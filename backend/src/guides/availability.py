"""
TripCraft / PackagePro Mandatory Guide Availability & Substitution Engine.
Implements §2.2 / §3.3 / §12 hard requirements:
- Date-range clash verification
- Rejection with exact clashing date named
- Same-language & same-specialisation substitute recommendation
- Live price delta calculation
"""

from datetime import datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Any
from src.database import get_db_connection, to_decimal, format_money

class GuideAvailabilityEngine:
    @staticmethod
    def get_date_range(start_date_str: str, duration_days: int) -> List[str]:
        """Generate list of ISO date strings for the trip duration."""
        start_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
        return [(start_dt + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(duration_days)]

    @classmethod
    def check_availability_and_substitute(
        cls,
        guide_id: str,
        start_date: str,
        duration_days: int = 1,
        package_id: Optional[str] = None,
        city_id: Optional[str] = None,
        preferred_language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check guide availability across the trip dates.
        If clashing: refuse with date named & provide same-language/specialisation substitute.
        """
        dates = cls.get_date_range(start_date, duration_days)

        with get_db_connection() as conn:
            # 1. Fetch original guide
            original_guide = conn.execute(
                "SELECT g.*, c.name AS city_name FROM tour_guides g "
                "JOIN cities c ON c.city_id = g.city_id "
                "WHERE g.guide_id = ?",
                (guide_id,)
            ).fetchone()

            if not original_guide:
                raise ValueError(f"Guide not found: {guide_id}")

            orig_day_rate = to_decimal(original_guide["day_rate"])
            orig_languages = [lang.strip() for lang in original_guide["languages"].split(",") if lang.strip()]
            orig_spec = original_guide["specialisation"]
            orig_sec_spec = original_guide.get("secondary_specialisation")
            orig_city_id = city_id or original_guide["city_id"]

            # 2. Query availability for original guide across all requested dates
            clashing_date = None
            multipliers = []

            for dt in dates:
                row = conn.execute(
                    "SELECT is_available, slots_available, price_multiplier "
                    "FROM guide_availability WHERE guide_id = ? AND for_date = ?",
                    (guide_id, dt)
                ).fetchone()

                # Rule §2.2: missing row is treated as unavailable
                if not row or row["is_available"] == 0 or row["slots_available"] <= 0:
                    clashing_date = dt
                    break
                else:
                    multipliers.append(to_decimal(row["price_multiplier"]))

            # 3. IF NO CLASH: Guide is available
            if not clashing_date:
                avg_multiplier = (
                    sum(multipliers) / Decimal(str(len(multipliers)))
                    if multipliers else Decimal("1.00")
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                total_cost = (orig_day_rate * Decimal(str(duration_days)) * avg_multiplier).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

                return {
                    "available": True,
                    "guide_id": guide_id,
                    "guide_name": original_guide["display_name"],
                    "start_date": start_date,
                    "duration_days": duration_days,
                    "dates_checked": dates,
                    "clashing_date": None,
                    "message": f"Guide '{original_guide['display_name']}' is fully available for all {duration_days} day(s).",
                    "day_rate": format_money(orig_day_rate),
                    "price_multiplier": str(avg_multiplier),
                    "total_guide_cost": format_money(total_cost),
                    "currency": original_guide["currency"],
                    "substitute": None,
                    "substitute_price_delta": "0.00"
                }

            # 4. IF CLASH: Rejection Flow + Finding Same-Language & Same-Specialisation Substitute
            rejection_message = (
                f"Guide '{original_guide['display_name']}' is unavailable on {clashing_date} "
                f"(during the {duration_days}-day trip starting {start_date})."
            )

            # Target language filter: if preferred_language given, use that; else primary language of original guide
            target_lang = preferred_language if (preferred_language and preferred_language in orig_languages) else orig_languages[0]

            # Query candidate guides with matching specialisation and active status
            candidates = conn.execute(
                "SELECT g.*, c.name AS city_name FROM tour_guides g "
                "JOIN cities c ON c.city_id = g.city_id "
                "WHERE g.status = 'active' AND g.guide_id != ? "
                "AND (g.specialisation = ? OR g.secondary_specialisation = ? OR g.specialisation = ?)",
                (guide_id, orig_spec, orig_spec, orig_sec_spec or orig_spec)
            ).fetchall()

            valid_substitutes = []

            for cand in candidates:
                cand_langs = [l.strip() for l in cand["languages"].split(",") if l.strip()]
                # Check shared language match
                has_lang_match = any(lang in cand_langs for lang in orig_languages)
                if not has_lang_match:
                    continue

                # Check 100% availability across all requested dates
                cand_available = True
                cand_multipliers = []
                for dt in dates:
                    cand_row = conn.execute(
                        "SELECT is_available, slots_available, price_multiplier "
                        "FROM guide_availability WHERE guide_id = ? AND for_date = ?",
                        (cand["guide_id"], dt)
                    ).fetchone()
                    if not cand_row or cand_row["is_available"] == 0 or cand_row["slots_available"] <= 0:
                        cand_available = False
                        break
                    cand_multipliers.append(to_decimal(cand_row["price_multiplier"]))

                if cand_available:
                    cand_day_rate = to_decimal(cand["day_rate"])
                    cand_avg_mult = (
                        sum(cand_multipliers) / Decimal(str(len(cand_multipliers)))
                        if cand_multipliers else Decimal("1.00")
                    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                    cand_total_cost = (cand_day_rate * Decimal(str(duration_days)) * cand_avg_mult).quantize(
                        Decimal("0.01"), rounding=ROUND_HALF_UP
                    )

                    # Same city bonus score
                    same_city = 1 if cand["city_id"] == orig_city_id else 0
                    rating_val = float(cand["rating"]) if cand["rating"] else 0.0
                    rate_diff = abs(cand_day_rate - orig_day_rate)

                    valid_substitutes.append({
                        "guide": cand,
                        "day_rate": cand_day_rate,
                        "avg_multiplier": cand_avg_mult,
                        "total_cost": cand_total_cost,
                        "same_city": same_city,
                        "rating": rating_val,
                        "rate_diff": rate_diff
                    })

            # Rank substitutes:
            # 1. Same city first
            # 2. Rating DESC
            # 3. Rate proximity (smallest rate_diff)
            # 4. Years experience DESC
            substitute_result = None
            price_delta = Decimal("0.00")

            if valid_substitutes:
                valid_substitutes.sort(
                    key=lambda s: (
                        -s["same_city"],
                        -s["rating"],
                        s["rate_diff"],
                        -s["guide"]["years_experience"]
                    )
                )
                best = valid_substitutes[0]
                best_guide = best["guide"]

                # Price delta = substitute total - original base day_rate * duration
                orig_baseline_cost = orig_day_rate * Decimal(str(duration_days))
                price_delta = (best["total_cost"] - orig_baseline_cost).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

                substitute_result = {
                    "guide_id": best_guide["guide_id"],
                    "display_name": best_guide["display_name"],
                    "city_id": best_guide["city_id"],
                    "city_name": best_guide["city_name"],
                    "languages": best_guide["languages"],
                    "specialisation": best_guide["specialisation"],
                    "secondary_specialisation": best_guide["secondary_specialisation"],
                    "years_experience": best_guide["years_experience"],
                    "rating": best["rating"],
                    "day_rate": format_money(best["day_rate"]),
                    "price_multiplier": str(best["avg_multiplier"]),
                    "total_cost": format_money(best["total_cost"]),
                    "currency": best_guide["currency"],
                    "certified": bool(best_guide["certified"]),
                    "bio": best_guide["bio"]
                }

            return {
                "available": False,
                "guide_id": guide_id,
                "guide_name": original_guide["display_name"],
                "start_date": start_date,
                "duration_days": duration_days,
                "dates_checked": dates,
                "clashing_date": clashing_date,
                "message": rejection_message,
                "rejection_reason": f"Guide unavailable on {clashing_date}",
                "original_day_rate": format_money(orig_day_rate),
                "substitute": substitute_result,
                "substitute_price_delta": format_money(price_delta),
                "currency": original_guide["currency"]
            }
