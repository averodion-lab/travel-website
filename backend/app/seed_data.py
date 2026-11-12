"""The fleet: one 2026 Keystone Montana 3795FK luxury fifth wheel.

Specs come from the dealer listing. The nightly rate was set by the owner;
the minimum stay, cleaning fee and security deposit are PLACEHOLDERS until
the owner confirms them. Photos are the dealer's listing photos and must be
replaced with the owner's own (or used with written permission) before launch.
"""
from decimal import Decimal

IMG = "/images/montana"

CAMPERS = [
    {
        "slug": "montana",
        "name": "The Montana",
        "class_type": "Luxury Fifth Wheel",
        "tagline": "Forty feet of residential comfort, parked wherever the view is best.",
        "description": (
            "A 2026 Keystone Montana 3795FK. Four slide-outs open it up into a real home: "
            "a raised front kitchen with a residential refrigerator, a living room with "
            "theater seating, two sofas and a fireplace, and a private king bedroom with "
            "its own closet. It sleeps six, runs two-zone air conditioning on 50 amp "
            "service and carries 70 gallons of fresh water. Tow it with your truck, rent ours, "
            "or have us deliver it, level it and hook everything up, so you arrive to a home that is ready."
        ),
        "layout": "Front kitchen, central living room, king bedroom",
        "sleeps": 6,
        "towing_weight_lbs": 13870,
        "length_ft": Decimal("39.9"),
        "hitch_type": "Fifth-wheel hitch, one-ton truck (17,070 lb GVWR). Delivery available.",
        "hookups": "Full hookups: 50 amp electric, water, sewer. 70 gal fresh water tank.",
        "amenities": [
            "King bedroom with closet", "Two hide-a-bed sofas", "Theater seating",
            "Electric fireplace", "Entertainment center with TV", "Front kitchen",
            "Residential refrigerator", "Gas range and oven", "Microwave", "Walk-in pantry",
            "Double-sink bathroom", "Glass-door shower", "Four slide-outs",
            "Air conditioning and furnace", "Power awnings", "Outside shower",
            "Outdoor speakers", "Pass-through storage", "Bedding and towels",
            "Cookware and dishes",
        ],
        "daily_rate": Decimal("249.00"),
        "cleaning_fee": Decimal("175.00"),
        "security_deposit": Decimal("2000.00"),
        "min_nights": 3,
        "image_url": f"{IMG}/exterior.jpg",
        # A file named "floorplan" is shown in its own section, not in the photo grid.
        "gallery": [
            f"{IMG}/{name}.jpg"
            for name in (
                "exterior", "living-1", "kitchen", "bedroom-1", "living-2", "fridge",
                "stove-oven", "bedroom-2", "bathroom-1", "entertainment-center",
                "fireplace", "bathroom-2", "pantry", "bedroom-closet", "campside",
                "off-campside", "pass-through-storage", "floorplan",
            )
        ],
        "featured": True,
    },
]
