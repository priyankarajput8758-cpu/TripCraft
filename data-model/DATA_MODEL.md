# Data Model Documentation — PS-04 Dynamic Tour Packages (TripCraft / PackagePro)

## 1. Overview & Canonical Conformance

TripCraft strictly conforms to the **KogniVera Hackathon 2026 Shared Travel Data Model (v1.1.0-rc1)**. The canonical schema and initial seed data are housed in `data/PS-04.db` (SQLite) and `data/csv/`.

### The 8 Foundational Rules (R1–R8)

| Rule | Requirement | Backend Enforcement |
|---|---|---|
| **R1 (Additive Only)** | Never rename, drop, or repurpose a canonical field or table. | All original 21 tables remain strictly intact. Any new requirements are introduced via additive tables. |
| **R2 (Opaque String IDs)** | IDs are opaque prefixed strings (`pkg_...`, `gui_...`, `cmp_...`, `sel_...`), never integers, never parsed for logic. | Handled as strings throughout database, models, and API responses. |
| **R3 (Decimal Money)** | Money is a pair: 2-place Decimal + ISO-4217 currency. Never a float. | Python `decimal.Decimal` engine used for all price recalculations from scratch. Serialized as strings over JSON. |
| **R4 (ISO-8601 Timestamps)** | `_at` fields have timezone offsets; `_date` fields are zoneless calendar dates (`YYYY-MM-DD`). | Python `datetime.now(timezone.utc).isoformat()` used across writes. |
| **R5 (Enums)** | Lowercase snake_case values validated against `data/enums.json`. | Pydantic and SQL schema validation. |
| **R6 (BCP-47 Languages)** | Languages are stored as BCP-47 tags (`ta`, `hi`, `en-IN`), never free-form names. | Server-side matching against `languages.bcp47` and comma-separated tags. |
| **R7 (WGS-84 Geography)** | 6-decimal-place latitude and longitude coordinates paired together. | Validated in Leaflet and OpenTripMap integrations. |
| **R8 (Soft Deletion)** | Rows maintain `status` and `updated_at`; no hard deletes. | State transitions (`active`, `cancelled`, `replaced`). |

---

## 2. Canonical Tables Used

| Table | Grain / Purpose | Role in PS-04 |
|---|---|---|
| `tour_packages` | Curated package definitions with base price, theme, duration, languages | Core browse & AI builder catalog |
| `package_components` | Swappable component lines with signed `price_delta` and `swap_group` | Swappable hotel tiers, activities, transfers |
| `tour_guides` | Local guide supply with languages, specialisations, day & half-day rates | First-class selectable tour-guide component |
| `guide_availability` | 30-day availability calendar with slots and `price_multiplier` | Mandatory Guide Availability Check & Peak Pricing |
| `user_preferences` | User profile with UI locale & `guide_language` BCP-47 | Multilingual filtering & personalized recommendations |
| `users` | Traveller identities and loyalty tiers | User context for preferences & bookings |
| `trips` | Trip container with origin/destination cities, dates, party size | Date range anchor for guide availability |
| `itineraries` | Versioned travel plans belonging to trips | Dynamic customized itinerary versions |
| `itinerary_items` | Individual stops, activities, and transfers in a day | Day-by-day customized schedule |
| `bookings` | Confirmed bookings with mandatory `idempotency_key` | Terminal checkout and booking action |
| `cities` | Geographic anchors with season profiles and primary languages | Map centers, destination filtering |
| `hotels` | Rich property metadata, star ratings, and coordinates | Accommodation component resolution |
| `hotel_room_types` | Room categories and base rates | Detailed room swap options |
| `hotel_media` | Image assets and alt text | Visual display of properties |
| `transfers` | Airport and intercity legs with costs and carbon metrics | Transport swapping |
| `categories` | Shared taxonomy for POI, themes, and expense types | Package theme filtering |
| `languages` | BCP-47 catalog with native names and scripts | Language validation and UI localization |
| `currencies` | ISO-4217 definitions and minor unit exponents | Multi-currency formatting |
| `price_history` | Dynamic pricing explanations and demand indices | Dynamic pricing audit trail |
| `amenities` | Property feature references | Accommodation filtering |

---

## 3. Additive Schema Extensions

### `package_selections`
The canonical `package_components` table is a **catalog of available options** with `swap_group` relations, but does not store an individual user's active choices during a customization session. `package_selections` provides an additive, non-breaking persistence layer for traveller choices.

```sql
CREATE TABLE IF NOT EXISTS package_selections (
  selection_id                 TEXT PRIMARY KEY,       -- sel_ prefixed opaque string (R2)
  package_id                   TEXT NOT NULL,          -- FK -> tour_packages(package_id)
  component_id                 TEXT NOT NULL,          -- FK -> package_components(component_id)
  swap_group                   TEXT NOT NULL,          -- component swap group identifier
  trip_id                      TEXT,                   -- optional FK -> trips(trip_id)
  itinerary_id                 TEXT,                   -- optional FK -> itineraries(itinerary_id)
  user_id                      TEXT,                   -- optional FK -> users(user_id)
  chosen_at                    TEXT NOT NULL,          -- ISO-8601 with offset (R4)
  status                       TEXT NOT NULL DEFAULT 'active', -- soft status (R8)
  updated_at                   TEXT NOT NULL,          -- ISO-8601 with offset (R4)
  FOREIGN KEY (package_id) REFERENCES tour_packages(package_id),
  FOREIGN KEY (component_id) REFERENCES package_components(component_id)
);
```
