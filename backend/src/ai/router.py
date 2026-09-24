"""
AI API endpoints.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
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
