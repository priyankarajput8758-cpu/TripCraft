# TripCraft (PackagePro) — Frontend Developer Specification & Handoff Guide

> **Prepared for:** Priyanka Rajput (Frontend & UI Lead)  
> **Prepared by:** Divyansh Duggad (Lead, Backend & AI)  
> **Team:** CodeBlooded · BMS College of Engineering  
> **Event:** KogniVera Hackathon 2026 · Problem Statement **PS-04 (Dynamic Tour Packages)**  
> **Hackathon Window:** 24 Sep 2026, 09:00 AM IST → 25 Sep 2026, 09:00 AM IST (24 Hours)  
> **Backend Repository / API:** `http://localhost:8000/api` (Swagger UI at `http://localhost:8000/docs`)

---

## 1. Executive Summary & Product Vision

**TripCraft** (deck name: *PackagePro*) is an intelligent, dynamic tour package customization and live repricing platform. Travellers can either pick curated base packages across popular travel themes or let our **Grounded AI** architect one from a natural language description.

### The Core User Journey
1. **Explore:** Browse curated packages across cities, themes, tiers, and language preferences.
2. **Customize:** Swap hotel tiers, activities, and transfers in real-time, watching the itinerary and price recalculate live.
3. **Guide Dimension:** Add an optional verified local tour guide with language, specialisation, and calendar availability.
4. **Mandatory Judge Feature (§2.2):** If a guide is unavailable on *any* package date, the UI refuses the selection, **names the exact clashing date**, proposes the **nearest matching substitute guide** (same language & specialisation), and recalculates the rate delta.
5. **Real-World Supply Comparison:** Toggle between canonical database rates and live Google Hotels market prices (via cached SerpAPI) + OpenTripMap landmarks.
6. **Book:** Instant confirmed reservation with idempotency token protection and itemized receipt.

---

## 2. Design System & UI/UX Aesthetic

We are building a **modern, minimal, ultra-polished dark-mode interface** with sleek glassmorphism, crisp typography, and fluid micro-interactions.

### 2.1 Color Palette
* **Background Canvas:** `#090d16` (Deep Midnight Slate)
* **Card & Surface Backgrounds:** `#0f172a` (Slate-900) with subtle borders (`#1e293b` / `border-slate-800`)
* **Primary Brand / Accent:** `#14b8a6` (Teal-500) to `#10b981` (Emerald-500) gradients
* **Success & Price Reductions:** `#34d399` (Emerald-400)
* **Warnings & External Supply:** `#fbbf24` (Amber-400)
* **Date Clash & Refusal Alert:** `#f43f5e` (Rose-500) / `#881337` (Rose-950)
* **Typography:** Clean sans-serif (`Inter` or system `-apple-system, BlinkMacSystemFont, 'Segoe UI'`)
* **Financial Numerals:** Monospace font (`font-mono`) for all prices and deltas

### 2.2 Mobile-First Responsiveness
* **Touch Targets:** Minimum 44px for buttons and swap cards.
* **Sticky Price Bar on Mobile:** On smaller screens (`< 768px`), display a sticky bottom drawer showing the total price and "Book Itinerary" CTA so users always see the live price as they customize components.
* **Responsive Grids:** 1 column on mobile (`grid-cols-1`), 2 columns on tablet (`sm:grid-cols-2`), 3–4 columns on desktop (`lg:grid-cols-3 xl:grid-cols-4`).

### 2.3 Animations & Micro-Interactions
* **Card Hover States:** `hover:border-teal-500/50 hover:bg-slate-800/80 transition-all duration-200`
* **Selected Swap Cards:** Glowing border `ring-1 ring-teal-500/50 bg-teal-950/30` with checkmark icon.
* **Live Price Recalculation:** Subtle pulse animation (`animate-pulse` on badge or price fade) when a component is swapped.
* **Modals:** Backdrop blur (`backdrop-blur-md bg-slate-950/80`) with ease-in fade (`animate-in fade-in zoom-in-95`).

---

## 3. The 6 Critical UI Components to Deliver

```
frontend/src/
├── api.js                           # Centralized API fetcher
├── App.jsx                          # Root layout, catalog state, modals
├── index.css                        # Tailwind directives & scrollbar styling
└── components/
    ├── Navbar.jsx                   # Brand, BCP-47 language picker, AI trigger, External supply toggle
    ├── CustomizerStudio.jsx         # Component swap groups & Live Price Summary card
    ├── GuideSelector.jsx            # Local guide selection + §2.2 Date Clash Refusal & Substitute Banner
    ├── TripMap.jsx                  # Leaflet interactive map + OpenTripMap POI discovery
    ├── RealWorldPanel.jsx           # SerpAPI Google Hotels live rate comparison
    ├── AIAssistantModal.jsx         # Grounded Gemini AI prompt builder
    └── BookingModal.jsx             # Reservation & confirmation receipt modal
```

