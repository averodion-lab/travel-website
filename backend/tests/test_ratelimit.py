"""Booking attempts, booking look-ups and admin logins are rate limited per visitor."""
import pytest

from app.api import admin, public

from .conftest import day, post_booking


@pytest.fixture(autouse=True)
def _reset():
    for limiter in (public.BOOKING_LIMIT, public.CONTACT_LIMIT, public.MANAGE_LIMIT, admin.LOGIN_LIMIT):
        limiter.clear()
    yield
    for limiter in (public.BOOKING_LIMIT, public.CONTACT_LIMIT, public.MANAGE_LIMIT, admin.LOGIN_LIMIT):
        limiter.clear()


def test_booking_form_is_rate_limited(client, camper, sent_emails):
    # each attempt counts, valid or not (a bad form must not be free to retry forever)
    for i in range(public.BOOKING_LIMIT.limit):
        res = post_booking(client, day(10 + i * 5), day(12 + i * 5), email="x")  # invalid email -> 400
        assert res.status_code == 400
    res = post_booking(client, day(200), day(203))
    assert res.status_code == 429
    assert "wait" in res.get_json()["error"].lower()


def test_other_visitors_are_not_affected(client, camper, sent_emails):
    for i in range(public.BOOKING_LIMIT.limit):
        post_booking(client, day(10), day(12), email="x")
    res = client.post(
        "/api/bookings",
        data={"camper": "test-trailer"},
        content_type="multipart/form-data",
        headers={"X-Forwarded-For": "203.0.113.9"},
    )
    assert res.status_code == 400  # judged on its merits, not blocked


def test_admin_login_is_rate_limited(client, app):
    for _ in range(admin.LOGIN_LIMIT.limit):
        res = client.post("/api/admin/login", json={"email": "owner@example.com", "password": "wrong"})
        assert res.status_code == 401
    res = client.post("/api/admin/login", json={"email": "owner@example.com", "password": "wrong"})
    assert res.status_code == 429
