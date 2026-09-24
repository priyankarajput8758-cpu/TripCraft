-- KV Hackathon 2026 · PS-04 Dynamic Tour Packages (TripCraft / PackagePro)
-- Data Model v1.1.0-rc1 + Additive Extensions

PRAGMA foreign_keys = ON;

-- 1. amenities (Reference & geography)
CREATE TABLE IF NOT EXISTS amenities (
  amenity_id                   TEXT PRIMARY KEY,
  code                         TEXT NOT NULL UNIQUE,
  label                        TEXT NOT NULL,
  amenity_group                TEXT NOT NULL,
  icon_hint                    TEXT,
  updated_at                   TEXT NOT NULL
);

-- 2. categories (Reference & geography)
CREATE TABLE IF NOT EXISTS categories (
  category_id                  TEXT PRIMARY KEY,
  code                         TEXT NOT NULL UNIQUE,
  label                        TEXT NOT NULL,
  parent_category_id           TEXT,
  applies_to                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
);

-- 3. currencies (Reference & geography)
CREATE TABLE IF NOT EXISTS currencies (
  currency_id                  TEXT PRIMARY KEY,
  iso4217                      TEXT NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  symbol                       TEXT NOT NULL,
  minor_unit_exponent          INTEGER NOT NULL,
  display_locale               TEXT NOT NULL,
  updated_at                   TEXT NOT NULL
);

-- 4. languages (Reference & geography)
CREATE TABLE IF NOT EXISTS languages (
  language_id                  TEXT PRIMARY KEY,
  bcp47                        TEXT NOT NULL UNIQUE,
  english_name                 TEXT NOT NULL,
  native_name                  TEXT NOT NULL,
  script                       TEXT NOT NULL,
  rtl                          INTEGER NOT NULL,
  tts_supported                INTEGER NOT NULL,
  updated_at                   TEXT NOT NULL
);

-- 5. price_history (Availability & pricing)
CREATE TABLE IF NOT EXISTS price_history (
  history_id                   TEXT PRIMARY KEY,
  entity_type                  TEXT NOT NULL,
  entity_id                    TEXT NOT NULL,
  effective_date               TEXT NOT NULL,
  price                        TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  baseline_price               TEXT NOT NULL,
  demand_index                 NUMERIC(6,3) NOT NULL,
  occupancy_pct                NUMERIC(5,2) NOT NULL,
  lead_time_factor             NUMERIC(6,3) NOT NULL,
  seasonality_factor           NUMERIC(6,3) NOT NULL,
  event_factor                 NUMERIC(6,3) NOT NULL,
  competitor_factor            NUMERIC(6,3) NOT NULL,
  bound_clamped                INTEGER NOT NULL,
  explanation                  TEXT NOT NULL,
  computed_at                  TEXT NOT NULL,
  FOREIGN KEY (currency) REFERENCES currencies(iso4217),
  UNIQUE (entity_type, entity_id, effective_date)
);

-- 6. countries (Reference & geography)
CREATE TABLE IF NOT EXISTS countries (
  country_id                   TEXT PRIMARY KEY,
  iso2                         TEXT NOT NULL UNIQUE,
  iso3                         TEXT NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  default_currency             TEXT NOT NULL,
  calling_code                 TEXT NOT NULL,
  region                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (default_currency) REFERENCES currencies(iso4217)
);

-- 7. cities (Reference & geography)
CREATE TABLE IF NOT EXISTS cities (
  city_id                      TEXT PRIMARY KEY,
  name                         TEXT NOT NULL,
  state                        TEXT,
  country_id                   TEXT NOT NULL,
  country_code                 TEXT NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  timezone                     TEXT NOT NULL,
  region                       TEXT NOT NULL,
  population                   INTEGER,
  season_profile               TEXT NOT NULL,
  peak_months                  TEXT NOT NULL,
  primary_language             TEXT NOT NULL,
  description                  TEXT,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (country_id) REFERENCES countries(country_id),
  FOREIGN KEY (primary_language) REFERENCES languages(bcp47)
);

-- 8. hotels (Supply & catalogue)
CREATE TABLE IF NOT EXISTS hotels (
  hotel_id                     TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  property_type                TEXT NOT NULL,
  star_rating                  INTEGER NOT NULL,
  guest_score                  NUMERIC(2,1),
  review_count                 INTEGER NOT NULL,
  address_line                 TEXT NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  distance_to_centre_km        NUMERIC(6,2) NOT NULL,
  description                  TEXT NOT NULL,
  base_currency                TEXT NOT NULL,
  checkin_time                 TEXT NOT NULL,
  checkout_time                TEXT NOT NULL,
  chain_code                   TEXT,
  has_xr_scene                 INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (base_currency) REFERENCES currencies(iso4217)
);

