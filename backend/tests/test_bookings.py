from datetime import timedelta
from decimal import Decimal

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.cli import purge_expired_licenses
from app.extensions import db
from app.models import Booking, BookingStatus, Customer, utcnow
from app.services import availability

from .conftest import day, post_booking


def make_booking(camper, start, end, status=BookingStatus.CONFIRMED, ref="BK-X"):
    customer = Customer(first_name="A", last_name="B", encrypted_email="x", encrypted_phone="x")
    b = Booking(
        reference=ref, camper=camper, customer=customer, start_date=start, end_date=end,
        days=(end - start).days, daily_rate=Decimal("150"), total_price=Decimal("1"),
        deposit_due=Decimal("1"), status=status,
    )
    db.session.add(b)
    db.session.commit()
    return b


# ---- double-booking protection -------------------------------------------

def test_database_rejects_overlapping_booking(camper):
    make_booking(camper, day(10), day(14), ref="BK-1")
    with pytest.raises(IntegrityError, match="bookings_no_overlap"):
        make_booking(camper, day(12), day(16), ref="BK-2")
    db.session.rollback()


def test_return_day_can_be_next_pickup_day(camper):
    make_booking(camper, day(10), day(14), ref="BK-1")
    make_booking(camper, day(14), day(17), ref="BK-2")  # no error
    assert not availability.is_available(camper.id, day(13), day(15))
    assert availability.is_available(camper.id, day(17), day(20))


def test_cancelled_booking_frees_the_dates(camper):
    make_booking(camper, day(10), day(14), status=BookingStatus.CANCELLED, ref="BK-1")
    make_booking(camper, day(10), day(14), ref="BK-2")  # no error


def test_api_refuses_taken_dates(client, camper, sent_emails):
    assert post_booking(client, day(10), day(14)).status_code == 201
    res = post_booking(client, day(12), day(15))
    assert res.status_code == 409
    assert res.get_json()["code"] == "dates_unavailable"
    assert db.session.query(Booking).count() == 1


def test_unpaid_booking_expires_and_releases_dates(app, camper):
    b = make_booking(camper, day(10), day(14), status=BookingStatus.PENDING)
    assert not availability.is_available(camper.id, day(10), day(14))
    b.created_at = utcnow() - timedelta(minutes=app.config["PENDING_HOLD_MINUTES"] + 1)
    db.session.commit()
    assert availability.expire_stale_pending() == 1
    assert availability.is_available(camper.id, day(10), day(14))


# ---- booking flow ----------------------------------------------------------

def test_booking_flow_saves_customer_confirms_and_notifies(client, camper, sent_emails):
    res = post_booking(client, day(10), day(14))
    assert res.status_code == 201
    body = res.get_json()
    assert body["checkout_url"].endswith(f"/booking/confirmation?ref={body['reference']}")

    b = db.session.query(Booking).one()
    assert b.status == BookingStatus.CONFIRMED  # mock payments confirm instantly
    assert b.total_price == Decimal("680.00")
    assert b.deposit_due == Decimal("204.00")
    assert b.notified_at is not None

    assert len(sent_emails) == 2
    customer_mail, owner_mail = sent_emails
    assert customer_mail["to"] == "jane@example.com"
    assert b.reference in customer_mail["body"]
    assert owner_mail["to"] == "owner@example.com"
    assert "Jane Camper" in owner_mail["body"]
    # Owner email carries no contact details; those stay behind the admin login.
    assert "jane@example.com" not in owner_mail["body"]
    assert "555" not in owner_mail["body"]


def test_client_cannot_set_the_price(client, camper, sent_emails):
    post_booking(client, day(10), day(14), total_price="1.00", deposit_due="0.01", daily_rate="1")
    b = db.session.query(Booking).one()
    assert b.total_price == Decimal("680.00")
    assert b.deposit_due == Decimal("204.00")


def test_pii_is_encrypted_at_rest(client, camper, sent_emails, app):
    post_booking(client, day(10), day(14))
    row = db.session.execute(
        text("SELECT encrypted_email, encrypted_phone, encrypted_address, encrypted_license_data, license_file_key FROM customers")
    ).one()
    joined = " ".join(str(v) for v in row)
    for secret in ("jane@example.com", "010-2030", "Mountain Rd", "NC-1234567"):
        assert secret not in joined
    # The uploaded file is encrypted on disk too.
    import os
    files = os.listdir(app.config["UPLOAD_DIR"])
    assert len(files) == 1
    with open(os.path.join(app.config["UPLOAD_DIR"], files[0]), "rb") as fh:
        assert b"fake-jpeg-bytes" not in fh.read()


def test_public_booking_lookup_has_no_contact_details(client, camper, sent_emails):
    ref = post_booking(client, day(10), day(14)).get_json()["reference"]
    res = client.get(f"/api/bookings/{ref}")
    assert res.status_code == 200
    text_body = res.get_data(as_text=True)
    assert "jane@example.com" not in text_body
    assert "NC-1234567" not in text_body
    assert "encrypted" not in text_body
    assert res.get_json()["booking"]["total_price"] == "680.00"


