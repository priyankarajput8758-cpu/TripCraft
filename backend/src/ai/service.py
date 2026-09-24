"""
Grounded AI Trip Builder & Guide Matcher Service.
Strictly conforms to Rule §7 & Guardrails:
AI only ranks, customizes, and explains real database rows; never hallucinates prices or IDs.
"""

import json
import re
from typing import Dict, List, Any, Optional
from src.database import get_db_connection, to_decimal, format_money
from src.pricing.engine import PricingEngine
from src.guides.availability import GuideAvailabilityEngine
from src.ai.gemini_client import GeminiClient

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
        AI Trip Builder: Parses natural language, queries candidate packages/components,
        ranks best fit, selects components, and provides a grounded explanation.
        """
        with get_db_connection() as conn:
            # 1. Retrieve Candidate Packages from DB
            query = "SELECT * FROM tour_packages WHERE status = 'active'"
            params = []
            if destination_city_id:
                query += " AND city_id = ?"
                params.append(destination_city_id)

            candidates = conn.execute(query, params).fetchall()

            if not candidates:
                # Fallback to all active packages
                candidates = conn.execute("SELECT * FROM tour_packages WHERE status = 'active' LIMIT 15").fetchall()

            # 2. Score & Rank Packages grounded in real data
            scored = []
            prompt_lower = (user_prompt + " " + (interests or "")).lower()

            for pkg in candidates:
                score = 0
                pkg_theme = pkg["theme"].lower()
                pkg_name = pkg["name"].lower()
                pkg_desc = pkg["description"].lower()

                # Theme matching
                if pkg_theme in prompt_lower:
                    score += 40
                for word in ["heritage", "temple", "spiritual", "adventure", "romantic", "honeymoon", "wildlife", "beach", "luxury", "family"]:
                    if word in prompt_lower and (word in pkg_theme or word in pkg_name or word in pkg_desc):
                        score += 25

                # Language matching
                if preferred_language and preferred_language in pkg["languages_offered"]:
                    score += 30

                # Budget proximity
                if max_budget:
                    pkg_price = float(to_decimal(pkg["base_price"]))
                    if pkg_price <= max_budget:
                        score += 20
                    elif pkg_price <= max_budget * 1.2:
                        score += 5

                # Duration matching
                if duration_days and pkg["duration_days"] == duration_days:
                    score += 20

                scored.append((score, pkg))

            scored.sort(key=lambda x: x[0], reverse=True)
            chosen_pkg = scored[0][1] if scored else candidates[0]
            package_id = chosen_pkg["package_id"]

            # 3. Retrieve all real components for chosen package
            components = conn.execute(
                "SELECT * FROM package_components WHERE package_id = ? ORDER BY day_index, slot",
                (package_id,)
            ).fetchall()

            # 4. Select components (default non-optional + best fit per swap group)
            selected_comp_ids = []
            seen_swap_groups = set()

            for comp in components:
                sg = comp["swap_group"]
                if comp["is_optional"] == 0:
                    if sg:
                        if sg not in seen_swap_groups:
                            selected_comp_ids.append(comp["component_id"])
                            seen_swap_groups.add(sg)
                    else:
                        selected_comp_ids.append(comp["component_id"])
                else:
                    # Check if optional activity matches prompt interests
                    comp_title_lower = comp["title"].lower()
                    if any(w in prompt_lower for w in ["guide", "safari", "dinner", "cruise", "temple", "museum", "spa"]):
                        if any(w in comp_title_lower for w in ["safari", "cruise", "dinner", "tour", "vip", "spa"]):
                            selected_comp_ids.append(comp["component_id"])

            # 5. Best matching guide in package city
            guide = conn.execute(
                "SELECT * FROM tour_guides WHERE city_id = ? AND status = 'active' ORDER BY rating DESC LIMIT 1",
                (chosen_pkg["city_id"],)
            ).fetchone()
            guide_id = guide["guide_id"] if guide else None

            # 6. Compute exact Decimal Repricing
            reprice = PricingEngine.calculate_repricing(
                package_id=package_id,
                selected_component_ids=selected_comp_ids,
                guide_id=guide_id,
                start_date="2026-09-24"
            )

            # 7. AI Explanation Generation via Gemini (with deterministic fallback)
            system_inst = "You are TripCraft AI, an expert travel architect. Explain succinctly why this package and itinerary components were curated for the traveller."
            prompt = (
                f"Traveller prompt: '{user_prompt}'\n"
                f"Curated package: {chosen_pkg['name']} ({chosen_pkg['theme']}, {chosen_pkg['duration_days']} days in {chosen_pkg['city_id']})\n"
                f"Total Price: {reprice['currency']} {reprice['total_price']}\n"
                f"Selected Components: {[c['title'] for c in reprice['line_items']]}\n"
                f"Local Guide: {guide['display_name'] if guide else 'Self-guided'}\n"
                "Give a 2-3 sentence personalized justification for this custom package."
            )

            ai_explanation = GeminiClient.generate_content(prompt, system_inst)
            if not ai_explanation:
                ai_explanation = (
                    f"Curated the '{chosen_pkg['name']}' package matching your interest in {chosen_pkg['theme']}. "
                    f"Customized with {len(reprice['line_items'])} components including {reprice['line_items'][0]['title'] if reprice['line_items'] else 'top experiences'}, "
                    f"priced accurately at {reprice['currency']} {reprice['total_price']}."
                )

            return {
                "status": "success",
                "grounded": True,
                "user_prompt": user_prompt,
                "package": chosen_pkg,
                "reprice_summary": reprice,
                "assigned_guide": guide,
                "ai_explanation": ai_explanation.strip()
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
            top_guide = guides[0]
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
