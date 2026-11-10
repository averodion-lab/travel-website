"""Owner dashboard numbers: revenue, occupancy, open dates, customers."""
from datetime import date
from decimal import Decimal

from app.extensions import db
from app.models import Booking, BookingStatus, Customer
from app.services import reports

from .conftest import day, post_booking

TODAY = date(2026, 6, 10)


def add(camper, start, end, status, total, deposit, ref):
    customer = Customer(first_name="A", last_name=ref, encrypted_email="x", encrypted_phone="x")
    b = Booking(
        reference=ref, camper=camper, customer=customer, start_date=start, end_date=end,
        days=(end - start).days, daily_rate=Decimal("150"), total_price=Decimal(total),
        deposit_due=Decimal(deposit), status=status,
    )
    db.session.add(b)
    db.session.commit()
    return b


def test_revenue_counts_only_paid_bookings(camper):
    add(camper, date(2026, 5, 1), date(2026, 5, 5), BookingStatus.COMPLETED, "1000", "300", "BK-A")
    add(camper, date(2026, 6, 20), date(2026, 6, 25), BookingStatus.CONFIRMED, "2000", "600", "BK-B")
    add(camper, date(2026, 7, 1), date(2026, 7, 4), BookingStatus.PENDING, "500", "150", "BK-C")
    add(camper, date(2026, 8, 1), date(2026, 8, 4), BookingStatus.CANCELLED, "900", "270", "BK-D")

    money = reports.overview(TODAY)["revenue"]
    assert money["booked"] == "3000.00"       # completed + confirmed
    assert money["collected"] == "1600.00"    # completed in full + confirmed deposit
    assert money["outstanding"] == "1400.00"  # confirmed balance, due at pickup


def test_revenue_is_grouped_by_pickup_month(camper):
    add(camper, date(2026, 6, 20), date(2026, 6, 25), BookingStatus.CONFIRMED, "2000", "600", "BK-B")
    months = {m["month"]: m for m in reports.overview(TODAY)["months"]}
    assert len(months) == 12
    assert months["2026-06"]["revenue"] == "2000.00"
    assert months["2026-06"]["nights"] == 5
    assert months["2026-07"]["revenue"] == "0.00"


def test_nights_are_split_across_months(camper):
    add(camper, date(2026, 6, 28), date(2026, 7, 3), BookingStatus.CONFIRMED, "1", "1", "BK-B")
    months = {m["month"]: m for m in reports.overview(TODAY)["months"]}
    assert months["2026-06"]["nights"] == 3  # 28, 29, 30
    assert months["2026-07"]["nights"] == 2  # 1, 2


def test_occupancy_over_the_next_90_days(camper):
    add(camper, date(2026, 6, 15), date(2026, 6, 24), BookingStatus.CONFIRMED, "1", "1", "BK-B")
    add(camper, date(2026, 6, 5), date(2026, 6, 12), BookingStatus.CONFIRMED, "1", "1", "BK-C")  # 2 nights left
    occupancy = reports.overview(TODAY)["occupancy"]
    assert occupancy["nights_booked"] == 11
    assert occupancy["days"] == 90
    assert occupancy["percent"] == 12


def test_open_windows_are_the_gaps_between_bookings(camper):
    add(camper, date(2026, 6, 15), date(2026, 6, 20), BookingStatus.CONFIRMED, "1", "1", "BK-B")
    add(camper, date(2026, 6, 21), date(2026, 6, 30), BookingStatus.PENDING, "1", "1", "BK-C")
    windows = reports.overview(TODAY)["open_windows"]
    # Jun 10 to 15 is open (5 nights). Jun 20 to 21 is one night: below the 2-night minimum.
    assert windows[0] == {"start": "2026-06-10", "end": "2026-06-15", "nights": 5}
    assert windows[1]["start"] == "2026-06-30"
    assert all(w["nights"] >= camper.min_nights for w in windows)


def test_who_is_out_now_and_who_is_next(camper):
    add(camper, date(2026, 6, 8), date(2026, 6, 12), BookingStatus.CONFIRMED, "1", "1", "BK-NOW")
    add(camper, date(2026, 6, 20), date(2026, 6, 25), BookingStatus.CONFIRMED, "1", "1", "BK-NEXT")
    data = reports.overview(TODAY)
    assert data["current"]["reference"] == "BK-NOW"
    assert data["next_pickup"]["reference"] == "BK-NEXT"


def test_overview_requires_admin(client, camper):
    assert client.get("/api/admin/overview").status_code == 401
    assert client.get("/api/admin/customers").status_code == 401


def test_customers_list_has_contact_details_and_totals(client, camper, sent_emails, admin_token):
    post_booking(client, day(10), day(14))
    auth = {"Authorization": f"Bearer {admin_token}"}
    assert client.get("/api/admin/overview", headers=auth).status_code == 200
    customers = client.get("/api/admin/customers", headers=auth).get_json()["customers"]
    assert len(customers) == 1
    assert customers[0]["email"] == "jane@example.com"
    assert customers[0]["bookings"] == 1
    assert customers[0]["total_spent"] == "680.00"  # 4 nights x $150 + $80 cleaning
