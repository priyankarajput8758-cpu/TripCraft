"""
Preferences API router.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from src.preferences.service import PreferencesService

router = APIRouter(prefix="/preferences", tags=["Preferences"])

class UpdatePreferencesRequest(BaseModel):
    user_id: str = Field(..., description="User ID (e.g. usr_...)")
    preferred_languages: Optional[str] = Field(None, description="Comma-separated BCP-47 tags (e.g. 'ta,hi,en-IN')")
    guide_language: Optional[str] = Field(None, description="Preferred language BCP-47 tag for guide/tour delivery")
    interests: Optional[str] = Field(None, description="Comma-separated interests")
    pace: Optional[str] = Field(None, description="Pace (relaxed, moderate, fast)")
    preferred_currency: Optional[str] = Field(None, description="ISO-4217 Currency (e.g. 'INR')")
    max_daily_budget: Optional[str] = Field(None, description="Max daily budget string")

@router.get("/{user_id}")
def get_preferences(user_id: str):
    try:
        return PreferencesService.get_user_preferences(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{user_id}")
def update_preferences(user_id: str, req: UpdatePreferencesRequest):
    try:
        return PreferencesService.update_user_preferences(
            user_id=user_id,
            preferred_languages=req.preferred_languages,
            guide_language=req.guide_language,
            interests=req.interests,
            pace=req.pace,
            preferred_currency=req.preferred_currency,
            max_daily_budget=req.max_daily_budget
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
