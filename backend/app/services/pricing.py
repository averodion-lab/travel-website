"""Server-side pricing. The client never supplies a price."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from ..catalog import DELIVERY_PER_MILE, DELIVERY_TRIPS, TRUCK
from ..errors import ApiError

CENT = Decimal("0.01")


@dataclass(frozen=True)
class Quote:
    days: int
    daily_rate: Decimal
    subtotal: Decimal
    cleaning_fee: Decimal
    total: Decimal
    deposit_due: Decimal  # charged now to confirm the booking
    balance_due: Decimal  # remainder, due at pickup
    security_deposit: Decimal  # refundable hold taken at pickup, not part of total
    addons: tuple[dict, ...] = ()  # [{code, name, daily_rate, days, total}]
    addons_total: Decimal = Decimal("0.00")
    # How the trailer gets there: {code, name, total, ...details}
    transport: dict | None = None

    def to_dict(self) -> dict:
        return {
            "addons": [{**a, "daily_rate": str(a["daily_rate"]), "total": str(a["total"])} for a in self.addons],
            "addons_total": str(self.addons_total),
            "transport": {k: (str(v) if isinstance(v, Decimal) else v) for k, v in (self.transport or transport_line("self", None, self.days)).items()},
            "days": self.days,
            "daily_rate": str(self.daily_rate),
            "subtotal": str(self.subtotal),
            "cleaning_fee": str(self.cleaning_fee),
            "total": str(self.total),
            "deposit_due": str(self.deposit_due),
            "balance_due": str(self.balance_due),
            "security_deposit": str(self.security_deposit),
        }


def calculate_quote(
    *,
    daily_rate: Decimal,
    cleaning_fee: Decimal,
    security_deposit: Decimal,
    min_nights: int,
    start: date,
    end: date,
    deposit_percent: int,
    max_days: int = 60,
    today: date | None = None,
    addons: list | tuple = (),
    transport_code: str = "self",
    park=None,
) -> Quote:
    """`addons` are catalog Addon objects; each is charged per day of the rental."""
    today = today or date.today()
    if end <= start:
        raise ApiError("Return date must be after the pickup date.")
    if start < today:
        raise ApiError("Pickup date can't be in the past.")
    days = (end - start).days
    if days < min_nights:
        raise ApiError(f"This camper has a {min_nights}-night minimum rental.")
    if days > max_days:
        raise ApiError(f"Rentals are limited to {max_days} nights. Contact us for longer trips.")

    daily_rate = Decimal(daily_rate)
    cleaning_fee = Decimal(cleaning_fee)
    subtotal = (daily_rate * days).quantize(CENT, ROUND_HALF_UP)
    addon_lines = tuple(
        {
            "code": a.code,
            "name": a.name,
            "daily_rate": Decimal(a.daily_rate).quantize(CENT),
            "days": days,
            "total": (Decimal(a.daily_rate) * days).quantize(CENT, ROUND_HALF_UP),
        }
        for a in addons
    )
    addons_total = sum((line["total"] for line in addon_lines), Decimal("0.00"))
    transport = transport_line(transport_code, park, days)
    total = (subtotal + cleaning_fee + addons_total + transport["total"]).quantize(CENT, ROUND_HALF_UP)
    deposit_due = (total * Decimal(deposit_percent) / Decimal(100)).quantize(CENT, ROUND_HALF_UP)
    return Quote(
        days=days,
        daily_rate=daily_rate.quantize(CENT),
        subtotal=subtotal,
        cleaning_fee=cleaning_fee.quantize(CENT),
        total=total,
        deposit_due=deposit_due,
        balance_due=total - deposit_due,
        security_deposit=Decimal(security_deposit).quantize(CENT),
        addons=addon_lines,
        addons_total=addons_total,
        transport=transport,
    )


def transport_line(code: str, park, days: int) -> dict:
    """The getting-there line of a quote. `code` is already validated."""
    if code == "truck":
        return {
            "code": "truck",
            "name": f"{TRUCK.name} rental",
            "daily_rate": TRUCK.daily_rate.quantize(CENT),
            "days": days,
            "total": (TRUCK.daily_rate * days).quantize(CENT, ROUND_HALF_UP),
        }
    if code == "delivery" and park is not None:
        return {
            "code": "delivery",
            "name": "Delivery and setup",
            "miles": park.delivery_miles,
            "trips": DELIVERY_TRIPS,
            "per_mile": DELIVERY_PER_MILE,
            "total": (DELIVERY_PER_MILE * park.delivery_miles * DELIVERY_TRIPS).quantize(CENT, ROUND_HALF_UP),
        }
    return {"code": "self", "name": "Your own truck", "total": Decimal("0.00")}


def quote_for_camper(camper, start: date, end: date, config, addons=(), transport_code="self", park=None) -> Quote:
    return calculate_quote(
        daily_rate=camper.daily_rate,
        cleaning_fee=camper.cleaning_fee,
        security_deposit=camper.security_deposit,
        min_nights=camper.min_nights,
        start=start,
        end=end,
        deposit_percent=config["DEPOSIT_PERCENT"],
        max_days=config["MAX_RENTAL_DAYS"],
        addons=addons,
        transport_code=transport_code,
        park=park,
    )
