"""
Grounded AI Trip Builder & Guide Matcher Service.
Strictly conforms to Rule §7 & Guardrails:
AI only ranks, customizes, and explains real database rows; never hallucinates prices or IDs.
"""

import json
import logging
from typing import Dict, List, Any, Optional
from src.database import get_db_connection, to_decimal, format_money
from src.pricing.engine import PricingEngine
from src.guides.availability import GuideAvailabilityEngine
from src.ai.gemini_client import GeminiClient

logger = logging.getLogger("ai_service")

# Indian Region Mapping for Semantic Fallback
REGION_MAP = {
    "south india": ["tamil nadu", "kerala", "karnataka", "andhra pradesh", "telangana", "puducherry", "ooty", "bengaluru", "munnar", "kochi", "thiruvananthapuram", "madurai", "thanjavur", "tirupati", "hampi", "mysuru", "gokarna", "alleppey", "wayanad", "visakhapatnam"],
    "north india": ["rajasthan", "delhi", "uttar pradesh", "uttarakhand", "himachal pradesh", "punjab", "jammu and kashmir", "ladakh", "jaipur", "jodhpur", "udaipur", "jaisalmer", "agra", "varanasi", "rishikesh", "manali", "shimla", "srinagar", "leh", "new delhi", "amritsar", "nainital", "lucknow"],
    "west india": ["maharashtra", "gujarat", "goa", "mumbai", "pune", "aurangabad", "ahmedabad", "bhuj", "panaji"],
    "east india": ["west bengal", "odisha", "kolkata", "darjeeling", "bhubaneswar", "puri"],
    "north east india": ["sikkim", "assam", "meghalaya", "gangtok", "guwahati", "shillong"],
    "international": ["dubai", "abu dhabi", "doha", "singapore", "kuala lumpur", "bangkok", "bali", "kathmandu", "pokhara", "colombo", "kandy", "male", "thimphu", "zurich", "kyoto"]
}

class AIService:
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
