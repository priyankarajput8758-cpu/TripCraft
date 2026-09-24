"""
Catalog API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from src.catalog.service import CatalogService

router = APIRouter(prefix="/catalog", tags=["Catalog"])

@router.get("/packages")
def get_packages(
    city_id: Optional[str] = Query(None, description="Filter by city ID"),
    theme: Optional[str] = Query(None, description="Filter by theme"),
    tier: Optional[str] = Query(None, description="Filter by tier (budget, comfort, luxury)"),
    language_bcp47: Optional[str] = Query(None, description="Filter by BCP-47 language tag (e.g. 'ta', 'hi', 'en-IN')"),
    max_price: Optional[float] = Query(None, description="Max base price filter"),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    try:
        return CatalogService.list_packages(
            city_id=city_id,
            theme=theme,
            tier=tier,
            language_bcp47=language_bcp47,
            max_price=max_price,
            limit=limit,
            offset=offset
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/packages/{package_id}")
def get_package_detail(
    package_id: str,
    language: Optional[str] = Query(None, description="BCP-47 language tag to prioritize guides")
):
    try:
        return CatalogService.get_package_detail(package_id, language=language)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/guides")
def get_guides(
    city_id: Optional[str] = Query(None, description="Filter by city ID"),
    language: Optional[str] = Query(None, description="BCP-47 language tag (e.g. 'ta', 'hi')"),
    specialisation: Optional[str] = Query(None, description="Specialisation category"),
    limit: int = Query(50, ge=1, le=100)
):
    try:
        return CatalogService.list_guides(
            city_id=city_id,
            language=language,
            specialisation=specialisation,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cities")
def get_cities():
    try:
        return CatalogService.list_cities()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/languages")
def get_languages():
    try:
        return CatalogService.list_languages()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
