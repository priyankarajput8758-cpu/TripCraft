/**
 * TripCraft API Client.
 */

const API_BASE = '/api';

export const api = {
  // Catalog
  getPackages: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.city_id) query.append('city_id', params.city_id);
    if (params.theme) query.append('theme', params.theme);
    if (params.tier) query.append('tier', params.tier);
    if (params.language_bcp47) query.append('language_bcp47', params.language_bcp47);
    if (params.max_price) query.append('max_price', params.max_price);

    const res = await fetch(`${API_BASE}/catalog/packages?${query.toString()}`);
    return res.json();
  },

  getPackageDetail: async (packageId) => {
    const res = await fetch(`${API_BASE}/catalog/packages/${packageId}`);
    return res.json();
  },

  getCities: async () => {
    const res = await fetch(`${API_BASE}/catalog/cities`);
    return res.json();
  },

  getGuides: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.city_id) query.append('city_id', params.city_id);
    if (params.language) query.append('language', params.language);
    if (params.specialisation) query.append('specialisation', params.specialisation);

    const res = await fetch(`${API_BASE}/catalog/guides?${query.toString()}`);
    return res.json();
  },

  // Pricing (reprice strictly from scratch)
  reprice: async (packageId, selectedComponentIds = [], guideId = null, startDate = null, durationDays = null) => {
    const res = await fetch(`${API_BASE}/pricing/reprice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package_id: packageId,
        selected_component_ids: selectedComponentIds,
        guide_id: guideId,
        start_date: startDate,
        duration_days: durationDays
      })
    });
    return res.json();
  },

  // Guides Availability & Substitute Check (§2.2 Mandatory Enhancement)
  checkGuideAvailability: async (guideId, startDate, durationDays = 1, packageId = null, cityId = null, preferredLang = null) => {
    const res = await fetch(`${API_BASE}/guides/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guide_id: guideId,
        start_date: startDate,
        duration_days: durationDays,
        package_id: packageId,
        city_id: cityId,
        preferred_language: preferredLang
      })
    });
    return res.json();
  },

  // Bookings
  createBooking: async (bookingData) => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return res.json();
  },

  // AI Assistant (Grounded Gemini Trip Builder)
  buildAiTrip: async (payload) => {
    const res = await fetch(`${API_BASE}/ai/build-trip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_prompt: payload.user_prompt || payload.prompt,
        destination_city_id: payload.destination_city_id || payload.city_id || null,
        max_budget: payload.max_budget || payload.budget || payload.budget_max || null,
        duration_days: payload.duration_days || payload.duration ? parseInt(payload.duration_days || payload.duration) : null,
        preferred_language: payload.preferred_language || payload.language || null,
        interests: payload.interests || null
      })
    });
    return res.json();
  },

  // Brand New Custom Destination Architect (OpenTripMap Day-wise Multi-Select Matrix + Gemini Optimizer)
  synthesizeCustomTrip: async (payload) => {
    const res = await fetch(`${API_BASE}/ai/synthesize-custom-trip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // External Real-World Integrations
  exploreDestination: async (query, radiusMeters = 15000) => {
    const params = new URLSearchParams({
      query,
      radius_meters: radiusMeters
    });
    const res = await fetch(`${API_BASE}/external/explore-destination?${params.toString()}`);
    return res.json();
  },

  searchLiveHotels: async (query, checkInDate = '2026-09-24', checkOutDate = '2026-09-25') => {
    const params = new URLSearchParams({
      query,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      currency: 'INR'
    });
    const res = await fetch(`${API_BASE}/external/hotels?${params.toString()}`);
    return res.json();
  },

  getNearbyAttractions: async (lat, lng, radiusMeters = 5000) => {
    const params = new URLSearchParams({
      lat,
      lng,
      radius_meters: radiusMeters
    });
    const res = await fetch(`${API_BASE}/external/attractions?${params.toString()}`);
    return res.json();
  },

  translateText: async (text, targetLang, sourceLang = 'en') => {
    const res = await fetch(`${API_BASE}/external/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        target_lang: targetLang,
        source_lang: sourceLang
      })
    });
    return res.json();
  }
};
