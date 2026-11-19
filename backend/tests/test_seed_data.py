"""The seed data must fit the database columns (a too-long text only fails on `flask seed`)."""
from app.models import Camper
from app.seed_data import CAMPERS


def test_seed_text_fits_the_columns():
    for data in CAMPERS:
        for col in Camper.__table__.columns:
            limit = getattr(col.type, "length", None)
            value = data.get(col.name)
            if limit and isinstance(value, str):
                assert len(value) <= limit, f"{data['slug']}.{col.name} is {len(value)} characters, limit {limit}"