-- 9. tour_guides (Supply & catalogue)
CREATE TABLE IF NOT EXISTS tour_guides (
  guide_id                     TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  display_name                 TEXT NOT NULL,
  languages                    TEXT NOT NULL,
  specialisation               TEXT NOT NULL,
  secondary_specialisation     TEXT,
  years_experience             INTEGER NOT NULL,
  rating                       NUMERIC(2,1),
  review_count                 INTEGER NOT NULL,
  day_rate                     TEXT NOT NULL,
  half_day_rate                TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  certified                    INTEGER NOT NULL,
  bio                          TEXT NOT NULL,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- 10. tour_packages (Supply & catalogue)
CREATE TABLE IF NOT EXISTS tour_packages (
  package_id                   TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  theme                        TEXT NOT NULL,
  tier                         TEXT NOT NULL,
  duration_days                INTEGER NOT NULL,
  duration_nights              INTEGER NOT NULL,
  base_price                   TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  min_group_size               INTEGER NOT NULL,
  max_group_size               INTEGER NOT NULL,
  difficulty                   TEXT NOT NULL,
  languages_offered            TEXT NOT NULL,
  inclusions                   TEXT NOT NULL,
  exclusions                   TEXT NOT NULL,
  description                  TEXT NOT NULL,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- 11. transfers (Supply & catalogue)
CREATE TABLE IF NOT EXISTS transfers (
  transfer_id                  TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  from_label                   TEXT NOT NULL,
  to_label                     TEXT NOT NULL,
  mode                         TEXT NOT NULL,
  duration_minutes             INTEGER NOT NULL,
  distance_km                  NUMERIC(7,3) NOT NULL,
  cost                         TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  carbon_kg                    NUMERIC(8,3) NOT NULL,
  capacity_pax                 INTEGER NOT NULL,
  accessible                   INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(city_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- 12. users (Identity & preference)
CREATE TABLE IF NOT EXISTS users (
  user_id                      TEXT PRIMARY KEY,
  display_name                 TEXT NOT NULL,
  email                        TEXT NOT NULL UNIQUE,
  home_city_id                 TEXT NOT NULL,
  home_currency                TEXT NOT NULL,
  locale                       TEXT NOT NULL,
  budget_band                  TEXT NOT NULL,
  travel_style                 TEXT NOT NULL,
  traveller_type               TEXT NOT NULL,
  segment                      TEXT NOT NULL,
  date_of_signup               TEXT NOT NULL,
  loyalty_tier                 TEXT,
  status                       TEXT NOT NULL,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (home_city_id) REFERENCES cities(city_id),
  FOREIGN KEY (home_currency) REFERENCES currencies(iso4217),
  FOREIGN KEY (locale) REFERENCES languages(bcp47)
);

-- 13. guide_availability (Supply & catalogue)
CREATE TABLE IF NOT EXISTS guide_availability (
  availability_id              TEXT PRIMARY KEY,
  guide_id                     TEXT NOT NULL,
  for_date                     TEXT NOT NULL,
  is_available                 INTEGER NOT NULL,
  slots_available              INTEGER NOT NULL,
  price_multiplier             NUMERIC(4,2) NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (guide_id) REFERENCES tour_guides(guide_id),
  UNIQUE (guide_id, for_date)
);

-- 14. hotel_room_types (Supply & catalogue)
CREATE TABLE IF NOT EXISTS hotel_room_types (
  room_type_id                 TEXT PRIMARY KEY,
  hotel_id                     TEXT NOT NULL,
  name                         TEXT NOT NULL,
  max_occupancy                INTEGER NOT NULL,
  max_adults                   INTEGER NOT NULL,
  max_children                 INTEGER NOT NULL,
  bed_config                   TEXT NOT NULL,
  size_sqm                     INTEGER,
  base_rate                    TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  total_units                  INTEGER NOT NULL,
  smoking_allowed              INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- 15. package_components (Supply & catalogue)
CREATE TABLE IF NOT EXISTS package_components (
  component_id                 TEXT PRIMARY KEY,
  package_id                   TEXT NOT NULL,
  component_type               TEXT NOT NULL,
  entity_type                  TEXT,
  entity_id                    TEXT,
  day_index                    INTEGER NOT NULL,
  slot                         TEXT NOT NULL,
  title                        TEXT NOT NULL,
  quantity                     INTEGER NOT NULL,
  price_delta                  TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  is_optional                  INTEGER NOT NULL,
  is_swappable                 INTEGER NOT NULL,
  swap_group                   TEXT,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (package_id) REFERENCES tour_packages(package_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- 16. trips (Trip & itinerary)
CREATE TABLE IF NOT EXISTS trips (
  trip_id                      TEXT PRIMARY KEY,
  owner_user_id                TEXT NOT NULL,
  title                        TEXT NOT NULL,
  origin_city_id               TEXT,
  destination_city_id          TEXT NOT NULL,
  start_date                   TEXT NOT NULL,
  end_date                     TEXT NOT NULL,
  party_size                   INTEGER NOT NULL,
  adults                       INTEGER NOT NULL,
  children                     INTEGER NOT NULL,
  trip_type                    TEXT NOT NULL,
  is_group_trip                INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  home_currency                TEXT NOT NULL,
  notes                        TEXT,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(user_id),
  FOREIGN KEY (origin_city_id) REFERENCES cities(city_id),
  FOREIGN KEY (destination_city_id) REFERENCES cities(city_id),
  FOREIGN KEY (home_currency) REFERENCES currencies(iso4217)
);

-- 17. user_preferences (Identity & preference)
CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id                TEXT PRIMARY KEY,
  user_id                      TEXT NOT NULL UNIQUE,
  preferred_languages          TEXT NOT NULL,
  guide_language               TEXT,
  interests                    TEXT NOT NULL,
  dietary_flags                TEXT,
  accessibility_needs          TEXT,
  preferred_currency           TEXT NOT NULL,
  max_daily_budget             TEXT,
  max_daily_budget_currency    TEXT,
  pace                         TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (guide_language) REFERENCES languages(bcp47),
  FOREIGN KEY (preferred_currency) REFERENCES currencies(iso4217),
  FOREIGN KEY (max_daily_budget_currency) REFERENCES currencies(iso4217)
);

-- 18. hotel_media (Supply & catalogue)
CREATE TABLE IF NOT EXISTS hotel_media (
  media_id                     TEXT PRIMARY KEY,
  hotel_id                     TEXT NOT NULL,
  room_type_id                 TEXT,
  media_role                   TEXT NOT NULL,
  file_path                    TEXT NOT NULL,
  alt_text                     TEXT NOT NULL,
  width_px                     INTEGER NOT NULL,
  height_px                    INTEGER NOT NULL,
  sort_order                   INTEGER NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id),
  FOREIGN KEY (room_type_id) REFERENCES hotel_room_types(room_type_id)
);

-- 19. itineraries (Trip & itinerary)
CREATE TABLE IF NOT EXISTS itineraries (
  itinerary_id                 TEXT PRIMARY KEY,
  trip_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  version                      INTEGER NOT NULL,
  is_active                    INTEGER NOT NULL,
  generated_by                 TEXT NOT NULL,
  total_cost                   TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  total_duration_minutes       INTEGER NOT NULL,
  total_carbon_kg              NUMERIC(10,3) NOT NULL,
  optimizer_weights            TEXT,
  status                       TEXT NOT NULL,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- 20. itinerary_items (Trip & itinerary)
CREATE TABLE IF NOT EXISTS itinerary_items (
  item_id                      TEXT PRIMARY KEY,
  itinerary_id                 TEXT NOT NULL,
  day_index                    INTEGER NOT NULL,
  sort_order                   INTEGER NOT NULL,
  starts_at                    TEXT,
  ends_at                      TEXT,
  item_type                    TEXT NOT NULL,
  entity_type                  TEXT,
  entity_id                    TEXT,
  title                        TEXT NOT NULL,
  cost                         TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  carbon_kg                    NUMERIC(8,3) NOT NULL,
  duration_minutes             INTEGER NOT NULL,
  source                       TEXT NOT NULL,
  explanation                  TEXT,
  locked                       INTEGER NOT NULL,
  status                       TEXT NOT NULL,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- 21. bookings (Booking & money)
CREATE TABLE IF NOT EXISTS bookings (
  booking_id                   TEXT PRIMARY KEY,
  user_id                      TEXT NOT NULL,
  trip_id                      TEXT,
  itinerary_id                 TEXT,
  booking_reference            TEXT NOT NULL UNIQUE,
  channel                      TEXT NOT NULL,
  total_amount                 TEXT NOT NULL,
  currency                     TEXT NOT NULL,
  tax_amount                   TEXT NOT NULL,
  idempotency_key              TEXT NOT NULL UNIQUE,
  status                       TEXT NOT NULL,
  confirmed_at                 TEXT,
  cancelled_at                 TEXT,
  cancellation_reason          TEXT,
  created_at                   TEXT NOT NULL,
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id),
  FOREIGN KEY (currency) REFERENCES currencies(iso4217)
);

-- =========================================================================
-- ADDITIVE EXTENSION: package_selections
-- Tracks a traveller's chosen component per swap_group for an itinerary / custom package.
-- Complies with Rules R1-R8 (opaque prefixed string ID, ISO-8601 offset, soft status).
-- =========================================================================
CREATE TABLE IF NOT EXISTS package_selections (
  selection_id                 TEXT PRIMARY KEY,
  package_id                   TEXT NOT NULL,
  component_id                 TEXT NOT NULL,
  swap_group                   TEXT NOT NULL,
  trip_id                      TEXT,
  itinerary_id                 TEXT,
  user_id                      TEXT,
  chosen_at                    TEXT NOT NULL,
  status                       TEXT NOT NULL DEFAULT 'active',
  updated_at                   TEXT NOT NULL,
  FOREIGN KEY (package_id) REFERENCES tour_packages(package_id),
  FOREIGN KEY (component_id) REFERENCES package_components(component_id)
);
