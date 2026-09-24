"""
Guide availability and substitution API router.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from src.guides.availability import GuideAvailabilityEngine

router = APIRouter(prefix="/guides", tags=["Guides"])

class GuideAvailabilityCheckRequest(BaseModel):
    guide_id: str = Field(..., description="ID of tour guide")
    start_date: str = Field(..., description="Start date YYYY-MM-DD")
    duration_days: int = Field(1, ge=1, le=30, description="Duration in calendar days")
    package_id: Optional[str] = Field(None, description="Optional package ID")
    city_id: Optional[str] = Field(None, description="Optional city ID")
    preferred_language: Optional[str] = Field(None, description="Target BCP-47 language tag")

@router.post("/check-availability")
def check_availability(req: GuideAvailabilityCheckRequest):
    """
    Mandatory Guide Availability Check (§2.2):
    Checks dates against guide_availability. If clash occurs:
    - Refuses selection naming the exact clashing date
    - Recommends same-language & same-specialisation substitute
    - Calculates price delta
    """
    try:
        return GuideAvailabilityEngine.check_availability_and_substitute(
            guide_id=req.guide_id,
            start_date=req.start_date,
            duration_days=req.duration_days,
            package_id=req.package_id,
            city_id=req.city_id,
            preferred_language=req.preferred_language
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{guide_id}/availability")
def get_guide_availability(
    guide_id: str,
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    duration_days: int = Query(1, ge=1, le=30),
    package_id: Optional[str] = Query(None),
    city_id: Optional[str] = Query(None),
    preferred_language: Optional[str] = Query(None)
):
    """GET endpoint for Guide Availability Check (§2.2)."""
    try:
        return GuideAvailabilityEngine.check_availability_and_substitute(
            guide_id=guide_id,
            start_date=start_date,
            duration_days=duration_days,
            package_id=package_id,
            city_id=city_id,
            preferred_language=preferred_language
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

