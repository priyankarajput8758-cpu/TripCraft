"""
OpenTripMap Integration Service.
Discovers tourist places, cultural heritage spots, and attractions for any city/area.
"""

import json
import time
import requests
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from src.config import settings
from src.database import get_db_connection

logger = logging.getLogger("opentripmap_service")

CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
OTM_CACHE_FILE = CACHE_DIR / "opentripmap_cache.json"

class OpenTripMapService:
    _cache: Dict[str, Any] = {}

    @classmethod
    def _load_cache(cls):
        if not cls._cache and OTM_CACHE_FILE.exists():
            try:
                with open(OTM_CACHE_FILE, "r", encoding="utf-8") as f:
                    cls._cache = json.load(f)
            except Exception:
                cls._cache = {}

    @classmethod
    def _save_cache(cls):
        try:
            with open(OTM_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cls._cache, f, indent=2)
        except Exception:
            pass

    @classmethod
    def geocode_destination(cls, query: str) -> Optional[Dict[str, Any]]:
        """
        Geocode any city or area name to coordinates using OpenStreetMap Nominatim or SQLite database.
        """
        query_clean = query.strip()
        if not query_clean:
            return None

        # 1. Check local DB cities first
        try:
            with get_db_connection() as conn:
                city_row = conn.execute(
                    "SELECT * FROM cities WHERE LOWER(name) = ? OR LOWER(name) LIKE ? LIMIT 1",
                    (query_clean.lower(), f"%{query_clean.lower()}%")
                ).fetchone()
                if city_row and city_row["lat"] and city_row["lng"]:
                    return {
                        "name": city_row["name"],
                        "state": city_row["state"],
                        "country": city_row["country_id"],
                        "lat": float(city_row["lat"]),
                        "lng": float(city_row["lng"]),
                        "display_name": f"{city_row['name']}, {city_row['state'] or ''}, India",
                        "source": "local_database"
                    }
        except Exception as e:
            logger.warning(f"Local DB geocoding lookup failed: {e}")

        # 2. Query OpenStreetMap Nominatim API
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": query_clean,
                "format": "json",
                "limit": 1
            }
            headers = {
                "User-Agent": "TripCraft-PackagePro-Hackathon/1.0"
            }
            resp = requests.get(url, params=params, headers=headers, timeout=6)
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    first = data[0]
                    return {
                        "name": first.get("name") or query_clean,
                        "state": first.get("display_name", "").split(",")[-2].strip() if len(first.get("display_name", "").split(",")) > 2 else None,
                        "country": "India",
                        "lat": float(first["lat"]),
                        "lng": float(first["lon"]),
                        "display_name": first.get("display_name"),
                        "boundingbox": first.get("boundingbox"),
                        "source": "nominatim_live"
                    }
        except Exception as e:
            logger.warning(f"Nominatim geocoding error: {e}")

        return None

    @classmethod
    def get_nearby_attractions(
        cls,
        lat: float,
        lng: float,
        radius_meters: int = 10000,
        lang: str = "en",
        limit: int = 25
    ) -> Dict[str, Any]:
        """
        Query attractions within radius of coordinates from OpenTripMap.
        """
        cls._load_cache()
        cache_key = f"{round(lat, 3)}_{round(lng, 3)}_{radius_meters}_{lang}"

        if cache_key in cls._cache:
            return {
                "source": "cache",
                "attractions": cls._cache[cache_key]
            }

        if not settings.OPENTRIPMAP_API_KEY:
            return {"source": "unavailable", "message": "OPENTRIPMAP_API_KEY not configured", "attractions": []}

        url = f"{settings.OPENTRIPMAP_BASE_URL}/{lang}/places/radius"
        params = {
            "radius": radius_meters,
            "lon": lng,
            "lat": lat,
            "kinds": "interesting_places,historic,architecture,cultural,natural,other,religion,theatres_and_entertainments",
            "format": "json",
            "limit": limit,
            "apikey": settings.OPENTRIPMAP_API_KEY
        }

        try:
            resp = requests.get(url, params=params, timeout=10)
            if resp.status_code == 200:
                raw_places = resp.json()
                places = []
                for p in raw_places:
                    name = p.get("name")
                    if not name or len(name.strip()) < 2:
                        continue
                    pt = p.get("point", {})
                    kinds_raw = p.get("kinds", "")
                    kinds_list = [k.strip() for k in kinds_raw.split(",") if k.strip()]

                    # Categorize into friendly travel types
                    cat = "Attraction"
                    if any(k in kinds_raw for k in ["religion", "temple", "church", "mosque", "monastery"]):
                        cat = "Temple & Spiritual"
                    elif any(k in kinds_raw for k in ["historic", "monument", "castle", "ruins", "fort", "architecture"]):
                        cat = "Heritage & Architecture"
                    elif any(k in kinds_raw for k in ["natural", "waterfall", "park", "garden", "mountain", "viewpoint", "cave", "lake"]):
                        cat = "Nature & Scenic"
                    elif any(k in kinds_raw for k in ["cultural", "museum", "theatre", "art", "cinema"]):
                        cat = "Museum & Culture"

                    places.append({
                        "xid": p.get("xid"),
                        "name": name.strip(),
                        "category": cat,
                        "kinds": kinds_list,
                        "rate": p.get("rate", 1),
                        "dist_meters": round(p.get("dist", 0), 1),
                        "lat": pt.get("lat"),
                        "lng": pt.get("lon"),
                        "osm": p.get("osm"),
                        "wikidata": p.get("wikidata")
                    })

                # Deduplicate by name
                unique_places = []
                seen_names = set()
                for pl in places:
                    if pl["name"].lower() not in seen_names:
                        unique_places.append(pl)
                        seen_names.add(pl["name"].lower())

                cls._cache[cache_key] = unique_places
                cls._save_cache()

                return {
                    "source": "opentripmap_live",
                    "attractions": unique_places
                }
            else:
                return {
                    "source": "api_error",
                    "status_code": resp.status_code,
                    "attractions": []
                }
        except Exception as e:
            return {
                "source": "exception",
                "error": str(e),
                "attractions": []
            }

    @classmethod
    def geocode_and_explore(cls, query: str, radius_meters: int = 15000) -> Dict[str, Any]:
        """
        Geocode any city/area, fetch all nearby tourist attractions, and summarize categories.
        """
        geo = cls.geocode_destination(query)
        if not geo:
            return {
                "status": "not_found",
                "message": f"Could not find coordinates for '{query}'. Try a well-known city or landmark.",
                "query": query,
                "attractions": []
            }

        attractions_res = cls.get_nearby_attractions(
            lat=geo["lat"],
            lng=geo["lng"],
            radius_meters=radius_meters,
            limit=30
        )

        attractions = attractions_res.get("attractions", [])

        # Count categories
        cat_counts = {}
        for a in attractions:
            c = a.get("category", "General")
            cat_counts[c] = cat_counts.get(c, 0) + 1

        return {
            "status": "success",
            "query": query,
            "destination": geo,
            "radius_meters": radius_meters,
            "attractions_count": len(attractions),
            "categories_summary": cat_counts,
            "attractions": attractions
        }
