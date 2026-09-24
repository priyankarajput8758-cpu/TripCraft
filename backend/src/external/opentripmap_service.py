"""
OpenTripMap Integration Service.
Discovers tourist places, cultural heritage spots, and attractions within 1-5km radius.
"""

import json
import time
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional
from src.config import settings

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
    def get_nearby_attractions(
        cls,
        lat: float,
        lng: float,
        radius_meters: int = 3000,
        lang: str = "en",
        limit: int = 12
    ) -> Dict[str, Any]:
        """
        Query attractions within radius of coordinates.
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
            "kinds": "interesting_places,historic,architecture,cultural,natural",
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
                    if not name:
                        continue
                    pt = p.get("point", {})
                    places.append({
                        "xid": p.get("xid"),
                        "name": name,
                        "kinds": p.get("kinds", "").split(","),
                        "rate": p.get("rate"),
                        "dist_meters": round(p.get("dist", 0), 1),
                        "lat": pt.get("lat"),
                        "lng": pt.get("lon"),
                        "osm": p.get("osm"),
                        "wikidata": p.get("wikidata")
                    })

                cls._cache[cache_key] = places
                cls._save_cache()

                return {
                    "source": "opentripmap_live",
                    "attractions": places
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
