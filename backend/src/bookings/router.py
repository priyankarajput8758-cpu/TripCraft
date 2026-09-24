"""
Bookings API router.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from src.bookings.service import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])

class CreateBookingRequest(BaseModel):
    package_id: str = Field(..., description="Package ID")
    user_id: str = Field(default="usr_default", description="User ID")
    selected_component_ids: List[str] = Field(..., description="List of chosen component IDs")
    idempotency_key: str = Field(..., description="Unique client idempotency token")
    guide_id: Optional[str] = Field(None, description="Optional chosen guide ID")
    start_date: Optional[str] = Field(None, description="Trip start date (YYYY-MM-DD)")
    party_size: int = Field(default=2, ge=1)
    num_travelers: Optional[int] = Field(None, ge=1, description="Active traveler count")
    total_price: Optional[str] = Field(None, description="Verified client total amount")
    notes: Optional[str] = Field(None, description="Booking notes")

@router.post("")
@router.post("/create")
def create_booking(req: CreateBookingRequest):
    """
    Create a confirmed booking with live pricing, versioned itinerary,
    and package selections persistence.
    """
    try:
        active_party = req.num_travelers or req.party_size
        return BookingService.create_booking(
            package_id=req.package_id,
            user_id=req.user_id,
            selected_component_ids=req.selected_component_ids,
            idempotency_key=req.idempotency_key,
            guide_id=req.guide_id,
            start_date=req.start_date,
            party_size=active_party,
            total_price=req.total_price,
            notes=req.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
