"""Owner tools: blocking dates and adding bookings taken by phone."""
from datetime import date
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app import crypto
from app.extensions import db
from app.models import Booking, BookingKind, BookingStatus
from app.services import reports

from .conftest import day, post_booking


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def block(client, token, start, end, note="Family trip"):
    return client.post(
        "/api/admin/blocks",
        json={"start": start.isoformat(), "end": end.isoformat(), "note": note},
        headers=auth(token),
    )


def phone(client, token, start, end, **overrides):
    body = {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "first_name": "Sam",
        "last_name": "Caller",
        "phone": "(555) 010-9999",
        "email": "sam@example.com",
        "towing_experience": True,
        "amount_paid": "100.00",
    }
    body.update(overrides)
    return client.post("/api/admin/bookings", json=body, headers=auth(token))


# --- blocks ---------------------------------------------------------------


def test_blocks_need_admin(client, camper):
    assert block(client, "nope", day(10), day(12)).status_code == 401


def test_block_hides_dates_from_guests(client, camper, admin_token):
    res = block(client, admin_token, day(10), day(14))
    assert res.status_code == 201
    b = res.get_json()["booking"]
    assert b["kind"] == "block" and b["note"] == "Family trip"

    ranges = client.get("/api/campers/test-trailer/availability").get_json()
    assert {"start": day(10).isoformat(), "end": day(14).isoformat()} in ranges["booked"]
    assert post_booking(client, day(12), day(16)).status_code == 409


def test_block_note_is_encrypted(client, camper, admin_token):
    block(client, admin_token, day(10), day(12), note="Repairs at the dealer")
    row = db.session.execute(db.select(Booking)).scalar_one()
    assert row.customer_id is None
    assert "Repairs" not in (row.encrypted_note or "")
    assert crypto.decrypt_str(row.encrypted_note) == "Repairs at the dealer"


def test_block_refused_over_a_guest_booking(client, camper, admin_token):
    assert post_booking(client, day(10), day(13)).status_code == 201
    res = block(client, admin_token, day(12), day(15))
    assert res.status_code == 409


def test_block_may_start_on_a_return_day(client, camper, admin_token):
    assert post_booking(client, day(10), day(13)).status_code == 201
    assert block(client, admin_token, day(13), day(14)).status_code == 201


def test_block_ignores_the_minimum_stay(client, camper, admin_token):
    assert block(client, admin_token, day(5), day(6)).status_code == 201


def test_block_rejects_bad_dates(client, camper, admin_token):
    assert block(client, admin_token, day(5), day(5)).status_code == 400
    assert block(client, admin_token, day(-5), day(-2)).status_code == 400


def test_removing_a_block_frees_the_dates(client, camper, admin_token):
    bid = block(client, admin_token, day(10), day(14)).get_json()["booking"]["id"]
    res = client.patch(f"/api/admin/bookings/{bid}", json={"status": "cancelled"}, headers=auth(admin_token))
    assert res.status_code == 200
    assert post_booking(client, day(10), day(14)).status_code == 201


def test_block_cannot_be_completed(client, camper, admin_token):
    bid = block(client, admin_token, day(10), day(14)).get_json()["booking"]["id"]
    res = client.patch(f"/api/admin/bookings/{bid}", json={"status": "completed"}, headers=auth(admin_token))
    assert res.status_code == 400


def test_block_is_not_public(client, camper, admin_token):
    ref = block(client, admin_token, day(10), day(14)).get_json()["booking"]["reference"]
    assert client.get(f"/api/bookings/{ref}").status_code == 404


def test_block_in_admin_lists(client, camper, admin_token):
    block(client, admin_token, day(10), day(14))
    rows = client.get("/api/admin/bookings", headers=auth(admin_token)).get_json()["bookings"]
    assert rows[0]["kind"] == "block" and rows[0]["customer_name"] == "Blocked"
    bid = rows[0]["id"]
    detail = client.get(f"/api/admin/bookings/{bid}", headers=auth(admin_token)).get_json()["booking"]
    assert detail["customer"] is None
    assert client.get(f"/api/admin/bookings/{bid}/license", headers=auth(admin_token)).status_code == 404


def test_blocks_are_not_revenue(client, camper, admin_token):
    today = date.today()
    block(client, admin_token, day(1), day(5))
    data = reports.overview(today)
    assert data["revenue"]["booked"] == "0.00"
    assert data["counts"]["total"] == 0
    assert data["occupancy"]["nights_booked"] == 0
    assert data["occupancy"]["nights_blocked"] == 4
    assert data["next_pickup"] is None
    assert [c["kind"] for c in data["calendar"]] == ["block"]
    # Blocked nights are not offered as open dates.
    assert all(w["start"] != day(1).isoformat() for w in data["open_windows"])


# --- phone bookings -------------------------------------------------------


def test_phone_booking_is_priced_like_online(client, camper, admin_token, sent_emails):
    res = phone(client, admin_token, day(10), day(13))
    assert res.status_code == 201, res.get_json()
    b = res.get_json()["booking"]
    assert b["kind"] == "phone" and b["status"] == "confirmed"
    # 3 nights x $150 + $80 cleaning, same as the public quote.
    quote = client.post(
        "/api/quote",
        json={"camper": "test-trailer", "start": day(10).isoformat(), "end": day(13).isoformat()},
    ).get_json()["quote"]
    assert b["total_price"] == quote["total"] == "530.00"
    assert b["deposit_due"] == "100.00" and b["balance_due"] == "430.00"
    assert sent_emails == []  # no email unless asked


