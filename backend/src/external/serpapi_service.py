"""
SerpAPI Google Hotels Integration Service with Intelligent Caching.
Strictly conserves API quota (200 requests/month) by caching search results.
"""

import json
import time
import requests
from pathlib import Path
from typing import Dict, List, Any, Optional
from src.config import settings

CACHE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
CACHE_FILE = CACHE_DIR / "serpapi_cache.json"

class SerpAPIService:
    _memory_cache: Dict[str, Any] = {}

    @classmethod
    def _load_cache(cls):
        if not cls._memory_cache and CACHE_FILE.exists():
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    cls._memory_cache = json.load(f)
            except Exception:
                cls._memory_cache = {}

    @classmethod
    def _save_cache(cls):
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cls._memory_cache, f, indent=2)
        except Exception:
            pass

    @classmethod
    def search_hotels(
        cls,
        query: str,
        check_in_date: Optional[str] = "2026-09-24",
        check_out_date: Optional[str] = "2026-09-25",
        adults: int = 2,
        currency: str = "INR",
        gl: str = "in",
        hl: str = "en"
    ) -> Dict[str, Any]:
        """
        Search live Google Hotels via SerpAPI with caching.
        """
        cls._load_cache()
        cache_key = f"{query.lower().strip()}_{check_in_date}_{check_out_date}_{adults}_{currency}_{gl}"

        # 1. Check Cache (Expires in 24 hours)
        cached_entry = cls._memory_cache.get(cache_key)
        if cached_entry and (time.time() - cached_entry.get("timestamp", 0)) < 86400:
            return {
                "source": "cache",
                "query": query,
                "hotels": cached_entry.get("data", [])
            }

        if not settings.SERPAPI_API_KEY:
            return {"source": "unavailable", "message": "SERPAPI_API_KEY not set", "hotels": []}

        # 2. Query Live API
        params = {
            "engine": "google_hotels",
            "q": query,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date,
            "adults": adults,
            "currency": currency,
            "gl": gl,
            "hl": hl,
            "api_key": settings.SERPAPI_API_KEY
        }

        try:
            resp = requests.get(settings.SERPAPI_BASE_URL, params=params, timeout=12)
            if resp.status_code == 200:
                data = resp.json()
                raw_properties = data.get("properties", []) or data.get("ads", [])

                formatted_hotels = []
                for prop in raw_properties[:10]:
                    rate_info = prop.get("rate_per_night", {}) or {}
                    lowest_price = rate_info.get("lowest") or prop.get("price") or "Contact for price"
                    extracted_rate = rate_info.get("extracted_lowest") or prop.get("extracted_price") or 0.0
                    gps = prop.get("gps_coordinates", {})

                    formatted_hotels.append({
                        "name": prop.get("name"),
                        "type": prop.get("type", "Hotel"),
                        "description": prop.get("description", ""),
                        "hotel_class": prop.get("extracted_hotel_class") or prop.get("hotel_class"),
                        "rating": prop.get("overall_rating", 4.5),
                        "reviews": prop.get("reviews", 0),
                        "price_formatted": lowest_price,
                        "rate_per_night": extracted_rate,
                        "currency": currency,
                        "lat": gps.get("latitude"),
                        "lng": gps.get("longitude"),
                        "thumbnail": prop.get("images", [{}])[0].get("thumbnail") if prop.get("images") else prop.get("thumbnail"),
                        "amenities": prop.get("amenities", [])[:6],
                        "free_cancellation": prop.get("free_cancellation", False),
                        "link": prop.get("link", "")
                    })

                # Save to Cache
                cls._memory_cache[cache_key] = {
                    "timestamp": time.time(),
                    "data": formatted_hotels
                }
                cls._save_cache()

                return {
                    "source": "serpapi_live",
                    "query": query,
                    "hotels": formatted_hotels
                }
            else:
                return {
                    "source": "api_error",
                    "status_code": resp.status_code,
                    "message": resp.text[:200],
                    "hotels": []
                }
        except Exception as e:
            return {
                "source": "exception",
                "error": str(e),
                "hotels": []
            }
