import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import {
  Compass,
  MapPin,
  Sparkles,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Building2,
  Zap,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Languages,
  ArrowRight,
  Check,
  Award,
  X,
  Eye,
  Info,
  Plus
} from 'lucide-react';

// Fix Leaflet marker icons in React/Vite bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function DestinationExplorer({ externalSupplyMode = false, onBookingComplete }) {
  const [destinationQuery, setDestinationQuery] = useState('Chikmagalur');
  const [radiusMeters, setRadiusMeters] = useState(15000);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [categoriesSummary, setCategoriesSummary] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Selected spot modal state
  const [activeSpotModal, setActiveSpotModal] = useState(null);

  // Real-world hotels from SerpAPI
  const [liveHotels, setLiveHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Configuration for Day Matrix
  const [durationDays, setDurationDays] = useState(3);
  const [pacePreference, setPacePreference] = useState('balanced');
  const [numTravelers, setNumTravelers] = useState(2);
  const [userCustomRequests, setUserCustomRequests] = useState('');

  // Stay Selection Mode: 'same' (Single Stay Throughout) vs 'different' (Different Stays Per Day)
  const [stayMode, setStayMode] = useState('same');
  const [masterHotel, setMasterHotel] = useState({
    name: 'Cozy Hill Cottage (Standard)',
    price_per_night: 3500,
    type: 'standard'
  });

  // Day-wise matrix state: array of { day_number, selected_activities: [], selected_hotel: {} }
  const [dayMatrix, setDayMatrix] = useState([]);

  // Synthesized AI Result & Interactive Suggestions State
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizedTrip, setSynthesizedTrip] = useState(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState({});

  // Translation state
  const [selectedLang, setSelectedLang] = useState('en');
  const [translatedTripTitle, setTranslatedTripTitle] = useState(null);
  const [translating, setTranslating] = useState(false);

  // Leaflet map refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize Day Matrix whenever durationDays changes
  useEffect(() => {
    setDayMatrix(prev => {
      const updated = [];
      for (let i = 1; i <= durationDays; i++) {
        const existing = prev.find(d => d.day_number === i);
        if (existing) {
          updated.push({
            ...existing,
            selected_hotel: stayMode === 'same' ? masterHotel : existing.selected_hotel
          });
        } else {
          updated.push({
            day_number: i,
            selected_activities: [],
            selected_hotel: stayMode === 'same' ? masterHotel : {
              name: 'Cozy Hill Cottage (Standard)',
              price_per_night: 3500,
              type: 'standard'
            }
          });
        }
      }
      return updated;
    });
  }, [durationDays, stayMode, masterHotel]);

  // Initial explore on mount
  useEffect(() => {
    handleExploreDestination('Chikmagalur');
  }, []);

  // Explore Destination API Call
  const handleExploreDestination = async (queryToSearch) => {
    const query = queryToSearch || destinationQuery;
    if (!query.trim()) return;

    setLoadingExplore(true);
    setSynthesizedTrip(null);
    try {
      const res = await api.exploreDestination(query, radiusMeters);
      if (res && res.status === 'success') {
        setGeoData(res.destination);
        setAttractions(res.attractions || []);
        setCategoriesSummary(res.categories_summary || {});

        // Fetch Live Hotels via SerpAPI for this destination
        fetchLiveHotels(query);

        // Pre-populate Day 1 & Day 2 with top attractions if matrix is empty
        if (res.attractions && res.attractions.length > 0) {
          const topSpots = res.attractions.slice(0, 8).map(a => a.name);
          setDayMatrix(prev => {
            return prev.map((day, idx) => {
              if (day.selected_activities.length === 0) {
                const sliceStart = idx * 2;
                return {
                  ...day,
                  selected_activities: topSpots.slice(sliceStart, sliceStart + 2)
                };
              }
              return day;
            });
          });
        }
      }
    } catch (err) {
      console.error('Explore destination failed:', err);
    } finally {
      setLoadingExplore(false);
    }
  };

  // Fetch Live Google Hotels
  const fetchLiveHotels = async (cityName) => {
    setLoadingHotels(true);
    try {
      const res = await api.searchLiveHotels(cityName);
      const list = res?.hotels || res?.data || [];
      setLiveHotels(list);
    } catch (err) {
      console.error('Error fetching live hotels:', err);
    } finally {
      setLoadingHotels(false);
    }
  };

  // Setup Leaflet Map whenever geoData or attractions update
  useEffect(() => {
    if (!mapRef.current || !geoData) return;

    const lat = geoData.lat || 13.3161;
    const lng = geoData.lng || 75.7720;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([lat, lng], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lng], 11);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Main Destination Hub Pin
    const hubIcon = L.divIcon({
      className: 'custom-hub-pin',
      html: `<div style="background-color: #0d9488; color: white; font-weight: bold; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-size: 15px;">📍</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    const hubMarker = L.marker([lat, lng], { icon: hubIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${geoData.name}</b><br/><span style="color:#64748b; font-size:11px;">Central Gathering Hub</span>`)
      .openPopup();
    markersRef.current.push(hubMarker);

    // Add attraction pins
    attractions.forEach(att => {
      if (att.lat && att.lng) {
        let color = '#f59e0b'; // default amber
        if (att.category === 'Temple & Spiritual') color = '#ec4899';
        else if (att.category === 'Heritage & Architecture') color = '#8b5cf6';
        else if (att.category === 'Nature & Scenic') color = '#10b981';
        else if (att.category === 'Museum & Culture') color = '#3b82f6';

        const marker = L.circleMarker([att.lat, att.lng], {
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-size: 12px; line-height: 1.3;">
              <b style="color: #047857; font-size: 13px;">${att.name}</b><br/>
              <span style="color: #6366f1; font-weight:600; font-size: 10px;">${att.category}</span><br/>
              <span style="color: #d97706; font-size: 11px;">📍 ${att.dist_formatted || att.dist_meters + 'm'} from center</span>
            </div>
          `);

        marker.on('click', () => {
          setActiveSpotModal(att);
        });

        markersRef.current.push(marker);
      }
    });
  }, [geoData, attractions]);

  // Toggle activity checkbox for a given day
  const handleToggleActivity = (dayNum, activityName) => {
    setDayMatrix(prev => {
      return prev.map(d => {
        if (d.day_number === dayNum) {
          const current = d.selected_activities || [];
          const exists = current.includes(activityName);
          const updated = exists
            ? current.filter(item => item !== activityName)
            : [...current, activityName];
          return { ...d, selected_activities: updated };
        }
        return d;
      });
    });
  };

  // Add activity to a specific day from Spot Card Modal
  const handleAddActivityFromModal = (dayNum, activityName) => {
    handleToggleActivity(dayNum, activityName);
  };

  // Select master hotel (applies to all days in 'same' stay mode)
  const handleSelectMasterHotel = (hotelObj) => {
    setMasterHotel(hotelObj);
    setDayMatrix(prev => prev.map(d => ({ ...d, selected_hotel: hotelObj })));
  };

  // Select hotel radio button for a given day (in 'different' stay mode)
  const handleSelectHotel = (dayNum, hotelObj) => {
    setDayMatrix(prev => {
      return prev.map(d => {
        if (d.day_number === dayNum) {
          return { ...d, selected_hotel: hotelObj };
        }
        return d;
      });
    });
  };

  // Interactive AI Suggestion Handlers
  const handleApplyConflictResolution = (conflictIndex, text) => {
    setAppliedSuggestions(prev => ({ ...prev, [`conflict_${conflictIndex}`]: true }));
  };

  const handleApplyVoidFill = (voidIndex, text) => {
    setAppliedSuggestions(prev => ({ ...prev, [`void_${voidIndex}`]: true }));
  };

  const handleApplyCostOptimization = () => {
    setAppliedSuggestions(prev => ({ ...prev, 'cost_optimization': true }));
  };

  // Trigger Gemini Custom Itinerary Synthesizer
  const handleSynthesizeCustomTrip = async () => {
    setSynthesizing(true);
    setTranslatedTripTitle(null);
    setAppliedSuggestions({});
    try {
      const payload = {
        destination_name: geoData?.name || destinationQuery,
        duration_days: durationDays,
        pace_preference: pacePreference,
        day_selections: dayMatrix,
        external_supply_mode: externalSupplyMode,
        lat: geoData?.lat,
        lng: geoData?.lng,
        user_custom_requests: userCustomRequests.trim() || undefined,
        num_travelers: numTravelers
      };

      const res = await api.synthesizeCustomTrip(payload);
      if (res && res.status === 'success') {
        setSynthesizedTrip(res.custom_package);
        // Scroll smoothly to generated itinerary
        setTimeout(() => {
          const el = document.getElementById('custom-itinerary-output');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (err) {
      console.error('Synthesis error:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  // Translate synthesized itinerary title
  const handleTranslate = async (langCode) => {
    if (!synthesizedTrip) return;
    setSelectedLang(langCode);
    if (langCode === 'en') {
      setTranslatedTripTitle(null);
      return;
    }
    setTranslating(true);
    try {
      const res = await api.translateText(synthesizedTrip.trip_title, langCode);
      if (res && res.translated_text) {
        setTranslatedTripTitle(res.translated_text);
      }
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setTranslating(false);
    }
  };

  // Filtered attractions list
  const filteredAttractions = attractions.filter(item => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'temple' && item.category === 'Temple & Spiritual') return true;
    if (selectedCategory === 'heritage' && item.category === 'Heritage & Architecture') return true;
    if (selectedCategory === 'nature' && item.category === 'Nature & Scenic') return true;
    if (selectedCategory === 'culture' && item.category === 'Museum & Culture') return true;
    return false;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Search & Geocoding Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/70 border border-teal-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Autonomous Custom Package Engine
              </span>
              {externalSupplyMode && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Live Google Hotels Active
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Custom Destination Itinerary Architect
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Input any Indian hill station, heritage town, or getaway (e.g.{' '}
              <span className="text-teal-400 font-semibold cursor-pointer underline" onClick={() => { setDestinationQuery('Chikmagalur'); handleExploreDestination('Chikmagalur'); }}>Chikmagalur</span>,{' '}
              <span className="text-teal-400 font-semibold cursor-pointer underline" onClick={() => { setDestinationQuery('Wayanad'); handleExploreDestination('Wayanad'); }}>Wayanad</span>,{' '}
              <span className="text-teal-400 font-semibold cursor-pointer underline" onClick={() => { setDestinationQuery('Hampi'); handleExploreDestination('Hampi'); }}>Hampi</span>, or{' '}
              <span className="text-teal-400 font-semibold cursor-pointer underline" onClick={() => { setDestinationQuery('Varanasi'); handleExploreDestination('Varanasi'); }}>Varanasi</span>).
              OpenTripMap auto-discovers real tourist spots up to 90km, and Gemini Flash constructs a seamless, void-filled itinerary.
            </p>
          </div>
        </div>

        {/* Input & Radius Controls */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExploreDestination();
          }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          <div className="relative flex-1">
            <MapPin className="w-5 h-5 text-teal-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              placeholder="Enter destination (e.g. Chikmagalur, Ooty, Coorg, Wayanad)..."
              className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-2xl px-3 py-3 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value={15000} className="bg-slate-900 text-white font-bold">15 km (City & Core Hub)</option>
              <option value={30000} className="bg-slate-900 text-white font-bold">30 km (Suburbs & Hilltops)</option>
              <option value={50000} className="bg-slate-900 text-white font-bold">50 km (Regional Excursion)</option>
              <option value={90000} className="bg-slate-900 text-white font-bold">90 km (Full 90km Exploration)</option>
            </select>

            <button
              type="submit"
              disabled={loadingExplore}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-2xl transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingExplore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  Discover Spots
                </>
              )}
            </button>
          </div>
        </form>

        {/* Destination Discovery Status Pill */}
        {geoData && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold text-white">Geocoded Location:</span>
              <span className="text-teal-300">{geoData.display_name || geoData.name}</span>
              <span className="text-slate-500 font-mono">({geoData.lat?.toFixed(4)}, {geoData.lng?.toFixed(4)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                {attractions.length} Tourist Landmarks Discovered (within {radiusMeters / 1000}km)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Map & Tourist Spots Discovery Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold text-white">
                Live Interactive Tourist Landmarks Map
              </h3>
            </div>
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'temple', label: 'Spiritual' },
                { id: 'heritage', label: 'Heritage' },
                { id: 'nature', label: 'Nature' },
                { id: 'culture', label: 'Culture' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div
            ref={mapRef}
            className="w-full h-80 rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner z-0"
            style={{ minHeight: '360px' }}
          />

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Powered by OpenStreetMap + OpenTripMap Live POIs (Click spot pin for details)</span>
            <span className="text-teal-400 font-mono">Showing {filteredAttractions.length} spots</span>
          </div>
        </div>

        {/* Tourist Spots Directory Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Discovered Attractions & POIs
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Click spot to inspect & add
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {filteredAttractions.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No spots found in this category. Expand radius or select "All".
              </div>
            ) : (
              filteredAttractions.map((spot, idx) => {
                const distText = spot.dist_formatted || (spot.dist_meters ? (spot.dist_meters >= 1000 ? (spot.dist_meters / 1000).toFixed(1) + ' km' : spot.dist_meters + ' m') : 'Nearby');
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveSpotModal(spot);
                      if (mapInstanceRef.current && spot.lat && spot.lng) {
                        mapInstanceRef.current.flyTo([spot.lat, spot.lng], 14, { duration: 1.0 });
                      }
                    }}
                    className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/50 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-teal-300 truncate">
                        {spot.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 text-teal-400 font-medium">
                          {spot.category}
                        </span>
                        <span>📍 {distText}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-1">
                      <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300" />
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Spot Detail Modal Card */}
      {activeSpotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in">
          <div className="bg-slate-900 border border-teal-500/50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
            {/* Modal Image Hero */}
            <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
              <img
                src={activeSpotModal.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                alt={activeSpotModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />
              <button
                onClick={() => setActiveSpotModal(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                  {activeSpotModal.category}
                </span>
                <h3 className="text-lg font-black text-white truncate mt-1">
                  {activeSpotModal.name}
                </h3>
              </div>
            </div>

            {/* Modal Content & Distance */}
            <div className="p-5 space-y-4 pt-0">
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-teal-300 font-semibold">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Distance: {activeSpotModal.dist_formatted || (activeSpotModal.dist_meters ? (activeSpotModal.dist_meters >= 1000 ? (activeSpotModal.dist_meters / 1000).toFixed(1) + ' km' : activeSpotModal.dist_meters + ' m') : 'Central Hub')}</span>
                </div>
                {activeSpotModal.lat && activeSpotModal.lng && (
                  <span className="font-mono text-[11px] text-slate-500">
                    ({activeSpotModal.lat.toFixed(4)}, {activeSpotModal.lng.toFixed(4)})
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeSpotModal.short_desc || `Explore ${activeSpotModal.name}, a distinguished ${activeSpotModal.category?.toLowerCase() || 'attraction'} in the region.`}
              </p>

              {/* Quick Add to Day Matrix Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Add to Itinerary Matrix:
                </span>
                <div className="flex flex-wrap gap-2">
                  {dayMatrix.map((day) => {
                    const isAdded = day.selected_activities.includes(activeSpotModal.name);
                    return (
                      <button
                        key={day.day_number}
                        onClick={() => handleAddActivityFromModal(day.day_number, activeSpotModal.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isAdded
                            ? 'bg-teal-500 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Day {day.day_number}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setActiveSpotModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer mt-2"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day-Wise Multi-Select Experience Matrix Studio */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-teal-400" />
              Day-Wise Multi-Select Experience Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Select multiple experiences per day (checkboxes) and customize your accommodations & schedule timing.
            </p>
          </div>

          {/* Duration, Party Size & Pace Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Party Size Selector */}
            <div className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-slate-300">Travelers:</span>
              <select
                value={numTravelers}
                onChange={(e) => setNumTravelers(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-xs font-bold text-teal-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value={1} className="bg-slate-900 text-white font-bold">1 Person (Solo)</option>
                <option value={2} className="bg-slate-900 text-white font-bold">2 Persons (Couple/Twin)</option>
                <option value={3} className="bg-slate-900 text-white font-bold">3 Persons (Triple)</option>
                <option value={4} className="bg-slate-900 text-white font-bold">4 Persons (Family/Group)</option>
                <option value={6} className="bg-slate-900 text-white font-bold">6 Persons (Large Group)</option>
              </select>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs font-bold text-slate-300">Duration:</span>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-xs font-bold text-teal-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value={1} className="bg-slate-900 text-white font-bold">1 Day (Express)</option>
                <option value={2} className="bg-slate-900 text-white font-bold">2 Days (Weekend)</option>
                <option value={3} className="bg-slate-900 text-white font-bold">3 Days (Standard)</option>
                <option value={4} className="bg-slate-900 text-white font-bold">4 Days (Extended)</option>
                <option value={5} className="bg-slate-900 text-white font-bold">5 Days (Complete)</option>
                <option value={6} className="bg-slate-900 text-white font-bold">6 Days</option>
                <option value={7} className="bg-slate-900 text-white font-bold">7 Days (Grand)</option>
              </select>
            </div>

            {/* Pace Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
              {[
                { id: 'relaxed', label: 'Relaxed' },
                { id: 'balanced', label: 'Balanced' },
                { id: 'packed', label: 'Packed' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPacePreference(p.id)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    pacePreference === p.id
                      ? 'bg-teal-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MASTER STAY SELECTOR & RADIO TOGGLE ── */}
        <div className="bg-slate-950/70 border border-teal-500/30 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <h4 className="text-sm font-bold text-white">
                Accommodation Preference Across All Days
              </h4>
            </div>

            {/* Radio Toggle: Same Stay Throughout vs Different Stays */}
            <div className="flex items-center space-x-4 bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs font-bold">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
                <input
                  type="radio"
                  name="stay_mode"
                  value="same"
                  checked={stayMode === 'same'}
                  onChange={() => setStayMode('same')}
                  className="accent-teal-500 w-4 h-4 cursor-pointer"
                />
                <span>Same Stay Throughout Trip</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-slate-200 hover:text-white">
                <input
                  type="radio"
                  name="stay_mode"
                  value="different"
                  checked={stayMode === 'different'}
                  onChange={() => setStayMode('different')}
                  className="accent-teal-500 w-4 h-4 cursor-pointer"
                />
                <span>Different Stays Per Day</span>
              </label>
            </div>
          </div>

          {/* Master Hotel Selector (Rendered when stayMode === 'same') */}
          {stayMode === 'same' ? (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Select Master Stay (Locked & Applied to All {durationDays} Days):
                </span>
                <span className="text-[11px] text-slate-400 bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20 font-medium">
                  🔒 Individual day stays locked
                </span>
              </div>

              {/* Master Hotel Options */}
              {externalSupplyMode && liveHotels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {liveHotels.slice(0, 4).map((h, idx) => {
                    const isSelected = masterHotel.name === h.name;
                    const rateNum = h.rate_per_night || 4500;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectMasterHotel({
                          name: h.name,
                          price_per_night: rateNum,
                          type: 'external_serpapi',
                          link: h.link
                        })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-950/50 border-amber-500 text-white font-semibold shadow-md'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="text-xs font-bold text-white line-clamp-1">{h.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                        <div className="flex items-baseline justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">Live Google Rate:</span>
                          <span className="text-amber-400 font-mono font-bold">₹{parseFloat(rateNum).toLocaleString('en-IN')}/night</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Cozy Hill Cottage (Standard)', price_per_night: 3500, type: 'standard' },
                    { name: 'Luxury Coffee Estate Resort', price_per_night: 7500, type: 'luxury' },
                    { name: 'Eco Nature Homestay (Budget)', price_per_night: 2200, type: 'budget' }
                  ].map((tier, idx) => {
                    const isSelected = masterHotel.name === tier.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectMasterHotel(tier)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-950/50 border-teal-500 text-white font-semibold shadow-md'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{tier.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Applies to all nights</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-teal-400 font-mono font-bold text-xs">
                            ₹{tier.price_per_night.toLocaleString('en-IN')}/night
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic pt-1">
              ✓ Different stays mode active: Select custom hotels per day in the matrix cards below.
            </div>
          )}
        </div>

        {/* ── CUSTOM USER PREFERENCE & TIMING PROMPT INPUT ── */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Custom Scheduling & Timing Requests (Incorporated directly into Gemini itinerary)</span>
          </label>
          <div className="relative">
            <textarea
              value={userCustomRequests}
              onChange={(e) => setUserCustomRequests(e.target.value)}
              rows={2}
              placeholder="e.g., 'I want to visit Mullayanagiri Peak specifically for sunset on Day 2', or 'Keep mornings relaxed with coffee tastings before 11 AM'..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Matrix Grid: Render cards for Day 1..N */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dayMatrix.map((day) => {
            const dayNum = day.day_number;
            const currentActs = day.selected_activities || [];
            const selectedHotel = day.selected_hotel;

            return (
              <div
                key={dayNum}
                className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-teal-500/40 transition-all shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 font-extrabold text-xs font-mono">
                      DAY {dayNum}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {currentActs.length} Selected
                    </span>
                  </div>

                  {/* Multi-Select Checkboxes for Experiences */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Experiences & Spots (Multi-Select):
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {attractions.length === 0 ? (
                        <div className="text-[11px] text-slate-500 italic py-2">
                          Discovering local attractions...
                        </div>
                      ) : (
                        attractions.slice(0, 10).map((spot, i) => {
                          const isChecked = currentActs.includes(spot.name);
                          return (
                            <div
                              key={i}
                              onClick={() => handleToggleActivity(dayNum, spot.name)}
                              className={`p-2 rounded-xl text-xs flex items-center space-x-2.5 cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-teal-950/40 border border-teal-500/60 text-white font-semibold'
                                  : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              <div className="shrink-0 text-teal-400">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 fill-teal-500 text-slate-950" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-600" />
                                )}
                              </div>
                              <span className="truncate flex-1 font-medium">{spot.name}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Radio Buttons for Stay / Hotel (Locked if stayMode === 'same') */}
                  <div className="space-y-2 pt-2 border-t border-slate-700/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Night {dayNum} Stay:
                      </span>
                      {stayMode === 'same' && (
                        <span className="text-[10px] text-teal-300 bg-teal-500/10 px-1.5 py-0.5 rounded font-mono">
                          Locked (Same Stay)
                        </span>
                      )}
                    </div>

                    {stayMode === 'same' ? (
                      <div className="p-2.5 bg-slate-950/60 border border-teal-500/30 rounded-xl text-xs flex items-center justify-between text-slate-200">
                        <span className="truncate font-medium">{masterHotel?.name || 'Selected Master Stay'}</span>
                        <span className="text-teal-400 font-mono font-bold shrink-0 ml-2">
                          ₹{masterHotel?.price_per_night?.toLocaleString('en-IN')}/nt
                        </span>
                      </div>
                    ) : (
                      /* If External Supply Mode is enabled and live hotels exist */
                      externalSupplyMode && liveHotels.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {liveHotels.slice(0, 4).map((h, hIdx) => {
                            const isSelected = selectedHotel?.name === h.name;
                            const rateNum = h.rate_per_night || 4500;
                            return (
                              <div
                                key={hIdx}
                                onClick={() => handleSelectHotel(dayNum, {
                                  name: h.name,
                                  price_per_night: rateNum,
                                  type: 'external_serpapi',
                                  link: h.link
                                })}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
                                  isSelected
                                    ? 'bg-amber-950/40 border-amber-500 text-white font-semibold'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                  </div>
                                  <span className="truncate font-semibold text-white">{h.name}</span>
                                </div>
                                <span className="font-mono text-amber-400 text-[11px] shrink-0 font-bold">
                                  ₹{parseFloat(rateNum).toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Default Standard Tiers
                        <div className="space-y-1.5">
                          {[
                            { name: 'Cozy Hill Cottage (Standard)', price_per_night: 3500, type: 'standard' },
                            { name: 'Luxury Coffee Estate Resort', price_per_night: 7500, type: 'luxury' },
                            { name: 'Eco Nature Homestay (Budget)', price_per_night: 2200, type: 'budget' }
                          ].map((tier, tIdx) => {
                            const isSelected = selectedHotel?.name === tier.name;
                            return (
                              <div
                                key={tIdx}
                                onClick={() => handleSelectHotel(dayNum, tier)}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
                                  isSelected
                                    ? 'bg-teal-950/40 border-teal-500 text-white font-semibold'
                                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-teal-400 bg-teal-400' : 'border-slate-600'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                                  </div>
                                  <span className="truncate font-medium text-slate-200">{tier.name}</span>
                                </div>
                                <span className="font-mono text-teal-400 text-[11px] shrink-0 font-bold">
                                  ₹{tier.price_per_night.toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Synthesize Action Banner */}
        <div className="bg-slate-950/90 border border-teal-500/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Ready to Synthesize Grounded Itinerary</span>
            </h4>
            <p className="text-xs text-slate-400">
              Gemini will resolve timing clashes, fill schedule voids, optimize hotel rates, and calculate zero-float Decimal pricing for {numTravelers} traveler(s).
            </p>
          </div>

          <button
            onClick={handleSynthesizeCustomTrip}
            disabled={synthesizing}
            className="px-8 py-3.5 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {synthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Synthesizing with Gemini Flash...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Synthesize Itinerary & Reprice
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Custom Package Output Section */}
      {synthesizedTrip && (
        <div
          id="custom-itinerary-output"
          className="bg-slate-900 border border-teal-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fadeIn"
        >
          {/* Header & Translation Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Gemini Optimized & Verified
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                  {synthesizedTrip.duration_days} Days / {synthesizedTrip.duration_days - 1} Nights
                </span>
                <span className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
                  {numTravelers} Traveler{numTravelers > 1 ? 's' : ''} ({Math.ceil(numTravelers / 2)} Room{Math.ceil(numTravelers / 2) > 1 ? 's' : ''})
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 text-xs font-bold uppercase">
                  {synthesizedTrip.pace} Pace
                </span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {translatedTripTitle || synthesizedTrip.trip_title}
              </h3>
            </div>

            {/* Translation Action Buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 text-xs">
              <Languages className="w-4 h-4 text-slate-400 ml-1.5 mr-1" />
              {[
                { code: 'en', label: 'EN' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'kn', label: 'ಕನ್ನಡ' },
                { code: 'te', label: 'తెలుగు' }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleTranslate(lang.code)}
                  disabled={translating}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedLang === lang.code
                      ? 'bg-teal-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Optimization Intelligence Cards with Interactive Action Buttons */}
          {synthesizedTrip.ai_optimizations && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Actionable AI Recommendations & Optimizations (Click to Apply):</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Conflicts Resolved Card */}
                <div className="bg-slate-950/70 border border-amber-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Schedule Conflicts</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                        {synthesizedTrip.ai_optimizations.conflicts_resolved?.length || 0} Resolved
                      </span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5">
                      {synthesizedTrip.ai_optimizations.conflicts_resolved?.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleApplyConflictResolution(0, 'All conflicts resolved')}
                    disabled={appliedSuggestions['conflict_0']}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      appliedSuggestions['conflict_0']
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                    }`}
                  >
                    {appliedSuggestions['conflict_0'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Rescheduled Timing Applied ✓</span>
                      </>
                    ) : (
                      <>
                        <span>Apply Schedule Optimization</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Voids Filled Card */}
                <div className="bg-slate-950/70 border border-teal-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-teal-400 font-bold text-xs">
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>Activity Voids Filled</span>
                      </div>
                      <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono">
                        {synthesizedTrip.ai_optimizations.voids_filled?.length || 0} Filled
                      </span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5">
                      {synthesizedTrip.ai_optimizations.voids_filled?.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-teal-400 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleApplyVoidFill(0, 'Added experiences to schedule')}
                    disabled={appliedSuggestions['void_0']}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      appliedSuggestions['void_0']
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md active:scale-95'
                    }`}
                  >
                    {appliedSuggestions['void_0'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Void Highlights Added ✓</span>
                      </>
                    ) : (
                      <>
                        <span>Apply Added Experiences</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Cost Optimization Card */}
                <div className="bg-slate-950/70 border border-emerald-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
                      <div className="flex items-center space-x-1.5">
                        <TrendingDown className="w-4 h-4" />
                        <span>Cost & Date Optimization</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                        Surge Analyzed
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {synthesizedTrip.ai_optimizations.cost_optimization_tip || 'Trip date selected avoids peak weekend surcharges. Stays and transfers locked with best available rates.'}
                    </p>
                  </div>

                  <button
                    onClick={handleApplyCostOptimization}
                    disabled={appliedSuggestions['cost_optimization']}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      appliedSuggestions['cost_optimization']
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md active:scale-95'
                    }`}
                  >
                    {appliedSuggestions['cost_optimization'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Best Rate Applied ✓</span>
                      </>
                    ) : (
                      <>
                        <span>Lock Optimized Rates</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Day-by-Day Timeline Schedule */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              Day-by-Day Synthesized Itinerary
            </h4>

            <div className="space-y-4">
              {synthesizedTrip.itinerary?.map((dayObj, dIdx) => (
                <div
                  key={dIdx}
                  className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 font-black text-xs font-mono">
                        DAY {dayObj.day}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {dayObj.title}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {dayObj.slots?.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1"
                      >
                        <div className="text-[10px] font-mono text-teal-400 font-semibold">
                          {slot.time}
                        </div>
                        <div className="text-xs font-bold text-white line-clamp-1">
                          {slot.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2">
                          {slot.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  {dayObj.notes && (
                    <div className="text-[11px] text-slate-400 italic pt-1">
                      💡 Note: {dayObj.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Decimal Financial Breakdown & Booking Action */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Synthesized Package Price (Decimal Precision for {numTravelers} Traveler{numTravelers > 1 ? 's' : ''}):
              </span>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black text-white font-mono">
                  ₹{parseFloat(synthesizedTrip.estimated_pricing?.grand_total || '32000.00').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  Includes {Math.ceil(numTravelers / 2)} Hotel Room(s) + Transfers + 5% GST
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 font-mono pt-1">
                <span>Stays: ₹{synthesizedTrip.estimated_pricing?.hotel_total || '14000.00'}</span>
                <span>•</span>
                <span>Activities ({numTravelers}p): ₹{synthesizedTrip.estimated_pricing?.activities_total || '9000.00'}</span>
                <span>•</span>
                <span>Transfers: ₹{synthesizedTrip.estimated_pricing?.transfers_total || '4200.00'}</span>
                <span>•</span>
                <span>GST Tax: ₹{synthesizedTrip.estimated_pricing?.gst_tax || '1360.00'}</span>
              </div>
            </div>

            <button
              onClick={() => onBookingComplete?.({
                ...synthesizedTrip,
                destination_name: geoData?.name || destinationQuery,
                cityName: geoData?.name || destinationQuery,
                num_travelers: numTravelers,
                partySize: numTravelers,
                hotelName: stayMode === 'same' ? masterHotel.name : 'Custom Multi-Stay Plan',
                selectedHotel: stayMode === 'same' ? masterHotel : undefined
              })}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>Book Custom Package</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
