# TripCraft (PackagePro) — Dynamic Tour Packages

**KogniVera Hackathon 2026** · Problem Statement **PS-04**  
**Team CodeBlooded** · BMS College of Engineering

---

## 1. Team & Problem Statement

* **Team Name:** CodeBlooded
* **Problem Statement:** PS-04 — Dynamic Tour Packages (PackagePro / TripCraft)
* **College:** BMS College of Engineering
* **Build Window:** 24 Sep 09:00 → 25 Sep 09:00 IST (24 Hours)
* **Team Members & Roles:**
  * **Divyansh Duggad:** Backend & AI
  * **Navya Agrawal:** Design
  * **Priyanka Rajput:** Frontend & UI
  * **Priyanshi Singh:** Pitch Lead

---

## 2. What We Built

* **Interactive Package Customization Studio with Live Decimal Repricing:** Swapping any component (hotel tier, activities, transfers, or optional add-ons) updates itinerary structure and package total price **live** using strict Python `Decimal` arithmetic recomputed from scratch.
* **First-Class Tour Guide Selection:** Local tour guides selectable as primary package components by language (BCP-47), specialisation (heritage, food, trekking, wildlife, etc.), daily rates, and peak multipliers directly driving the total.
* **✦ Mandatory Guide Availability Check & Substitute Flow (§2.2):** Selecting an unavailable guide refuses the pick naming the **exact clashing date**, automatically proposes a **same-language, same-specialisation substitute guide**, and **reprices the package live** with the rate delta.
* **Server-Side Multilingual Filtering & Regional Translation:** Separate UI and guide language preferences using standard BCP-47 tags (`hi`, `ta`, `te`, `kn`, `mr`, `bn`, `gu`) driving server-side package and guide recommendations, with native script toggles and Azure Translator v3.0 regional localization.
* **Autonomous Custom Destination Architect (90km Geo Radius):** Geocoding via OpenStreetMap + OpenTripMap tourist discovery up to a **90km radius** for any destination on an interactive Leaflet map canvas with day-wise multi-selection of experiences and stays.
* **Grounded AI Package Synthesizer & Live Google Hotels:** Gemini Flash balances schedules, fills voids, and resolves timing conflicts without entity hallucinations; optional SerpAPI Google Hotels integration delivers live real-world room rates with verified zero-float Decimal pricing.

---

## 3. Architecture

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND (UI)                                     |
|  React 18 + Vite + Tailwind CSS + Lucide Icons + Leaflet Interactive Map         |
+------------------------------------------+----------------------------------------+
                                           | JSON API (Decimal Strings)
                                           v
+-----------------------------------------------------------------------------------+
|                           FASTAPI BACKEND SERVICE                                 |
|  catalog/       - Packages, components, guides, cities, categories                |
|  pricing/       - Strict Decimal Engine (base + sum(deltas) + guide)              |
|  guides/        - Availability Check, Conflict Refusal & Substitute Engine        |
|  preferences/   - BCP-47 Server-Side Filtering & Graceful Fallback                |
|  bookings/      - Idempotent Booking Engine & package_selections Persistence       |
|  ai/            - Grounded Gemini AI Pipeline (Prompt -> DB Entities Ranking)     |
|  external/      - SerpAPI Google Hotels, OpenTripMap POIs, Azure Translator v3.0   |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
+---------------------------------------+   +---------------------------------------+
|          INTERNAL DATABASE            |   |          EXTERNAL LIVE APIS           |
|  SQLite (data/PS-04.db - 21 tables)   |   |  - SerpAPI Google Hotels Engine       |
|  + Additive package_selections table  |   |  - OpenTripMap Geo Radius POIs (90km) |
|  Conforms to Rules R1-R8 (v1.1.0-rc1) |   |  - Microsoft Azure Translator v3.0    |
|                                       |   |  - Google Gemini AI Flash Series      |
+---------------------------------------+   +---------------------------------------+
```

---

## 4. Data Model

Conforms strictly to **v1.1.0-rc1** of the shared canonical data model (`01_YOUR_DATA_MODEL.md`):

* **Canonical Tables Used (D1–D9 Domains, 21 tables, 28,103 rows):**
  * `tour_packages`, `package_components`, `tour_guides`, `guide_availability`, `user_preferences`, `users`, `trips`, `itineraries`, `itinerary_items`, `bookings`, `cities`, `countries`, `currencies`, `hotels`, `hotel_room_types`, `hotel_media`, `transfers`, `categories`, `languages`, `price_history`, `amenities`.
* **Additive Schema Extension (Documented in `data-model/DATA_MODEL.md`):**
  * **`package_selections`**: Persists a traveller's selected component choices per `swap_group` for a trip/itinerary, preserving catalog immutability.
* **Rules R1–R8 Enforced in Code:**
  * **R1 (Additive Only):** No canonical column renamed or dropped.
  * **R2 (Opaque IDs):** Prefixed strings (`pkg_...`, `cmp_...`, `gui_...`, `sel_...`).
  * **R3 (Decimal Money):** Zero float arithmetic. All money handled via Python `Decimal` and serialized as 2-place strings.
  * **R4 (ISO-8601):** Timezone-aware timestamps (`_at`) and zoneless dates (`_date`).
  * **R5 (Enums):** Lowercase snake_case values validated against `data/enums.json`.
  * **R6 (BCP-47 Languages):** Languages stored and matched exclusively via BCP-47 tags (`ta`, `hi`, `en-IN`).
  * **R7 (WGS-84 Geography):** 6-decimal-place latitude and longitude coordinates.
  * **R8 (Soft Deletion):** State transitions (`active`, `cancelled`, `replaced`); no hard deletes.

---

## 5. AI Features

| Feature | Mechanism | Grounding & Guardrails | Evaluation Metric |
|---|---|---|---|
| **AI Trip Builder** | Natural language constraint parser + Gemini Flash model with multi-model fallback (`gemini-2.5-flash`, `gemini-1.5-flash`) | Ranks & selects verified package and component IDs from SQLite DB. Never invents entities, prices, or dates. | Preference & budget match accuracy |
| **Guide Matching Engine** | Multi-attribute scoring on languages (BCP-47), specialisations, ratings, and date availability | Verified against `tour_guides` and `guide_availability` calendar | Match accuracy & zero-clash guarantee |
| **Smart Add-on Recommender** | Contextual relevance matching between itinerary theme and optional `package_components` | Validated against active optional component rows | Add-on acceptance rate |
| **Explanation Generator** | Gemini Prompt Pipeline | Explains selected components and price breakdown using verified facts only | Rationale relevance & factual consistency |

---

## 6. Run It Locally

### 1. Prerequisites
* Python 3.11+
* Node.js v18+ & npm

### 2. Setup Environment
```bash
# Clone the repository
git clone https://github.com/kognivera-org/kv-hack2026-codeblooded.git
cd kv-hack2026-codeblooded

