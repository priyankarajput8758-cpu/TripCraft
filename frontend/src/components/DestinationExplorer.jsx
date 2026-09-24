import React, { useState, useEffect, useRef } from 'react';
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
  Award
} from 'lucide-react';

export default function DestinationExplorer({ externalSupplyMode = false, onBookingComplete }) {
  const [destinationQuery, setDestinationQuery] = useState('Chikmagalur');
  const [radiusMeters, setRadiusMeters] = useState(15000);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [categoriesSummary, setCategoriesSummary] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Real-world hotels from SerpAPI
  const [liveHotels, setLiveHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Configuration for Day Matrix
  const [durationDays, setDurationDays] = useState(3);
  const [pacePreference, setPacePreference] = useState('balanced');

  // Day-wise matrix state: array of { day_number, selected_activities: [], selected_hotel: {} }
  const [dayMatrix, setDayMatrix] = useState([]);

  // Synthesized AI Result
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizedTrip, setSynthesizedTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary'); // 'itinerary' | 'pricing' | 'optimizations'

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
          updated.push(existing);
        } else {
          updated.push({
            day_number: i,
            selected_activities: [],
            selected_hotel: {
              name: 'Standard Hillview Stay',
              price_per_night: 3500,
              type: 'standard'
            }
          });
        }
      }
      return updated;
    });
  }, [durationDays]);

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
    if (!window.L || !mapRef.current || !geoData) return;

    const lat = geoData.lat || 13.3161;
    const lng = geoData.lng || 75.7720;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapRef.current).setView([lat, lng], 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lng], 12);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 150);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Main Destination Hub Pin
    const hubIcon = window.L.divIcon({
      className: 'custom-hub-pin',
      html: `<div style="background-color: #0d9488; color: white; font-weight: bold; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    const hubMarker = window.L.marker([lat, lng], { icon: hubIcon })
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

        const marker = window.L.circleMarker([att.lat, att.lng], {
          radius: 7,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-size: 12px; line-height: 1.3;">
              <b style="color: #047857; font-size: 13px;">${att.name}</b><br/>
              <span style="color: #6366f1; font-weight:600; font-size: 10px;">${att.category}</span><br/>
              <span style="color: #d97706; font-size: 11px;">📍 ${att.dist_meters}m from center</span>
            </div>
          `);
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

  // Select hotel radio button for a given day
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

  // Trigger Gemini Custom Itinerary Synthesizer
  const handleSynthesizeCustomTrip = async () => {
    setSynthesizing(true);
    setTranslatedTripTitle(null);
    try {
      const payload = {
        destination_name: geoData?.name || destinationQuery,
        duration_days: durationDays,
        pace_preference: pacePreference,
        day_selections: dayMatrix,
        external_supply_mode: externalSupplyMode,
        lat: geoData?.lat,
        lng: geoData?.lng
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
              OpenTripMap auto-discovers real tourist spots, and Gemini Flash constructs a seamless, void-filled itinerary.
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
              className="bg-slate-950/80 border border-slate-700 text-slate-200 text-xs rounded-2xl px-3 py-3 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value={5000}>5 km radius</option>
              <option value={10000}>10 km radius</option>
              <option value={15000}>15 km radius (Default)</option>
              <option value={25000}>25 km radius</option>
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
                {attractions.length} Tourist Landmarks Discovered
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
            <span>Powered by OpenStreetMap + OpenTripMap Live POIs</span>
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
              Click to view location
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {filteredAttractions.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No spots found in this category. Expand radius or select "All".
              </div>
            ) : (
              filteredAttractions.map((spot, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (mapInstanceRef.current && spot.lat && spot.lng) {
                      mapInstanceRef.current.flyTo([spot.lat, spot.lng], 15, { duration: 1.2 });
                    }
                  }}
                  className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/50 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-teal-300 truncate">
                      {spot.name}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-teal-400 font-medium">
                        {spot.category}
                      </span>
                      {spot.dist_meters && (
                        <span>📍 {spot.dist_meters}m from center</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Day-Wise Multi-Select Experience Matrix Studio */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-teal-400" />
              Day-Wise Multi-Select Experience Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Select multiple experiences per day (checkboxes) and pick your preferred hotel/stay (radio buttons).
            </p>
          </div>

          {/* Duration & Pace Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">Duration:</span>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-teal-300 focus:outline-none cursor-pointer"
              >
                <option value={1}>1 Day (Express)</option>
                <option value={2}>2 Days (Weekend)</option>
                <option value={3}>3 Days (Standard)</option>
                <option value={4}>4 Days (Extended)</option>
                <option value={5}>5 Days (Complete)</option>
                <option value={6}>6 Days</option>
                <option value={7}>7 Days (Grand)</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
              {[
                { id: 'relaxed', label: 'Relaxed' },
                { id: 'balanced', label: 'Balanced' },
                { id: 'packed', label: 'Packed' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPacePreference(p.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    pacePreference === p.id
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
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
                className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-teal-500/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 font-extrabold text-xs font-mono">
                      DAY {dayNum}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {currentActs.length} Activities Selected
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
                                  ? 'bg-teal-950/40 border border-teal-500/60 text-white'
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

                  {/* Radio Buttons for Stay / Hotel */}
                  <div className="space-y-2 pt-2 border-t border-slate-700/40">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Night {dayNum} Stay (Radio Select):
                    </span>

                    {/* If External Supply Mode is enabled and live hotels exist */}
                    {externalSupplyMode && liveHotels.length > 0 ? (
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
                                  ? 'bg-amber-950/40 border-amber-500 text-white'
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
                                  ? 'bg-teal-950/40 border-teal-500 text-white'
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
              Gemini will resolve timing clashes, fill empty schedule voids, and compute zero-float Decimal pricing.
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

          {/* AI Optimization Intelligence Cards */}
          {synthesizedTrip.ai_optimizations && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/60 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Conflicts Resolved</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {synthesizedTrip.ai_optimizations.conflicts_resolved?.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-teal-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Activity Voids Filled</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {synthesizedTrip.ai_optimizations.voids_filled?.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <TrendingDown className="w-4 h-4" />
                  <span>Cost & Date Optimization</span>
                </div>
                <p className="text-xs text-slate-300">
                  {synthesizedTrip.ai_optimizations.cost_optimization_tip}
                </p>
              </div>
            </div>
          )}

          {/* Day-by-Day Timeline Schedule */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              Day-by-Day Schedule
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
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-left w-full md:w-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Custom Package Price (Zero-Float Decimal)
              </span>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-black text-teal-400 font-mono">
                  ₹{parseFloat(synthesizedTrip.estimated_pricing?.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400">
                  (Includes ₹{synthesizedTrip.estimated_pricing?.gst_tax} GST)
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 pt-1">
                <span>Hotels: ₹{synthesizedTrip.estimated_pricing?.hotel_total}</span>
                <span>•</span>
                <span>Activities: ₹{synthesizedTrip.estimated_pricing?.activities_total}</span>
                <span>•</span>
                <span>Transfers: ₹{synthesizedTrip.estimated_pricing?.transfers_total}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (onBookingComplete) {
                  onBookingComplete({
                    trip_title: synthesizedTrip.trip_title,
                    destination: synthesizedTrip.destination,
                    duration_days: synthesizedTrip.duration_days,
                    grand_total: synthesizedTrip.estimated_pricing?.grand_total,
                    currency: 'INR'
                  });
                } else {
                  alert(`Booking Confirmed for "${synthesizedTrip.trip_title}"! Total: ₹${synthesizedTrip.estimated_pricing?.grand_total}`);
                }
              }}
              className="w-full md:w-auto px-8 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <ShieldCheck className="w-5 h-5" />
              Book Custom Itinerary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
