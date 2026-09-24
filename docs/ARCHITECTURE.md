# Architecture Documentation — TripCraft (PS-04)

## 1. System Overview

TripCraft (PackagePro) is an intelligent dynamic tour package assembly and customization platform engineered for **KogniVera Hackathon 2026 (Problem Statement PS-04)**.

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND (UI)                                     |
|  React 18 + Vite + Tailwind CSS + Lucide Icons + Leaflet Interactive Map         |
|  - Package Explorer & Theme Filtering                                            |
|  - Customization Studio (Live Decimal Reprice, Swap Groups, Add-ons)              |
|  - Tour Guide Selector with Availability Conflict Banner & 1-Click Substitute     |
|  - Real-World Toggle (Google Hotels via SerpAPI + OpenTripMap Attractions)        |
|  - AI Package Architect (Prompt to Grounded Itinerary Proposal)                   |
|  - Multilingual Selector (en-IN, hi, ta, te, mr, bn, kn, gu)                     |
+------------------------------------------+----------------------------------------+
                                           | REST JSON API (Decimal Strings)
                                           v
+-----------------------------------------------------------------------------------+
|                             BACKEND API SERVICE                                   |
|                             FastAPI (Python 3.11)                                 |
+------------------------------------------+----------------------------------------+
|  catalog/       | Browse packages, swappable components, cities, guides, media   |
|  pricing/       | Strict Decimal Engine (base + sum(deltas) + guide)              |
|  guides/        | Availability Checker & Same-Language/Spec Substitute Engine     |
|  preferences/   | BCP-47 Server-side Filter & Graceful Multilingual Fallback      |
|  bookings/      | Idempotent Booking Engine & package_selections Persistence       |
|  ai/            | Gemini AI Grounding Pipeline (Prompt -> DB Entities Ranking)    |
|  external/      | SerpAPI Google Hotels, OpenTripMap POIs, LibreTranslate         |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
+---------------------------------------+   +---------------------------------------+
|          INTERNAL DATA STORE          |   |          EXTERNAL REAL-WORLD          |
|    SQLite (data/PS-04.db)             |   |            LIVE SERVICES              |
|  - 21 Canonical Tables (v1.1.0-rc1)   |   |  - Google Hotels (SerpAPI Cached)     |
|  - Additive: package_selections       |   |  - OpenTripMap Attractions Radius     |
|  - 28,103 Synthetic Travel Rows       |   |  - Google GenAI (Gemini Flash Series) |
|  - Rules R1-R8 Enforced in Code       |   |  - LibreTranslate Translation Engine  |
+---------------------------------------+   +---------------------------------------+
```

---

## 2. Core Modules

### 2.1 Pricing Engine (`backend/src/pricing/engine.py`)
- **Zero Float Rule (R3):** Uses Python's `decimal.Decimal` exclusively. All money values serialized as strings over the API wire.
- **Recalculation From Scratch (§9):** Total price is computed from scratch on every change:
  $$\text{Total} = \text{base\_price} + \sum \text{price\_delta}_{\text{selected components}} + (\text{day\_rate} \times \text{duration} \times \text{multiplier})$$
- Correctly handles signed deltas (downgrades reducing price), optional add-on components, and guide peak multipliers.

### 2.2 Mandatory Guide Availability & Substitute Engine (`backend/src/guides/availability.py`)
- Resolves calendar date range ($T_{\text{start}} \dots T_{\text{end}}$).
- Queries `guide_availability` table for $(guide\_id, for\_date)$.
- If any day has `is_available = 0` or is unlisted, **refuses immediately** and names the exact earliest clashing date.
- Queries alternative active guides matching **same BCP-47 language tag** and **same specialisation** who are verified 100% available across all trip dates.
- Ranks substitutes (same city > rating DESC > rate proximity), calculates price delta, and exposes a 1-click substitute replacement.

### 2.3 Grounded AI Pipeline (`ai/pipeline.py` & `backend/src/ai/service.py`)
- Multi-model fallback across `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-3.8-flash`.
- **Strict Guardrail (§7):** AI is restricted to parsing requirements, scoring candidate packages, selecting valid component IDs from DB, and generating natural language justifications. It never generates arbitrary package IDs, prices, or availability records.

### 2.4 Real-World External Integrations (`backend/src/external/`)
- **SerpAPI Google Hotels:** Live rates and properties when real-world toggle is active. Cached in-memory and on disk to conserve the 200/month quota limit.
- **OpenTripMap:** Geographic radius search (1–5km) discovering heritage sites, monuments, and attractions.
- **Multilingual Support:** Server-side BCP-47 tag matching + LibreTranslate / local dictionary fallback for Indian languages.
