/**
 * TripCraft API Client — Modern REST Client for Dynamic Tour Packages.
 * Interfaces directly with FastAPI backend with automatic multi-endpoint failover.
 */

const API_BASE_CANDIDATES = [
  '/api',
  'http://localhost:8000/api',
  'http://127.0.0.1:8000/api'
];

let workingApiBase = '/api';

async function smartFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${workingApiBase}${endpoint}`, options);
    if (res.ok) return res;
  } catch (e) {
    // Failover to candidate bases
  }

  for (const candidate of API_BASE_CANDIDATES) {
    if (candidate === workingApiBase) continue;
    try {
      const res = await fetch(`${candidate}${endpoint}`, options);
      if (res.ok) {
        workingApiBase = candidate;
        return res;
      }
    } catch (err) {
      // Continue searching
    }
  }

  throw new Error(`Unable to connect to backend endpoint: ${endpoint}`);
}

export const api = {
  // Catalog Packages
  getPackages: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.city_id) query.append('city_id', params.city_id);
    if (params.theme && params.theme !== 'all') query.append('theme', params.theme);
    if (params.tier) query.append('tier', params.tier);
    if (params.language_bcp47) query.append('language_bcp47', params.language_bcp47);
    if (params.max_price) query.append('max_price', params.max_price);

    const res = await smartFetch(`/catalog/packages?${query.toString()}`);
    return await res.json();
  },

  getPackageDetail: async (packageId, language = null) => {
    const langParam = language ? `?language=${encodeURIComponent(language)}` : '';
    const res = await smartFetch(`/catalog/packages/${packageId}${langParam}`);
    return await res.json();
  },

  // Tour Guides & Availability (§2.2 Mandatory Verification)
  getGuides: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.city_id) query.append('city_id', params.city_id);
    if (params.language) query.append('language', params.language);
    if (params.specialisation) query.append('specialisation', params.specialisation);

    const res = await smartFetch(`/catalog/guides?${query.toString()}`);
    return await res.json();
  },

  checkGuideAvailability: async (guideId, startDate, durationDays = 4, packageId = null) => {
    const query = new URLSearchParams({
      start_date: startDate,
      duration_days: durationDays.toString()
    });
    if (packageId) query.append('package_id', packageId);

    const res = await smartFetch(`/guides/${guideId}/availability?${query.toString()}`);
    return await res.json();
  },

  // Live Decimal Repricing (§3.1, §9)
  reprice: async (data) => {
    const res = await smartFetch('/pricing/reprice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Real-World SerpAPI Google Hotels Integration
  searchLiveHotels: async (query, checkInDate = null, checkOutDate = null, adults = 2) => {
    const qParams = new URLSearchParams({ query });
    if (checkInDate) qParams.append('check_in_date', checkInDate);
    if (checkOutDate) qParams.append('check_out_date', checkOutDate);
    if (adults) qParams.append('adults', adults.toString());

    const res = await smartFetch(`/external/hotels?${qParams.toString()}`);
    return await res.json();
  },

  // Real-World OpenTripMap & OSM Attractions
  getNearbyAttractions: async (lat, lng, radiusMeters = 25000, lang = 'en') => {
    const res = await smartFetch(`/external/attractions?lat=${lat}&lng=${lng}&radius_meters=${radiusMeters}&lang=${lang}`);
    return await res.json();
  },

  geocodeAndExplore: async (query, radiusMeters = 25000) => {
    const res = await smartFetch(`/external/explore?query=${encodeURIComponent(query)}&radius_meters=${radiusMeters}`);
    return await res.json();
  },

  getAttractionDetail: async (xid, lang = 'en') => {
    const res = await smartFetch(`/external/attraction/${xid}?lang=${lang}`);
    return await res.json();
  },

  // AI Trip Builder & Architect
  buildTrip: async (prompt, userPreferences = {}) => {
    const res = await smartFetch('/ai/build-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, user_preferences: userPreferences })
    });
    return await res.json();
  },

  architectTrip: async (brief, preferences = {}) => {
    const res = await smartFetch('/ai/architect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, preferences })
    });
    return await res.json();
  },

  // Bookings & Selections
  createBooking: async (bookingData) => {
    const res = await smartFetch('/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return await res.json();
  },

  // User Preferences & Multilingual Filtering
  getUserPreferences: async (userId = 'usr_traveller_01') => {
    const res = await smartFetch(`/preferences/${userId}`);
    return await res.json();
  },

  saveUserPreferences: async (userId = 'usr_traveller_01', prefs = {}) => {
    const res = await smartFetch(`/preferences/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    return await res.json();
  },

  // Multilingual Translation
  translate: async (text, targetLang, sourceLang = 'en') => {
    const res = await smartFetch('/external/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_lang: targetLang, source_lang: sourceLang })
    });
    return await res.json();
  }
};