def test_phone_booking_contact_details_are_encrypted(client, camper, admin_token):
    phone(client, admin_token, day(10), day(13))
    row = db.session.execute(db.select(Booking)).scalar_one()
    assert "sam@" not in row.customer.encrypted_email
    detail = client.get(f"/api/admin/bookings/{row.id}", headers=auth(admin_token)).get_json()["booking"]
    assert detail["customer"]["email"] == "sam@example.com"
    assert detail["customer"]["phone"] == "(555) 010-9999"


def test_phone_booking_without_email(client, camper, admin_token):
    res = phone(client, admin_token, day(10), day(13), email="", send_email=True)
    assert res.status_code == 201


def test_phone_booking_needs_a_phone_number(client, camper, admin_token):
    assert phone(client, admin_token, day(10), day(13), phone="").status_code == 400


def test_phone_booking_blocks_double_booking(client, camper, admin_token):
    assert post_booking(client, day(10), day(13)).status_code == 201
    assert phone(client, admin_token, day(12), day(15)).status_code == 409
    assert phone(client, admin_token, day(13), day(15)).status_code == 201
    assert post_booking(client, day(14), day(16)).status_code == 409


def test_phone_booking_keeps_the_rules(client, camper, admin_token):
    assert phone(client, admin_token, day(10), day(11)).status_code == 400  # 2-night minimum
    assert phone(client, admin_token, day(10), day(13), towing_experience=False).status_code == 400


def test_phone_booking_paid_amount_must_fit_the_total(client, camper, admin_token):
    assert phone(client, admin_token, day(10), day(13), amount_paid="531").status_code == 400
    assert phone(client, admin_token, day(10), day(13), amount_paid="-1").status_code == 400
    assert phone(client, admin_token, day(10), day(13), amount_paid="530").status_code == 201


def test_phone_booking_price_override_needs_a_reason(client, camper, admin_token):
    res = phone(client, admin_token, day(10), day(13), total_override="450")
    assert res.status_code == 400
    res = phone(client, admin_token, day(10), day(13), total_override="450", note="Returning guest")
    assert res.status_code == 201
    b = res.get_json()["booking"]
    assert b["total_price"] == "450.00" and b["note"] == "Returning guest"


def test_phone_booking_with_extras_and_park(client, camper, admin_token):
    res = phone(client, admin_token, day(10), day(13), park="vogel", addons=["ebike:2"])
    assert res.status_code == 201, res.get_json()
    b = res.get_json()["booking"]
    assert b["park"]["slug"] == "vogel"
    assert b["addons"][0]["qty"] == 2


def test_phone_booking_email_when_asked(client, camper, admin_token, sent_emails):
    res = phone(client, admin_token, day(10), day(13), send_email=True)
    assert res.status_code == 201
    assert [m["to"] for m in sent_emails] == ["sam@example.com"]
    body = sent_emails[0]["body"]
    assert "Paid so far: $100.00" in body
    assert "/booking/manage" not in body  # changes go through the owner
    assert res.get_json()["booking"]["emails_sent"] is True


def test_phone_booking_paid_amount_can_be_updated(client, camper, admin_token):
    bid = phone(client, admin_token, day(10), day(13)).get_json()["booking"]["id"]
    res = client.patch(f"/api/admin/bookings/{bid}", json={"amount_paid": "530"}, headers=auth(admin_token))
    assert res.status_code == 200
    assert res.get_json()["booking"]["balance_due"] == "0.00"


def test_paid_amount_is_only_editable_on_phone_bookings(client, camper, admin_token):
    post_booking(client, day(10), day(13))
    bid = client.get("/api/admin/bookings", headers=auth(admin_token)).get_json()["bookings"][0]["id"]
    res = client.patch(f"/api/admin/bookings/{bid}", json={"amount_paid": "1"}, headers=auth(admin_token))
    assert res.status_code == 400


def test_phone_booking_counts_as_revenue(client, camper, admin_token):
    phone(client, admin_token, day(1), day(4))
    data = reports.overview(date.today())
    assert data["revenue"]["booked"] == "530.00"
    assert data["revenue"]["collected"] == "100.00"
    assert data["revenue"]["outstanding"] == "430.00"


def test_phone_booking_is_changed_through_the_owner(client, camper, admin_token):
    ref = phone(client, admin_token, day(10), day(13)).get_json()["booking"]["reference"]
    res = client.post("/api/manage/find", json={"reference": ref, "email": "sam@example.com"})
    assert res.status_code == 409
    assert "by phone" in res.get_json()["error"]
    # Without the right email it looks like any unknown booking.
    res = client.post("/api/manage/find", json={"reference": ref, "email": "x@example.com"})
    assert res.status_code == 404


def test_kinds_are_limited(app, camper):
    b = Booking(
        reference="BL-X", camper=camper, kind="guest", start_date=day(1), end_date=day(2), days=1,
        daily_rate=Decimal("0"), total_price=Decimal("0"), deposit_due=Decimal("0"),
        status=BookingStatus.CONFIRMED,
    )
    db.session.add(b)
    with pytest.raises(IntegrityError):  # only a block may have no customer
        db.session.commit()
    db.session.rollback()
    assert BookingKind.ALL == ("guest", "phone", "block")