---

## 4. ✦ The Mandatory Judge Feature (§2.2): Guide Availability Clash & Substitute

Judges will test this specific flow during scoring.

### Step-by-Step UI Experience
1. Traveller picks package dates (e.g. `2026-09-24`, 4 days).
2. Traveller selects a guide from the dropdown (e.g., *Ramesh Iyer*).
3. The UI automatically queries `POST /api/guides/check-availability`.
4. If unavailable on *any* date (`is_available: false`):
   - Show a **Rose/Red Alert Box**: *"Selection Refused — Calendar Clash Detected on 2026-09-24"*.
   - Display the **Auto-Selected Substitute Guide Card** matching the exact same language (e.g., Tamil) and specialisation (e.g., Heritage), who is 100% available for all 4 days.
   - Show the **Price Delta** (e.g. `+₹500.00/day` or `-₹200.00/day`).
   - Provide an **"Accept Substitute & Reprice"** CTA button that automatically selects the substitute and updates the live price summary.

---

## 5. Complete Backend REST API Reference

The backend runs on `http://localhost:8000`. In `vite.config.js`, all `/api` requests are proxied to `http://localhost:8000`.

### 5.1 Catalog Endpoints

#### `GET /api/catalog/packages`
* **Query Params:**
  * `city_id` (optional, string): e.g. `cty_d4f5e3a5`
  * `theme` (optional, string): `heritage`, `adventure`, `food_trail`, `wildlife`, `pilgrimage`, `honeymoon`
  * `language_bcp47` (optional, string): `ta`, `hi`, `te`, `kn`, `mr`, `bn`, `en`
* **Response (JSON):**
```json
{
  "total": 60,
  "language_filter": "ta",
  "language_notice": "No direct packages available in 'ta'. Displaying all recommended packages.",
  "packages": [
    {
      "package_id": "pkg_2d89ae17",
      "city_id": "cty_d4f5e3a5",
      "city_name": "Tirupati",
      "name": "Tirupati Honeymoon — 4 Days",
      "theme": "honeymoon",
      "tier": "deluxe",
      "duration_days": 4,
      "duration_nights": 3,
      "base_price": "28312.56",
      "currency": "INR",
      "languages_offered": "te,en-IN,kn",
      "description": "A 4-day honeymoon itinerary based in Tirupati."
    }
  ]
}
```

#### `GET /api/catalog/packages/{package_id}`
* **Response (JSON):**
```json
{
  "package": {
    "package_id": "pkg_2d89ae17",
    "name": "Tirupati Honeymoon — 4 Days",
    "city_id": "cty_d4f5e3a5",
    "city_name": "Tirupati",
    "city_lat": 13.6288,
    "city_lng": 79.4192,
    "base_price": "28312.56",
    "currency": "INR",
    "duration_days": 4
  },
  "components": [
    {
      "component_id": "cmp_a6960d70",
      "title": "Deluxe Room — 3 Nights",
      "component_type": "hotel",
      "swap_group": "hotel_tier",
      "day_index": 1,
      "price_delta": "0.00",
      "currency": "INR",
      "is_optional": 0
    }
  ],
  "swap_groups": [
    {
      "swap_group": "hotel_tier",
      "component_type": "hotel",
      "options": [
        { "component_id": "cmp_a6960d70", "title": "Deluxe Room", "price_delta": "0.00" },
        { "component_id": "cmp_b7821c81", "title": "Luxury Suite", "price_delta": "4500.00" }
      ]
    }
  ],
  "available_guides": [
    {
      "guide_id": "gd_8708c909",
      "display_name": "Ramesh Iyer",
      "specialisation": "heritage",
      "languages": "ta,en-IN,hi",
      "rating": 4.9,
      "day_rate": "2500.00",
      "currency": "INR"
    }
  ]
}
```

#### `GET /api/catalog/cities`
* **Response:** Array of city objects `[{ "city_id": "cty_...", "name": "Bengaluru", "lat": 12.9716, "lng": 77.5946, "package_count": 8 }, ...]`

#### `GET /api/catalog/guides`
* **Query Params:** `city_id`, `language`, `specialisation`
* **Response:** `{ "total": 12, "guides": [...] }`

---

### 5.2 Live Repricing Engine

