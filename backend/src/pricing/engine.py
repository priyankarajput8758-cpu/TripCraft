"""
TripCraft / PackagePro Repricing Engine.
Implements Rule R3 (Decimal Money) and §3.1/§9 exact repricing from scratch.
Zero float math anywhere.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Any
from src.database import get_db_connection, to_decimal, format_money

class PricingEngine:
    @staticmethod
    def calculate_repricing(
        package_id: str,
        selected_component_ids: List[str],
        guide_id: Optional[str] = None,
        start_date: Optional[str] = None,
        duration_days: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Recompute package total strictly from scratch in Decimal.
        Total = base_price + sum(price_delta of selected non-optional components) + guide_cost
        """
        with get_db_connection() as conn:
            # 1. Fetch package details
            pkg = conn.execute(
                "SELECT package_id, name, base_price, currency, duration_days FROM tour_packages WHERE package_id = ?",
                (package_id,)
            ).fetchone()

            if not pkg:
                raise ValueError(f"Package not found: {package_id}")

            base_price = to_decimal(pkg["base_price"])
            currency = pkg["currency"]
            trip_duration = duration_days or pkg["duration_days"]

            # 2. Fetch all components belonging to this package
            all_components = conn.execute(
                "SELECT * FROM package_components WHERE package_id = ? ORDER BY day_index, slot",
                (package_id,)
            ).fetchall()

            component_map = {c["component_id"]: c for c in all_components}

            # 3. Determine active components
            # If user provided selected_component_ids, use those;
            # otherwise default to non-optional components + first item per swap group.
            active_component_ids = set(selected_component_ids) if selected_component_ids is not None else set()

            if not active_component_ids:
                # Default selection: include all mandatory components
                for c in all_components:
                    if c["is_optional"] == 0:
                        active_component_ids.add(c["component_id"])

            # 4. Sum price deltas from scratch
            components_delta_total = Decimal("0.00")
            line_items = []

            for comp_id in active_component_ids:
                comp = component_map.get(comp_id)
                if comp:
                    delta = to_decimal(comp["price_delta"])
                    components_delta_total += delta
                    line_items.append({
                        "component_id": comp["component_id"],
                        "component_type": comp["component_type"],
                        "title": comp["title"],
                        "swap_group": comp["swap_group"],
                        "day_index": comp["day_index"],
                        "slot": comp["slot"],
                        "price_delta": format_money(delta),
                        "is_optional": bool(comp["is_optional"]),
                        "is_swappable": bool(comp["is_swappable"])
                    })

            # 5. Calculate Guide Pricing if guide selected
            guide_cost = Decimal("0.00")
            guide_detail = None

            if guide_id:
                guide = conn.execute(
                    "SELECT guide_id, display_name, day_rate, half_day_rate, currency, languages, specialisation, rating "
                    "FROM tour_guides WHERE guide_id = ?",
                    (guide_id,)
                ).fetchone()

                if guide:
                    day_rate = to_decimal(guide["day_rate"])
                    days = Decimal(str(trip_duration))

                    # Check average price multiplier across dates if start_date provided
                    multiplier = Decimal("1.00")
                    if start_date:
                        avail_rows = conn.execute(
                            "SELECT price_multiplier FROM guide_availability "
                            "WHERE guide_id = ? AND for_date >= ? "
                            "ORDER BY for_date LIMIT ?",
                            (guide_id, start_date, trip_duration)
                        ).fetchall()
                        if avail_rows:
                            total_mult = sum(to_decimal(r["price_multiplier"]) for r in avail_rows)
                            multiplier = (total_mult / Decimal(str(len(avail_rows)))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                    # guide_cost = day_rate * days * multiplier
                    raw_guide_cost = day_rate * days * multiplier
                    guide_cost = raw_guide_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                    guide_detail = {
                        "guide_id": guide["guide_id"],
                        "display_name": guide["display_name"],
                        "languages": guide["languages"],
                        "specialisation": guide["specialisation"],
                        "rating": float(guide["rating"]) if guide["rating"] else 0.0,
                        "day_rate": format_money(day_rate),
                        "days_booked": trip_duration,
                        "price_multiplier": str(multiplier),
                        "total_cost": format_money(guide_cost)
                    }

            # 6. Final Total = base_price + components_delta_total + guide_cost
            total_price = (base_price + components_delta_total + guide_cost).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            return {
                "package_id": package_id,
                "package_name": pkg["name"],
                "currency": currency,
                "currency_symbol": "₹" if currency == "INR" else f"{currency} ",
                "base_price": format_money(base_price),
                "components_delta_total": format_money(components_delta_total),
                "guide_cost": format_money(guide_cost),
                "total_price": format_money(total_price),
                "duration_days": trip_duration,
                "selected_components_count": len(line_items),
                "line_items": line_items,
                "guide_detail": guide_detail
            }
