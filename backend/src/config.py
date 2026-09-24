"""
TripCraft / PackagePro Backend Configuration.
Loads environment variables and sets system defaults.
"""

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Base paths
SRC_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SRC_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

# Load .env from ROOT_DIR
load_dotenv(ROOT_DIR / ".env")

class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # SQLite Database Path
    DB_PATH: str = os.getenv("DATABASE_PATH", str(ROOT_DIR / "data" / "PS-04.db"))

    # AI - Google Gemini API Key & Model Fallback Hierarchy
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODELS: List[str] = [
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite"
    ]

    # Real-World Hotels - SerpAPI Google Hotels Engine
    SERPAPI_API_KEY: str = os.getenv("SERPAPI_API_KEY", "")
    SERPAPI_BASE_URL: str = "https://serpapi.com/search.json"

    # Real-World Attractions - OpenTripMap API
    OPENTRIPMAP_API_KEY: str = os.getenv("OPENTRIPMAP_API_KEY", "")
    OPENTRIPMAP_BASE_URL: str = "https://api.opentripmap.com/0.1"

    # Multilingual Translation - LibreTranslate
    LIBRETRANSLATE_URL: str = os.getenv("LIBRETRANSLATE_URL", "http://localhost:5000")

settings = Settings()
