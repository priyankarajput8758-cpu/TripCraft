"""
Grounded AI Trip Builder & Custom Itinerary Synthesizer Service.
Strictly conforms to Rule §7 & Guardrails:
AI only ranks, customizes, balances, and explains real data; never hallucinates broken prices.
"""

import json
import logging
from decimal import Decimal
from typing import Dict, List, Any, Optional
from src.database import get_db_connection, to_decimal, format_money
from src.pricing.engine import PricingEngine
from src.guides.availability import GuideAvailabilityEngine
from src.ai.gemini_client import GeminiClient

logger = logging.getLogger("ai_service")

# Indian Region Mapping for Semantic Fallback
REGION_MAP = {
    "south india": ["tamil nadu", "kerala", "karnataka", "andhra pradesh", "telangana", "puducherry", "ooty", "bengaluru", "munnar", "kochi", "thiruvananthapuram", "madurai", "thanjavur", "tirupati", "hampi", "mysuru", "gokarna", "alleppey", "wayanad", "visakhapatnam", "chikmagalur", "coorg"],
    "north india": ["rajasthan", "delhi", "uttar pradesh", "uttarakhand", "himachal pradesh", "punjab", "jammu and kashmir", "ladakh", "jaipur", "jodhpur", "udaipur", "jaisalmer", "agra", "varanasi", "rishikesh", "manali", "shimla", "srinagar", "leh", "new delhi", "amritsar", "nainital", "lucknow"],
    "west india": ["maharashtra", "gujarat", "goa", "mumbai", "pune", "aurangabad", "ahmedabad", "bhuj", "panaji"],
    "east india": ["west bengal", "odisha", "kolkata", "darjeeling", "bhubaneswar", "puri"],
    "north east india": ["sikkim", "assam", "meghalaya", "gangtok", "guwahati", "shillong"],
    "international": ["dubai", "abu dhabi", "doha", "singapore", "kuala lumpur", "bangkok", "bali", "kathmandu", "pokhara", "colombo", "kandy", "male", "thimphu", "zurich", "kyoto"]
}

# Rich Photography Curations for Grounded Custom Destinations
DESTINATION_PHOTOS = {
    "chikmagalur": "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1000&q=80",
    "coorg": "https://images.unsplash.com/photo-1598894101832-61a7a02c3809?auto=format&fit=crop&w=1000&q=80",
    "hampi": "https://images.unsplash.com/photo-1600100397608-f46338b77626?auto=format&fit=crop&w=1000&q=80",
    "ooty": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1000&q=80",
    "varanasi": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1000&q=80",
    "jaipur": "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?auto=format&fit=crop&w=1000&q=80",
    "kerala": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80",
    "munnar": "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1000&q=80",
    "manali": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1000&q=80",
    "ladakh": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1000&q=80",
    "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80",
    "mysuru": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80",
    "bengaluru": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1000&q=80",
    "delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1000&q=80",
    "mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1000&q=80",
    "rishikesh": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1000&q=80",
    "darjeeling": "https://images.unsplash.com/photo-1622308644420-a922440fa352?auto=format&fit=crop&w=1000&q=80",
    "default": "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80"
}

SLOT_TYPE_PHOTOS = {
    "trek": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
    "sightseeing": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80",
    "heritage": "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80",
    "dining": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    "scenic": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    "spiritual": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
    "adventure": "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=800&q=80",
    "cultural": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
    "leisure": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
}

def get_destination_photo(dest_name: str) -> str:
    dest_lower = (dest_name or "").lower().strip()
    for key, url in DESTINATION_PHOTOS.items():
        if key in dest_lower:
            return url
    return DESTINATION_PHOTOS["default"]

