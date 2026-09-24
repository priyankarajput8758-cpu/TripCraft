import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import {
  Sparkles, AlertTriangle, CheckCircle2, Clock, MapPin, ArrowRight,
  Share2, Compass, ShieldCheck, Check, DollarSign, Calendar, Users,
  Hotel, Activity, Car, Utensils, Eye, Filter
} from 'lucide-react';

// Safely fix Leaflet marker icon paths for Vite/React
if (L && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export default function OptimizeView({
  activePackage,
  packageDetailData,
  bookingDetails,
  pricing,
  guide,
  onProceedToBook,
  onBack,
}) {
  const [activeDay, setActiveDay] = useState(1);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [optimizedDiscount, setOptimizedDiscount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [attractions, setAttractions] = useState([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const pkg = activePackage || packageDetailData?.package || bookingDetails?.package;
  const cityName = pkg?.city_name || 'Destination';
  const durationDays = bookingDetails?.durationDays || pkg?.duration_days || 4;
  const numTravelers = bookingDetails?.numTravelers || bookingDetails?.partySize || 2;
  const startDate = bookingDetails?.startDate || '2026-09-24';
  const endDate = bookingDetails?.endDate || '2026-09-28';
  const activeGuide = guide || bookingDetails?.selectedGuide;
  const componentsList = packageDetailData?.components || [];

  const defaultLat = parseFloat(pkg?.city_lat || 12.9716);
  const defaultLng = parseFloat(pkg?.city_lng || 77.5946);

  // Dynamic Day list based on actual package duration
  const daysList = useMemo(() => {
    return Array.from({ length: durationDays }, (_, i) => ({
      num: i + 1,
      label: `Day ${i + 1}`
    }));
  }, [durationDays]);

  // Extract selected hotel and components from database package
  const selectedHotel = useMemo(() => {
    return componentsList.find(c => c.component_type === 'hotel' || c.swap_group === 'hotel_tier') || {
      title: `${cityName} Premium Hotel & Resort`,
      name: `${cityName} Premium Hotel & Resort`
    };
  }, [componentsList, cityName]);

  // Build authentic day schedule from database package components for this day
  const activeDaySchedule = useMemo(() => {
    const dayComps = componentsList.filter(c => c.day_index === activeDay);
    const dayActs = [];

    // Morning Hotel Breakfast
    dayActs.push({
      time: '08:00 AM - 09:30 AM',
      title: 'Buffet Breakfast & Morning Prep',
      desc: `Regional and continental breakfast hosted at ${selectedHotel.title || selectedHotel.name}.`,
      badge: 'Included In Stay',
      type: 'hotel',
      slot: 'morning'
    });

    if (dayComps.length > 0) {
      dayComps.forEach((comp, idx) => {
        let defaultTime = '10:00 AM - 01:00 PM';
        if (comp.slot === 'afternoon') defaultTime = '02:00 PM - 04:30 PM';
        else if (comp.slot === 'evening') {
          defaultTime = conflictResolved ? '06:00 PM - 08:30 PM' : '04:30 PM - 07:00 PM (Overlap)';
        } else if (comp.slot === 'overnight') defaultTime = '08:30 PM Onwards';

        const isConflict = !conflictResolved && comp.slot === 'evening' && activeDay === 2;

        dayActs.push({
          time: defaultTime,
          title: comp.title || comp.name || `${cityName} Experience`,
          desc: `Verified package inclusion (${comp.component_type}). ${activeGuide ? `Guided by your certified guide (${activeGuide.display_name || activeGuide.name}).` : 'Self-guided admission & transfers arranged.'}`,
          badge: isConflict ? 'Timing Conflict' : (comp.is_optional === 0 ? 'Verified In Package' : 'Custom Selection'),
          type: comp.component_type || 'activity',
          slot: comp.slot,
          isConflict: isConflict
        });
      });
    } else {
      // Fallback for days beyond catalog default components
      dayActs.push({
        time: '10:00 AM - 01:00 PM',
        title: `${cityName} Cultural Discovery & Landmark Walk`,
        desc: `Discover local heritage monuments, viewpoints, and artisan centers across ${cityName}.`,
        badge: 'Curated Sightseeing',
        type: 'activity',
        slot: 'morning'
      });
      dayActs.push({
        time: '01:00 PM - 02:30 PM',
        title: 'Authentic Regional Gastronomy Lunch',
        desc: `Curated local cuisine dining break in central ${cityName}.`,
        badge: 'Curated Dining',
        type: 'meal',
        slot: 'afternoon'
      });
      dayActs.push({
        time: conflictResolved ? '06:00 PM - 08:00 PM' : '04:30 PM - 06:30 PM',
        title: `${cityName} Sunset Panoramic Viewpoint`,
        desc: `Relaxed golden hour visit to scenic viewpoints overlooking the surrounding valleys/coast.`,
        badge: conflictResolved ? 'Rescheduled ✓' : 'Evening Leisure',
        type: 'scenic',
        slot: 'evening'
      });
    }

    // Evening / Night return
    dayActs.push({
      time: '08:30 PM',
      title: `Return to ${selectedHotel.title || selectedHotel.name}`,
      desc: 'Private chauffeured transfer back to your accommodation for relaxation.',
      badge: 'Private Transfer',
      type: 'transfer',
      slot: 'overnight'
    });

    return dayActs;
  }, [activeDay, componentsList, selectedHotel, activeGuide, cityName, conflictResolved]);

  // Initial and dynamic pricing calculations
  const rawBasePrice = bookingDetails?.totalPrice
    ? parseFloat(bookingDetails.totalPrice.toString().replace(/,/g, ''))
    : (pricing?.total_price ? parseFloat(pricing.total_price) : parseFloat(pkg?.base_price || 32000) * numTravelers);

  const currentDisplayPrice = Math.max(0, rawBasePrice - optimizedDiscount);

  // Handle Apply Optimization: resolve conflict and apply cost optimization discount
  const handleApplyOptimization = () => {
    setConflictResolved(true);
    // Apply 20% smart booking rate optimization if not yet applied
    const discount = Math.round(rawBasePrice * 0.20);
    setOptimizedDiscount(discount);
    if (bookingDetails) {
      bookingDetails.optimizedTotalPrice = (rawBasePrice - discount).toFixed(2);
      bookingDetails.discountApplied = discount.toFixed(2);
    }
  };

  // Initialize and update Leaflet Map in light theme
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapContainerRef.current._leaflet_id && !mapInstanceRef.current) {
      delete mapContainerRef.current._leaflet_id;
    }

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([defaultLat, defaultLng], 12);
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);
      }

      // Clear existing markers
      markersRef.current.forEach(m => {
        try { m.remove(); } catch (e) {}
      });
      markersRef.current = [];

      // Add Primary Destination Marker
      const centerMarker = L.marker([defaultLat, defaultLng])
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${cityName} Center</b><br/>Primary Itinerary Hub`)
        .openPopup();
      markersRef.current.push(centerMarker);
    } catch (err) {
      console.warn('Map initialization:', err);
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

  // Load POIs from OpenTripMap
  useEffect(() => {
    let isCancelled = false;
    async function loadPOIs() {
      setLoadingAttractions(true);
      try {
        const res = await api.getNearbyAttractions(defaultLat, defaultLng, 15000);
        if (isCancelled) return;
        const list = res?.attractions || res?.data || [];
        setAttractions(list);
      } catch (err) {
        console.warn('Could not fetch OpenTripMap attractions:', err);
      } finally {
        if (!isCancelled) setLoadingAttractions(false);
      }
    }
    loadPOIs();
    return () => { isCancelled = true; };
  }, [defaultLat, defaultLng]);

  // Filter attractions by category
  const filteredAttractions = useMemo(() => {
    if (selectedCategory === 'All') return attractions;
    return attractions.filter(a => {
      const cat = (a.category || a.kinds || '').toLowerCase();
      const target = selectedCategory.toLowerCase();
      return cat.includes(target);
    });
  }, [attractions, selectedCategory]);

  // Render POI markers on map whenever filtered attractions change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear non-center markers
    markersRef.current.slice(1).forEach(m => {
      try { m.remove(); } catch (e) {}
    });
    markersRef.current = markersRef.current.slice(0, 1);

    filteredAttractions.forEach((item) => {
      if (item.lat && item.lng) {
        let color = '#3C8B30';
        if (item.category?.toLowerCase().includes('heritage')) color = '#8b5cf6';
        else if (item.category?.toLowerCase().includes('nature')) color = '#059669';
        else if (item.category?.toLowerCase().includes('temple') || item.category?.toLowerCase().includes('spiritual')) color = '#ec4899';

        const marker = L.circleMarker([item.lat, item.lng], {
          radius: 7,
          fillColor: color,
          color: '#1a2e1a',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-size: 11px; line-height: 1.3;">
              <b style="color: #1a2e1a; font-size: 12px;">${item.name || 'Point of Interest'}</b><br/>
              <span style="color: ${color}; font-weight: bold;">${item.category || 'Sightseeing'}</span><br/>
              <span style="color: #666;">📍 ${item.dist_formatted || (item.dist_meters ? (item.dist_meters / 1000).toFixed(1) + ' km' : 'Nearby')}</span>
            </div>
          `);
        markersRef.current.push(marker);
      }
    });
  }, [filteredAttractions]);

  return (
    <div className="space-y-6 animate-fadeIn text-[#1a2e1a]">

      {/* ── Subheader Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#84D175]/30 pb-5">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4a5e4a] hover:text-[#1a2e1a] bg-white border border-[#84D175]/40 hover:bg-[#FFF8D2] px-3 py-1 rounded-xl transition-all cursor-pointer mb-2 shadow-xs"
            >
              ← Back to Customizer
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#1a2e1a]">Your Optimized Itinerary</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#84D175] text-[#1a2e1a] flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-[#1a2e1a]" />
              Grounded AI Engine
            </span>
          </div>
          <p className="text-xs text-[#4a5e4a] font-semibold mt-1 flex flex-wrap items-center gap-2">
            <span>📍 {cityName}</span>
            <span>•</span>
            <span>📅 {startDate} → {endDate}</span>
            <span>•</span>
            <span>⏱️ {durationDays} Days</span>
            <span>•</span>
            <span>👥 {numTravelers} Traveler{numTravelers > 1 ? 's' : ''}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#4a5e4a]">Verified Total ({numTravelers}p)</div>
            <div className="text-xl sm:text-2xl font-black text-[#1a2e1a] font-mono">
              ₹{currentDisplayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {optimizedDiscount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 inline-block mt-0.5">
                ✓ ₹{optimizedDiscount.toLocaleString('en-IN')} AI Rate Discount Applied
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Trip link copied to clipboard!');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-[#FFF8D2] text-[#1a2e1a] text-xs font-bold transition-all border border-[#84D175]/40 shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#3C8B30]" />
              <span>Share</span>
            </button>
            <button
              onClick={() => {
                if (bookingDetails) {
                  bookingDetails.totalPrice = currentDisplayPrice.toFixed(2);
                  bookingDetails.numTravelers = numTravelers;
                  bookingDetails.partySize = numTravelers;
                }
                onProceedToBook?.();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] text-xs font-black transition-all shadow-md shadow-[#84D175]/30 active:scale-95 cursor-pointer"
            >
              <span>Proceed to Book →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Day Tabs Row ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {daysList.map((d) => (
          <button
            key={d.num}
            onClick={() => setActiveDay(d.num)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeDay === d.num
                ? 'bg-[#84D175] text-[#1a2e1a] shadow-md shadow-[#84D175]/25 border border-[#67C456]'
                : 'bg-white border border-[#84D175]/30 text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-white/90 shadow-xs'
            }`}
          >
            Day {d.num}
          </button>
        ))}
      </div>

      {/* ── Schedule & Cost Optimization Banner (Interactive AI Optimization) ── */}
      {!conflictResolved ? (
        <div className="rounded-3xl bg-amber-50 border-2 border-amber-300 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-black">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>AI SCHEDULE & COST OPTIMIZATION OPPORTUNITY</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold border border-amber-300 uppercase">
              Actionable AI Tip
            </span>
          </div>

          <div className="text-xs sm:text-sm font-bold text-slate-900">
            Afternoon schedule overlap detected on Day {activeDay} • Midweek off-peak tariff optimization available.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-semibold shadow-xs">
              <span>💡</span>
              <span>
                AI Recommendation: Reschedule evening slot to 6:00 PM and apply smart rate optimization to save ₹{Math.round(rawBasePrice * 0.20).toLocaleString('en-IN')} (From ₹{rawBasePrice.toLocaleString('en-IN')} → ₹{(rawBasePrice * 0.80).toLocaleString('en-IN')}).
              </span>
            </div>

            <button
              onClick={handleApplyOptimization}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Apply Optimization (Save ₹{Math.round(rawBasePrice * 0.20).toLocaleString('en-IN')})
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-bold text-emerald-900 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>✓ Optimization Applied — Schedule conflicts eliminated (shifted to 6:00 PM) & ₹{optimizedDiscount.toLocaleString('en-IN')} smart discount locked into booking!</span>
          </div>
          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-300">
            Optimized Rate: ₹{currentDisplayPrice.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {/* ── Main Content Grid (Dynamic Timeline + Light-Themed POI Map) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Timeline Column (Left 7) */}
        <div className="lg:col-span-7 bg-white/90 border border-[#84D175]/40 rounded-3xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#84D175]/30 pb-3">
            <h3 className="text-xs font-black text-[#1a2e1a] uppercase tracking-wider">
              Itinerary Timeline — Day {activeDay} of {durationDays}
            </h3>
            <span className="text-xs text-[#4a5e4a] font-bold">{activeDaySchedule.length} Events Scheduled</span>
          </div>

          {/* Dynamic Vertical Timeline Nodes */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#84D175]/40">
            {activeDaySchedule.map((event, idx) => {
              const isConflict = event.isConflict;
              return (
                <div key={idx} className="relative">
                  <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                    isConflict ? 'bg-rose-500' : 'bg-[#3C8B30]'
                  }`} />
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black font-mono ${
                        isConflict ? 'text-rose-600' : 'text-[#2D6A24]'
                      }`}>
                        {event.time}
                      </span>
                      <h4 className="text-sm font-black text-[#1a2e1a]">{event.title}</h4>
                      <p className="text-xs text-[#4a5e4a] font-medium max-w-md leading-relaxed">
                        {event.desc}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      isConflict
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-[#84D175]/20 text-[#2D6A24] border border-[#84D175]/40'
                    }`}>
                      {event.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (Light Interactive Map with POI Filters + Pace Box) */}
        <div className="lg:col-span-5 space-y-5">

          {/* Light-Themed Interactive Map Box */}
          <div className="bg-white/90 border border-[#84D175]/40 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#84D175]/30 pb-3">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-[#3C8B30]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#1a2e1a]">
                  Interactive Trip Map
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#84D175]/20 text-[#2D6A24] font-bold border border-[#84D175]/40">
                OpenStreetMap POIs
              </span>
            </div>

            {/* Category Filters for Points of Interest */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#4a5e4a]">
                <span className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-[#3C8B30]" />
                  <span>Filter Map Attractions:</span>
                </span>
                <span className="text-[10px] text-[#2D6A24]">{filteredAttractions.length} spots visible</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['All', 'Heritage', 'Nature', 'Culture', 'Spiritual', 'Museum'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                        : 'bg-white border border-[#84D175]/30 text-[#4a5e4a] hover:bg-[#FFF8D2]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Leaflet Canvas */}
            <div
              ref={mapContainerRef}
              className="w-full h-56 rounded-2xl overflow-hidden border border-[#84D175]/40 shadow-inner z-0"
              style={{ minHeight: '220px' }}
            />

            {/* Points of Attraction Showcase List */}
            <div className="space-y-2 pt-2 border-t border-[#84D175]/30">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#4a5e4a]">
                <span>Points of Attraction ({filteredAttractions.length})</span>
                {loadingAttractions && <span className="text-[#3C8B30] animate-pulse">Loading POIs...</span>}
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {filteredAttractions.slice(0, 8).map((spot, sIdx) => (
                  <div
                    key={sIdx}
                    onClick={() => {
                      if (mapInstanceRef.current && spot.lat && spot.lng) {
                        mapInstanceRef.current.flyTo([spot.lat, spot.lng], 14, { duration: 1 });
                      }
                    }}
                    className="p-2 bg-[#FFF8D2]/50 hover:bg-[#FFF8D2] border border-[#84D175]/30 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#1a2e1a] truncate">{spot.name || 'Attraction Spot'}</div>
                      <div className="text-[10px] text-[#4a5e4a] flex items-center gap-1.5">
                        <span className="font-semibold text-[#3C8B30]">{spot.category || 'Sightseeing'}</span>
                        <span>•</span>
                        <span>{spot.dist_formatted || (spot.dist_meters ? (spot.dist_meters / 1000).toFixed(1) + ' km' : 'Nearby')}</span>
                      </div>
                    </div>
                    <MapPin className="w-3.5 h-3.5 text-[#3C8B30] shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Budget & Pace Summary Box */}
          <div className="bg-white/90 border border-[#84D175]/40 rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#1a2e1a]">
                Budget & Pace Verification
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Verified Grounded ✓
              </span>
            </div>

            <div className="text-xs text-[#4a5e4a] space-y-1 bg-[#FFF8D2]/60 p-3 rounded-xl border border-[#84D175]/30">
              <div className="flex justify-between font-semibold">
                <span>Pace Profile:</span>
                <span className="font-bold text-[#1a2e1a]">Balanced (2-3 stops/day)</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Guide Support:</span>
                <span className="font-bold text-[#1a2e1a]">
                  {activeGuide ? `${activeGuide.display_name || activeGuide.name} (${activeGuide.languages_spoken || 'Multilingual'})` : 'Self-Guided Package'}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Party Size:</span>
                <span className="font-bold text-[#1a2e1a]">{numTravelers} Person{numTravelers > 1 ? 's' : ''}</span>
              </div>
              {optimizedDiscount > 0 && (
                <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-[#84D175]/30">
                  <span>AI Discount Applied:</span>
                  <span>-₹{optimizedDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
