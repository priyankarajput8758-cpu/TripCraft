"""
Booking & Package Selections Persistence Engine.
Implements Rule R2 (Opaque IDs), R3 (Decimal Money), and mandatory idempotency key enforcement.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, List, Optional, Any
from src.database import get_db_connection, to_decimal, format_money
from src.pricing.engine import PricingEngine

class BookingService:
    @staticmethod
    def create_booking(
        package_id: str,
        user_id: str,
        selected_component_ids: List[str],
        idempotency_key: str,
        guide_id: Optional[str] = None,
        start_date: Optional[str] = None,
        party_size: int = 2,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates a confirmed booking, creates trip, versioned itinerary,
        persists package selections, and returns booking receipt.
        """
        now = datetime.now(timezone.utc).isoformat()

        with get_db_connection() as conn:
            # 1. Idempotency Check
            existing = conn.execute(
                "SELECT * FROM bookings WHERE idempotency_key = ?",
                (idempotency_key,)
            ).fetchone()
            if existing:
                return {
                    "status": "already_confirmed",
                    "message": "Booking previously confirmed with this idempotency key.",
                    "booking": existing
                }

            # 2. Recalculate price from scratch using PricingEngine
            reprice = PricingEngine.calculate_repricing(
                package_id=package_id,
                selected_component_ids=selected_component_ids,
                guide_id=guide_id,
                start_date=start_date
            )

            total_amount = reprice["total_price"]
            currency = reprice["currency"]
            tax_amount = format_money(to_decimal(total_amount) * Decimal("0.05")) # 5% GST

            # 3. Generate Opaque IDs (R2)
            uid_hex = uuid.uuid4().hex[:8]
            trip_id = f"trp_{uid_hex}"
            itinerary_id = f"itn_{uid_hex}"
            booking_id = f"bkg_{uid_hex}"
            booking_ref = f"BKG-{uid_hex.upper()}"

            # Fetch package to get destination city
            pkg = conn.execute(
                "SELECT city_id, name, duration_days FROM tour_packages WHERE package_id = ?",
                (package_id,)
            ).fetchone()

            start_dt = start_date or datetime.now().strftime("%Y-%m-%d")

            # 4. Insert Trip
            conn.execute("""
                INSERT INTO trips (
                    trip_id, owner_user_id, title, destination_city_id, start_date, end_date,
                    party_size, adults, children, trip_type, is_group_trip, status, home_currency,
                    notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trip_id, user_id, f"{pkg['name']} Trip", pkg["city_id"], start_dt, start_dt,
                party_size, party_size, 0, "leisure", 0, "confirmed", currency,
                notes or "Booked via TripCraft", now, now
            ))

            # 5. Insert Versioned Itinerary (v1, active)
            conn.execute("""
                INSERT INTO itineraries (
                    itinerary_id, trip_id, name, version, is_active, generated_by,
                    total_cost, currency, total_duration_minutes, total_carbon_kg,
                    status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                itinerary_id, trip_id, f"{pkg['name']} Itinerary v1", 1, 1, "custom_builder",
                total_amount, currency, pkg["duration_days"] * 480, 45.5,
                "active", now, now
            ))

            # 6. Insert Itinerary Items & Persist Package Selections
            for idx, comp_id in enumerate(selected_component_ids):
                comp = conn.execute(
                    "SELECT * FROM package_components WHERE component_id = ?",
                    (comp_id,)
                ).fetchone()

                if comp:
                    item_id = f"itm_{uuid.uuid4().hex[:8]}"
                    conn.execute("""
                        INSERT INTO itinerary_items (
                            item_id, itinerary_id, day_index, sort_order, item_type,
                            entity_type, entity_id, title, cost, currency,
                            carbon_kg, duration_minutes, source, locked, status,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        item_id, itinerary_id, comp["day_index"], idx + 1, comp["component_type"],
                        comp["entity_type"], comp["entity_id"], comp["title"],
                        comp["price_delta"], currency, 2.5, 90, "package_customizer", 0, "active",
                        now, now
                    ))

                    # Persist to package_selections
                    sel_id = f"sel_{uuid.uuid4().hex[:8]}"
                    conn.execute("""
                        INSERT INTO package_selections (
                            selection_id, package_id, component_id, swap_group,
                            trip_id, itinerary_id, user_id, chosen_at, status, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        sel_id, package_id, comp_id, comp["swap_group"] or "default",
                        trip_id, itinerary_id, user_id, now, "active", now
                    ))

            # If Guide selected, add Guide Itinerary Item
            if guide_id:
                guide = conn.execute(
                    "SELECT * FROM tour_guides WHERE guide_id = ?", (guide_id,)
                ).fetchone()
                if guide:
                    item_id = f"itm_gui_{uuid.uuid4().hex[:6]}"
                    conn.execute("""
                        INSERT INTO itinerary_items (
                            item_id, itinerary_id, day_index, sort_order, item_type,
                            entity_type, entity_id, title, cost, currency,
                            carbon_kg, duration_minutes, source, locked, status,
                            created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        item_id, itinerary_id, 1, 0, "tour_guide",
                        "tour_guide", guide_id, f"Local Tour Guide: {guide['display_name']}",
                        reprice["guide_cost"], currency, 0.0, pkg["duration_days"] * 480,
                        "guide_matcher", 1, "active", now, now
                    ))

            # 7. Insert Booking
            conn.execute("""
                INSERT INTO bookings (
                    booking_id, user_id, trip_id, itinerary_id, booking_reference,
                    channel, total_amount, currency, tax_amount, idempotency_key,
                    status, confirmed_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                booking_id, user_id, trip_id, itinerary_id, booking_ref,
                "web_app", total_amount, currency, tax_amount, idempotency_key,
                "confirmed", now, now, now
            ))

            return {
                "booking_id": booking_id,
                "booking_reference": booking_ref,
                "status": "confirmed",
                "total_amount": total_amount,
                "currency": currency,
                "tax_amount": tax_amount,
                "trip_id": trip_id,
                "itinerary_id": itinerary_id,
                "confirmed_at": now,
                "package_name": pkg["name"],
                "guide_detail": reprice.get("guide_detail"),
                "selected_components_count": len(selected_component_ids)
            }