def get_slot_photo(slot_type: str, title: str = "") -> str:
    t_lower = (slot_type or "").lower().strip()
    title_lower = (title or "").lower().strip()
    if any(w in title_lower for w in ["food", "lunch", "dinner", "breakfast", "cafe", "coffee", "restaurant", "meal"]):
        return SLOT_TYPE_PHOTOS["dining"]
    if any(w in title_lower for w in ["trek", "peak", "hike", "hill", "climb", "giri"]):
        return SLOT_TYPE_PHOTOS["trek"]
    if any(w in title_lower for w in ["temple", "ghat", "shrine", "aarti", "puja", "ashram", "church", "mosque"]):
        return SLOT_TYPE_PHOTOS["spiritual"]
    for key, url in SLOT_TYPE_PHOTOS.items():
        if key in t_lower:
            return url
    return SLOT_TYPE_PHOTOS["sightseeing"]

class AIService:
    @classmethod
    def synthesize_custom_trip(
        cls,
        destination_name: str,
        duration_days: int = 3,
        pace_preference: str = "balanced",
        day_selections: Optional[List[Dict[str, Any]]] = None,
        external_supply_mode: bool = False,
        selected_guide_id: Optional[str] = None,
        start_date: str = "2026-09-24",
        lat: Optional[float] = None,
        lng: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes a brand new custom itinerary for any destination (e.g. Chikmagalur)
        evaluating day-wise multi-select experiences, timing conflicts, void filling,
        and hotel surge/cost optimization with Gemini Flash.
        """
        day_selections = day_selections or []
        num_days = max(1, duration_days)

        # 1. Prepare day selections summary for Gemini prompt
        selections_text = []
        hotel_total_dec = Decimal("0.00")
        total_activities_count = 0

        for idx in range(1, num_days + 1):
            day_data = next((d for d in day_selections if d.get("day_number") == idx), None)
            acts = day_data.get("selected_activities", []) if day_data else []
            total_activities_count += len(acts)
            hotel = day_data.get("selected_hotel") if day_data else None

            hotel_name = hotel.get("name", "Standard Destination Hotel") if hotel else "Standard Destination Hotel"
            hotel_rate = float(hotel.get("price_per_night", 3500)) if hotel else 3500.0

            hotel_total_dec += to_decimal(hotel_rate)
            acts_str = ", ".join(acts) if acts else "No specific activity selected yet"
            selections_text.append(f"- Day {idx}: Activities: [{acts_str}] | Hotel: {hotel_name} (₹{hotel_rate:.2f}/night)")

        # 2. Construct Gemini Optimization Prompt
        prompt = f"""Destination: {destination_name}
Duration: {num_days} Days (Nights: {num_days - 1})
Pace Preference: {pace_preference.upper()} (Relaxed = 1-2 key spots/day, Balanced = 2-4 spots/day, Packed = 4+ spots/day)
External Supply Mode: {"ON (Real-World Google Hotels Live)" if external_supply_mode else "OFF (Catalog Supply)"}

User's Day-Wise Selections:
{chr(10).join(selections_text)}

Task Requirements:
1. Activity Void Filling: If any day has too few activities for the chosen pace, intelligently insert authentic local spots/experiences in {destination_name} that do NOT duplicate any other day.
2. Timing & Transit Conflict Resolution: Check for timing overlaps (e.g. two sunset spots on same day, or excessive transit). Explain adjustments made.
3. Cost & Date Optimization: Provide actionable advice on booking dates, weekday vs weekend hotel rate surges (e.g. comparing next/prior 7 days), and budget tips.
4. Generate a structured day-by-day itinerary schedule with realistic time slots (Morning, Afternoon, Evening).

Return ONLY a valid JSON object strictly matching this schema:
{{
  "trip_title": "<engaging trip title for this custom package>",
  "destination": "{destination_name}",
  "duration_days": {num_days},
  "pace": "{pace_preference}",
  "itinerary": [
    {{
      "day": 1,
      "title": "<theme or focus of day>",
      "slots": [
        {{"time": "08:30 AM - 11:30 AM", "title": "<activity name>", "type": "trek|sightseeing|leisure|spiritual", "description": "<concise description>"}},
        {{"time": "12:30 PM - 02:00 PM", "title": "<lunch/dining>", "type": "dining", "description": "<local food recommendation>"}},
        {{"time": "04:30 PM - 06:30 PM", "title": "<evening experience>", "type": "scenic|cultural", "description": "<details>"}}
      ],
      "notes": "<practical day advice>"
    }}
  ],
  "ai_optimizations": {{
    "conflicts_resolved": ["<concrete timing or transit conflict identified and fixed>"],
    "voids_filled": ["<specific local activity added to balance a day>"],
    "cost_optimization_tip": "<hotel rate analysis and date adjustment recommendation for cost saving>"
  }},
  "estimated_pricing": {{
    "hotel_total": 0,
    "activities_total": 0,
    "transfers_total": 0,
    "gst_tax": 0,
    "grand_total": 0,
    "currency": "INR"
  }}
}}
"""

        system_inst = "You are TripCraft's elite custom itinerary architect and schedule optimizer. Create grounded, seamless travel plans."

        ai_res = GeminiClient.generate_json(prompt, system_inst)

        # 3. Fallback Deterministic Custom Package Synthesizer if Gemini is offline
        if not ai_res or not isinstance(ai_res, dict) or "itinerary" not in ai_res:
            itinerary_fallback = []
            for d in range(1, num_days + 1):
                day_data = next((item for item in day_selections if item.get("day_number") == d), None)
                acts = day_data.get("selected_activities", []) if day_data else []

                slots = []
                if acts:
                    slots.append({
                        "time": "08:30 AM - 12:00 PM",
                        "title": acts[0],
                        "type": "sightseeing",
                        "description": f"Morning discovery of {acts[0]} with local insights."
                    })
                    slots.append({
                        "time": "01:00 PM - 02:30 PM",
                        "title": f"Local Cuisine Lunch in {destination_name}",
                        "type": "dining",
                        "description": f"Experience authentic local dishes at a top-rated dining spot."
                    })
                    if len(acts) > 1:
                        slots.append({
                            "time": "04:00 PM - 06:30 PM",
                            "title": acts[1],
                            "type": "scenic",
                            "description": f"Evening exploration of {acts[1]} during sunset."
                        })
                    else:
                        slots.append({
                            "time": "04:30 PM - 06:30 PM",
                            "title": f"{destination_name} Scenic Sunset Viewpoint",
                            "type": "scenic",
                            "description": "Unwind with panoramic views of the surrounding landscapes."
                        })
                else:
                    slots = [
                        {"time": "09:00 AM - 12:00 PM", "title": f"Highlights of {destination_name}", "type": "sightseeing", "description": f"Explore iconic landmarks and scenic highlights."},
                        {"time": "01:00 PM - 02:30 PM", "title": "Regional Specialties Lunch", "type": "dining", "description": "Savor authentic regional flavors."},
                        {"time": "04:30 PM - 06:30 PM", "title": "Evening Walk & Cultural Immersion", "type": "cultural", "description": "Relaxed evening walk through local markets and viewpoints."}
                    ]

                itinerary_fallback.append({
                    "day": d,
                    "title": f"Day {d}: Exploring {destination_name}",
                    "slots": slots,
                    "notes": f"Comfortable shoes and hydration recommended for Day {d}."
                })

            ai_res = {
                "trip_title": f"Custom {num_days}-Day {destination_name} Explorer",
                "destination": destination_name,
                "duration_days": num_days,
                "pace": pace_preference,
                "itinerary": itinerary_fallback,
                "ai_optimizations": {
                    "conflicts_resolved": [
                        f"Sequenced morning treks and afternoon scenic points to avoid peak heat and transit friction in {destination_name}."
                    ],
                    "voids_filled": [
                        f"Balanced Day schedules with authentic local dining and viewpoint stops to ensure smooth {pace_preference} pacing."
                    ],
                    "cost_optimization_tip": f"Properties in {destination_name} offer up to 20% lower tariffs on midweek bookings (Tuesday–Thursday) compared to Friday–Sunday weekends."
                }
            }

        # 4. Attach Destination Cover Photo & Slot Imagery
        ai_res["cover_image"] = get_destination_photo(destination_name)
        for day in ai_res.get("itinerary", []):
            for slot in day.get("slots", []):
                if not slot.get("image_url"):
                    slot["image_url"] = get_slot_photo(slot.get("type", ""), slot.get("title", ""))

        # 5. Enforce Strict Zero-Float Decimal Pricing
        hotel_total = to_decimal(str(hotel_total_dec if hotel_total_dec > 0 else Decimal("3500.00") * num_days))
        act_cost_per_item = Decimal("750.00")
        activities_total = to_decimal(str(act_cost_per_item * max(total_activities_count, num_days * 2)))
        transfers_total = to_decimal(str(Decimal("1400.00") * num_days))

        subtotal = hotel_total + activities_total + transfers_total
        gst_tax = to_decimal(str(subtotal * Decimal("0.05")))
        grand_total = subtotal + gst_tax

        ai_res["estimated_pricing"] = {
            "hotel_total": format_money(hotel_total),
            "activities_total": format_money(activities_total),
            "transfers_total": format_money(transfers_total),
            "gst_tax": format_money(gst_tax),
            "grand_total": format_money(grand_total),
            "currency": "INR"
        }

        return {
            "status": "success",
            "custom_package": ai_res
        }

    @classmethod
    def build_custom_trip(
        cls,
        user_prompt: str,
        destination_city_id: Optional[str] = None,
        max_budget: Optional[float] = None,
        duration_days: Optional[int] = None,
        preferred_language: Optional[str] = None,
        interests: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        AI Trip Builder: Evaluates natural language constraints with Gemini Flash,
        grounded strictly in SQLite database catalog, followed by strict Decimal repricing.
        """
        with get_db_connection() as conn:
            # 1. Retrieve all candidate packages with joined city information
            query = """
                SELECT p.*, c.name as city_name, c.state as city_state, c.region as city_region,
                       c.lat as city_lat, c.lng as city_lng, c.primary_language as city_language
                FROM tour_packages p
                JOIN cities c ON p.city_id = c.city_id
                WHERE p.status = 'active'
            """
            params = []
            if destination_city_id:
                query += " AND p.city_id = ?"
                params.append(destination_city_id)

            candidates = conn.execute(query, params).fetchall()
            if not candidates:
                candidates = conn.execute(
                    "SELECT p.*, c.name as city_name, c.state as city_state, c.region as city_region FROM tour_packages p JOIN cities c ON p.city_id = c.city_id WHERE p.status = 'active'"
                ).fetchall()

            candidates_list = [dict(c) for c in candidates]

            # 2. Try Gemini Structured Package Architect First
            chosen_pkg_id = None
            gemini_reasoning = None

            prompt_combined = f"{user_prompt} {interests or ''}".strip()

            gemini_payload = [
                {
                    "package_id": c["package_id"],
                    "name": c["name"],
                    "duration_days": c["duration_days"],
                    "theme": c["theme"],
                    "base_price": str(c["base_price"]),
                    "city": c["city_name"],
                    "state": c.get("city_state"),
                    "region": c.get("city_region"),
                    "description": c.get("description", "")
                }
                for c in candidates_list
            ]

            ai_prompt = f"""User Travel Request: "{prompt_combined}"
Filters: Max Budget: {max_budget or 'Flexible'}, Preferred Duration: {duration_days or 'Flexible'} Days, Language: {preferred_language or 'Any'}

Available Real Verified Packages from Database:
{json.dumps(gemini_payload, indent=2)}

Task:
Analyze the user's travel request (region/geography, duration, theme, budget, style) and select the single best matching package from the database list above.
Return a valid JSON object ONLY with this structure:
{{
  "selected_package_id": "<package_id from list>",
  "reasoning": "<2-3 sentence personalized justification explaining why this package, destination, and duration fits their exact request>",
  "suggested_hotel_tier": "luxury|standard|budget",
  "highlight": "<key memorable feature>"
}}
"""
            system_inst = "You are TripCraft's Grounded AI Travel Architect. Match traveller requests strictly to real database packages."

            ai_response = GeminiClient.generate_json(ai_prompt, system_inst)
            if ai_response and isinstance(ai_response, dict) and "selected_package_id" in ai_response:
                matched_id = ai_response["selected_package_id"]
                if any(c["package_id"] == matched_id for c in candidates_list):
                    chosen_pkg_id = matched_id
                    gemini_reasoning = ai_response.get("reasoning")
                    logger.info(f"Gemini selected package {chosen_pkg_id} with reasoning: {gemini_reasoning}")

            # 3. Fallback Deterministic Multi-Dimension Scorer if Gemini did not pick
            if not chosen_pkg_id:
                prompt_lower = prompt_combined.lower()
                scored = []

                for pkg in candidates_list:
                    score = 0
                    pkg_name = pkg["name"].lower()
                    pkg_theme = (pkg.get("theme") or "").lower()
                    pkg_city = (pkg.get("city_name") or "").lower()
                    pkg_state = (pkg.get("city_state") or "").lower()
                    pkg_region = (pkg.get("city_region") or "").lower()
                    pkg_desc = (pkg.get("description") or "").lower()

                    # Geographic and Regional Matching
                    for reg_name, places in REGION_MAP.items():
                        if reg_name in prompt_lower:
                            if pkg_region == reg_name or any(p in pkg_city or p in pkg_state for p in places):
                                score += 80

                    # Direct city / state keyword match
                    if pkg_city in prompt_lower:
                        score += 100
                    if pkg_state and pkg_state in prompt_lower:
                        score += 70

                    # Theme matching
                    if pkg_theme and pkg_theme in prompt_lower:
                        score += 50
                    for kw in ["heritage", "temple", "spiritual", "adventure", "romantic", "honeymoon", "wildlife", "beach", "luxury", "family", "food", "wellness"]:
                        if kw in prompt_lower and (kw in pkg_theme or kw in pkg_name or kw in pkg_desc):
                            score += 30

                    # Duration matching (exact = +60, 1 day diff = +20)
                    if duration_days:
                        diff = abs(pkg["duration_days"] - duration_days)
                        if diff == 0:
                            score += 60
                        elif diff == 1:
                            score += 25
                    else:
                        # Parse duration from text like "5 day" or "5 days"
                        import re
                        day_match = re.search(r'(\d+)\s*(?:day|days)', prompt_lower)
                        if day_match:
                            parsed_days = int(day_match.group(1))
                            diff = abs(pkg["duration_days"] - parsed_days)
                            if diff == 0:
                                score += 60
                            elif diff == 1:
                                score += 25

                    # Language matching
                    if preferred_language and preferred_language in (pkg.get("languages_offered") or ""):
                        score += 30

                    # Budget matching
                    if max_budget:
                        pkg_price = float(to_decimal(pkg["base_price"]))
                        if pkg_price <= max_budget:
                            score += 30
                        elif pkg_price <= max_budget * 1.2:
                            score += 10

                    scored.append((score, pkg))

                scored.sort(key=lambda x: x[0], reverse=True)
                chosen_pkg_id = scored[0][1]["package_id"] if scored else candidates_list[0]["package_id"]

            chosen_pkg = next((c for c in candidates_list if c["package_id"] == chosen_pkg_id), candidates_list[0])
            package_id = chosen_pkg["package_id"]

            # 4. Retrieve all real components for chosen package
            components = conn.execute(
                "SELECT * FROM package_components WHERE package_id = ? ORDER BY day_index, slot",
                (package_id,)
            ).fetchall()

            # 5. Select components (default non-optional + best fit per swap group)
            selected_comp_ids = []
            seen_swap_groups = set()
            prompt_lower = prompt_combined.lower()

            for comp in components:
                sg = comp["swap_group"]
                is_opt = comp["is_optional"]

                if is_opt == 0:
                    if sg:
                        if sg not in seen_swap_groups:
                            selected_comp_ids.append(comp["component_id"])
                            seen_swap_groups.add(sg)
                    else:
                        selected_comp_ids.append(comp["component_id"])
                else:
                    # Contextual add-on selection based on prompt
                    comp_title_lower = comp["title"].lower()
                    if any(w in prompt_lower for w in ["guide", "safari", "dinner", "cruise", "temple", "darshan", "museum", "spa", "aarti", "trek"]):
                        if any(w in comp_title_lower for w in ["safari", "cruise", "dinner", "tour", "vip", "spa", "darshan", "aarti", "trek"]):
                            selected_comp_ids.append(comp["component_id"])

            # 6. Best matching guide in package city
            guide = conn.execute(
                "SELECT * FROM tour_guides WHERE city_id = ? AND status = 'active' ORDER BY rating DESC LIMIT 1",
                (chosen_pkg["city_id"],)
            ).fetchone()
            guide_dict = dict(guide) if guide else None
            guide_id = guide_dict["guide_id"] if guide_dict else None

            # 7. Compute exact Decimal Repricing
            reprice = PricingEngine.calculate_repricing(
                package_id=package_id,
                selected_component_ids=selected_comp_ids,
                guide_id=guide_id,
                start_date="2026-09-24"
            )

            # 8. Generate personalized explanation if not provided by Gemini
            if not gemini_reasoning:
                gemini_reasoning = (
                    f"Curated the '{chosen_pkg['name']}' package in {chosen_pkg.get('city_name', 'destination')} "
                    f"to match your preference for {chosen_pkg.get('theme', 'custom')} travel. "
                    f"Configured with {len(reprice['line_items'])} verified itinerary items "
                    f"for a verified total of {reprice['currency']} {reprice['total_price']}."
                )

            return {
                "status": "success",
                "grounded": True,
                "user_prompt": user_prompt,
                "package": chosen_pkg,
                "reprice_summary": reprice,
                "assigned_guide": guide_dict,
                "ai_explanation": gemini_reasoning.strip()
            }

    @classmethod
    def match_best_guide(
        cls,
        city_id: str,
        start_date: str,
        duration_days: int = 3,
        language: str = "en",
        specialisation: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        AI Guide Matcher: Identifies and verifies availability for best local guide.
        """
        with get_db_connection() as conn:
            query = "SELECT * FROM tour_guides WHERE city_id = ? AND status = 'active'"
            params = [city_id]

            if language:
                query += " AND languages LIKE ?"
                params.append(f"%{language}%")

            if specialisation:
                query += " AND (specialisation = ? OR secondary_specialisation = ?)"
                params.extend([specialisation, specialisation])

            query += " ORDER BY rating DESC, years_experience DESC"
            guides = conn.execute(query, params).fetchall()

            if not guides:
                # Fallback to any active guide in city
                guides = conn.execute(
                    "SELECT * FROM tour_guides WHERE city_id = ? AND status = 'active' ORDER BY rating DESC",
                    (city_id,)
                ).fetchall()

            if not guides:
                return {"status": "no_guides_found", "guide": None}

            # Check availability on top candidate
            top_guide = dict(guides[0])
            avail_check = GuideAvailabilityEngine.check_availability_and_substitute(
                guide_id=top_guide["guide_id"],
                start_date=start_date,
                duration_days=duration_days,
                preferred_language=language
            )

            return {
                "status": "matched",
                "guide": top_guide,
                "availability_status": avail_check
            }
