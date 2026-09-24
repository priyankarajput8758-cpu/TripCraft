/**
 * TripCraft API Client — Modern REST Client for Dynamic Tour Packages.
 * Interfaces directly with FastAPI backend with automatic multi-endpoint failover.
 */

const API_BASE_CANDIDATES = [
  '/api',
  'http://127.0.0.2:8000/api',
  'http://localhost:8000/api',
  'http://127.0.0.1:8000/api'
];

let workingApiBase = '/api';

async function smartFetch(endpoint, options = {}) {
  let lastResponse = null;
  try {
    const res = await fetch(`${workingApiBase}${endpoint}`, options);
    if (res.ok) return res;
    lastResponse = res;
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
      lastResponse = res;
    } catch (err) {
      // Continue searching
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw new Error(`Unable to connect to backend endpoint: ${endpoint}`);
}

export const api = {
  // Cities & Reference Data
  getCities: async () => {
    try {
      const res = await smartFetch('/catalog/cities');
      const data = await res.json();
      return Array.isArray(data) ? data : (data?.cities || []);
    } catch (e) {
      console.warn('getCities fallback:', e);
      return [];
    }
  },

  getLanguages: async () => {
    try {
      const res = await smartFetch('/catalog/languages');
      return await res.json();
    } catch (e) {
      return [];
    }
  },

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
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.guides || []);
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
  searchLiveHotels: async (query, checkInDate = null, checkOutDate = null, adults = 2, currency = 'INR') => {
    const qParams = new URLSearchParams({ query });
    if (checkInDate) qParams.append('check_in_date', checkInDate);
    if (checkOutDate) qParams.append('check_out_date', checkOutDate);
    if (currency) qParams.append('currency', currency);

    const res = await smartFetch(`/external/hotels?${qParams.toString()}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.hotels || []);
  },

  // Real-World OpenTripMap & OSM Attractions
  exploreDestination: async (query, radiusMeters = 25000) => {
    const res = await smartFetch(`/external/explore-destination?query=${encodeURIComponent(query)}&radius_meters=${radiusMeters}`);
    return await res.json();
  },

  getNearbyAttractions: async (lat, lng, radiusMeters = 25000, lang = 'en') => {
    let endpoint = `/external/attractions?lat=${lat}&lng=${lng}&radius_meters=${radiusMeters}`;
    if (!lat || !lng) {
      endpoint = `/external/explore-destination?query=Destination&radius_meters=${radiusMeters}`;
    }
    const res = await smartFetch(endpoint);
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.attractions || []);
  },

  getAttractionDetail: async (xid, lang = 'en') => {
    const res = await smartFetch(`/external/attraction-detail?xid=${encodeURIComponent(xid)}&lang=${lang}`);
    return await res.json();
  },

  getSpotImage: async (spotName, category = null) => {
    const catParam = category ? `&category=${encodeURIComponent(category)}` : '';
    const res = await smartFetch(`/external/spot-image?query=${encodeURIComponent(spotName)}${catParam}`);
    return await res.json();
  },

  // AI Trip Builder & Architect
  buildAiTrip: async (payload) => {
    const res = await smartFetch('/ai/build-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  buildTrip: async (prompt, userPreferences = {}) => {
    return api.buildAiTrip({ user_prompt: prompt, ...userPreferences });
  },

  synthesizeCustomTrip: async (payload) => {
    const res = await smartFetch('/ai/synthesize-custom-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  architectTrip: async (brief, preferences = {}) => {
    return api.synthesizeCustomTrip({ destination_name: brief, ...preferences });
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
  translateText: async (text, targetLang, sourceLang = 'en') => {
    const res = await smartFetch('/external/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_lang: targetLang, source_lang: sourceLang })
    });
    return await res.json();
  },

  translateBatch: async (texts, targetLang, sourceLang = 'en') => {
    const res = await smartFetch('/external/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, target_lang: targetLang, source_lang: sourceLang })
    });
    return await res.json();
  },

  translateItinerary: async (customPackage, targetLang, sourceLang = 'en') => {
    const res = await smartFetch('/external/translate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ custom_package: customPackage, target_lang: targetLang, source_lang: sourceLang })
    });
    return await res.json();
  },

  translate: async (text, targetLang, sourceLang = 'en') => {
    return api.translateText(text, targetLang, sourceLang);
  }
};
