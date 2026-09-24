import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { MapPin, Navigation, Compass, Layers, Info } from 'lucide-react';

export default function TripMap({ city, lat, lng, cityName }) {
  const [attractions, setAttractions] = useState([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(3000);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const defaultLat = lat || 12.9716; // Bengaluru default
  const defaultLng = lng || 77.5946;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 12);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([defaultLat, defaultLng], 12);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add Main Destination Marker
    const mainMarker = window.L.marker([defaultLat, defaultLng])
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${cityName || 'Trip Destination'}</b><br/>Primary Tour Center`)
      .openPopup();
    markersRef.current.push(mainMarker);

    return () => {
      // Cleanup on unmount if needed
    };
  }, [defaultLat, defaultLng, cityName]);

  // Fetch OpenTripMap Real-World Attractions around the destination
  useEffect(() => {
    async function fetchAttractions() {
      setLoadingAttractions(true);
      try {
        const res = await api.getNearbyAttractions(defaultLat, defaultLng, radiusMeters);
        if (res.status === 'success' && res.data) {
          setAttractions(res.data);

          // Add markers to map
          if (mapInstanceRef.current && window.L) {
            res.data.forEach((item) => {
              if (item.lat && item.lng) {
                const marker = window.L.circleMarker([item.lat, item.lng], {
                  radius: 7,
                  fillColor: '#14b8a6',
                  color: '#0f766e',
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.85
                })
                  .addTo(mapInstanceRef.current)
                  .bindPopup(`<b>${item.name}</b><br/>${item.kinds || 'Attraction'}<br/>Dist: ${item.distance_meters}m`);
                markersRef.current.push(marker);
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to load attractions from OpenTripMap:', err);
      } finally {
        setLoadingAttractions(false);
      }
    }

    fetchAttractions();
  }, [defaultLat, defaultLng, radiusMeters]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Interactive Itinerary & Exploration Map</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium">
                OpenTripMap Grounded
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live geographic landmarks around {cityName || 'destination'}
            </p>
          </div>
        </div>

        {/* Radius Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Radius:</span>
          <select
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-teal-500"
          >
            <option value={1000}>1 km radius</option>
            <option value={3000}>3 km radius</option>
            <option value={5000}>5 km radius</option>
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner z-0"
        style={{ minHeight: '320px' }}
      />

      {/* Attractions List Snippets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Points of Interest ({attractions.length} discovered)</span>
          {loadingAttractions && <span className="text-teal-400 animate-pulse">Scanning map...</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
          {attractions.slice(0, 6).map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 text-xs flex items-start space-x-2 hover:bg-slate-800 transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-200 truncate">{item.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{item.kinds?.split(',')[0]} • {item.distance_meters}m</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
