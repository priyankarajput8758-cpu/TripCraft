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
