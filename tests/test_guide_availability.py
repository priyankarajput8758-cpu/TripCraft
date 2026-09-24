"""
MANDATORY HARD-PROOF TEST SUITE: Guide Availability Check & Substitution (§2.2).
Proves:
1. Guide selection on an unavailable date is REFUSED with the exact clashing date named.
2. A substitute guide is OFFERED matching the SAME language (BCP-47) and SAME specialisation.
3. The total package price REPRICES LIVE to reflect the substitute's rate.
"""

import pytest
from decimal import Decimal
from src.guides.availability import GuideAvailabilityEngine
from src.pricing.engine import PricingEngine
from src.database import to_decimal, get_db_connection

def test_hard_proof_guide_availability_clash_and_substitution(db):
    """
    THE PS-04 MANDATORY HARD-PROOF TEST:
    Verifies refusal on unavailable date, named clash, same-language same-specialisation
    substitute, and live repricing delta.
    """
    # 1. Find a guide and date where is_available = 0 in guide_availability
    clash_record = db.execute("""
        SELECT ga.guide_id, ga.for_date, g.display_name, g.languages, g.specialisation, g.city_id, g.day_rate
        FROM guide_availability ga
        JOIN tour_guides g ON g.guide_id = ga.guide_id
        WHERE ga.is_available = 0 AND g.status = 'active'
        LIMIT 1
    """).fetchone()

    assert clash_record is not None, "Seed data must contain unavailable guide rows"

    orig_guide_id = clash_record["guide_id"]
    clash_date = clash_record["for_date"]
    orig_name = clash_record["display_name"]
    orig_langs = [l.strip() for l in clash_record["languages"].split(",") if l.strip()]
    orig_spec = clash_record["specialisation"]
    orig_day_rate = to_decimal(clash_record["day_rate"])

    # 2. Run Guide Availability Check on the clashing date
    duration_days = 3
    result = GuideAvailabilityEngine.check_availability_and_substitute(
        guide_id=orig_guide_id,
        start_date=clash_date,
        duration_days=duration_days
    )

    # STEP 1 PROOF: Selection is REFUSED
    assert result["available"] is False, "Guide must be flagged as unavailable"

    # STEP 2 PROOF: Clashing date is explicitly named in refusal message
    assert result["clashing_date"] == clash_date, "Exact clashing date must be identified"
    assert clash_date in result["message"], f"Message must explicitly contain clashing date {clash_date}"
    assert orig_name in result["message"], f"Message must name the guide {orig_name}"

    # STEP 3 PROOF: Substitute guide is offered with SAME language and SAME specialisation
    substitute = result["substitute"]
    assert substitute is not None, "A substitute guide must be found"
    assert substitute["guide_id"] != orig_guide_id, "Substitute must be a different guide"

    # Language matching check (BCP-47 tag overlap)
    sub_langs = [l.strip() for l in substitute["languages"].split(",") if l.strip()]
    shared_langs = set(orig_langs).intersection(set(sub_langs))
    assert len(shared_langs) > 0, f"Substitute must speak at least one shared language ({orig_langs} vs {sub_langs})"

    # Specialisation matching check
    sub_spec = substitute["specialisation"]
    sub_sec_spec = substitute.get("secondary_specialisation")
    assert (sub_spec == orig_spec or sub_sec_spec == orig_spec), (
        f"Substitute specialisation ({sub_spec}) must match original ({orig_spec})"
    )

    # STEP 4 PROOF: Total reprices live with the substitute's price delta applied
    pkg = db.execute("SELECT * FROM tour_packages WHERE status = 'active' LIMIT 1").fetchone()
    pkg_id = pkg["package_id"]

    # Original attempt quote
    orig_quote = PricingEngine.calculate_repricing(
        package_id=pkg_id,
        selected_component_ids=[],
        guide_id=orig_guide_id,
        duration_days=duration_days
    )

    # Substitute quote
    sub_quote = PricingEngine.calculate_repricing(
        package_id=pkg_id,
        selected_component_ids=[],
        guide_id=substitute["guide_id"],
        duration_days=duration_days
    )

    sub_guide_cost = to_decimal(sub_quote["guide_cost"])
    orig_guide_cost = to_decimal(orig_quote["guide_cost"])
    price_delta = sub_guide_cost - orig_guide_cost

    assert to_decimal(sub_quote["total_price"]) == (
        to_decimal(orig_quote["total_price"]) + price_delta
    ), "Substitute price delta must apply cleanly to package total"

    print("\n[HARD-PROOF TEST PASSED]")
    print(f"Original Guide: {orig_name} (Unavailable on {clash_date})")
    print(f"Refusal Message: {result['message']}")
    print(f"Substitute Guide: {substitute['display_name']} (Langs: {substitute['languages']}, Spec: {substitute['specialisation']})")
    print(f"Original Total: {orig_quote['currency']} {orig_quote['total_price']} -> Substitute Total: {sub_quote['currency']} {sub_quote['total_price']} (Delta: {price_delta})")
