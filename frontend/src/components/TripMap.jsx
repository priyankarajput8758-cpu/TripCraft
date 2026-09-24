import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { MapPin, Navigation, Compass, Filter, Sparkles, ExternalLink, X, Info } from 'lucide-react';
import { t } from '../i18n';

// Fix Leaflet marker icons in Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function TripMap({ cityName = 'Bengaluru', lat = 12.9716, lng = 77.5946, currentLanguage = 'en' }) {
  const [attractions, setAttractions] = useState([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(15000);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeAttraction, setActiveAttraction] = useState(null);
  const [selectedSpotModal, setSelectedSpotModal] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const defaultLat = lat || 12.9716;
  const defaultLng = lng || 77.5946;

  // Initialize or re-center Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([defaultLat, defaultLng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([defaultLat, defaultLng], 12);
    }

    // Force Leaflet container reflow so tiles never render grey/blank
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Main Destination Hub Marker
    const mainIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #0d9488; color: white; font-weight: bold; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    const mainMarker = L.marker([defaultLat, defaultLng], { icon: mainIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<div style="color: #0f172a; font-family: sans-serif;"><b style="font-size: 13px;">${cityName || 'Destination Hub'}</b><br/><span style="font-size: 11px; color: #475569;">Central Tour Gathering Point</span></div>`)
      .openPopup();
    markersRef.current.push(mainMarker);

  }, [defaultLat, defaultLng, cityName]);

  // Fetch OpenTripMap Real-World Attractions around coordinates
  useEffect(() => {
    async function fetchAttractions() {
      setLoadingAttractions(true);
      try {
        const res = await api.getNearbyAttractions(defaultLat, defaultLng, radiusMeters);
        const list = res?.attractions || res?.data || [];
        setAttractions(list);

        // Add attraction markers to Leaflet map
        if (mapInstanceRef.current && list.length > 0) {
          list.forEach((item) => {
            if (item.lat && item.lng) {
              let color = '#f59e0b';
              if (item.category === 'Temple & Spiritual') color = '#ec4899';
              else if (item.category === 'Heritage & Architecture') color = '#8b5cf6';
              else if (item.category === 'Nature & Scenic') color = '#10b981';

              const distDisplay = item.dist_formatted || (item.dist_meters ? (item.dist_meters > 1000 ? `${(item.dist_meters / 1000).toFixed(1)} km` : `${item.dist_meters} m`) : 'Nearby');

              const marker = L.circleMarker([item.lat, item.lng], {
                radius: 8,
                fillColor: color,
                color: '#ffffff',
                weight: 1.5,
                opacity: 1,
                fillOpacity: 0.9
              })
                .addTo(mapInstanceRef.current)
                .bindPopup(`
                  <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; line-height: 1.4;">
                    <b style="color: #047857; font-size: 13px;">${item.name}</b><br/>
                    <span style="color: #6366f1; font-weight:600; font-size: 10px;">${item.category}</span><br/>
                    <span style="font-weight: 600; color: #d97706;">📍 ${distDisplay} from center</span>
                  </div>
                `);

              marker.on('click', () => {
                setSelectedSpotModal(item);
              });

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
    if (selectedCategory === 'temple' && item.category === 'Temple & Spiritual') return true;
    if (selectedCategory === 'historic' && item.category === 'Heritage & Architecture') return true;
    if (selectedCategory === 'nature' && item.category === 'Nature & Scenic') return true;
    if (selectedCategory === 'culture' && item.category === 'Museum & Culture') return true;
    return false;
  });

  const handleFocusAttraction = (item) => {
    setActiveAttraction(item);
    if (mapInstanceRef.current && item.lat && item.lng) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 14, { duration: 1 });
    }
    setSelectedSpotModal(item);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{t('interactive_map', currentLanguage)}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold">
                OpenTripMap + Leaflet Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {cityName} • Click any landmark marker for instant details and photos
            </p>
          </div>
        </div>

        {/* Radius Selector up to 90km */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">{t('radius', currentLanguage)}:</span>
          <select
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer font-medium"
          >
            <option value={5000} className="bg-slate-900 text-slate-100">5 km radius</option>
            <option value={15000} className="bg-slate-900 text-slate-100">15 km radius</option>
            <option value={30000} className="bg-slate-900 text-slate-100">30 km radius</option>
            <option value={60000} className="bg-slate-900 text-slate-100">60 km radius</option>
            <option value={90000} className="bg-slate-900 text-slate-100">90 km radius (Regional)</option>
          </select>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner">
        <div
          ref={mapContainerRef}
          className="w-full h-80 sm:h-96 rounded-2xl z-0"
          style={{ minHeight: '380px' }}
        />
        {loadingAttractions && (
          <div className="absolute top-3 right-3 z-20 bg-slate-950/90 text-teal-300 text-xs px-3 py-1.5 rounded-xl border border-teal-500/40 shadow-lg flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-teal-400" />
            <span>Scanning OpenTripMap...</span>
          </div>
        )}
      </div>

      {/* Discovered Attractions Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-slate-200">
            {t('discovered_attractions', currentLanguage)} ({filteredAttractions.length} spots within {radiusMeters / 1000}km)
          </span>
          <span className="text-teal-400 text-[11px]">
            {t('click_for_details', currentLanguage)}
          </span>
        </div>

        {filteredAttractions.length === 0 && !loadingAttractions ? (
          <div className="text-center py-6 bg-slate-950/40 rounded-2xl text-xs text-slate-400 border border-slate-800">
            No attractions found in this category within {radiusMeters / 1000}km. Expand search radius up to 90km.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
            {filteredAttractions.map((item, idx) => {
              const isFocused = activeAttraction?.name === item.name;
              const distDisplay = item.dist_formatted || (item.dist_meters ? (item.dist_meters > 1000 ? `${(item.dist_meters / 1000).toFixed(1)} km` : `${item.dist_meters} m`) : 'Nearby');

              return (
                <div
                  key={idx}
                  onClick={() => handleFocusAttraction(item)}
                  className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start space-x-2.5 ${
                    isFocused
                      ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-teal-500/40'
                  }`}
                >
                  <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-400 shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-bold text-white truncate">{item.name}</div>
                    <div className="text-[10px] text-teal-400 font-medium">
                      {item.category}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      📍 {distDisplay} from center
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spot Detail Modal Card */}
      {selectedSpotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-teal-500/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
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
                  <span>📍 {selectedSpotModal.dist_formatted || `${selectedSpotModal.dist_meters}m`} from {cityName} center</span>
                  {selectedSpotModal.lat && (
                    <span>• ({selectedSpotModal.lat?.toFixed(3)}, {selectedSpotModal.lng?.toFixed(3)})</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                {selectedSpotModal.short_desc || `Explore ${selectedSpotModal.name}, a featured ${selectedSpotModal.category} destination spot.`}
              </p>

              {selectedSpotModal.kinds && (
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(selectedSpotModal.kinds) ? selectedSpotModal.kinds : selectedSpotModal.kinds.split(',')).slice(0, 4).map((k, i) => (
                    <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                      {k.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
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
    </div>
  );
}