#### `POST /api/pricing/reprice`
* **Payload:**
```json
{
  "package_id": "pkg_2d89ae17",
  "selected_component_ids": ["cmp_a6960d70", "cmp_c34918ef"],
  "guide_id": "gd_8708c909",
  "start_date": "2026-09-24",
  "duration_days": 4
}
```
* **Response:**
```json
{
  "package_id": "pkg_2d89ae17",
  "package_name": "Tirupati Honeymoon — 4 Days",
  "currency": "INR",
  "base_price": "28312.56",
  "components_delta_total": "4500.00",
  "guide_cost": "10000.00",
  "total_price": "42812.56",
  "duration_days": 4,
  "line_items": [
    {
      "component_id": "cmp_a6960d70",
      "title": "Luxury Suite",
      "price_delta": "4500.00",
      "currency": "INR"
    }
  ],
  "guide_detail": {
    "guide_id": "gd_8708c909",
    "guide_name": "Ramesh Iyer",
    "day_rate": "2500.00",
    "days": 4,
    "price_multiplier": "1.00",
    "total_guide_cost": "10000.00"
  }
}
```

---

### 5.3 Guide Availability & Substitute Engine

#### `POST /api/guides/check-availability`
* **Payload:**
```json
{
  "guide_id": "gd_8708c909",
  "start_date": "2026-09-24",
  "duration_days": 4,
  "package_id": "pkg_2d89ae17",
  "city_id": "cty_d4f5e3a5",
  "preferred_language": "ta"
}
```
* **Response (When Unavailable / Clash):**
```json
{
  "is_available": false,
  "guide_id": "gd_8708c909",
  "guide_name": "Ramesh Iyer",
  "clashing_date": "2026-09-24",
  "message": "Guide Ramesh Iyer is unavailable on 2026-09-24.",
  "substitute_guide": {
    "guide_id": "gd_14569a12",
    "display_name": "Sundaram Balan",
    "specialisation": "heritage",
    "languages": "ta,en-IN",
    "rating": 4.8,
    "day_rate": "2200.00",
    "currency": "INR",
    "price_delta": "-300.00"
  }
}
```

---

### 5.4 Grounded AI Trip Builder

#### `POST /api/ai/build-trip`
* **Payload:**
```json
{
  "user_prompt": "I want a 4-day heritage tour in Bengaluru with a Tamil speaking guide under 35000",
  "max_budget": 35000,
  "duration_days": 4,
  "preferred_language": "ta"
}
```
* **Response:**
```json
{
  "status": "success",
  "grounded": true,
  "user_prompt": "I want a 4-day heritage tour in Bengaluru with a Tamil speaking guide under 35000",
  "package": {
    "package_id": "pkg_2d89ae17",
    "name": "Bengaluru Heritage & Royal Trail",
    "base_price": "28312.56",
    "theme": "heritage"
  },
  "reprice_summary": {
    "total_price": "32812.56",
    "currency": "INR"
  },
  "ai_explanation": "Selected the Bengaluru Heritage Trail matching your request for cultural immersion and allocated a certified Tamil guide within your ₹35,000 budget."
}
```

---

### 5.5 External Integrations (Real-World Supply)

#### `GET /api/external/hotels?query=Bengaluru`
* Returns real-time market rates from Google Hotels via cached SerpAPI.

#### `GET /api/external/attractions?lat=12.9716&lng=77.5946&radius_meters=3000`
* Returns landmark attractions from OpenTripMap within the selected radius.

---

### 5.6 Booking Confirmation

#### `POST /api/bookings`
* **Payload:**
```json
{
  "package_id": "pkg_2d89ae17",
  "user_id": "usr_guest_demo",
  "selected_component_ids": ["cmp_a6960d70"],
  "idempotency_key": "idemp_abc12345",
  "guide_id": "gd_8708c909",
  "start_date": "2026-09-24",
  "party_size": 2,
  "notes": "Passenger: Divyansh Duggad (divyansh@example.com, +91 9876543210)"
}
```
* **Response:**
```json
{
  "status": "success",
  "booking_id": "bkg_a1b2c3d4",
  "confirmation_code": "TC-2026-9812",
  "total_price": "42812.56",
  "currency": "INR"
}
```

---

## 6. How to Run Frontend Locally

```bash
# In terminal 1 (Backend):
cd backend
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload

# In terminal 2 (Frontend):
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 7. Key Guardrails to Remember
1. **Zero Floats for Money:** Prices are strings from the backend. Display them formatted with `.toLocaleString('en-IN')`. Never perform floating-point math client-side.
2. **Mandatory Date Clash Feature:** Ensure the clashing date is clearly highlighted in red/rose when a guide is unavailable.
3. **Responsive Mobile View:** Test with DevTools Mobile View (iPhone 14 / Pixel 7) to ensure no horizontal overflow.

*Let's build a winning submission! Reach out to Divyansh for any backend logic or custom endpoints.*
