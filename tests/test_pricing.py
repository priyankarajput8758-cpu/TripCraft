"""
Test Suite: Live Decimal Repricing Engine.
Tests Rule R3 (Decimal Money) and §3.1/§9 exact repricing from scratch without float accumulation.
"""

import pytest
from decimal import Decimal
from src.pricing.engine import PricingEngine
from src.database import to_decimal, get_db_connection

def test_decimal_repricing_from_scratch(db):
    """Verify that total is computed as base_price + sum(deltas) with zero float precision error."""
    pkg = db.execute("SELECT * FROM tour_packages LIMIT 1").fetchone()
    pkg_id = pkg["package_id"]
    base_price = to_decimal(pkg["base_price"])

    # Get non-optional components
    comps = db.execute(
        "SELECT * FROM package_components WHERE package_id = ? AND is_optional = 0",
        (pkg_id,)
    ).fetchall()

    comp_ids = [c["component_id"] for c in comps]
    expected_delta_sum = sum(to_decimal(c["price_delta"]) for c in comps)
    expected_total = (base_price + expected_delta_sum).quantize(Decimal("0.01"))

    result = PricingEngine.calculate_repricing(pkg_id, comp_ids)

    assert result["package_id"] == pkg_id
    assert result["base_price"] == str(base_price)
    assert result["components_delta_total"] == str(expected_delta_sum)
    assert result["total_price"] == str(expected_total)
    assert isinstance(result["total_price"], str)

def test_component_swapping_price_reduction(db):
    """Verify that swapping to a lower-cost component within a swap group reduces the total price."""
    # Find a swap group with multiple options of differing prices
    swap_group_row = db.execute("""
        SELECT swap_group, package_id
        FROM package_components
        WHERE swap_group <> ''
        GROUP BY swap_group, package_id
        HAVING COUNT(*) > 1
        LIMIT 1
    """).fetchone()

    assert swap_group_row is not None
    sg = swap_group_row["swap_group"]
    pkg_id = swap_group_row["package_id"]

    options = db.execute(
        "SELECT * FROM package_components WHERE package_id = ? AND swap_group = ? ORDER BY CAST(price_delta AS REAL) ASC",
        (pkg_id, sg)
    ).fetchall()

    cheaper_comp = options[0]
    expensive_comp = options[-1]

    quote_cheap = PricingEngine.calculate_repricing(pkg_id, [cheaper_comp["component_id"]])
    quote_exp = PricingEngine.calculate_repricing(pkg_id, [expensive_comp["component_id"]])

    assert to_decimal(quote_cheap["total_price"]) < to_decimal(quote_exp["total_price"])
    expected_diff = to_decimal(expensive_comp["price_delta"]) - to_decimal(cheaper_comp["price_delta"])
    actual_diff = to_decimal(quote_exp["total_price"]) - to_decimal(quote_cheap["total_price"])
    assert actual_diff == expected_diff

def test_guide_pricing_with_multiplier(db):
    """Verify that adding a guide computes duration * day_rate * multiplier in Decimal."""
    pkg = db.execute("SELECT * FROM tour_packages LIMIT 1").fetchone()
    guide = db.execute("SELECT * FROM tour_guides WHERE status = 'active' LIMIT 1").fetchone()

    pkg_id = pkg["package_id"]
    guide_id = guide["guide_id"]
    day_rate = to_decimal(guide["day_rate"])

    result = PricingEngine.calculate_repricing(
        package_id=pkg_id,
        selected_component_ids=[],
        guide_id=guide_id,
        duration_days=4
    )

    expected_guide_cost = (day_rate * Decimal("4") * Decimal("1.00")).quantize(Decimal("0.01"))
    assert result["guide_cost"] == str(expected_guide_cost)
    assert to_decimal(result["total_price"]) > to_decimal(result["base_price"])
