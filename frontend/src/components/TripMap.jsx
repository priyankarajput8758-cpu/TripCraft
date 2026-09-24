import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { MapPin, Navigation, Compass, Layers, Info, Filter, ExternalLink, Sparkles } from 'lucide-react';

export default function TripMap({ city, lat, lng, cityName }) {
  const [attractions, setAttractions] = useState([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeAttraction, setActiveAttraction] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const defaultLat = lat || 12.9716; // Default to Bengaluru if coords missing
  const defaultLng = lng || 77.5946;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([defaultLat, defaultLng], 13);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add Main Destination Marker with distinct styling
    const mainIcon = window.L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #14b8a6; color: #022c22; font-weight: bold; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">📍</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26]
    });

    const mainMarker = window.L.marker([defaultLat, defaultLng], { icon: mainIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<div style="color: #0f172a; font-family: sans-serif;"><b style="font-size: 13px;">${cityName || 'Destination Hub'}</b><br/><span style="font-size: 11px; color: #475569;">Central Tour Gathering Point</span></div>`)
      .openPopup();
    markersRef.current.push(mainMarker);

  }, [defaultLat, defaultLng, cityName]);

  // Fetch OpenTripMap Real-World Attractions around destination coordinates
  useEffect(() => {
    async function fetchAttractions() {
      setLoadingAttractions(true);
      try {
        const res = await api.getNearbyAttractions(defaultLat, defaultLng, radiusMeters);
        const list = res?.attractions || res?.data || [];
        setAttractions(list);

        // Add attraction markers to Leaflet map
        if (mapInstanceRef.current && window.L && list.length > 0) {
          list.forEach((item) => {
            if (item.lat && item.lng) {
              const marker = window.L.circleMarker([item.lat, item.lng], {
                radius: 8,
                fillColor: '#f59e0b',
                color: '#78350f',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85
              })
                .addTo(mapInstanceRef.current)
                .bindPopup(`
                  <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
                    <b style="color: #047857; font-size: 13px;">${item.name}</b><br/>
                    <span style="color: #64748b; font-size: 11px;">${Array.isArray(item.kinds) ? item.kinds.slice(0, 3).join(', ') : item.kinds || 'Attraction'}</span><br/>
                    <span style="font-weight: 600; color: #d97706;">📍 ${item.dist_meters || 0}m from center</span>
                  </div>
                `);
              markersRef.current.push(marker);
            }
          });
        }
      } catch (err) {
        console.error('Failed to load attractions from OpenTripMap:', err);
      } finally {
        setLoadingAttractions(false);
      }
    }

    fetchAttractions();
  }, [defaultLat, defaultLng, radiusMeters]);

  // Filtered attractions list
  const filteredAttractions = attractions.filter(item => {
    if (selectedCategory === 'all') return true;
    const kindsStr = Array.isArray(item.kinds) ? item.kinds.join(' ') : (item.kinds || '');
    if (selectedCategory === 'temple' && (kindsStr.includes('religion') || kindsStr.includes('temple') || kindsStr.includes('hindu'))) return true;
    if (selectedCategory === 'historic' && (kindsStr.includes('historic') || kindsStr.includes('monument') || kindsStr.includes('architecture'))) return true;
    if (selectedCategory === 'nature' && (kindsStr.includes('natural') || kindsStr.includes('park') || kindsStr.includes('garden') || kindsStr.includes('water'))) return true;
    if (selectedCategory === 'culture' && (kindsStr.includes('cultural') || kindsStr.includes('museum') || kindsStr.includes('theatre'))) return true;
    return false;
  });

  const handleFocusAttraction = (item) => {
    setActiveAttraction(item);
    if (mapInstanceRef.current && item.lat && item.lng) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 15, { duration: 1.2 });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Interactive Itinerary & Tourist Spot Discovery</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium">
                OpenTripMap API Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Explore landmarks, temples, and heritage sites around {cityName || 'destination'}
            </p>
          </div>
        </div>

        {/* Radius Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Radius:</span>
          <select
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value={2000}>2 km radius</option>
            <option value={5000}>5 km radius</option>
            <option value={10000}>10 km radius</option>
            <option value={20000}>20 km radius</option>
          </select>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mr-1">
          Filter Category:
        </span>
        {[
          { id: 'all', label: 'All Places' },
          { id: 'temple', label: 'Temples & Spiritual' },
          { id: 'historic', label: 'Heritage & Architecture' },
          { id: 'nature', label: 'Nature & Parks' },
          { id: 'culture', label: 'Museums & Culture' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner z-0"
        style={{ minHeight: '340px' }}
      />

      {/* Tourist Attractions Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Discovered Tourist Attractions ({filteredAttractions.length} spots in {cityName})
          </span>
          {loadingAttractions && (
            <span className="text-teal-400 animate-pulse flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" /> Scanning OpenTripMap...
            </span>
          )}
        </div>

        {filteredAttractions.length === 0 && !loadingAttractions ? (
          <div className="text-center py-4 bg-slate-950/40 rounded-xl text-xs text-slate-400">
            No attractions found in this category within {radiusMeters / 1000}km. Try expanding search radius or choosing "All Places".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {filteredAttractions.map((item, idx) => {
              const isFocused = activeAttraction?.name === item.name;
              const kindsList = Array.isArray(item.kinds) ? item.kinds : (item.kinds || '').split(',');
              return (
                <div
                  key={idx}
                  onClick={() => handleFocusAttraction(item)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start space-x-2.5 ${
                    isFocused
                      ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {kindsList.slice(0, 2).join(' • ')}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono pt-0.5">
                      📍 {item.dist_meters ? `${item.dist_meters}m away` : 'Nearby'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
