"""
External integrations API router (SerpAPI, OpenTripMap, Microsoft Azure Translator).
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from src.external.serpapi_service import SerpAPIService
from src.external.opentripmap_service import OpenTripMapService
from src.external.translate_service import TranslationService

router = APIRouter(prefix="/external", tags=["External Integrations"])

class TranslateRequest(BaseModel):
    text: str = Field(..., description="Text to translate")
    target_lang: str = Field(..., description="Target BCP-47 / ISO language code (e.g. 'hi', 'ta', 'te', 'kn')")
    source_lang: Optional[str] = Field("en", description="Source language code")

class TranslateBatchRequest(BaseModel):
    texts: List[str] = Field(..., description="List of strings to translate")
    target_lang: str = Field(..., description="Target BCP-47 / ISO language code")
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
    Translate text using Microsoft Azure Translator v3.0 with Gemini AI fallback.
    """
    return TranslationService.translate(
        text=req.text,
        target_lang=req.target_lang,
        source_lang=req.source_lang or "en"
    )

@router.post("/translate-batch")
def translate_batch(req: TranslateBatchRequest):
    """
    Translate multiple texts in a single batch using Microsoft Azure Translator v3.0.
    """
    translated_list = TranslationService.translate_batch(
        texts=req.texts,
        target_lang=req.target_lang,
        source_lang=req.source_lang or "en"
    )
    return {
        "translations": translated_list,
        "target_lang": req.target_lang,
        "count": len(translated_list)
    }

class TranslateItineraryRequest(BaseModel):
    custom_package: dict = Field(..., description="Full custom synthesized package dictionary")
    target_lang: str = Field(..., description="Target BCP-47 language tag")
    source_lang: Optional[str] = Field("en", description="Source language code")

@router.post("/translate-itinerary")
def translate_itinerary(req: TranslateItineraryRequest):
    """
    Translate the entire custom itinerary (trip title, day titles, time slot descriptions, notes, and tips)
    in a single batch using Azure Translator v3.0 / Gemini AI fallback.
    """
    import copy
    pkg = copy.deepcopy(req.custom_package)
    target_lang = req.target_lang
    if not target_lang or target_lang.lower().startswith("en"):
        return {"status": "success", "custom_package": pkg}

    texts_to_translate = []
    
    # 1. Trip title
    title = pkg.get("trip_title", "")
    texts_to_translate.append(title)
    
    # 2. Days, slots, notes
    itinerary = pkg.get("itinerary", [])
    day_indices = []
    slot_indices = []
    
    for d_idx, day in enumerate(itinerary):
        if "title" in day and day["title"]:
            texts_to_translate.append(day["title"])
            day_indices.append((d_idx, "title", len(texts_to_translate) - 1))
        if day.get("notes"):
            texts_to_translate.append(day["notes"])
            day_indices.append((d_idx, "notes", len(texts_to_translate) - 1))
        for s_idx, slot in enumerate(day.get("slots", [])):
            if "title" in slot and slot["title"]:
                texts_to_translate.append(slot["title"])
                slot_indices.append((d_idx, s_idx, "title", len(texts_to_translate) - 1))
            if "description" in slot and slot["description"]:
                texts_to_translate.append(slot["description"])
                slot_indices.append((d_idx, s_idx, "description", len(texts_to_translate) - 1))

    # 3. AI Optimizations
    opts = pkg.get("ai_optimizations", {})
    conflict_indices = []
    void_indices = []
    cost_tip_idx = None
    
    for c_idx, c_text in enumerate(opts.get("conflicts_resolved", [])):
        if c_text:
            texts_to_translate.append(c_text)
            conflict_indices.append((c_idx, len(texts_to_translate) - 1))
        
    for v_idx, v_text in enumerate(opts.get("voids_filled", [])):
        if v_text:
            texts_to_translate.append(v_text)
            void_indices.append((v_idx, len(texts_to_translate) - 1))
        
    if opts.get("cost_optimization_tip"):
        texts_to_translate.append(opts["cost_optimization_tip"])
        cost_tip_idx = len(texts_to_translate) - 1

    translated = TranslationService.translate_batch(
        texts=texts_to_translate,
        target_lang=target_lang,
        source_lang=req.source_lang or "en"
    )

    if translated and len(translated) == len(texts_to_translate):
        pkg["trip_title"] = translated[0]
        
        for d_idx, field, t_idx in day_indices:
            pkg["itinerary"][d_idx][field] = translated[t_idx]
            
        for d_idx, s_idx, field, t_idx in slot_indices:
            pkg["itinerary"][d_idx]["slots"][s_idx][field] = translated[t_idx]
            
        if "ai_optimizations" in pkg:
            for c_idx, t_idx in conflict_indices:
                pkg["ai_optimizations"]["conflicts_resolved"][c_idx] = translated[t_idx]
            for v_idx, t_idx in void_indices:
                pkg["ai_optimizations"]["voids_filled"][v_idx] = translated[t_idx]
            if cost_tip_idx is not None:
                pkg["ai_optimizations"]["cost_optimization_tip"] = translated[cost_tip_idx]

    return {
        "status": "success",
        "custom_package": pkg,
        "target_lang": target_lang
    }