@pytest.mark.parametrize(
    "overrides, message",
    [
        ({"email": "not-an-email"}, "valid email"),
        ({"phone": "123"}, "valid phone"),
        ({"first_name": ""}, "First name is required"),
        ({"license_number": ""}, "license number is required"),
        ({"agree_terms": ""}, "rental terms"),
        ({"license": None}, "upload a photo"),
    ],
)
def test_booking_validation(client, camper, overrides, message):
    res = post_booking(client, day(10), day(14), **overrides)
    assert res.status_code == 400
    assert message in res.get_json()["error"]
    assert db.session.query(Booking).count() == 0


def test_license_upload_type_is_restricted(client, camper):
    import io
    res = post_booking(client, day(10), day(14), license=(io.BytesIO(b"MZ"), "virus.exe"))
    assert res.status_code == 400


def test_fleet_search_hides_booked_campers(client, camper, sent_emails):
    post_booking(client, day(10), day(14))
    res = client.get(f"/api/campers?start={day(11).isoformat()}&end={day(13).isoformat()}")
    assert res.get_json()["campers"] == []
    res = client.get(f"/api/campers?start={day(20).isoformat()}&end={day(23).isoformat()}")
    assert len(res.get_json()["campers"]) == 1


# ---- admin / RBAC ------------------------------------------------------------

def test_admin_routes_require_login(client, camper):
    assert client.get("/api/admin/bookings").status_code == 401
    assert client.get("/api/admin/bookings/1").status_code == 401
    assert client.get("/api/admin/bookings/1/license").status_code == 401
    assert client.get("/api/admin/bookings", headers={"Authorization": "Bearer forged"}).status_code == 401


def test_admin_login_rejects_wrong_password(client, admin_token):
    res = client.post("/api/admin/login", json={"email": "owner@example.com", "password": "nope"})
    assert res.status_code == 401


def test_admin_sees_decrypted_customer_and_license(client, camper, sent_emails, admin_token):
    post_booking(client, day(10), day(14))
    auth = {"Authorization": f"Bearer {admin_token}"}
    booking_id = client.get("/api/admin/bookings", headers=auth).get_json()["bookings"][0]["id"]
    detail = client.get(f"/api/admin/bookings/{booking_id}", headers=auth).get_json()["booking"]
    assert detail["customer"]["email"] == "jane@example.com"
    assert detail["customer"]["license_number"] == "NC-1234567"
    assert detail["emails_sent"] is True
    lic = client.get(f"/api/admin/bookings/{booking_id}/license", headers=auth)
    assert lic.data == b"\xff\xd8fake-jpeg-bytes"
    assert lic.mimetype == "image/jpeg"


def test_admin_completes_then_license_is_purged_after_retention(client, camper, sent_emails, admin_token, app):
    import os
    post_booking(client, day(10), day(14))
    auth = {"Authorization": f"Bearer {admin_token}"}
    b = db.session.query(Booking).one()
    res = client.patch(f"/api/admin/bookings/{b.id}", json={"status": "completed"}, headers=auth)
    assert res.get_json()["booking"]["status"] == "completed"

    assert purge_expired_licenses() == 0  # too soon
    b.completed_at = utcnow() - timedelta(days=app.config["LICENSE_RETENTION_DAYS"] + 1)
    db.session.commit()
    assert purge_expired_licenses() == 1

    c = db.session.query(Customer).one()
    assert c.license_file_key is None and c.encrypted_license_data is None
    assert c.license_purged_at is not None
    assert os.listdir(app.config["UPLOAD_DIR"]) == []
    assert client.get(f"/api/admin/bookings/{b.id}/license", headers=auth).status_code == 404


# ---- Stripe webhook ------------------------------------------------------------

def test_webhook_rejects_bad_signature(client, app):
    app.config["STRIPE_WEBHOOK_SECRET"] = "whsec_test"
    res = client.post("/api/webhooks/stripe", data=b"{}", headers={"Stripe-Signature": "t=1,v1=bad"})
    assert res.status_code == 400


def test_webhook_confirms_pending_booking_once(client, app, camper, sent_emails, monkeypatch):
    app.config["STRIPE_WEBHOOK_SECRET"] = "whsec_test"
    b = make_booking(camper, day(10), day(14), status=BookingStatus.PENDING, ref="BK-PAID")
    b.customer.encrypted_email = __import__("app.crypto", fromlist=["x"]).encrypt_str("jane@example.com")
    db.session.commit()
    event = {
        "type": "checkout.session.completed",
        "data": {"object": {"client_reference_id": "BK-PAID", "payment_status": "paid"}},
    }
    monkeypatch.setattr("app.services.payments.parse_webhook", lambda payload, sig: event)

    assert sent_emails == []  # nothing is sent before payment
    for _ in range(2):  # Stripe may deliver twice
        assert client.post("/api/webhooks/stripe", data=b"{}").status_code == 200
    assert db.session.get(Booking, b.id).status == BookingStatus.CONFIRMED
    assert len(sent_emails) == 2  # one customer + one owner, not four
