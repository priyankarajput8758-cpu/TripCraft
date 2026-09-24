"""
Catalog service for packages, components, guides, cities, and categories.
"""

from typing import Dict, List, Optional, Any
from src.database import get_db_connection, to_decimal, format_money

class CatalogService:
    @staticmethod
    def list_packages(
        city_id: Optional[str] = None,
        theme: Optional[str] = None,
        tier: Optional[str] = None,
        language_bcp47: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """List curated packages with filters."""
        query = """
            SELECT tp.*, c.name AS city_name, c.state AS city_state, co.name AS country_name
            FROM tour_packages tp
            JOIN cities c ON c.city_id = tp.city_id
            JOIN countries co ON co.country_id = c.country_id
            WHERE tp.status = 'active'
        """
        params = []

        if city_id:
            query += " AND tp.city_id = ?"
            params.append(city_id)

        if theme:
            query += " AND tp.theme = ?"
            params.append(theme)

        if tier:
            query += " AND tp.tier = ?"
            params.append(tier)

        # Server-side language filtering (PS-04 Rule R6)
        lang_notice = None
        if language_bcp47:
            # Check if any package has this language tag
            with get_db_connection() as conn:
                count = conn.execute(
                    "SELECT COUNT(*) AS c FROM tour_packages WHERE languages_offered LIKE ? AND status = 'active'",
                    (f"%{language_bcp47}%",)
                ).fetchone()["c"]

                if count > 0:
                    query += " AND tp.languages_offered LIKE ?"
                    params.append(f"%{language_bcp47}%")
                else:
                    lang_notice = f"No direct packages available in '{language_bcp47}'. Displaying all recommended packages."

        query += " ORDER BY tp.base_price ASC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        with get_db_connection() as conn:
            packages = conn.execute(query, params).fetchall()

            # For each package, get thumbnail or first hotel image
            for pkg in packages:
                pkg["base_price_formatted"] = format_money(to_decimal(pkg["base_price"]))
                # Fetch hotel image if available
                img = conn.execute("""
                    SELECT hm.file_path, hm.alt_text FROM hotel_media hm
                    JOIN hotels h ON h.hotel_id = hm.hotel_id
                    WHERE h.city_id = ? AND hm.media_role = 'hero'
                    LIMIT 1
                """, (pkg["city_id"],)).fetchone()
                pkg["hero_image"] = img["file_path"] if img else None
                pkg["hero_alt"] = img["alt_text"] if img else pkg["name"]

            return {
                "total": len(packages),
                "language_filter": language_bcp47,
                "language_notice": lang_notice,
                "packages": packages
            }

    @staticmethod
    def get_package_detail(package_id: str, language: Optional[str] = None) -> Dict[str, Any]:
        """Fetch package details with grouped swappable components and language-prioritized guide options."""
        with get_db_connection() as conn:
            pkg = conn.execute("""
                SELECT tp.*, c.name AS city_name, c.state AS city_state, c.lat AS city_lat, c.lng AS city_lng,
                       co.name AS country_name
                FROM tour_packages tp
                JOIN cities c ON c.city_id = tp.city_id
                JOIN countries co ON co.country_id = c.country_id
                WHERE tp.package_id = ?
            """, (package_id,)).fetchone()

            if not pkg:
                raise ValueError(f"Package not found: {package_id}")

            pkg["base_price_formatted"] = format_money(to_decimal(pkg["base_price"]))

            # Fetch all package components
            components = conn.execute("""
                SELECT * FROM package_components
                WHERE package_id = ?
                ORDER BY day_index, slot
            """, (package_id,)).fetchall()

            # Organize components:
            # 1. Day-by-day itinerary
            # 2. Swap groups (e.g. hotel options, activity options)
            days = {}
            swap_groups = {}

            for comp in components:
                comp["price_delta_formatted"] = format_money(to_decimal(comp["price_delta"]))
                day_idx = comp["day_index"]
                if day_idx not in days:
                    days[day_idx] = []
                days[day_idx].append(comp)

                sg = comp["swap_group"]
                if sg:
                    if sg not in swap_groups:
                        swap_groups[sg] = {
                            "swap_group": sg,
                            "component_type": comp["component_type"],
                            "day_index": comp["day_index"],
                            "slot": comp["slot"],
                            "options": []
                        }
                    swap_groups[sg]["options"].append(comp)

            # Available tour guides: prioritize requested BCP-47 language and local proximity
            clean_lang = language.split("-")[0].lower() if language else None
            if clean_lang and clean_lang != "en":
                guides = conn.execute("""
                    SELECT g.*, c.name AS city_name, c.state AS city_state,
                           CASE
                               WHEN g.city_id = ? AND g.languages LIKE ? THEN 1
                               WHEN c.state = ? AND g.languages LIKE ? THEN 2
                               WHEN g.languages LIKE ? THEN 3
                               WHEN g.city_id = ? THEN 4
                               ELSE 5
                           END AS rank_score
                    FROM tour_guides g
                    JOIN cities c ON c.city_id = g.city_id
                    WHERE g.status = 'active'
                    ORDER BY rank_score ASC, g.rating DESC LIMIT 20
                """, (pkg["city_id"], f"%{clean_lang}%", pkg["city_state"], f"%{clean_lang}%", f"%{clean_lang}%", pkg["city_id"])).fetchall()
            else:
                guides = conn.execute("""
                    SELECT g.*, c.name AS city_name, c.state AS city_state,
                           CASE
                               WHEN g.city_id = ? THEN 1
                               WHEN c.state = ? THEN 2
                               ELSE 3
                           END AS rank_score
                    FROM tour_guides g
                    JOIN cities c ON c.city_id = g.city_id
                    WHERE g.status = 'active'
                    ORDER BY rank_score ASC, g.rating DESC LIMIT 20
                """, (pkg["city_id"], pkg["city_state"])).fetchall()

            for g in guides:
                g["day_rate_formatted"] = format_money(to_decimal(g["day_rate"]))
                g["half_day_rate_formatted"] = format_money(to_decimal(g["half_day_rate"]))

            # City hotels
            hotels = conn.execute("""
                SELECT h.*, hm.file_path AS hero_image FROM hotels h
                LEFT JOIN hotel_media hm ON hm.hotel_id = h.hotel_id AND hm.media_role = 'hero'
                WHERE h.city_id = ? AND h.status = 'active'
                LIMIT 10
            """, (pkg["city_id"],)).fetchall()

            return {
                "package": pkg,
                "components": components,
                "itinerary_by_day": days,
                "swap_groups": list(swap_groups.values()),
                "available_guides": guides,
                "nearby_hotels": hotels
            }

    @staticmethod
    def list_guides(
        city_id: Optional[str] = None,
        language: Optional[str] = None,
        specialisation: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """List tour guides with BCP-47 language & specialisation filtering and regional fallback."""
        clean_lang = language.split("-")[0].lower() if language else None
        lang_notice = None

        with get_db_connection() as conn:
            # Check direct local city matches first
            if city_id and clean_lang:
                local_count = conn.execute(
                    "SELECT COUNT(*) AS c FROM tour_guides WHERE city_id = ? AND languages LIKE ? AND status = 'active'",
                    (city_id, f"%{clean_lang}%")
                ).fetchone()["c"]

                if local_count > 0:
                    query = """
                        SELECT g.*, c.name AS city_name, c.state AS city_state FROM tour_guides g
                        JOIN cities c ON c.city_id = g.city_id
                        WHERE g.status = 'active' AND g.city_id = ? AND g.languages LIKE ?
                    """
                    params = [city_id, f"%{clean_lang}%"]
                    if specialisation:
                        query += " AND (g.specialisation = ? OR g.secondary_specialisation = ?)"
                        params.extend([specialisation, specialisation])
                    query += " ORDER BY g.rating DESC, g.years_experience DESC LIMIT ?"
                    params.append(limit)
                    guides = conn.execute(query, params).fetchall()
                else:
                    # Broaden to state and regional guides who speak the requested language
                    city_info = conn.execute("SELECT state FROM cities WHERE city_id = ?", (city_id,)).fetchone()
                    city_state = city_info["state"] if city_info else None

                    query = """
                        SELECT g.*, c.name AS city_name, c.state AS city_state,
                               CASE WHEN c.state = ? THEN 1 ELSE 2 END as locality_rank
                        FROM tour_guides g
                        JOIN cities c ON c.city_id = g.city_id
                        WHERE g.status = 'active' AND g.languages LIKE ?
                    """
                    params = [city_state or "", f"%{clean_lang}%"]
                    if specialisation:
                        query += " AND (g.specialisation = ? OR g.secondary_specialisation = ?)"
                        params.extend([specialisation, specialisation])
                    query += " ORDER BY locality_rank ASC, g.rating DESC LIMIT ?"
                    params.append(limit)
                    guides = conn.execute(query, params).fetchall()
                    if guides:
                        lang_notice = f"Showing verified {language.upper()}-speaking regional guides serving this destination."
                    else:
                        # Fallback to city guides
                        query = """
                            SELECT g.*, c.name AS city_name, c.state AS city_state FROM tour_guides g
                            JOIN cities c ON c.city_id = g.city_id
                            WHERE g.status = 'active' AND g.city_id = ?
                        """
                        params = [city_id]
                        if specialisation:
                            query += " AND (g.specialisation = ? OR g.secondary_specialisation = ?)"
                            params.extend([specialisation, specialisation])
                        query += " ORDER BY g.rating DESC LIMIT ?"
                        params.append(limit)
                        guides = conn.execute(query, params).fetchall()
                        lang_notice = f"No guides speaking '{language}' found. Showing all available guides for this destination."
            else:
                query = """
                    SELECT g.*, c.name AS city_name, c.state AS city_state FROM tour_guides g
                    JOIN cities c ON c.city_id = g.city_id
                    WHERE g.status = 'active'
                """
                params = []
                if city_id:
                    query += " AND g.city_id = ?"
                    params.append(city_id)
                if clean_lang:
                    query += " AND g.languages LIKE ?"
                    params.append(f"%{clean_lang}%")
                if specialisation:
                    query += " AND (g.specialisation = ? OR g.secondary_specialisation = ?)"
                    params.extend([specialisation, specialisation])
                query += " ORDER BY g.rating DESC, g.years_experience DESC LIMIT ?"
                params.append(limit)
                guides = conn.execute(query, params).fetchall()

            for g in guides:
                g["day_rate_formatted"] = format_money(to_decimal(g["day_rate"]))
                g["half_day_rate_formatted"] = format_money(to_decimal(g["half_day_rate"]))

            return {
                "total": len(guides),
                "language_filter": language,
                "language_notice": lang_notice,
                "guides": guides
            }

    @staticmethod
    def list_cities() -> List[Dict[str, Any]]:
        """List all supported cities with coordinates and descriptions."""
        with get_db_connection() as conn:
            return conn.execute("""
                SELECT c.*, co.name AS country_name, co.default_currency,
                       (SELECT COUNT(*) FROM tour_packages tp WHERE tp.city_id = c.city_id) AS package_count,
                       (SELECT COUNT(*) FROM tour_guides tg WHERE tg.city_id = c.city_id) AS guide_count
                FROM cities c
                JOIN countries co ON co.country_id = c.country_id
                WHERE c.status = 'active'
                ORDER BY package_count DESC, c.name ASC
            """).fetchall()

    @staticmethod
    def list_languages() -> List[Dict[str, Any]]:
        """List supported BCP-47 languages."""
        with get_db_connection() as conn:
            return conn.execute("SELECT * FROM languages ORDER BY english_name ASC").fetchall()
