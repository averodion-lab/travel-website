"""The fleet: one 2026 Keystone Montana 3795FK luxury fifth wheel.

Specs come from the dealer listing. The nightly rate was set by the owner;
the minimum stay and security deposit are PLACEHOLDERS (the $120 cleaning fee is the owner's) until
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
            "A 2026 Keystone Montana 3795FK: a 40 ft fifth wheel that sleeps six. Four slide-outs open into a real home, with a raised front kitchen, theater seating, a fireplace and a private king bedroom. Two-zone air conditioning, 50 amp service and 70 gallons of fresh water. Three ways to get it:\n"
            "- Tow it with your own truck\n"
            "- Rent ours\n"
            "- We deliver it, level it and hook everything up, so you arrive to a home that is ready"
        ),
        "layout": "Front kitchen, central living room, king bedroom",
        "sleeps": 6,
        "towing_weight_lbs": 13870,
        "length_ft": Decimal("39.9"),
        "hitch_type": "Fifth wheel; one-ton truck, 6,000 lb+ (17,070 lb GVWR). Delivery available.",
        "hookups": "Full hookups: 50 amp electric, water, sewer. 70 gal fresh water tank.",
        "amenities": [
            "King bedroom with closet", "Two hide-a-bed sofas", "Theater seating",
            "Electric fireplace", "Entertainment center with TV", "Front kitchen",
            "Residential refrigerator", "Gas range and oven", "Microwave", "Walk-in pantry",
            "Double-sink bathroom", "Glass-door shower", "Four slide-outs",
            "Air conditioning and furnace", "Power awnings", "Outside shower",
            "Outdoor speakers", "Pass-through storage", "Bedding and towels",
            "Cookware and dishes", "Washer", "Dryer", "Hair dryer",
            "Starlink high-speed internet", "Pet friendly",
        ],
        "daily_rate": Decimal("299.00"),
        "cleaning_fee": Decimal("120.00"),
        "security_deposit": Decimal("2000.00"),
        "min_nights": 2,
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
