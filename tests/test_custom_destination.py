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

def test_synthesize_custom_trip_timing_constraint_post_sunset_waterfall():
    """
    Punchlist Item 7: Verify that when user inputs 'put waterfalls post sunset only',
    the synthesizer strictly places the waterfall activity in the evening slot, not at 8:30 AM.
    """
    res = AIService.synthesize_custom_trip(
        destination_name="Gokarna",
        duration_days=2,
        pace_preference="balanced",
        user_custom_requests="put waterfalls post sunset only",
        day_selections=[
            {
                "day_number": 1,
                "selected_activities": ["Vibhooti Waterfalls", "Yana Rocks"]
            }
        ]
    )
    assert res["status"] == "success"
    itinerary = res["custom_package"]["itinerary"]
    day1_slots = itinerary[0]["slots"]
    
    # Morning slot must NOT be waterfall
    morning_slot = day1_slots[0]
    morning_text = (morning_slot.get("title", "") + " " + morning_slot.get("description", "")).lower()
    assert "waterfall" not in morning_text and "vibhooti" not in morning_text

    # Evening slot (or last slot) MUST be the waterfall
    evening_slot = day1_slots[-1]
    evening_text = (evening_slot.get("title", "") + " " + evening_slot.get("description", "")).lower()
    assert "waterfall" in evening_text or "vibhooti" in evening_text
    assert "pm" in evening_slot.get("time", "").lower()

def test_pricing_market_hotel_additive_with_room_capacity():
    """
    Verify that selecting a real-world market hotel adds the market hotel
    pricing with 2 persons per room capacity ((travelers + 1) // 2), while keeping base hotel charges intact.
    """
    from src.pricing.engine import PricingEngine
    from decimal import Decimal
    
    # Reprice with lux hotel
    res_lux = PricingEngine.calculate_repricing(
        package_id="pkg_c3711737",
        selected_component_ids=["cmp_hotel_lux"],
        num_travelers=1
    )
    lux_total = Decimal(res_lux["total_price"])

    # Reprice with market hotel (rate ₹3,000/night for 3 nights * 1 room = ₹9,000)
    res_market = PricingEngine.calculate_repricing(
        package_id="pkg_c3711737",
        selected_component_ids=["cmp_hotel_lux"],
        market_hotel_rate=3000.0,
        market_hotel_name="Seaside Grand Market Hotel",
        num_travelers=1
    )
    assert Decimal(res_market["market_hotel_cost"]) == Decimal("9000.00")
    # Base hotel components remain retained as requested
    assert Decimal(res_market["components_delta_total"]) == Decimal("6500.00")
    assert res_market["market_hotel_name"] == "Seaside Grand Market Hotel"

    # For 3 travelers -> 2 rooms (₹3,000 * 3 nights * 2 rooms = ₹18,000)
    res_market_3 = PricingEngine.calculate_repricing(
        package_id="pkg_c3711737",
        selected_component_ids=["cmp_hotel_lux"],
        market_hotel_rate=3000.0,
        market_hotel_name="Seaside Grand Market Hotel",
        num_travelers=3
    )
    assert Decimal(res_market_3["market_hotel_cost"]) == Decimal("18000.00")

def test_full_itinerary_translation():
    """
    Punchlist Item 8: Verify that translate-itinerary translates trip title, day titles,
    and slot descriptions in a batch.
    """
    from fastapi.testclient import TestClient
    from src.main import app

    client = TestClient(app)
    sample_pkg = {
        "trip_title": "Grand Explorer Adventure",
        "duration_days": 2,
        "itinerary": [
            {
                "day": 1,
                "title": "Heritage Landmark Discovery",
                "notes": "Carry sunscreen and water bottles.",
                "slots": [
                    {
                        "time": "09:00 AM - 12:00 PM",
                        "title": "Ancient Temple Exploration",
                        "type": "spiritual",
                        "description": "Visit historic temple with intricate Dravidian architecture."
                    }
                ]
            }
        ],
        "ai_optimizations": {
            "conflicts_resolved": ["Morning transit schedule aligned with opening hours."],
            "voids_filled": ["Added regional lunch dining."],
            "cost_optimization_tip": "Book on weekdays for lower rates."
        }
    }

    resp = client.post("/api/external/translate-itinerary", json={
        "custom_package": sample_pkg,
        "target_lang": "hi"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    translated_pkg = data["custom_package"]
    assert translated_pkg["trip_title"] != "Grand Explorer Adventure"
    assert len(translated_pkg["itinerary"][0]["title"]) > 0
    assert translated_pkg["itinerary"][0]["title"] != "Heritage Landmark Discovery"
    assert len(translated_pkg["itinerary"][0]["slots"][0]["title"]) > 0


def test_ai_builder_extracts_custom_city_and_budget_raipur():
    from src.ai.service import AIService
    res = AIService.build_custom_trip(
        "Create a 2-day Raipur and food tour package with a Hindi speaking guide under ₹20,000"
    )
    assert res["status"] == "success"
    assert res["destination_name"] == "Raipur"
    assert res["duration_days"] == 2
    assert res["target_budget"] == 20000.0
    assert res["preferred_language"] == "hi"
    assert res["redirect_to_custom_architect"] is True


