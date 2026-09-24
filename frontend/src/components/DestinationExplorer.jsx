import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { t } from '../i18n';
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
  PlusCircle,
  Eye
} from 'lucide-react';

// Fix Leaflet marker icons in Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function DestinationExplorer({ externalSupplyMode = false, onBookingComplete, currentLanguage = 'en' }) {
  const [destinationQuery, setDestinationQuery] = useState('Chikmagalur');
  const [radiusMeters, setRadiusMeters] = useState(30000); // 30km default
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [categoriesSummary, setCategoriesSummary] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Spot detail modal
  const [selectedSpotModal, setSelectedSpotModal] = useState(null);

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
              name: 'Cozy Hill Cottage (Standard)',
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

        // Fetch Live Hotels via SerpAPI
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
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([lat, lng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lng], 12);
    }

    // Force Leaflet container reflow so tiles never render grey/blank
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Main Destination Hub Pin
    const hubIcon = L.divIcon({
      className: 'custom-hub-pin',
      html: `<div style="background-color: #0d9488; color: white; font-weight: bold; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">📍</div>`,
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
        let color = '#f59e0b';
        if (att.category === 'Temple & Spiritual') color = '#ec4899';
        else if (att.category === 'Heritage & Architecture') color = '#8b5cf6';
        else if (att.category === 'Nature & Scenic') color = '#10b981';

        const distDisplay = att.dist_formatted || (att.dist_meters ? (att.dist_meters > 1000 ? `${(att.dist_meters / 1000).toFixed(1)} km` : `${att.dist_meters} m`) : 'Nearby');

        const marker = L.circleMarker([att.lat, att.lng], {
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-size: 12px; line-height: 1.3;">
              <b style="color: #047857; font-size: 13px;">${att.name}</b><br/>
              <span style="color: #6366f1; font-weight:600; font-size: 10px;">${att.category}</span><br/>
              <span style="color: #d97706; font-size: 11px;">📍 ${distDisplay} from center</span>
            </div>
          `);

        marker.on('click', () => {
          setSelectedSpotModal(att);
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
                {t('custom_architect', currentLanguage)}
              </span>
              {externalSupplyMode && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {t('external_supply', currentLanguage)}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('custom_architect', currentLanguage)}
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Explore tourist landmarks and hidden gems up to <b className="text-teal-300 font-mono">90km radius</b> around any destination.
              Click any place to inspect photos and info, select experiences day-wise, and generate an optimized plan.
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
              placeholder={t('search_placeholder', currentLanguage)}
              className="w-full bg-slate-950/80 border border-slate-700 text-white rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Radius Selector up to 90km */}
            <select
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="bg-slate-950/90 border border-slate-700 text-slate-100 text-xs rounded-2xl px-3.5 py-3 focus:outline-none focus:border-teal-500 cursor-pointer font-medium"
            >
              <option value={5000} className="bg-slate-900 text-slate-100">5 km radius</option>
              <option value={15000} className="bg-slate-900 text-slate-100">15 km radius</option>
              <option value={30000} className="bg-slate-900 text-slate-100">30 km radius (Default)</option>
              <option value={60000} className="bg-slate-900 text-slate-100">60 km radius (Wide)</option>
              <option value={90000} className="bg-slate-900 text-slate-100">90 km radius (Regional)</option>
            </select>

            <button
              type="submit"
              disabled={loadingExplore}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-2xl transition-all shadow-lg shadow-teal-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingExplore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('scanning', currentLanguage)}
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4" />
                  {t('explore_spots', currentLanguage)}
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
              <span className="font-semibold text-white">Geocoded:</span>
              <span className="text-teal-300 font-medium">{geoData.display_name || geoData.name}</span>
              <span className="text-slate-500 font-mono">({geoData.lat?.toFixed(3)}, {geoData.lng?.toFixed(3)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono font-bold">
                {attractions.length} {t('tourist_landmarks', currentLanguage)}
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
                {t('interactive_map', currentLanguage)}
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
            style={{ minHeight: '380px' }}
          />

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>OpenStreetMap + OpenTripMap Live POIs</span>
            <span className="text-teal-400 font-mono">Showing {filteredAttractions.length} spots (up to {radiusMeters / 1000}km)</span>
          </div>
        </div>

        {/* Tourist Spots Directory Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                {t('discovered_attractions', currentLanguage)}
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {t('click_for_details', currentLanguage)}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
            {filteredAttractions.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No spots found in this category. Expand radius up to 90km or select "All".
              </div>
            ) : (
              filteredAttractions.map((spot, idx) => {
                const distDisplay = spot.dist_formatted || (spot.dist_meters ? (spot.dist_meters > 1000 ? `${(spot.dist_meters / 1000).toFixed(1)} km` : `${spot.dist_meters} m`) : 'Nearby');

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedSpotModal(spot);
                      if (mapInstanceRef.current && spot.lat && spot.lng) {
                        mapInstanceRef.current.flyTo([spot.lat, spot.lng], 14, { duration: 1 });
                      }
                    }}
                    className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/50 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={spot.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80'}
                        alt={spot.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-700"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=120&q=80';
                        }}
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-teal-300 truncate">
                          {spot.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-teal-400 font-medium">
                            {spot.category}
                          </span>
                          <span className="font-mono">📍 {distDisplay}</span>
                        </div>
                      </div>
                    </div>
                    <Eye className="w-4 h-4 text-slate-500 group-hover:text-teal-400 shrink-0 transition-colors" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Spot Detail Modal Card */}
      {selectedSpotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-teal-500/50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
            {/* Spot Image Header */}
            <div className="relative h-48 w-full bg-slate-950">
              <img
                src={selectedSpotModal.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                alt={selectedSpotModal.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <button
                onClick={() => setSelectedSpotModal(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-xl border border-slate-700 text-xs font-bold text-teal-300">
                {selectedSpotModal.category}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 pt-0 space-y-3">
              <div>
                <h4 className="text-lg font-bold text-white">
                  {selectedSpotModal.name}
                </h4>
                <div className="text-xs text-slate-400 flex items-center gap-2 pt-1 font-mono">
                  <span>📍 {selectedSpotModal.dist_formatted || `${selectedSpotModal.dist_meters}m`} from {destinationQuery}</span>
                  {selectedSpotModal.lat && (
                    <span>• ({selectedSpotModal.lat?.toFixed(3)}, {selectedSpotModal.lng?.toFixed(3)})</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                {selectedSpotModal.short_desc || `Explore ${selectedSpotModal.name}, a prominent ${selectedSpotModal.category} destination offering memorable cultural or scenic sights.`}
              </p>

              {/* Quick Add To Itinerary Day 1..N */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Add to Day:
                </span>
                <div className="flex flex-wrap gap-2">
                  {dayMatrix.map((day) => {
                    const isAdded = day.selected_activities?.includes(selectedSpotModal.name);
                    return (
                      <button
                        key={day.day_number}
                        onClick={() => handleToggleActivity(day.day_number, selectedSpotModal.name)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isAdded
                            ? 'bg-teal-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                        <span>Day {day.day_number}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setSelectedSpotModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (mapInstanceRef.current && selectedSpotModal.lat && selectedSpotModal.lng) {
                      mapInstanceRef.current.flyTo([selectedSpotModal.lat, selectedSpotModal.lng], 15, { duration: 1 });
                    }
                    setSelectedSpotModal(null);
                  }}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Locate on Map
                </button>
              </div>
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
              {t('day_matrix_title', currentLanguage)}
            </h3>
            <p className="text-xs text-slate-400">
              {t('day_matrix_subtitle', currentLanguage)}
            </p>
          </div>

          {/* Duration & Pace Controls - FIXED HIGH CONTRAST DARK THEME STYLING */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700 px-3.5 py-2 rounded-xl">
              <span className="text-xs text-slate-400 font-medium">{t('duration_label', currentLanguage)}</span>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="bg-slate-900 text-slate-100 text-xs font-bold focus:outline-none cursor-pointer border-none"
              >
                <option value={1} className="bg-slate-900 text-slate-100">1 Day (Express)</option>
                <option value={2} className="bg-slate-900 text-slate-100">2 Days (Weekend)</option>
                <option value={3} className="bg-slate-900 text-slate-100">3 Days (Standard)</option>
                <option value={4} className="bg-slate-900 text-slate-100">4 Days (Extended)</option>
                <option value={5} className="bg-slate-900 text-slate-100">5 Days (Complete)</option>
                <option value={6} className="bg-slate-900 text-slate-100">6 Days</option>
                <option value={7} className="bg-slate-900 text-slate-100">7 Days (Grand)</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs">
              {[
                { id: 'relaxed', label: t('pace_relaxed', currentLanguage) },
                { id: 'balanced', label: t('pace_balanced', currentLanguage) },
                { id: 'packed', label: t('pace_packed', currentLanguage) }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPacePreference(p.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    pacePreference === p.id
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
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
                        attractions.slice(0, 12).map((spot, i) => {
                          const isChecked = currentActs.includes(spot.name);
                          const distDisplay = spot.dist_formatted || (spot.dist_meters ? (spot.dist_meters > 1000 ? `${(spot.dist_meters / 1000).toFixed(1)} km` : `${spot.dist_meters} m`) : 'Nearby');

                          return (
                            <div
                              key={i}
                              onClick={() => handleToggleActivity(dayNum, spot.name)}
                              className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-teal-950/40 border border-teal-500/60 text-white'
                                  : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-900'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="shrink-0 text-teal-400">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 fill-teal-500 text-slate-950" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-600" />
                                  )}
                                </div>
                                <span className="truncate font-medium">{spot.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                {distDisplay}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Radio Buttons for Stay / Hotel with Actual Cost & Price Difference */}
                  <div className="space-y-2 pt-2 border-t border-slate-700/40">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Night {dayNum} Hotel Stay (Radio Select):
                    </span>

                    {/* If External Supply Mode is enabled and live hotels exist */}
                    {externalSupplyMode && liveHotels.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {liveHotels.slice(0, 5).map((h, hIdx) => {
                          const isSelected = selectedHotel?.name === h.name;
                          const rateNum = parseFloat(h.rate_per_night || 4500);
                          const baseStandardRate = 3500;
                          const diff = rateNum - baseStandardRate;
                          const diffFormatted = diff >= 0 ? `+₹${diff.toLocaleString('en-IN')}` : `-₹${Math.abs(diff).toLocaleString('en-IN')}`;

                          return (
                            <div
                              key={hIdx}
                              onClick={() => handleSelectHotel(dayNum, {
                                name: h.name,
                                price_per_night: rateNum,
                                type: 'external_serpapi',
                                link: h.link
                              })}
                              className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
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
                              <div className="text-right shrink-0">
                                <div className="font-mono text-amber-400 text-[11px] font-bold">
                                  ₹{rateNum.toLocaleString('en-IN')}
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono">
                                  {isSelected ? 'Selected' : diffFormatted}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Default Standard Tiers with Actual Cost and Delta
                      <div className="space-y-1.5">
                        {[
                          { name: 'Cozy Hill Cottage (Standard)', price_per_night: 3500, type: 'standard' },
                          { name: 'Luxury Coffee Estate Resort', price_per_night: 7500, type: 'luxury' },
                          { name: 'Eco Nature Homestay (Budget)', price_per_night: 2200, type: 'budget' }
                        ].map((tier, tIdx) => {
                          const isSelected = selectedHotel?.name === tier.name;
                          const baseRate = 3500;
                          const diff = tier.price_per_night - baseRate;
                          const diffFormatted = diff === 0 ? 'Included (+₹0)' : (diff > 0 ? `+₹${diff.toLocaleString('en-IN')}` : `-₹${Math.abs(diff).toLocaleString('en-IN')}`);

                          return (
                            <div
                              key={tIdx}
                              onClick={() => handleSelectHotel(dayNum, tier)}
                              className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
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
                              <div className="text-right shrink-0">
                                <div className="font-mono text-teal-400 text-[11px] font-bold">
                                  ₹{tier.price_per_night.toLocaleString('en-IN')}
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono">
                                  {isSelected ? 'Active Tier' : diffFormatted}
                                </div>
                              </div>
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
                {t('synthesizing_btn', currentLanguage)}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                {t('synthesize_btn', currentLanguage)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Custom Package Output Section */}
      {synthesizedTrip && (
        <div
          id="custom-itinerary-output"
          className="bg-slate-900 border border-teal-500/40 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn space-y-6"
        >
          {/* Cover Photography Hero Banner */}
          {synthesizedTrip.cover_image && (
            <div className="relative h-48 sm:h-64 w-full bg-slate-950 overflow-hidden">
              <img
                src={synthesizedTrip.cover_image}
                alt={synthesizedTrip.destination}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur text-slate-950 text-xs font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Gemini Optimized & Verified
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur border border-slate-700 text-slate-200 text-xs font-mono">
                      {synthesizedTrip.duration_days} Days / {synthesizedTrip.duration_days - 1} Nights
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-teal-500/90 text-slate-950 text-xs font-bold uppercase">
                      {synthesizedTrip.pace} Pace
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                    {synthesizedTrip.trip_title}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Header if no cover image */}
          {!synthesizedTrip.cover_image && (
            <div className="p-6 sm:p-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
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
                  {synthesizedTrip.trip_title}
                </h3>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 pt-0 space-y-6">
            {/* AI Optimization Intelligence Cards */}
            {synthesizedTrip.ai_optimizations && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t('conflicts_resolved', currentLanguage)}</span>
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
                    <span>{t('voids_filled', currentLanguage)}</span>
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
                    <span>{t('cost_optimization', currentLanguage)}</span>
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
                {t('day_schedule', currentLanguage)}
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
                          className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 overflow-hidden flex flex-col justify-between"
                        >
                          {slot.image_url && (
                            <div className="h-24 w-full rounded-lg overflow-hidden bg-slate-950 shrink-0">
                              <img
                                src={slot.image_url}
                                alt={slot.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="text-[10px] font-mono text-teal-400 font-semibold flex items-center justify-between">
                              <span>{slot.time}</span>
                              {slot.type && (
                                <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-[9px] text-slate-300 font-normal">{slot.type}</span>
                              )}
                            </div>
                            <div className="text-xs font-bold text-white line-clamp-1">
                              {slot.title}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-2">
                              {slot.description}
                            </div>
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
                {t('grand_total', currentLanguage)}
              </span>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-black text-teal-400 font-mono">
                  ₹{parseFloat(synthesizedTrip.estimated_pricing?.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400">
                  ({t('gst_included', currentLanguage)})
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
              {t('book_custom_btn', currentLanguage)}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