# Copy environment file
cp .env.example .env
```

### 3. Database Verification & Seeding
The canonical SQLite database is pre-indexed and ready at `data/PS-04.db`. Conformance can be verified anytime:
```bash
python PackagePro/tools/validate_conformance.py data/PS-04.db
```

### 4. Quickstart: Unified Single-Command Run (Recommended)
Launch both the FastAPI Backend and the React Frontend simultaneously with a single command from the project root:
```bash
python run.py
# Or from npm at root:
npm run dev
```
* **Frontend UI:** `http://localhost:5173`
* **Backend API:** `http://localhost:8000` (Swagger Interactive Docs: `http://localhost:8000/docs`)

### 5. Running Backend & Frontend Independently
Both services maintain isolated dependency requirements (`backend/requirements.txt` and `frontend/package.json`) and can run independently without version conflicts:

**Backend (FastAPI):**
```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (React + Vite):**
```bash
cd frontend
npm install
npm run dev
```

---

## 7. Demo Path (Terminal MVP Outcome)

1. **Browse & Filter:** Open `http://localhost:5173`, switch language preference to **Tamil (`த`)** or **Hindi (`हि`)**, and observe server-side package and guide filtering.
2. **Select Package:** Click on a curated package (e.g. *Tirupati Honeymoon* or *Varanasi Heritage*).
3. **Customize Components:**
   * Swap hotel tier from Standard to Luxury $\to$ observe live itinerary update and exact Decimal price recalculation.
   * Toggle optional activities (e.g. Temple VIP Darshan, Evening Aarti Boat) $\to$ price recalculates live with signed deltas.
4. **✦ Trigger Guide Clash & Substitution Flow (§2.2):**
   * Select a tour guide for a date known to have a clash (e.g. `2026-09-01`).
   * See the refusal alert appear: *"Guide 'Nisha Verma' is unavailable on 2026-09-01"*.
   * View the recommended **substitute guide** matching the **same language and same specialisation**.
   * Click **"Accept Substitute"** $\to$ the substitute replaces the guide and the total reprices live with the price delta.
5. **Custom Destination Architect (Any City):**
   * Switch to the **"Custom Architect"** tab.
   * Type any destination (e.g. `Chikmagalur`, `Wayanad`, `Coorg`, `Hampi`).
   * See OpenStreetMap + OpenTripMap discover all nearby POIs on the Leaflet map.
   * Select day-wise experiences (checkboxes) and hotels (radio buttons) across a 1–7 day duration.
   * Click **"Synthesize Itinerary & Reprice"** $\to$ Gemini Flash balances schedules, fills voids, resolves timing conflicts, and applies zero-float Decimal pricing.
6. **Real-World Live Google Hotels:** Toggle external supply mode $\to$ select live hotels via SerpAPI Google Hotels with real INR rates.
7. **Book Custom Package:** Click **"Book Package"** $\to$ booking created with unique reference and idempotency key.

---

## 8. Tests / Proof

Run the automated pytest test suite (including **THE MANDATORY GUIDE AVAILABILITY HARD-PROOF TEST**):

```bash
# Run all automated tests with verbose output
pytest -v -s tests/
```

### Running Data Model Conformance Check:
```bash
python PackagePro/tools/validate_conformance.py data/PS-04.db
```
*(Returns `PASS` with 100% schema compliance)*
