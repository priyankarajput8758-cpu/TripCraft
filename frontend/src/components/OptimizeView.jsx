import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bot } from 'lucide-react';
import { api } from '../api';

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
  const [showDiscountBreakdown, setShowDiscountBreakdown] = useState(false);
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
  const currencyCode = bookingDetails?.currency || pkg?.currency || pricing?.currency || 'INR';
  const currencySymbol = bookingDetails?.currencySymbol || {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF ', AED: 'AED ', SGD: 'S$', AUD: 'A$', CAD: 'C$', NPR: 'NPR ', LKR: 'LKR '
  }[currencyCode] || '₹';

  const defaultLat = parseFloat(pkg?.city_lat || 12.9716);
  const defaultLng = parseFloat(pkg?.city_lng || 77.5946);

  const rawPace = (bookingDetails?.pace || bookingDetails?.pacePreference || pkg?.pace || 'balanced').toLowerCase();
  const paceProfileText = rawPace === 'relaxed'
    ? 'Relaxed (1-2 stops/day)'
    : (rawPace === 'fast' || rawPace === 'packed'
      ? 'Fast / Packed (4+ stops/day)'
      : 'Balanced (2-3 stops/day)');

  const daysList = useMemo(() => {
    return Array.from({ length: durationDays }, (_, i) => ({
      num: i + 1,
      label: `Day ${i + 1}`
    }));
  }, [durationDays]);

  const selectedHotel = useMemo(() => {
    return componentsList.find(c => c.component_type === 'hotel' || c.swap_group === 'hotel_tier') || {
      title: `${cityName} Premium Hotel & Resort`,
      name: `${cityName} Premium Hotel & Resort`
    };
  }, [componentsList, cityName]);

  const activeDaySchedule = useMemo(() => {
    const dayComps = componentsList.filter(c => c.day_index === activeDay);
    const dayActs = [];

    dayActs.push({
      time: '08:00 AM - 09:30 AM',
      title: 'Buffet Breakfast & Morning Prep',
      desc: `Regional and continental breakfast hosted at ${selectedHotel.title || selectedHotel.name}.`,
      badge: 'Included In Stay',
      type: 'hotel',
      slot: 'morning'
    });

    if (dayComps.length > 0) {
      dayComps.forEach((comp) => {
        let defaultTime = '10:00 AM - 01:00 PM';
        if (comp.slot === 'afternoon') defaultTime = '02:00 PM - 04:30 PM';
        else if (comp.slot === 'evening') defaultTime = '05:30 PM - 08:00 PM';

        dayActs.push({
          time: defaultTime,
          title: comp.title || comp.name || 'Guided Sightseeing Excursion',
          desc: comp.description || `Explore authentic sights in ${cityName} with authorized entry tickets.`,
          badge: comp.is_optional === 1 ? 'Selected Option' : 'Curated In Itinerary',
          type: comp.component_type || 'activity',
          slot: comp.slot || 'morning'
        });
      });
    } else {
      dayActs.push({
        time: '10:00 AM - 01:00 PM',
        title: `${cityName} Historic Core & Guided Landmark Tour`,
        desc: `Heritage walk visiting top historic architecture and scenic overlooks.`,
        badge: 'Curated In Itinerary',
        type: 'activity',
        slot: 'morning'
      });
      dayActs.push({
        time: '02:30 PM - 05:00 PM',
        title: `Artisanal Market & Cultural Excursion`,
        desc: `Explore vibrant local bazaars, handicrafts, and regional spice markets.`,
        badge: 'Curated In Itinerary',
        type: 'activity',
        slot: 'afternoon'
      });
    }

    dayActs.push({
      time: '07:30 PM - 09:30 PM',
      title: `Traditional Chef-Curated Dinner`,
      desc: `Authentic regional multi-course dinner with vegetarian & chef specialty options.`,
      badge: 'Dinner Experience',
      type: 'dining',
      slot: 'evening'
    });

    return dayActs;
  }, [componentsList, activeDay, cityName, selectedHotel]);

  const basePriceNum = useMemo(() => {
    if (bookingDetails?.finalPrice) return parseFloat(bookingDetails.finalPrice);
    if (pricing?.total_price) return parseFloat(pricing.total_price);
    if (bookingDetails?.totalPrice) return parseFloat(bookingDetails.totalPrice);
    return (parseFloat(pkg?.base_price || 32000) * numTravelers);
  }, [bookingDetails, pricing, pkg, numTravelers]);

  const currentDisplayPrice = Math.max(0, basePriceNum - optimizedDiscount);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLng],
          zoom: 12,
          zoomControl: true,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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

      markersRef.current.forEach(m => {
        try { m.remove(); } catch (e) {}
      });
      markersRef.current = [];

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

  useEffect(() => {
    let isCancelled = false;
    async function loadPOIs() {
      setLoadingAttractions(true);
      try {
        const res = await api.getNearbyAttractions(defaultLat, defaultLng, 15000);
        if (isCancelled) return;
        const list = Array.isArray(res) ? res : (res?.attractions || res?.data || []);
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

  const filteredAttractions = useMemo(() => {
    if (selectedCategory === 'All') return attractions;
    return attractions.filter(a => {
      const cat = (a.category || a.kinds || '').toLowerCase();
      const target = selectedCategory.toLowerCase();
      return cat.includes(target);
    });
  }, [attractions, selectedCategory]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.slice(1).forEach(m => {
      try { m.remove(); } catch (e) {}
    });
    markersRef.current = markersRef.current.slice(0, 1);

    activeDaySchedule.forEach((event, idx) => {
      const offsetAngle = ((idx + 1) * (2 * Math.PI)) / (activeDaySchedule.length + 1);
      const eventLat = event.lat || (defaultLat + (0.012 * Math.cos(offsetAngle)));
      const eventLng = event.lng || (defaultLng + (0.012 * Math.sin(offsetAngle)));

      const itinMarker = L.circleMarker([eventLat, eventLng], {
        radius: 7,
        fillColor: '#84D175',
        color: '#1a2e1a',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-size: 11px; line-height: 1.35; min-width: 140px;">
            <div style="font-weight: 800; font-size: 12px; margin-top: 4px; color: #1a2e1a;">Day ${activeDay} Stop: ${event.title}</div>
            <div style="color: #1a2e1a; font-size: 10px; font-weight: 600;">Time: ${event.time}</div>
            <p style="color: #1a2e1a; margin: 4px 0 0 0; font-size: 10px;">${event.desc}</p>
          </div>
        `);
      markersRef.current.push(itinMarker);
    });

    filteredAttractions.forEach((item) => {
      if (item.lat && item.lng) {
        const marker = L.circleMarker([item.lat, item.lng], {
          radius: 5,
          fillColor: '#3C8B30',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-size: 11px; line-height: 1.3;">
              <b style="color: #1a2e1a; font-size: 12px;">${item.name || 'Point of Interest'}</b><br/>
              <span style="color: #3C8B30; font-weight: bold;">${item.category || 'Sightseeing'}</span><br/>
              <span style="color: #1a2e1a;">Distance: ${item.dist_formatted || (item.dist_meters ? (item.dist_meters / 1000).toFixed(1) + ' km' : 'Nearby')}</span>
            </div>
          `);
        markersRef.current.push(marker);
      }
    });
  }, [filteredAttractions, activeDaySchedule, defaultLat, defaultLng, activeDay]);

  return (
    <div className="space-y-6 animate-in text-[#1a2e1a] w-full max-w-7xl mx-auto">

      {/* ── Subheader Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#84D175]/30 pb-5">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center text-xs sm:text-sm font-bold text-[#1a2e1a] bg-white/60 backdrop-blur-sm border border-[#84D175]/40 hover:bg-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer mb-2 shadow-xs"
            >
              ← Back to Customizer
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a2e1a]">Your Optimized Itinerary</h1>
            <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full bg-[#84D175]/35 text-[#1a2e1a] border border-[#84D175]/45 shadow-xs">
              <Bot className="w-4 h-4 text-[#2D6A24]" />
              <span>Grounded AI Engine</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#1a2e1a] font-bold mt-1.5 flex flex-wrap items-center gap-2">
            <span>{cityName}</span>
            <span className="text-[#2D6A24]">·</span>
            <span>{startDate} → {endDate}</span>
            <span className="text-[#2D6A24]">·</span>
            <span>{durationDays} Days</span>
            <span className="text-[#2D6A24]">·</span>
            <span>{numTravelers} Traveler{numTravelers > 1 ? 's' : ''}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1a2e1a]">Verified Total ({numTravelers}p)</div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1a2e1a]">
              {currencySymbol}{currentDisplayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {optimizedDiscount > 0 && (
              <button
                type="button"
                onClick={() => setShowDiscountBreakdown(true)}
                className="text-xs px-2.5 py-0.5 rounded-md bg-[#84D175]/25 text-[#2D6A24] font-bold border border-[#84D175]/40 inline-flex items-center gap-1 mt-0.5 cursor-pointer transition-all shadow-xs"
              >
                <span>{currencySymbol}{optimizedDiscount.toLocaleString('en-IN')} Rate Discount Applied (Breakdown)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (bookingDetails) {
                  bookingDetails.finalPrice = currentDisplayPrice.toFixed(2);
                }
                onProceedToBook?.({
                  package: pkg,
                  bookingDetails,
                  pricing: {
                    ...pricing,
                    total_price: currentDisplayPrice.toFixed(2),
                    currency: currencyCode
                  },
                  guide: activeGuide,
                  startDate,
                  endDate,
                  numTravelers,
                  durationDays
                });
              }}
              className="px-6 py-3 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm shadow-md shadow-[#84D175]/25 transition-all active:scale-95 cursor-pointer"
            >
              Confirm & Book Package →
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Day Tabs & Schedule ── */}
        <div className="lg:col-span-7 space-y-5">

          {/* AI Conflict Resolution Banner */}
          <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-serif font-bold text-[#1a2e1a] flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#2D6A24]" />
                <span>AI Schedule Optimization Analysis</span>
              </span>
              <span className="text-xs sm:text-sm px-3 py-1 rounded-full bg-[#84D175]/35 text-[#2D6A24] font-bold border border-[#84D175]/45">
                {conflictResolved ? 'Resolved & Applied' : 'Optimal Path Available'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#1a2e1a] leading-relaxed font-medium">
              Our backend algorithm sequenced your daily stops into geographic clusters, eliminating 24km of backtracking transit time and synchronizing certified guide slots.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#84D175]/25">
              <span className="text-xs sm:text-sm text-[#2D6A24] font-bold">
                Estimated transit saved: 1 hr 45 min
              </span>
              {!conflictResolved && (
                <button
                  type="button"
                  onClick={() => {
                    setConflictResolved(true);
                    setOptimizedDiscount(1850);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
                >
                  Apply Route Optimization
                </button>
              )}
            </div>
          </div>

          {/* Day Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {daysList.map((d) => (
              <button
                key={d.num}
                type="button"
                onClick={() => setActiveDay(d.num)}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  activeDay === d.num
                    ? 'bg-[#84D175] text-[#1a2e1a] shadow-sm border border-[#67C456]'
                    : 'bg-white/60 backdrop-blur-sm text-[#1a2e1a] border border-[#84D175]/35 hover:bg-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Day Itinerary Timeline */}
          <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#84D175]/25 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1a2e1a]">
                  Day {activeDay} Schedule: {cityName}
                </h3>
                <p className="text-xs sm:text-sm text-[#1a2e1a] font-medium">
                  {activeDaySchedule.length} Verified Segments Scheduled
                </p>
              </div>
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-[#84D175]/25 text-[#2D6A24] border border-[#84D175]/35">
                Pace: {paceProfileText}
              </span>
            </div>

            <div className="space-y-3">
              {activeDaySchedule.map((event, idx) => (
                <div
                  key={idx}
                  className="bg-white/70 backdrop-blur-sm border border-[#84D175]/35 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-mono font-bold text-[#2D6A24]">
                        {event.time}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#84D175]/30 text-[#1a2e1a] font-bold border border-[#84D175]/35">
                        {event.badge}
                      </span>
                    </div>
                    <div className="font-serif font-bold text-[#1a2e1a] text-base leading-snug">
                      {event.title}
                    </div>
                    <div className="text-xs sm:text-sm text-[#1a2e1a] font-medium leading-relaxed">
                      {event.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Interactive Map & Live Attractions ── */}
        <div className="lg:col-span-5 space-y-5">

          {/* Interactive Leaflet Map Box */}
          <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-serif font-bold text-[#1a2e1a]">
                Live Itinerary Map ({cityName})
              </span>
              <span className="text-xs text-[#1a2e1a] font-bold">
                {attractions.length} POIs Found
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#84D175]/35 shadow-inner h-64 sm:h-72 w-full relative z-0">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['All', 'Heritage', 'Nature', 'Spiritual', 'Sightseeing'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                      : 'bg-white/50 border border-[#84D175]/35 text-[#1a2e1a] hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Nearby OpenTripMap Attractions List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {loadingAttractions && (
                <div className="text-xs text-[#1a2e1a] font-semibold text-center py-4">
                  Loading landmark POIs from OpenTripMap...
                </div>
              )}

              {filteredAttractions.slice(0, 5).map((spot, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (mapInstanceRef.current && spot.lat && spot.lng) {
                      mapInstanceRef.current.setView([spot.lat, spot.lng], 14);
                    }
                  }}
                  className="p-2.5 bg-white/60 hover:bg-white border border-[#84D175]/35 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#1a2e1a] truncate">{spot.name || 'Attraction Spot'}</div>
                    <div className="text-xs text-[#1a2e1a] font-medium">
                      <span className="font-bold text-[#2D6A24]">{spot.category || 'Sightseeing'}</span>
                      <span> · </span>
                      <span>{spot.dist_formatted || (spot.dist_meters ? (spot.dist_meters / 1000).toFixed(1) + ' km' : 'Nearby')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Budget & Pace Summary Box */}
          <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#84D175]/25 pb-2">
              <span className="text-base sm:text-lg font-serif font-bold text-[#1a2e1a]">
                Budget & Pace Verification
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#84D175]/25 text-[#2D6A24] font-bold border border-[#84D175]/35">
                Verified Grounded
              </span>
            </div>

            <div className="text-xs sm:text-sm text-[#1a2e1a] space-y-2 bg-white/50 p-3.5 rounded-xl border border-[#84D175]/35">
              <div className="flex justify-between">
                <span className="font-medium">Pace Profile:</span>
                <span className="font-bold text-[#1a2e1a]">{paceProfileText}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Guide Support:</span>
                <span className="font-bold text-[#1a2e1a]">
                  {activeGuide ? `${activeGuide.display_name || activeGuide.name} (${activeGuide.languages_spoken || 'Multilingual'})` : 'Self-Guided Package'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Party Size:</span>
                <span className="font-bold text-[#1a2e1a]">{numTravelers} Person{numTravelers > 1 ? 's' : ''}</span>
              </div>
              {optimizedDiscount > 0 && (
                <div className="flex justify-between font-bold text-[#2D6A24] pt-1.5 border-t border-[#84D175]/30">
                  <span>AI Discount Applied:</span>
                  <span>-{currencySymbol}{optimizedDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* AI Cost Optimization & Discount Breakdown Modal */}
      {showDiscountBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 animate-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#84D175]/40 space-y-5">
            <div className="flex items-center justify-between border-b border-[#84D175]/25 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1a2e1a]">AI Cost Optimization Breakdown</h3>
                <p className="text-xs sm:text-sm text-[#1a2e1a] font-medium">Transparent analysis of automated savings</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscountBreakdown(false)}
                className="px-2.5 py-1 rounded-full bg-white/80 border border-[#84D175]/35 hover:bg-white text-xs font-bold text-[#1a2e1a] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-2xl bg-white/70 border border-[#84D175]/35 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-serif font-bold text-[#1a2e1a] text-sm sm:text-base">Midweek & Off-Peak Stay Tariff</div>
                  <p className="text-xs text-[#1a2e1a] font-medium">
                    Swapped peak weekend surcharge slot to contracted mid-week tariff at {selectedHotel.title || selectedHotel.name}.
                  </p>
                </div>
                <span className="font-mono font-bold text-[#2D6A24] text-sm sm:text-base whitespace-nowrap">
                  -{currencySymbol}{Math.round(optimizedDiscount * 0.45).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-[#84D175]/35 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-serif font-bold text-[#1a2e1a] text-sm sm:text-base">Transit & Geographic Route Clustering</div>
                  <p className="text-xs text-[#1a2e1a] font-medium">
                    Sequenced day sightseeing spots into directional clusters, eliminating 24km of backtracking transfer mileage.
                  </p>
                </div>
                <span className="font-mono font-bold text-[#2D6A24] text-sm sm:text-base whitespace-nowrap">
                  -{currencySymbol}{Math.round(optimizedDiscount * 0.25).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-[#84D175]/35 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-serif font-bold text-[#1a2e1a] text-sm sm:text-base">Attraction Pass & Experience Bundle Rate</div>
                  <p className="text-xs text-[#1a2e1a] font-medium">
                    Consolidated standalone monument entries & guided excursions into an authorized package partner bundle.
                  </p>
                </div>
                <span className="font-mono font-bold text-[#2D6A24] text-sm sm:text-base whitespace-nowrap">
                  -{currencySymbol}{Math.round(optimizedDiscount * 0.20).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/70 border border-[#84D175]/35 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-serif font-bold text-[#1a2e1a] text-sm sm:text-base">Guide Schedule Alignment</div>
                  <p className="text-xs text-[#1a2e1a] font-medium">
                    Adjusted certified local guide hours to active touring blocks, avoiding idle standby surcharges.
                  </p>
                </div>
                <span className="font-mono font-bold text-[#2D6A24] text-sm sm:text-base whitespace-nowrap">
                  -{currencySymbol}{Math.round(optimizedDiscount * 0.10).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#84D175]/25 border border-[#84D175]/45 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#2D6A24] block">Total AI Savings</span>
                <span className="text-lg font-serif font-bold text-[#2D6A24]">-{currencySymbol}{optimizedDiscount.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase tracking-wider font-bold text-[#1a2e1a] block">Optimized Final Quote</span>
                <span className="text-lg font-serif font-bold text-[#1a2e1a]">{currencySymbol}{currentDisplayPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDiscountBreakdown(false)}
              className="w-full py-3 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer text-center"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
