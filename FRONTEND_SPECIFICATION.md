# TripCraft (PackagePro) — Complete Frontend Specification & API Reference

> **Document Version:** v2.0.0-final  
> **Prepared for:** Priyanka Rajput (Frontend & UI Lead) & Team CodeBlooded (BMS College of Engineering)  
> **Prepared by:** Divyansh Duggad (Lead, Backend & AI)  
> **Event:** KogniVera Hackathon 2026 · Problem Statement **PS-04 (Dynamic Tour Packages)**  
> **Build Window:** 24 Sep 2026, 09:00 AM IST → 25 Sep 2026, 09:00 AM IST (24 Hours)  
> **Backend Base URL:** `http://localhost:8000/api` (Interactive Swagger Docs: `http://localhost:8000/docs`)  
> **Frontend Port:** `http://localhost:5173` (Vite Proxy configured for `/api` → `http://localhost:8000`)  

---

## Table of Contents
1. [Executive Summary & Core User Journeys](#1-executive-summary--core-user-journeys)
2. [Design System, Colors & UI/UX Guidelines](#2-design-system-colors--uiux-guidelines)
3. [Component Architecture & Directory Layout](#3-component-architecture--directory-layout)
4. [✦ Mandatory Judge Feature (§2.2): Guide Availability Clash & Substitute Flow](#4--mandatory-judge-feature-22-guide-availability-clash--substitute-flow)
5. [Complete REST API Contract & Request/Response JSON Schemas](#5-complete-rest-api-contract--requestresponse-json-schemas)
   - [5.1 Catalog APIs](#51-catalog-apis)
   - [5.2 Live Repricing Engine (Zero-Float Decimal Math)](#52-live-repricing-engine-zero-float-decimal-math)
   - [5.3 Guide Availability & Substitution Engine](#53-guide-availability--substitution-engine)
   - [5.4 Grounded AI Trip Builder & Itinerary Synthesizer](#54-grounded-ai-trip-builder--itinerary-synthesizer)
   - [5.5 External Supply & Real-World Integrations (SerpAPI, OpenTripMap, Azure Translator)](#55-external-supply--real-world-integrations)
   - [5.6 Bookings & Idempotency Store](#56-bookings--idempotency-store)
6. [Interactive Leaflet & OpenStreetMap Integration](#6-interactive-leaflet--openstreetmap-integration)
7. [Multilingual Translation Engine (Microsoft Azure Translator v3.0)](#7-multilingual-translation-engine-microsoft-azure-translator-v30)
8. [Frontend State Management & Application Workflows](#8-frontend-state-management--application-workflows)
9. [Verification, Testing & Production Build](#9-verification-testing--production-build)

---

## 1. Executive Summary & Core User Journeys

**TripCraft** (deck name: *PackagePro*) assembles dynamic, customisable tour packages tailored to traveller preferences, budget, and travel style, with zero-float decimal pricing that updates live as components are modified.

### Two Core Interactive Modes:
1. **Mode A — Curated Packages Customizer:**
   - Browse catalog packages filtered by Indian language (`ta`, `hi`, `te`, `kn`, `mr`, `bn`, `en`), theme (*heritage, adventure, food_trail, wildlife, pilgrimage, honeymoon*), and tier (*budget, standard, deluxe, luxury*).
   - Customize hotel tiers, day-wise activities, transfers, and guides.
   - Live recalculation of price deltas (`+₹X` / `-₹Y`), total package price, taxes (5% GST), and dynamic itinerary.
2. **Mode B — Custom Destination Architect (Any City / 90km Radius):**
   - Enter any destination in India or worldwide (e.g. *Chikmagalur, Ooty, Hampi, Coorg, Munnar, Manali, Goa*).
   - Explores tourist spots, viewpoints, historic sites, and adventures up to **90km search radius** using OpenTripMap.
   - Interactive Leaflet map with geocoded pins and rich spot detail modal (cover photography, distance, description).
   - **Day-Wise Multi-Select Experience Matrix:** Select multiple experiences per day (checkboxes) and choose hotel tiers or live Google Hotels (radio/picker).
   - **Grounded Gemini AI Synthesis:** Evaluates pace preference (*relaxed, balanced, packed*), automatically fills itinerary schedule voids, resolves timing/transit conflicts (e.g., separating overlapping sunset spots), optimizes midweek hotel surges, attaches cover imagery, and computes itemized Decimal pricing.

---

## 2. Design System, Colors & UI/UX Guidelines

We use a modern, dark-mode glassmorphism interface built with **Tailwind CSS** and **Lucide React Icons**.

### 2.1 Color Palette
* **Canvas Background:** `#090d16` (Deep Midnight Slate `bg-slate-950`)
* **Card & Modal Surfaces:** `#0f172a` (Slate-900 `bg-slate-900/90`) with `border-slate-800`
* **Primary Brand Accent:** Teal-500 (`#14b8a6`) to Emerald-500 (`#10b981`) gradients
* **Live Real-World Supply / SerpAPI:** Amber-400 (`#fbbf24`) with `border-amber-500/40`
* **Mandatory Clash Refusal:** Rose-500 (`#f43f5e`) with Rose-950 (`#881337`)
* **Verified / Optimizations:** Emerald-400 (`#34d399`)
* **Monospace Financial Figures:** `font-mono text-teal-400 font-bold`

### 2.2 Financial Number Rule (Strict R3 & §9 Conformance)
* **Never use JavaScript `float` operations for currency math.**
* Prices over the wire are serialized as 2-place decimal strings (e.g., `"28312.56"`).
* Format displaying amounts using `₹${parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` or direct string rendering.
* Clearly show baseline/included items as `Included (+₹0)` and alternative options with their signed delta (e.g., `+₹4,500.00` or `-₹1,200.00`).

### 2.3 Mobile-First Responsiveness
* Touch targets must be at least `44px` height/width.
* Grid system: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
* Mobile sticky price summary bar on small viewports so travellers always see their grand total.

---

## 3. Component Architecture & Directory Layout

```
frontend/
├── public/
│   ├── logo.png                     # Official TripCraft Brand Icon
│   └── favicon.ico
├── src/
│   ├── api.js                       # Centralized REST API Service (all endpoints)
│   ├── i18n.js                      # Instant Multi-language Travel Dictionary
│   ├── App.jsx                      # Root Application Controller & View Router
│   ├── main.jsx                     # Vite DOM Mount
│   ├── index.css                    # Tailwind CSS Directives & Leaflet Styling
│   └── components/
│       ├── Navbar.jsx               # Brand, Language Switcher, View Switcher, AI Planner, Live Toggle
│       ├── CustomizerStudio.jsx     # Curated Package Swapping Studio, Guide Integration & Price Card
│       ├── DestinationExplorer.jsx  # Custom Destination Architect (90km Radius, Leaflet, Matrix, Gemini)
│       ├── GuideSelector.jsx        # Local Guide Selection & Mandatory Clash Refusal Flow (§2.2)
│       ├── TripMap.jsx              # Leaflet Interactive Map for Curated Package Coordinates
│       ├── AIAssistantModal.jsx     # Grounded Gemini Natural Language Trip Builder Modal
│       └── BookingModal.jsx         # Booking Confirmation, Idempotency Token & Printable Receipt
```

---

## 4. ✦ Mandatory Judge Feature (§2.2): Guide Availability Clash & Substitute Flow

**Judges will verify this exact flow during hackathon scoring:**
1. Traveller picks package travel dates (e.g. `2026-09-24`, 4 days).
2. Traveller selects a guide from the dropdown (e.g., *Ramesh Iyer*).
3. The frontend calls `POST /api/guides/check-availability`.
4. If unavailable on *any* day (`is_available: false`):
   - **Refusal Alert Banner:** Display a prominent Rose-500 container:
     > ⚠️ *"Selection Refused — Calendar Clash Detected on 2026-09-24. Ramesh Iyer is unavailable on this date."*
   - **Substitute Recommendation:** Automatically displays the top recommended substitute guide who matches the **same language (e.g., Tamil)** and **same specialisation (e.g., Heritage)** and is 100% available for all package dates.
   - **Price Delta Display:** Shows rate difference (e.g. `+₹500.00/day` or `-₹200.00/day`).
   - **One-Click Accept:** An *"Accept Substitute Guide & Reprice"* button replaces the selection and recalculates the grand total live.

---

## 5. Complete REST API Contract & Request/Response JSON Schemas

All endpoints return HTTP 200 with standard JSON responses.

### 5.1 Catalog APIs

#### `GET /api/catalog/packages`
* **Query Parameters:**
  * `city_id` (string, optional): e.g. `cty_d4f5e3a5`
  * `theme` (string, optional): `heritage`, `adventure`, `food_trail`, `wildlife`, `pilgrimage`, `honeymoon`
  * `tier` (string, optional): `budget`, `standard`, `deluxe`, `luxury`
  * `language_bcp47` (string, optional): `ta`, `hi`, `te`, `kn`, `mr`, `bn`, `en`
* **Response:**
```json
{
  "total": 60,
  "language_filter": "ta",
  "language_notice": null,
  "packages": [
    {
      "package_id": "pkg_2d89ae17",
      "city_id": "cty_d4f5e3a5",
      "city_name": "Tirupati",
      "name": "Tirupati Heritage & Temple Trail",
      "theme": "heritage",
      "tier": "deluxe",
      "duration_days": 4,
      "duration_nights": 3,
      "base_price": "28312.56",
      "currency": "INR",
      "languages_offered": "te,ta,en-IN,kn",
      "description": "A 4-day heritage itinerary exploring spiritual and cultural landmarks."
    }
  ]
}
```

#### `GET /api/catalog/packages/{package_id}`
* **Response:**
```json
{
  "package": {
    "package_id": "pkg_2d89ae17",
    "name": "Tirupati Heritage & Temple Trail",
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
      "title": "Deluxe Heritage Suite — 3 Nights",
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
        { "component_id": "cmp_a6960d70", "title": "Deluxe Heritage Suite", "price_delta": "0.00" },
        { "component_id": "cmp_b7821c81", "title": "Presidential Palace Villa", "price_delta": "4500.00" }
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
* **Response:** Array of destination cities `[{ "city_id": "cty_d4f5e3a5", "name": "Tirupati", "state": "Andhra Pradesh", "lat": 13.6288, "lng": 79.4192, "package_count": 4 }, ...]`

---

### 5.2 Live Repricing Engine (Zero-Float Decimal Math)

#### `POST /api/pricing/reprice`
* **Request Body:**
```json
{
  "package_id": "pkg_2d89ae17",
  "selected_component_ids": ["cmp_b7821c81", "cmp_c34918ef"],
  "guide_id": "gd_8708c909",
  "start_date": "2026-09-24",
  "duration_days": 4
}
```
* **Response:**
```json
{
  "package_id": "pkg_2d89ae17",
  "base_price": "28312.56",
  "component_deltas_total": "4500.00",
  "guide_cost": "10000.00",
  "subtotal": "42812.56",
  "tax_amount": "2140.63",
  "total_price": "44953.19",
  "currency": "INR",
  "breakdown": {
    "base_package": "28312.56",
    "swaps": [
      { "component_id": "cmp_b7821c81", "title": "Presidential Palace Villa", "price_delta": "4500.00" }
    ],
    "guide": {
      "guide_id": "gd_8708c909",
      "name": "Ramesh Iyer",
      "days": 4,
      "base_day_rate": "2500.00",
      "peak_multiplier": "1.00",
      "total": "10000.00"
    },
    "tax_gst_rate": "0.05",
    "tax_gst_amount": "2140.63"
  }
}
```

---

### 5.3 Guide Availability & Substitution Engine

#### `POST /api/guides/check-availability`
* **Request Body:**
```json
{
  "guide_id": "gd_8708c909",
  "start_date": "2026-09-24",
  "duration_days": 4,
  "required_language": "ta",
  "required_specialisation": "heritage"
}
```
* **Response (When Clash Occurs):**
```json
{
  "guide_id": "gd_8708c909",
  "guide_name": "Ramesh Iyer",
  "is_available": false,
  "clashing_dates": ["2026-09-24"],
  "first_clashing_date": "2026-09-24",
  "reason": "Ramesh Iyer is marked unavailable on 2026-09-24 (slots: 0).",
  "substitute_guide": {
    "guide_id": "gd_f192aa34",
    "display_name": "Karthik Raja",
    "languages": "ta,en-IN",
    "specialisation": "heritage",
    "rating": 4.85,
    "day_rate": "2400.00",
    "currency": "INR",
    "price_delta_per_day": "-100.00",
    "total_price_delta": "-400.00"
  }
}
```

---

### 5.4 Grounded AI Trip Builder & Itinerary Synthesizer

#### `POST /api/ai/build-trip`
* **Request Body:**
```json
{
  "prompt": "5-day relaxed cultural exploration in South India for family with heritage focus",
  "budget": 50000,
  "duration_days": 5,
  "preferred_language": "ta"
}
```
* **Response:** Selects and customizes the optimal real package from the SQLite catalog with Gemini reasoning and Decimal repricing.

#### `POST /api/ai/synthesize-custom-trip` (Custom Architect)
* **Request Body:**
```json
{
  "destination_name": "Chikmagalur",
  "duration_days": 3,
  "pace_preference": "balanced",
  "external_supply_mode": true,
  "start_date": "2026-09-24",
  "day_selections": [
    {
      "day_number": 1,
      "selected_activities": ["Mullayanagiri Peak Trek", "Coffee Museum Visit"],
      "selected_hotel": { "name": "The Serai Chikmagalur", "price_per_night": 7500.0 }
    },
    {
      "day_number": 2,
      "selected_activities": ["Baba Budangiri Scenic Viewpoint", "Manikyadhara Falls"],
      "selected_hotel": { "name": "The Serai Chikmagalur", "price_per_night": 7500.0 }
    },
    {
      "day_number": 3,
      "selected_activities": ["Bhadra Wildlife Safari"],
      "selected_hotel": { "name": "The Serai Chikmagalur", "price_per_night": 7500.0 }
    }
  ]
}
```
* **Response:**
```json
{
  "status": "success",
  "custom_package": {
    "trip_title": "Custom 3-Day Chikmagalur Explorer",
    "destination": "Chikmagalur",
    "duration_days": 3,
    "pace": "balanced",
    "cover_image": "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1000&q=80",
    "itinerary": [
      {
        "day": 1,
        "title": "Mullayanagiri Ascent & Coffee Heritage",
        "slots": [
          {
            "time": "08:30 AM - 12:00 PM",
            "title": "Mullayanagiri Peak Trek",
            "type": "trek",
            "image_url": "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80",
            "description": "Morning climb to Karnataka's highest peak with misty panoramic views."
          },
          {
            "time": "01:00 PM - 02:30 PM",
            "title": "Authentic Malnad Cuisine Lunch",
            "type": "dining",
            "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
            "description": "Savor authentic regional flavors including Akki Roti and filter coffee."
          },
          {
            "time": "04:00 PM - 06:30 PM",
            "title": "Coffee Museum & Plantation Walk",
            "type": "cultural",
            "image_url": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
            "description": "Explore the history of coffee processing and aroma cupping."
          }
        ],
        "notes": "Carry light warm clothing and comfortable hiking boots for the morning trek."
      }
    ],
    "ai_optimizations": {
      "conflicts_resolved": [
        "Sequenced Mullayanagiri in the early morning to avoid peak heat and fog density."
      ],
      "voids_filled": [
        "Added Malnad traditional dining and Coffee Museum to balance Day 1 schedule."
      ],
      "cost_optimization_tip": "Booking Chikmagalur resorts on Tuesday–Thursday yields up to 20% lower tariffs compared to weekend dates."
    },
    "estimated_pricing": {
      "hotel_total": "22500.00",
      "activities_total": "4500.00",
      "transfers_total": "4200.00",
      "gst_tax": "1560.00",
      "grand_total": "32760.00",
      "currency": "INR"
    }
  }
}
```

---

### 5.5 External Supply & Real-World Integrations

#### `GET /api/external/explore-destination`
* **Query Parameters:**
  * `query` (string, required): e.g. `Chikmagalur`
  * `radius_meters` (int, default `15000`, up to `100000` / 100km): Search radius
* **Response:** Geocodes destination coordinates and returns up to 30 categorized attractions with distance, ratings, and coordinates:
```json
{
  "query": "Chikmagalur",
  "center": { "lat": 13.3153, "lng": 75.7754 },
  "radius_km": 15,
  "count": 12,
  "attractions": [
    {
      "xid": "N123456",
      "name": "Mullayanagiri Peak",
      "category": "Historic & Nature",
      "lat": 13.3912,
      "lng": 75.7214,
      "dist_meters": 7800,
      "dist_formatted": "7.8 km",
      "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      "short_desc": "The highest peak in Karnataka, offering breathtaking trekking trails and sunset viewpoints."
    }
  ]
}
```

#### `GET /api/external/attraction-detail`
* **Query Parameters:** `xid` (string), `lang` (string)
* **Response:** Returns high-resolution image, full description, and Wikipedia extract.

#### `GET /api/external/hotels` (Live SerpAPI Google Hotels)
* **Query Parameters:** `query`, `check_in_date`, `check_out_date`, `currency`
* **Response:** Live real-world Google Hotels rates, star ratings, and direct booking links.

#### `POST /api/external/translate` (Microsoft Azure Translator v3.0)
* **Request Body:**
```json
{
  "text": "Welcome to your customized tour package",
  "target_lang": "hi",
  "source_lang": "en"
}
```
* **Response:**
```json
{
  "translated_text": "आपके कस्टमाइज़्ड टूर पैकेज में आपका स्वागत है",
  "source": "azure_translator_v3",
  "target_lang": "hi"
}
```

#### `POST /api/external/translate-batch` (Batch Azure Translator)
* **Request Body:**
```json
{
  "texts": ["Heritage Tour", "Local Guide", "Book Now", "Live Repricing"],
  "target_lang": "ta",
  "source_lang": "en"
}
```
* **Response:**
```json
{
  "translations": [
    "பாரம்பரிய சுற்றுலா",
    "உள்ளூர் வழிகாட்டி",
    "இப்போது முன்பதிவு செய்யுங்கள்",
    "நேரலை விலை மறுமதிப்பீடு"
  ],
  "target_lang": "ta",
  "count": 4
}
```

---

### 5.6 Bookings & Idempotency Store

#### `POST /api/bookings/`
* **Request Body:**
```json
{
  "package_id": "pkg_2d89ae17",
  "user_id": "usr_99f3a1b2",
  "selected_component_ids": ["cmp_b7821c81", "cmp_c34918ef"],
  "guide_id": "gd_8708c909",
  "start_date": "2026-09-24",
  "duration_days": 4,
  "guest_name": "Priyanka Rajput",
  "guest_email": "priyanka@tripcraft.app",
  "guest_phone": "+91 98765 43210",
  "idempotency_key": "idemp_tok_991823a"
}
```
* **Response:** Confirmed reservation object with immutable receipt ID (`bkg_71a92e10`), final Decimal grand total, and payment status `confirmed`.

---

## 6. Interactive Leaflet & OpenStreetMap Integration

To prevent blank canvas or bundling issues in Vite:
1. **Direct ES Module Imports:**
```javascript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
```
2. **Default Marker Icon Fix:**
```javascript
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
```
3. **Container Dimensioning:** Wrap map canvas inside a parent with explicit height (e.g., `h-[420px] w-full rounded-2xl overflow-hidden relative z-10`). Call `map.invalidateSize()` if rendered inside dynamic tabs.

---

## 7. Multilingual Translation Engine (Microsoft Azure Translator v3.0)

1. **Storage & State:** Selected language code is persisted in browser `localStorage.getItem('tripcraft_lang') || 'en'`.
2. **Instant UI Translations:** Synchronous zero-latency lookup via `src/i18n.js` for common terms (English, Tamil, Hindi, Telugu, Kannada, Marathi, Bengali).
3. **Dynamic Cloud Translation:** For arbitrary API content or AI synthesis text, use `POST /api/external/translate-batch` or `POST /api/external/translate`.
4. **Server-Side Catalog Filtering:** Passing `language_bcp47` in `GET /api/catalog/packages` and `GET /api/catalog/guides` filters available items server-side.

---

## 8. Frontend State Management & Application Workflows

```
                                 [ Navbar.jsx ]
                               /               \
                 [ Mode: Curated ]          [ Mode: Custom Architect ]
                        |                                |
              [ CustomizerStudio.jsx ]        [ DestinationExplorer.jsx ]
              - Package Selection             - 90km Radius OpenTripMap
              - Hotel Tier Swaps              - Interactive Leaflet Pins
              - Activity Checkboxes           - Day Matrix Multi-Selector
              - Guide Availability (§2.2)     - Google Hotels Integration
                        \                                /
                         \                              /
                          v                            v
             [ POST /api/pricing/reprice ]    [ POST /api/ai/synthesize-custom-trip ]
                                  \                  /
                                   v                v
                                   [ BookingModal.jsx ]
                                   - Idempotency Key
                                   - Confirmed Receipt
```

---

## 9. Verification, Testing & Production Build

### Automated Test Suite Run
```bash
pytest tests/ -v
```
*Runs all 11 automated pytest suites in ~25s, including Decimal math precision, Guide Availability clash refusal & substitute matching, and Azure Translator.*

### Frontend Production Build
```bash
cd frontend
npm run build
```
*Builds optimized production bundle in `frontend/dist/` in ~6s.*

### Running Full-Stack Dev Environment
* **Backend:** `uvicorn src.main:app --reload --port 8000`
* **Frontend:** `npm run dev` (running on `http://localhost:5173`)
