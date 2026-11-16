"""Guests manage their own booking: cancel or change dates free of charge up
to 24 hours before pickup, identified by booking number + email."""
from decimal import Decimal

import pytest

from app.api import public
from app.extensions import db
from app.models import Booking

from .conftest import day, post_booking

EMAIL = "jane@example.com"


@pytest.fixture(autouse=True)
def _reset_rate_limit():
    public._contact_hits.clear()
    public._manage_hits.clear()


def book(client, start, end, **extra):
    res = post_booking(client, start, end, **extra)
    assert res.status_code == 201, res.get_json()
    return res.get_json()["reference"]


def manage(client, action, ref, email=EMAIL, **extra):
    return client.post(f"/api/manage/{action}", json={"reference": ref, "email": email, **extra})


def test_find_needs_the_matching_email(client, camper, sent_emails):
    ref = book(client, day(10), day(14))
    assert manage(client, "find", ref, email="someone@else.com").status_code == 404
    res = manage(client, "find", ref, email="  JANE@example.com ")
    assert res.status_code == 200
    data = res.get_json()
    assert data["booking"]["reference"] == ref and data["can_change"] is True
    assert "email" not in str(data["booking"]).lower().replace("free_change", "")


def test_cancel_frees_the_dates_and_emails_both(client, camper, sent_emails):
    ref = book(client, day(10), day(14))
    sent_emails.clear()
    res = manage(client, "cancel", ref)
    assert res.status_code == 200, res.get_json()
    b = db.session.query(Booking).one()
    assert b.status == "cancelled" and b.cancelled_at is not None
    # the dates are free again
    assert book(client, day(10), day(14))
    assert {m["to"] for m in sent_emails} >= {EMAIL, "owner@example.com"}
    assert any("cancelled" in m["subject"].lower() for m in sent_emails)


def test_changes_allowed_until_the_day_before_pickup(client, camper, sent_emails):
    # No set pickup time, so "24 hours before pickup" = through the day before.
    tomorrow = book(client, day(1), day(5))
    assert manage(client, "find", tomorrow).get_json()["can_change"] is True


def test_no_changes_within_24_hours_of_pickup(client, camper, sent_emails):
    ref = book(client, day(0), day(4), email="today@example.com")
    who = "today@example.com"
    assert manage(client, "find", ref, email=who).get_json()["can_change"] is False
    res = manage(client, "cancel", ref, email=who)
    assert res.status_code == 400 and "contact us" in res.get_json()["error"]
    assert manage(client, "change", ref, email=who, start=day(20).isoformat(), end=day(24).isoformat()).status_code == 400


def test_change_dates_reprices_and_keeps_the_deposit(client, camper, sent_emails):
    ref = book(client, day(10), day(14), park="vogel", addons="ebike:2")
    before = db.session.query(Booking).one()
    deposit = before.deposit_due
    sent_emails.clear()
    res = manage(client, "change", ref, start=day(30).isoformat(), end=day(35).isoformat())
    assert res.status_code == 200, res.get_json()
    b = db.session.query(Booking).one()
    db.session.refresh(b)
    assert (b.start_date, b.end_date, b.days) == (day(30), day(35), 5)
    assert b.deposit_due == deposit  # already paid
    assert b.addons[0]["qty"] == 2 and b.addons[0]["days"] == 5
    assert b.addons_total == Decimal("500.00")  # $50 x 5 days x 2 bikes
    assert b.total_price == Decimal("150.00") * 5 + Decimal("80.00") + Decimal("500.00")
    assert any("changed" in m["subject"].lower() for m in sent_emails)


def test_change_refuses_dates_someone_else_has(client, camper, sent_emails):
    ref = book(client, day(10), day(14))
    book(client, day(30), day(34), email="other@example.com")
    res = manage(client, "change", ref, start=day(31).isoformat(), end=day(36).isoformat())
    assert res.status_code == 409


def test_change_can_overlap_its_own_old_dates(client, camper, sent_emails):
    ref = book(client, day(10), day(14))
    res = manage(client, "change", ref, start=day(12).isoformat(), end=day(16).isoformat())
    assert res.status_code == 200, res.get_json()
