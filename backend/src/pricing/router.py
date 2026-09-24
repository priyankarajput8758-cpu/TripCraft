"""
Pricing API router.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from src.pricing.engine import PricingEngine

router = APIRouter(prefix="/pricing", tags=["Pricing"])

class RepriceRequest(BaseModel):
    package_id: str = Field(..., description="Package ID (e.g. pkg_...)")
    selected_component_ids: List[str] = Field(default_factory=list, description="IDs of chosen components")
    guide_id: Optional[str] = Field(None, description="Optional guide ID")
    start_date: Optional[str] = Field(None, description="Trip start date (YYYY-MM-DD)")
    duration_days: Optional[int] = Field(None, description="Custom trip duration in days")
    num_travelers: Optional[int] = Field(1, ge=1, description="Number of travelers")
    market_hotel_rate: Optional[float] = Field(None, description="Optional live market hotel rate per night")
    market_hotel_name: Optional[str] = Field(None, description="Optional live market hotel name")

@router.post("/reprice")
def reprice_package(req: RepriceRequest):
    """
    Live recalculation of package pricing in Decimal strictly from scratch.
    """
    try:
        return PricingEngine.calculate_repricing(
            package_id=req.package_id,
            selected_component_ids=req.selected_component_ids,
            guide_id=req.guide_id,
            start_date=req.start_date,
            duration_days=req.duration_days,
            num_travelers=req.num_travelers or 1,
            market_hotel_rate=req.market_hotel_rate,
            market_hotel_name=req.market_hotel_name
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
