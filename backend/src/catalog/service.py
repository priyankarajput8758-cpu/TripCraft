"""
Catalog service for packages, components, guides, cities, and categories.
Includes server-side multilingual filtering (§8 BCP-47) and dynamic translation of package details.
"""

from typing import Dict, List, Optional, Any
from src.database import get_db_connection, to_decimal, format_money
from src.external.translate_service import TranslationService

class CatalogService:
    @staticmethod
    def list_packages(
        city_id: Optional[str] = None,
        theme: Optional[str] = None,
        tier: Optional[str] = None,
        language_bcp47: Optional[str] = None,
        max_price: Optional[float] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """List curated packages with filters and live language translation."""
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

        # Server-side language filtering & ranking (PS-04 Rule R6)
        lang_notice = None
        clean_lang = language_bcp47.split("-")[0].lower() if language_bcp47 else None

        if clean_lang and clean_lang != "en":
            # Priority ranking: packages explicitly offering this language appear first,
            # while retaining all packages in the catalog with dynamic translation.
            query += " ORDER BY CASE WHEN tp.languages_offered LIKE ? THEN 1 ELSE 2 END, tp.base_price ASC LIMIT ? OFFSET ?"
            params.extend([f"%{clean_lang}%", limit, offset])
            lang_notice = f"Showing all packages with live translation. Packages natively offering '{language_bcp47}' are prioritized at top."
        else:
            query += " ORDER BY tp.base_price ASC LIMIT ? OFFSET ?"
            params.extend([limit, offset])

        with get_db_connection() as conn:
            packages = conn.execute(query, params).fetchall()

            # For each package, provide verified landmark or hotel image
            CITY_LANDMARK_IMAGES = {
                "hyderabad": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/960px-Charminar_Hyderabad_1.jpg",
                "jaisalmer": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Jaisalmer_forteresse.jpg/960px-Jaisalmer_forteresse.jpg",
                "jaipur": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/960px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg",
                "pune": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Front_view_of_Shaniwar_Wada_illuminated.jpg/960px-Front_view_of_Shaniwar_Wada_illuminated.jpg",
                "puri": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Shri_Jagannath_temple.jpg/960px-Shri_Jagannath_temple.jpg",
                "bhubaneswar": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Lingaraj_Temple_%2C_Bhubaneswar.jpg/960px-Lingaraj_Temple_%2C_Bhubaneswar.jpg",
                "hampi": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/960px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg",
                "darjeeling": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/DarjeelingTrainFruitshop_%282%29.jpg/960px-DarjeelingTrainFruitshop_%282%29.jpg",
                "gangtok": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Rumtek_Monastery_alias_Dharma_Chakra_Centre_near_Gangtok%2C_East_Sikkim_09.jpg/960px-Rumtek_Monastery_alias_Dharma_Chakra_Centre_near_Gangtok%2C_East_Sikkim_09.jpg",
                "srinagar": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg",
                "aurangabad": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Ajanta_%2863%29.jpg/960px-Ajanta_%2863%29.jpg",
                "lucknow": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Rumi_Darwaza_-_DSC2797-01.jpg/960px-Rumi_Darwaza_-_DSC2797-01.jpg",
                "jodhpur": "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
                "udaipur": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80",
                "varanasi": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
                "agra": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
                "delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
                "new delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80",
                "mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
                "leh": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
                "munnar": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
                "colombo": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Colombo_Lotus_Tower_2022.jpg/960px-Colombo_Lotus_Tower_2022.jpg",
                "abu dhabi": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
                "kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
                "shimla": "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=800&q=80",
                "ahmedabad": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Adalaj_stepwell_01.jpg/960px-Adalaj_stepwell_01.jpg",
                "kathmandu": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
                "kandy": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Temple_of_the_Tooth_%28Sri_Dalada_Maligawa%29.jpg/960px-Temple_of_the_Tooth_%28Sri_Dalada_Maligawa%29.jpg",
                "rishikesh": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
                "wayanad": "https://images.unsplash.com/photo-1616489953149-8d48f7601b31?auto=format&fit=crop&w=800&q=80",
                "male": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80",
                "zurich": "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80",
                "kolkata": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80",
                "visakhapatnam": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Dolphin%27s_nose_and_harbour_in_Visakhapatnam.jpg/960px-Dolphin%27s_nose_and_harbour_in_Visakhapatnam.jpg",
                "shillong": "https://images.unsplash.com/photo-1626014303757-646654714152?auto=format&fit=crop&w=800&q=80",
                "pondicherry": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
                "mysuru": "https://images.unsplash.com/photo-1600100397608-f010f4439066?auto=format&fit=crop&w=800&q=80",
                "alleppey": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
                "manali": "https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=800&q=80",
                "amritsar": "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80",
                "bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
                "bangkok": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80",
                "bengaluru": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
                "bhuj": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/White_Rann_of_Kutch_Gujarat.jpg/960px-White_Rann_of_Kutch_Gujarat.jpg",
                "chennai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
                "doha": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
                "dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
                "gokarna": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
                "guwahati": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Kamakhya_Temple_Guwahati.jpg/960px-Kamakhya_Temple_Guwahati.jpg",
                "kochi": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80",
                "kuala lumpur": "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=800&q=80",
                "madurai": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Madurai_Meenakshi_Amman_temple_Gopuram.jpg/960px-Madurai_Meenakshi_Amman_temple_Gopuram.jpg",
                "nainital": "https://images.unsplash.com/photo-1626014303757-646654714152?auto=format&fit=crop&w=800&q=80",
                "ooty": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
                "panaji": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
                "pokhara": "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
                "singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80",
                "thanjavur": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Brihadisvara_Temple_Thanjavur.jpg/960px-Brihadisvara_Temple_Thanjavur.jpg",
                "thimphu": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
                "thiruvananthapuram": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Sree_Padmanabhaswamy_Temple_Thiruvananthapuram.jpg/960px-Sree_Padmanabhaswamy_Temple_Thiruvananthapuram.jpg",
                "tirupati": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Tirumala_Venkateswara_Temple.jpg/960px-Tirumala_Venkateswara_Temple.jpg"
            }
            for pkg in packages:
                pkg["base_price_formatted"] = format_money(to_decimal(pkg["base_price"]))
                c_name = (pkg.get("city_name") or "").lower().strip()
                landmark_img = CITY_LANDMARK_IMAGES.get(c_name)
                if not landmark_img:
                    for k, v in CITY_LANDMARK_IMAGES.items():
                        if k in c_name or k in (pkg.get("name") or "").lower():
                            landmark_img = v
                            break

                pkg["hero_image"] = landmark_img or "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80"
                pkg["hero_alt"] = pkg.get("name")

            # Translate package names and titles if non-English language is requested
            if clean_lang and clean_lang != "en" and packages:
                titles = [p["name"] for p in packages]
                translated_titles = TranslationService.translate_batch(titles, clean_lang, "en")
                for idx, pkg in enumerate(packages):
                    trans = translated_titles[idx]
                    if trans:
                        pkg["name"] = trans
                        pkg["title"] = trans

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
            raw_components = conn.execute("""
                SELECT * FROM package_components
                WHERE package_id = ?
                ORDER BY day_index, slot
            """, (package_id,)).fetchall()

            city_name = pkg["city_name"]
            theme = pkg["theme"]
            duration_days = pkg["duration_days"] or 4

            # City specific attraction templates for authentic non-repetitive itineraries
            CITY_EXPERIENCE_POIS = {
                "Tirupati": [
                    ("Lord Venkateswara Temple Special Darshan & Sanctum Experience", "poi", "morning", "poi_tiru_01"),
                    ("Silathoranam Geological Arch & Natural Rock Formations", "poi", "afternoon", "poi_tiru_02"),
                    ("Kapila Theertham Holy Waterfall & Ancient Shrine", "poi", "morning", "poi_tiru_03"),
                    ("Chandragiri Fort & Light Show", "poi", "evening", "poi_tiru_04"),
                    ("Sri Venkateswara National Park Flora & Safari Trail", "poi", "morning", "poi_tiru_05"),
                    ("Papavinasam Sacred Water Spring & Forest Walk", "poi", "afternoon", "poi_tiru_06"),
                    ("ISKCON Lotus Temple & Traditional Prasad Feast", "poi", "evening", "poi_tiru_07")
                ],
                "Bhubaneswar": [
                    ("Lingaraj Temple & Old Town Heritage Architecture Walk", "poi", "morning", "poi_bhub_01"),
                    ("Udayagiri and Khandagiri Ancient Rock-Cut Jain Caves", "poi", "afternoon", "poi_bhub_02"),
                    ("Nandankanan Botanical Sanctuary & White Tiger Safari", "poi", "morning", "poi_bhub_03"),
                    ("Dhauli Shanti Stupa & Historic Ashokan Rock Inscriptions", "poi", "evening", "poi_bhub_04"),
                    ("Mukteshwar & Rajarani Sculptured Temple Tour", "poi", "morning", "poi_bhub_05"),
                    ("Ekamra Haat Traditional Odishan Handicrafts & Silk Weavers", "poi", "afternoon", "poi_bhub_06"),
                    ("Tribal Art Museum & Regional Cultural Experience", "poi", "morning", "poi_bhub_07")
                ],
                "Pokhara": [
                    ("Phewa Lake Morning Boating & Island Shrine Visit", "poi", "morning", "poi_pok_01"),
                    ("World Peace Pagoda Panoramic Annapurna Viewpoint", "poi", "afternoon", "poi_pok_02"),
                    ("Sarangkot Sunrise Mountain Himalayan Expedition", "poi", "morning", "poi_pok_03"),
                    ("Davis Falls & Subterranean Gupteshwor Mahadev Cave", "poi", "afternoon", "poi_pok_04"),
                    ("Begnas Lake Quiet Boat Cruise & Fishermen Village", "poi", "morning", "poi_pok_05"),
                    ("Old Pokhara Bazaar & Traditional Heritage Walk", "poi", "evening", "poi_pok_06"),
                    ("Tibetan Cultural Centre & Handcrafted Carpet Weaving", "poi", "morning", "poi_pok_07")
                ],
                "Goa": [
                    ("Fort Aguada Coastal Cliff Bastion & Portuguese Lighthouse", "poi", "morning", "poi_goa_01"),
                    ("Old Goa Basilica of Bom Jesus & Se Cathedral Heritage", "poi", "afternoon", "poi_goa_02"),
                    ("Dudhsagar Roaring Waterfalls Jungle Safari", "poi", "morning", "poi_goa_03"),
                    ("Anjuna & Chapora Cliff Sunset Leisure", "poi", "evening", "poi_goa_04"),
                    ("Divar Island Village Cycle & Heritage Churches", "poi", "morning", "poi_goa_05"),
                    ("Fontainhas Colorful Latin Quarter Walk & Bakery Cafe Stroll", "poi", "afternoon", "poi_goa_06"),
                    ("Mandovi River Sunset Cultural Catamaran Cruise", "poi", "evening", "poi_goa_07")
                ],
                "Jaipur": [
                    ("Amber Fort & Sheesh Mahal Palatial Experience", "poi", "morning", "poi_jai_01"),
                    ("Hawa Mahal & City Palace Royal Heritage Museum", "poi", "afternoon", "poi_jai_02"),
                    ("Jantar Mantar Astronomical UNESCO Wonder", "poi", "morning", "poi_jai_03"),
                    ("Nahargarh Fort Sunset Viewpoint Overlooking Pink City", "poi", "evening", "poi_jai_04"),
                    ("Jal Mahal & Lakefront Photography Walk", "poi", "morning", "poi_jai_05"),
                    ("Chokhi Dhani Traditional Rajasthani Cultural Village", "poi", "evening", "poi_jai_06"),
                    ("Albert Hall Museum & Johari Bazaar Gemstone Trail", "poi", "morning", "poi_jai_07")
                ],
                "Mumbai": [
                    ("Gateway of India & Historic Taj Mahal Palace Walk", "poi", "morning", "poi_mum_01"),
                    ("Elephanta Island Rock-Cut Caves Ferry Cruise", "poi", "afternoon", "poi_mum_02"),
                    ("Marine Drive & Queens Necklace Evening Promenade", "poi", "evening", "poi_mum_03"),
                    ("Siddhivinayak Temple & Shivaji Park Cultural Walk", "poi", "morning", "poi_mum_04"),
                    ("Bandra Fort, Castella & Bandstand Sunset View", "poi", "evening", "poi_mum_05"),
                    ("Colaba Causeway Vintage Market & Heritage Cafe Stroll", "poi", "afternoon", "poi_mum_06"),
                    ("Sanjay Gandhi National Park & Kanheri Ancient Caves", "poi", "morning", "poi_mum_07")
                ]
            }

            city_pois = CITY_EXPERIENCE_POIS.get(city_name, [
                (f"{city_name} Historic Landmark & Heritage City Walk", "poi", "morning", "poi_gen_01"),
                (f"{city_name} Scenic Valley / Coastal Panoramic Viewpoint", "poi", "afternoon", "poi_gen_02"),
                (f"{city_name} Cultural Heritage Museum & Artisan Village", "poi", "morning", "poi_gen_03"),
                (f"{city_name} Traditional Night Bazaar & Regional Food Trail", "poi", "evening", "poi_gen_04"),
                (f"{city_name} Nature Sanctuary & Botanical Trail", "poi", "morning", "poi_gen_05"),
                (f"{city_name} Sacred Temple / Monastery Architectural Tour", "poi", "afternoon", "poi_gen_06"),
                (f"{city_name} Farewell Sunset Cruise & Culinary Dinner", "poi", "evening", "poi_gen_07")
            ])

            # Deduplicate raw components and synthesize multi-day coverage
            components = []
            seen_titles = set()
            max_raw_day = 0

            for rc in raw_components:
                c_dict = dict(rc)
                t_key = (c_dict.get("title") or c_dict.get("name") or "").strip().lower()
                # Deduplicate repeated POIs
                if c_dict.get("component_type") == "poi" and t_key in seen_titles:
                    continue
                if t_key:
                    seen_titles.add(t_key)
                max_raw_day = max(max_raw_day, c_dict.get("day_index", 1))
                components.append(c_dict)

            # Ensure hotel tier swappables exist
            has_hotel_swap = any(c.get("swap_group") == "hotel_tier" for c in components)
            if not has_hotel_swap:
                components.insert(0, {
                    "component_id": f"cmp_htl_std_{package_id}",
                    "package_id": package_id,
                    "component_type": "hotel",
                    "title": f"{city_name} Premium 3-Star Comfort Resort",
                    "name": f"{city_name} Premium 3-Star Comfort Resort",
                    "day_index": 1,
                    "slot": "overnight",
                    "price_delta": "0.00",
                    "currency": pkg["currency"],
                    "is_optional": 0,
                    "is_swappable": 1,
                    "swap_group": "hotel_tier"
                })
                components.insert(1, {
                    "component_id": f"cmp_htl_lux_{package_id}",
                    "package_id": package_id,
                    "component_type": "hotel",
                    "title": f"{city_name} 5-Star Luxury Heritage Villa & Spa",
                    "name": f"{city_name} 5-Star Luxury Heritage Villa & Spa",
                    "day_index": 1,
                    "slot": "overnight",
                    "price_delta": "6500.00",
                    "currency": pkg["currency"],
                    "is_optional": 0,
                    "is_swappable": 1,
                    "swap_group": "hotel_tier"
                })

            # Ensure days 1 to duration_days have rich activities
            existing_days = {c.get("day_index") for c in components}
            for d in range(1, duration_days + 1):
                if d not in existing_days or sum(1 for c in components if c.get("day_index") == d) < 2:
                    poi_info = city_pois[(d - 1) % len(city_pois)]
                    components.append({
                        "component_id": f"cmp_poi_d{d}_{package_id}",
                        "package_id": package_id,
                        "component_type": poi_info[1],
                        "title": poi_info[0],
                        "name": poi_info[0],
                        "day_index": d,
                        "slot": poi_info[2],
                        "price_delta": "0.00",
                        "currency": pkg["currency"],
                        "is_optional": 0,
                        "is_swappable": 0,
                        "swap_group": None
                    })
                    # Add authentic dinner / transfer / experience
                    if d >= 2:
                        components.append({
                            "component_id": f"cmp_meal_d{d}_{package_id}",
                            "package_id": package_id,
                            "component_type": "meal",
                            "title": f"Authentic Regional Cuisine Dinner ({city_name} Specialties)",
                            "name": f"Authentic Regional Cuisine Dinner ({city_name} Specialties)",
                            "day_index": d,
                            "slot": "evening",
                            "price_delta": "850.00",
                            "currency": pkg["currency"],
                            "is_optional": 1,
                            "is_swappable": 0,
                            "swap_group": None
                        })

            # Sort components by day_index, slot
            slot_order = {"morning": 1, "afternoon": 2, "evening": 3, "overnight": 4}
            components.sort(key=lambda c: (c.get("day_index", 1), slot_order.get(c.get("slot"), 5)))

            # Dynamic Translation of Package and Component titles if language is non-English
            clean_lang = language.split("-")[0].lower() if language else None
            if clean_lang and clean_lang != "en":
                # Translate package title
                pkg_trans = TranslationService.translate(pkg["name"], clean_lang, "en")
                if pkg_trans.get("translated_text"):
                    pkg["name"] = pkg_trans["translated_text"]
                    pkg["title"] = pkg_trans["translated_text"]

                # Batch translate component names
                comp_titles = [c.get("title") or c.get("name") or "" for c in components]
                translated_comps = TranslationService.translate_batch(comp_titles, clean_lang, "en")
                for idx, c in enumerate(components):
                    if idx < len(translated_comps) and translated_comps[idx]:
                        c["name"] = translated_comps[idx]
                        c["title"] = translated_comps[idx]
                    else:
                        c["name"] = c.get("title") or ""

            # Ensure all components have both 'name' and 'title' populated
            for c in components:
                if not c.get("name"):
                    c["name"] = c.get("title") or ""
                if not c.get("title"):
                    c["title"] = c.get("name") or ""

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
