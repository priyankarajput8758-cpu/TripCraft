"""
External integrations API router (SerpAPI, OpenTripMap, LibreTranslate).
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from src.external.serpapi_service import SerpAPIService
from src.external.opentripmap_service import OpenTripMapService
from src.external.translate_service import TranslationService

router = APIRouter(prefix="/external", tags=["External Integrations"])

class TranslateRequest(BaseModel):
    text: str = Field(..., description="Text to translate")
    target_lang: str = Field(..., description="Target BCP-47 / ISO language code (e.g. 'hi', 'ta')")
    source_lang: Optional[str] = Field("en", description="Source language code")

@router.get("/explore-destination")
def explore_destination(
    query: str = Query(..., description="Destination city or area name, e.g. 'Chikmagalur', 'Ooty', 'Hampi'"),
    radius_meters: int = Query(15000, ge=1000, le=100000, description="Search radius in meters (up to 90-100km)")
):
    """
    Geocodes any destination and fetches all nearby tourist spots, heritage landmarks, and viewpoints from OpenTripMap.
    """
    return OpenTripMapService.geocode_and_explore(query=query, radius_meters=radius_meters)

@router.get("/attraction-detail")
def get_attraction_detail(
    xid: str = Query(..., description="OpenTripMap XID"),
    lang: str = Query("en", description="Language code")
):
    """
    Get detailed description and image for an OpenTripMap attraction.
    """
    return OpenTripMapService.get_attraction_detail(xid=xid, lang=lang)

@router.get("/hotels")
def search_live_hotels(
    query: str = Query(..., description="Search query, e.g. 'Varanasi Resorts' or 'Jaipur Luxury'"),
    check_in_date: Optional[str] = Query("2026-09-24", description="Check-in YYYY-MM-DD"),
    check_out_date: Optional[str] = Query("2026-09-25", description="Check-out YYYY-MM-DD"),
    currency: str = Query("INR", description="Currency (default INR)")
):
    """
    Search real-world Google Hotels prices via SerpAPI (cached to protect quota).
    """
    return SerpAPIService.search_hotels(
        query=query,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        currency=currency
    )

@router.get("/attractions")
def get_nearby_attractions(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_meters: int = Query(15000, ge=500, le=100000, description="Search radius in meters")
):
    """
    Get nearby tourist attractions & heritage spots within radius from OpenTripMap.
    """
    return OpenTripMapService.get_nearby_attractions(
        lat=lat,
        lng=lng,
        radius_meters=radius_meters
    )

@router.post("/translate")
def translate_text(req: TranslateRequest):
    """
    Translate UI terms or descriptions.
    """
    return TranslationService.translate(
        text=req.text,
        target_lang=req.target_lang,
        source_lang=req.source_lang or "en"
    )
