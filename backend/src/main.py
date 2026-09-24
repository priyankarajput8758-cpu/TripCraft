"""
TripCraft / PackagePro FastAPI Application Entrypoint.
KogniVera Hackathon 2026 · PS-04 Dynamic Tour Packages
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database import init_db_extensions
from src.catalog.router import router as catalog_router
from src.pricing.router import router as pricing_router
from src.guides.router import router as guides_router
from src.preferences.router import router as preferences_router
from src.bookings.router import router as bookings_router
from src.external.router import router as external_router
from src.ai.router import router as ai_router

# Initialize FastAPI App
app = FastAPI(
    title="TripCraft / PackagePro API",
    description="Dynamic Tour Packages API with Live Decimal Repricing, Guide Availability Verification, and Multilingual Filtering.",
    version="1.1.0-rc1"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(catalog_router, prefix="/api")
app.include_router(pricing_router, prefix="/api")
app.include_router(guides_router, prefix="/api")
app.include_router(preferences_router, prefix="/api")
app.include_router(bookings_router, prefix="/api")
app.include_router(external_router, prefix="/api")
app.include_router(ai_router, prefix="/api")

@app.on_event("startup")
def startup_event():
    """Ensure additive schema tables exist on launch."""
    init_db_extensions()

@app.get("/")
def health_check():
    return {
        "service": "TripCraft / PackagePro API",
        "status": "healthy",
        "version": "1.1.0-rc1",
        "conformance": "v1.1.0-rc1 (SQLite)",
        "features": [
            "Live Decimal Repricing (§3.1, §9)",
            "Mandatory Guide Availability Check & Refusal (§2.2)",
            "Same-Language & Same-Specialisation Guide Substitution (§2.2)",
            "BCP-47 Server-Side Multilingual Filtering (§8)",
            "Grounded AI Trip Builder (§7)",
            "Real-World Pricing via SerpAPI Google Hotels",
            "Real-World POIs via OpenTripMap",
            "Multilingual UI Support via LibreTranslate"
        ]
    }
