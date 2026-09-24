"""
Test suite for Custom Destination Architect & Itinerary Synthesizer.
"""

import pytest
from src.ai.service import AIService
from src.external.opentripmap_service import OpenTripMapService

def test_geocode_and_explore_destination():
    """Verify OpenTripMap and OpenStreetMap geocoding and discovery."""
    res = OpenTripMapService.geocode_and_explore(query="Chikmagalur", radius_meters=15000)
    assert res["status"] == "success"
    assert res["destination"]["lat"] is not None
    assert res["destination"]["lng"] is not None
    assert isinstance(res["attractions"], list)

def test_synthesize_custom_trip_decimal_math():
    """Verify that synthesized custom package has exact zero-float Decimal pricing."""
    res = AIService.synthesize_custom_trip(
        destination_name="Chikmagalur",
        duration_days=3,
        pace_preference="balanced",
        day_selections=[
            {
                "day_number": 1,
                "selected_activities": ["Mullayanagiri Trek", "Hirekolale Lake"],
                "selected_hotel": {"name": "Test Resort", "price_per_night": 5000}
            }
        ],
        external_supply_mode=False
    )
    assert res["status"] == "success"
    pkg = res["custom_package"]
    assert pkg["destination"] == "Chikmagalur"
    assert pkg["duration_days"] == 3
    assert "itinerary" in pkg
    assert len(pkg["itinerary"]) == 3

    pricing = pkg["estimated_pricing"]
    assert pricing["currency"] == "INR"
    assert "." in pricing["grand_total"]
    # Check 2 decimal place string format
    cents = pricing["grand_total"].split(".")[1]
    assert len(cents) == 2

def test_ai_builder_redirects_to_custom_architect_when_no_exact_package_matches():
    """
    Verify that when no exact curated package matches (e.g. 5 days in Bhubaneswar under 40k, or Gokarna),
    the system seamlessly routes to Custom Architect with pre-selected options.
    """
    # 1. Test 5-day Bhubaneswar under 40k (DB only has 6-day wildlife at ~68k)
    res = AIService.build_custom_trip(
        user_prompt="Create a 5-day Bhuvaneshwar and food tour package with a Marathi speaking guide under 40,000"
    )
    assert res["status"] == "success"
    assert res["action"] == "custom_architect"
    assert res["redirect_to_custom_architect"] is True
    assert res["destination_name"] == "Bhubaneswar"
    assert res["duration_days"] == 5
    assert res["target_budget"] == 40000.0
    assert res["preferred_language"] == "mr"
    assert "custom_package" in res
    assert res["custom_package"]["duration_days"] == 5

    # 2. Test Gokarna (no curated package in catalog)
    res_gokarna = AIService.build_custom_trip(
        user_prompt="waterfalls trip from gokarna"
    )
    assert res_gokarna["status"] == "success"
    assert res_gokarna["action"] == "custom_architect"
    assert res_gokarna["destination_name"] == "Gokarna"
    assert res_gokarna["redirect_to_custom_architect"] is True

def test_ai_builder_loads_curated_package_when_exact_match_exists():
    """
    Verify that when an exact curated package exists with matching duration and under budget,
    it returns action == 'curated_package' to load in Customizer Studio.
    """
    res = AIService.build_custom_trip(
        user_prompt="4-day adventure trip in Mumbai under 40000"
    )
    assert res["status"] == "success"
    assert res["action"] == "curated_package"
    assert res["redirect_to_custom_architect"] is False
    assert res["package"]["package_id"] == "pkg_c3711737"
    assert res["package"]["duration_days"] == 4

