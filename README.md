# TripCraft (PackagePro) — Dynamic Tour Packages

**KogniVera Hackathon 2026** · Problem Statement **PS-04**  
**Team CodeBlooded** · BMS College of Engineering

---

## 1. Team & Problem Statement

* **Team Name:** CodeBlooded
* **Problem Statement:** PS-04 — Dynamic Tour Packages (PackagePro / TripCraft)
* **Build Window:** 24 Sep 09:00 → 25 Sep 09:00 IST (24 Hours)
* **Team Members & Roles:**
  * **Divyansh Duggad (Lead):** Backend, Business Logics, Decimal Pricing & Grounded AI
  * **Navya Agrawal:** Design & User Experience
  * **Priyanka Rajput:** Frontend & UI
  * **Priyanshi Singh:** Pitch Lead & Demo Flow

---

## 2. What We Built

* **Curated Package Explorer:** Browse curated packages across themes (Spiritual, Adventure, Honeymoon, Heritage, Wildlife, Luxury) with transparent itemized inclusions and base pricing.
* **Live Decimal Customization Studio:** Swapping any component (hotel tier, activities, transfers, optional add-ons) updates itinerary structure and package total price **live** using strict `Decimal` math.
* **Tour-Guide as a First-Class Component:** Local tour guides selectable with BCP-47 language spoken, specialisation (heritage, food, trekking, wildlife, etc.), daily rates, and peak multipliers directly driving the total.
* **✦ Mandatory Guide Availability Check & Refusal Flow (§2.2):** Adding a guide whose dates clash refuses the selection with the **exact clashing date named**, automatically proposes a **same-language, same-specialisation substitute guide**, and **reprices the package live** with the rate delta.
* **Server-Side Multilingual Filtering (§8):** Preferences filter packages (`languages_offered`) and tour guides (`languages`) using standard BCP-47 tags (e.g. `ta`, `hi`, `en-IN`), with graceful fallback and clear notices.
* **Autonomous Custom Destination Architect (Any City / 90km Radius):** Free-form geocoding via OpenStreetMap Nominatim + OpenTripMap tourist landmark discovery up to a **90km radius** for any destination (e.g. Chikmagalur, Ooty, Wayanad, Coorg, Hampi, Varanasi) on an interactive Leaflet map canvas with detailed spot cards and distance calculation.
* **Day-Wise Multi-Select Experience Matrix:** Allows travellers to choose multiple activities/experiences per day (checkboxes) and select hotels/stays per night (radio buttons) across a flexible 1–7 day duration with pace preferences (Relaxed, Balanced, Packed).
* **Gemini Schedule Optimization, Void Filling & Imagery:** Automatically fills activity voids with authentic local spots, resolves timing and sunset conflicts, attaches rich cover and attraction photography, and provides cost optimization insights (weekday vs weekend hotel tariffs).
* **Real-World Pricing & Live Google Hotels Selection:** Toggle external supply mode to select real-world live hotels via SerpAPI Google Hotels with live INR pricing and booking links.
* **Multilingual Translation Engine (Azure Translator v3.0):** Neural machine translation across Indian regional languages (Tamil, Hindi, Telugu, Kannada, Marathi, Bengali, Gujarati, Malayalam) via Microsoft Azure Cognitive Services Translator Text API v3.0 with batch processing and Gemini AI fallback.

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

Conforms strictly to **v1.1.0-rc1** of the shared data model (`01_YOUR_DATA_MODEL.md`):

* **Canonical Tables Used (20 core + 1 reference):**
  * `tour_packages`, `package_components`, `tour_guides`, `guide_availability`, `user_preferences`, `users`, `trips`, `itineraries`, `itinerary_items`, `bookings`, `cities`, `countries`, `currencies`, `hotels`, `hotel_room_types`, `hotel_media`, `transfers`, `categories`, `languages`, `price_history`, `amenities`.
* **Additive Schema Extension (Documented in `data-model/DATA_MODEL.md`):**
  * **`package_selections`**: Stores a traveller's selected component choices per `swap_group` for a trip/itinerary, preserving catalog immutability.
* **Rules R1–R8 Enforced in Code:**
  * **R1 (Additive Only):** No canonical column renamed or dropped.
  * **R2 (Opaque IDs):** Prefixed strings (`pkg_...`, `cmp_...`, `gui_...`, `sel_...`).
  * **R3 (Decimal Money):** Zero float arithmetic. All money handled via Python `Decimal` and serialized as 2-place strings.
  * **R4 (ISO-8601):** Timezone-aware timestamps (`_at`) and zoneless dates (`_date`).
  * **R6 (BCP-47 Languages):** Languages stored and matched exclusively via BCP-47 tags (`ta`, `hi`, `en-IN`).
  * **R8 (Soft Deletion):** Status state transitions.

---

## 5. AI Features

| Feature | Mechanism | Grounding & Guardrails | Evaluation Metric |
|---|---|---|---|
| **AI Trip Builder** | Natural language constraint parser + Gemini Flash model with multi-model fallback (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-3.8-flash`) | Ranks & selects verified package and component IDs from SQLite DB. Never invents entities, prices, or dates. | Preference & budget match accuracy |
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

### 3. Backend Setup & Run
```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Run the backend API server
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be live at: `http://localhost:8000`  
Swagger API Docs available at: `http://localhost:8000/docs`

### 4. Frontend Setup & Run
```bash
# In a new terminal
cd frontend
npm install
npm run dev
```
Open web app in browser: `http://localhost:5173`

---

## 7. Demo Path (Terminal MVP Outcome)

1. **Browse & Filter:** Open the app, set language preference to **Tamil (`ta`)** or **Hindi (`hi`)**, and observe server-side package and guide filtering.
2. **Select Package:** Click on a curated package (e.g. *Tirupati Honeymoon* or *Varanasi Heritage*).
3. **Customize Components:**
   * Swap hotel tier from Standard to Luxury $\to$ observe live itinerary update and exact Decimal price increase.
   * Toggle optional activities (e.g. Temple VIP Darshan, Evening Aarti Boat) $\to$ price recalculates live.
4. **✦ Trigger Guide Clash & Substitution Flow (§2.2):**
   * Select a tour guide for a date known to have a clash (e.g. `2026-09-01`).
   * See the refusal alert appear: *"Guide 'Nisha Verma' is unavailable on 2026-09-01"*.
   * View the recommended **substitute guide** matching the **same language and same specialisation**.
   * Click **"Accept Substitute"** $\to$ the substitute replaces the guide and the total reprices live with the price delta.
5. **Custom Destination Architect (Any City):**
   * Switch to the **"Custom Destination Architect"** tab.
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
