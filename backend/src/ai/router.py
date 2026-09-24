"""
AI API endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from src.ai.service import AIService

router = APIRouter(prefix="/ai", tags=["AI Engine"])

class BuildTripRequest(BaseModel):
    user_prompt: str = Field(..., description="Free text traveller requirements (e.g. 'I want a 4-day spiritual heritage trip with a Tamil guide')")
    destination_city_id: Optional[str] = Field(None, description="Optional city ID")
    max_budget: Optional[float] = Field(None, description="Maximum budget")
    duration_days: Optional[int] = Field(None, description="Desired duration in days")
    preferred_language: Optional[str] = Field(None, description="Preferred language BCP-47 tag (e.g. 'ta', 'hi')")
    interests: Optional[str] = Field(None, description="Comma-separated interests")

class MatchGuideRequest(BaseModel):
    city_id: str = Field(..., description="City ID")
    start_date: str = Field(..., description="Start date YYYY-MM-DD")
    duration_days: int = Field(default=3, ge=1)
    language: str = Field(default="en", description="BCP-47 language tag")
    specialisation: Optional[str] = Field(None, description="Specialisation enum")

class DaySelection(BaseModel):
    day_number: int
    selected_activities: List[str] = []
    selected_hotel: Optional[Dict[str, Any]] = None

class SynthesizeCustomTripRequest(BaseModel):
    destination_name: str = Field(..., description="Destination name, e.g. 'Chikmagalur', 'Ooty'")
    duration_days: int = Field(3, ge=1, le=10, description="Duration in days")
    pace_preference: str = Field("balanced", description="Pace: 'relaxed', 'balanced', 'packed'")
    day_selections: List[DaySelection] = Field(default=[], description="Day-wise multi-selected experiences and hotels")
    external_supply_mode: bool = Field(False, description="Whether live Google Hotels external supply is enabled")
    selected_guide_id: Optional[str] = Field(None, description="Guide ID if selected")
    start_date: Optional[str] = Field("2026-09-24", description="Start date")
    lat: Optional[float] = Field(None, description="Latitude")
    lng: Optional[float] = Field(None, description="Longitude")
    user_custom_requests: Optional[str] = Field(None, description="User's custom schedule & timing requests, e.g. sunset at a specific spot")
    num_travelers: Optional[int] = Field(1, ge=1, description="Number of travelers")

@router.post("/build-trip")
def build_trip(req: BuildTripRequest):
    """
    AI Package Builder from free-text interests, budget, and language.
    Grounded in real database rows and verified with Decimal repricing.
    """
    try:
        return AIService.build_custom_trip(
            user_prompt=req.user_prompt,
            destination_city_id=req.destination_city_id,
            max_budget=req.max_budget,
            duration_days=req.duration_days,
            preferred_language=req.preferred_language,
            interests=req.interests
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize-custom-trip")
def synthesize_custom_trip(req: SynthesizeCustomTripRequest):
    """
    Brand New Custom Destination Itinerary Synthesizer:
    Gathers OpenTripMap tourist experiences across multi-select day matrix,
    resolves timing & sunset conflicts, fills activity voids, and evaluates hotel surge pricing.
    """
    try:
        return AIService.synthesize_custom_trip(
            destination_name=req.destination_name,
            duration_days=req.duration_days,
            pace_preference=req.pace_preference,
            day_selections=[d.dict() for d in req.day_selections],
            external_supply_mode=req.external_supply_mode,
            selected_guide_id=req.selected_guide_id,
            start_date=req.start_date or "2026-09-24",
            lat=req.lat,
            lng=req.lng,
            user_custom_requests=req.user_custom_requests,
            num_travelers=req.num_travelers or 1
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match-guide")
def match_guide(req: MatchGuideRequest):
    """
    AI Guide Matcher: Ranks and verifies availability of top local guides.
    """
    try:
        return AIService.match_best_guide(
            city_id=req.city_id,
            start_date=req.start_date,
            duration_days=req.duration_days,
            language=req.language,
            specialisation=req.specialisation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
