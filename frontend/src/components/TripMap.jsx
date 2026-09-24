import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { MapPin, Compass } from 'lucide-react';

// Fix Leaflet marker icons in React/Vite bundlers safely
if (L && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export default function TripMap({ city, lat, lng, cityName }) {
  const [attractions, setAttractions] = useState([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const defaultLat = parseFloat(lat) || 12.9716;
  const defaultLng = parseFloat(lng) || 77.5946;

  // Initialize and update Leaflet Map safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up if container was marked by a previous Leaflet initialization
    if (mapContainerRef.current._leaflet_id && !mapInstanceRef.current) {
      delete mapContainerRef.current._leaflet_id;
    }

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 300);
      } else {
        mapInstanceRef.current.setView([defaultLat, defaultLng], 13);
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);
      }

      // Clear old markers
      markersRef.current.forEach(m => {
        try { m.remove(); } catch (e) {}
      });
      markersRef.current = [];

      // Add Main Destination Marker
      const mainMarker = L.marker([defaultLat, defaultLng])
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${cityName || 'Trip Destination'}</b><br/>Primary Tour Center`)
        .openPopup();
      markersRef.current.push(mainMarker);
    } catch (err) {
      console.warn('Leaflet map initialization safe catch:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, [defaultLat, defaultLng, cityName]);

  // Fetch OpenTripMap Real-World Attractions around the destination
  useEffect(() => {
    let isCancelled = false;

    async function fetchAttractions() {
      setLoadingAttractions(true);
      try {
        const res = await api.getNearbyAttractions(defaultLat, defaultLng, radiusMeters);
        if (isCancelled) return;
        const list = Array.isArray(res) ? res : (res?.attractions || res?.data || []);
        setAttractions(list);

        // Add markers to map if map is alive
        if (mapInstanceRef.current && Array.isArray(list)) {
          list.forEach((item) => {
            if (item.lat && item.lng) {
              const marker = L.circleMarker([item.lat, item.lng], {
                radius: 7,
                fillColor: '#2563eb',
                color: '#1d4ed8',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85
              })
                .addTo(mapInstanceRef.current)
                .bindPopup(`<b>${item.name || 'Point of Interest'}</b><br/>${item.category || item.kinds?.split?.(',')[0] || 'Attraction'}<br/>Dist: ${item.dist_formatted || (item.dist_meters ? item.dist_meters + 'm' : '')}`);
              markersRef.current.push(marker);
            }
          });
        }
      } catch (err) {
        console.warn('Failed to load attractions from OpenTripMap:', err);
      } finally {
        if (!isCancelled) setLoadingAttractions(false);
      }
    }

    fetchAttractions();

    return () => {
      isCancelled = true;
    };
  }, [defaultLat, defaultLng, radiusMeters]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Interactive Itinerary & Exploration Map</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
                OpenTripMap Grounded
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Live geographic landmarks around {cityName || 'destination'}
            </p>
          </div>
        </div>

        {/* Radius Selector */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 font-bold">Radius:</span>
          <select
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-2.5 py-1 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value={1000}>1 km radius</option>
            <option value={3000}>3 km radius</option>
            <option value={5000}>5 km radius</option>
            <option value={10000}>10 km radius</option>
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0"
        style={{ minHeight: '320px' }}
      />

      {/* Attractions List Snippets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
          <span>Points of Interest ({attractions.length} discovered)</span>
          {loadingAttractions && <span className="text-blue-600 animate-pulse">Scanning map...</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
          {attractions.slice(0, 6).map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs flex items-start space-x-2 hover:bg-slate-100 transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 truncate">{item.name || 'Attraction Spot'}</div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  {item.category || item.kinds?.split?.(',')[0] || 'Point of Interest'} • {item.dist_formatted || (item.dist_meters ? item.dist_meters + 'm' : '')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
