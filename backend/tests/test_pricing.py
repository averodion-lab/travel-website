from datetime import date
from decimal import Decimal

import pytest

from app.errors import ApiError
from app.services.pricing import calculate_quote

TODAY = date(2026, 6, 1)


def quote(start, end, **kw):
    args = dict(
        daily_rate=Decimal("150.00"),
        cleaning_fee=Decimal("80.00"),
        security_deposit=Decimal("500.00"),
        min_nights=2,
        deposit_percent=30,
        today=TODAY,
    )
    args.update(kw)
    return calculate_quote(start=start, end=end, **args)


def test_daily_rate_times_days_plus_cleaning_fee():
    q = quote(date(2026, 6, 10), date(2026, 6, 14))
    assert q.days == 4
    assert q.subtotal == Decimal("600.00")
    assert q.total == Decimal("680.00")
    assert q.deposit_due == Decimal("204.00")
    assert q.balance_due == Decimal("476.00")
    assert q.security_deposit == Decimal("500.00")


def test_deposit_rounds_to_the_cent_and_parts_add_up():
    q = quote(date(2026, 6, 10), date(2026, 6, 13), daily_rate=Decimal("109.99"), cleaning_fee=Decimal("65.00"))
    assert q.total == Decimal("394.97")
    assert q.deposit_due == Decimal("118.49")  # 118.491 rounded
    assert q.deposit_due + q.balance_due == q.total


def test_money_is_exact_decimal_not_float():
    q = quote(date(2026, 6, 10), date(2026, 6, 13), daily_rate=Decimal("0.10"), cleaning_fee=Decimal("0"))
    assert q.subtotal == Decimal("0.30")
    assert isinstance(q.total, Decimal)


def test_minimum_nights_enforced():
    with pytest.raises(ApiError, match="2-night minimum"):
        quote(date(2026, 6, 10), date(2026, 6, 11))


def test_return_must_be_after_pickup():
    with pytest.raises(ApiError, match="after the pickup"):
        quote(date(2026, 6, 10), date(2026, 6, 10))
    with pytest.raises(ApiError, match="after the pickup"):
        quote(date(2026, 6, 10), date(2026, 6, 8))


def test_pickup_cannot_be_in_the_past():
    with pytest.raises(ApiError, match="past"):
        quote(date(2026, 5, 30), date(2026, 6, 3))


def test_maximum_length_enforced():
    with pytest.raises(ApiError, match="limited to 60"):
        quote(date(2026, 6, 10), date(2026, 9, 10))
