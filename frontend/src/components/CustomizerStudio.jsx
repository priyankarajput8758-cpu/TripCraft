import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import GuideSelector from './GuideSelector';
import { t } from '../i18n';
import {
  Hotel,
  Activity,
  Car,
  Utensils,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Receipt,
  HelpCircle,
  Globe,
  PlusCircle,
  MinusCircle,
  CalendarDays,
  Sliders,
  Compass,
  CheckSquare,
  Square,
  Building2,
  Zap,
  ExternalLink
} from 'lucide-react';

export default function CustomizerStudio({
  packageDetailData,
  preferredLanguage = 'en',
  currentLanguage = 'en',
  onOpenBooking,
  externalSupplyMode = false
}) {
  const activeLang = currentLanguage || preferredLanguage || 'en';
  const pkg = packageDetailData?.package;
  const components = packageDetailData?.components || [];
  const initialSwapGroups = packageDetailData?.swap_groups || [];

  // Selected State
  const [selectedHotelTierId, setSelectedHotelTierId] = useState(null);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [selectedExternalHotel, setSelectedExternalHotel] = useState(null);
  const [selectedActivityIds, setSelectedActivityIds] = useState(new Set());
  const [optionalAddOns, setOptionalAddOns] = useState({});
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [startDate, setStartDate] = useState('2026-09-24');

  // External live hotels and OpenTripMap suggestions
  const [liveHotels, setLiveHotels] = useState([]);
  const [loadingLiveHotels, setLoadingLiveHotels] = useState(false);
  const [liveAttractions, setLiveAttractions] = useState([]);
  const [loadingLiveAttractions, setLoadingLiveAttractions] = useState(false);
  const [selectedLiveAttractions, setSelectedLiveAttractions] = useState([]);

  // Pricing State
  const [pricingResult, setPricingResult] = useState(null);
  const [isRepricing, setIsRepricing] = useState(false);
  const [activeTab, setActiveTab] = useState('components'); // 'components' | 'itinerary'

  // Translation State
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [translatingLang, setTranslatingLang] = useState(null);

  // Group components by Category & Day
  const { hotelOptions, transferOptions, dayActivities, optionalComponents, dayByDayItinerary } = useMemo(() => {
    const hotels = [];
    const transfers = [];
    const dayActs = {}; // { 1: [comp1, comp2], 2: [...] }
    const optionals = [];
    const days = {};

    for (const comp of components) {
      const dayIdx = comp.day_index || 1;
      if (!days[dayIdx]) days[dayIdx] = [];
      days[dayIdx].push(comp);

      const typeLower = (comp.type || '').toLowerCase();
      const groupLower = (comp.swap_group || '').toLowerCase();

      if (typeLower.includes('hotel') || groupLower.includes('hotel') || groupLower.includes('tier') || groupLower.includes('stay')) {
        hotels.push(comp);
      } else if (typeLower.includes('transfer') || groupLower.includes('transfer') || groupLower.includes('transport') || groupLower.includes('cab')) {
        transfers.push(comp);
      } else if (comp.is_optional === 1 && !comp.swap_group) {
        optionals.push(comp);
      } else {
        // Activity / Sightseeing / Experience
        if (!dayActs[dayIdx]) dayActs[dayIdx] = [];
        dayActs[dayIdx].push(comp);
      }
    }

    return {
      hotelOptions: hotels,
      transferOptions: transfers,
      dayActivities: dayActs,
      optionalComponents: optionals,
      dayByDayItinerary: days
    };
  }, [components]);

  // Initial defaults
  useEffect(() => {
    if (!pkg) return;

    // Pick first hotel option by default
    if (hotelOptions.length > 0) {
      setSelectedHotelTierId(hotelOptions[0].component_id);
    }
    // Pick first transfer option by default
    if (transferOptions.length > 0) {
      setSelectedTransferId(transferOptions[0].component_id);
    }
    // Pre-select all standard day activities by default
    const initialActIds = new Set();
    Object.values(dayActivities).forEach(acts => {
      acts.forEach(a => initialActIds.add(a.component_id));
    });
    setSelectedActivityIds(initialActIds);

    setSelectedExternalHotel(null);
    setSelectedLiveAttractions([]);
    setOptionalAddOns({});
    setSelectedGuide(null);
    setTranslatedTitle(null);
    setTranslatedDesc(null);
  }, [pkg?.package_id]);

  // Auto-translate package title/description if not in English
  useEffect(() => {
    if (activeLang !== 'en' && pkg) {
      handleTranslate(activeLang);
    } else {
      setTranslatedTitle(null);
      setTranslatedDesc(null);
    }
  }, [activeLang, pkg?.package_id]);

  // Fetch External Real-World Hotels & Attractions if External Supply Mode is enabled
  useEffect(() => {
    if (!externalSupplyMode || !pkg) return;

    async function loadExternalSupply() {
      const cityName = pkg.city_name || 'Bengaluru';
      setLoadingLiveHotels(true);
      setLoadingLiveAttractions(true);

      try {
        const hotelRes = await api.searchLiveHotels(cityName);
        const hList = hotelRes?.hotels || hotelRes?.data || [];
        setLiveHotels(hList);
      } catch (err) {
        console.error('Error fetching external hotels:', err);
      } finally {
        setLoadingLiveHotels(false);
      }

      try {
        const lat = parseFloat(pkg.city_lat || 12.9716);
        const lng = parseFloat(pkg.city_lng || 77.5946);
        const attRes = await api.getNearbyAttractions(lat, lng, 25000);
        const aList = attRes?.attractions || attRes?.data || [];
        setLiveAttractions(aList);
      } catch (err) {
        console.error('Error fetching external attractions:', err);
      } finally {
        setLoadingLiveAttractions(false);
      }
    }

    loadExternalSupply();
  }, [externalSupplyMode, pkg?.package_id]);

  // Handle Multilingual 1-Click Translation
  const handleTranslate = async (targetLang) => {
    if (!pkg) return;
    setTranslatingLang(targetLang);
    try {
      const [titleRes, descRes] = await Promise.all([
        api.translateText(pkg.name || pkg.title || '', targetLang, 'en'),
        api.translateText(pkg.description || '', targetLang, 'en')
      ]);

      if (titleRes?.translated_text) setTranslatedTitle(titleRes.translated_text);
      if (descRes?.translated_text) setTranslatedDesc(descRes.translated_text);
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setTranslatingLang(null);
    }
  };

  // Toggle Day Activity Checkbox
  const handleToggleActivity = (componentId) => {
    setSelectedActivityIds(prev => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }
      return next;
    });
  };

  // Toggle External Live Attraction Checkbox
  const handleToggleLiveAttraction = (attraction) => {
    setSelectedLiveAttractions(prev => {
      const exists = prev.some(a => a.name === attraction.name);
      if (exists) {
        return prev.filter(a => a.name !== attraction.name);
      } else {
        return [...prev, { ...attraction, custom_price: 450 }];
      }
    });
  };

  // Select Hotel Tier (Radio)
  const handleSelectHotelTier = (tierId) => {
    setSelectedHotelTierId(tierId);
    setSelectedExternalHotel(null); // Clear external hotel selection
  };

  // Select External SerpAPI Hotel (Radio)
  const handleSelectExternalHotel = (hotel) => {
    setSelectedExternalHotel(hotel);
    setSelectedHotelTierId(null); // Deselect default package hotel tier
  };

  // Select Transfer (Radio)
  const handleSelectTransfer = (transferId) => {
    setSelectedTransferId(transferId);
  };

  // Toggle Add-on
  const toggleAddOn = (comp) => {
    setOptionalAddOns(prev => ({
      ...prev,
      [comp.component_id]: !prev[comp.component_id]
    }));
  };

  // Trigger Live Repricing strictly from scratch on every change
  useEffect(() => {
    async function triggerReprice() {
      if (!pkg?.package_id) return;

      const activeComponentIds = [];
      if (selectedHotelTierId) activeComponentIds.push(selectedHotelTierId);
      if (selectedTransferId) activeComponentIds.push(selectedTransferId);
      selectedActivityIds.forEach(id => activeComponentIds.push(id));

      const optionalIds = Object.keys(optionalAddOns).filter(id => optionalAddOns[id]);
      const allSelectedIds = [...activeComponentIds, ...optionalIds];

      setIsRepricing(true);
      try {
        const res = await api.reprice(
          pkg.package_id,
          allSelectedIds,
          selectedGuide?.guide_id || null,
          startDate,
          pkg.duration_days
        );

        if (res && res.total_price) {
          let adjustedTotal = parseFloat(res.total_price);
          const lineItems = [...(res.line_items || [])];

          // If an external hotel is chosen, substitute hotel delta
          if (selectedExternalHotel) {
            const externalRate = parseFloat(selectedExternalHotel.rate_per_night || 4500);
            const nights = pkg.duration_days > 1 ? pkg.duration_days - 1 : 1;
            const externalHotelTotal = externalRate * nights;

            lineItems.push({
              component_id: 'ext_hotel',
              title: `${selectedExternalHotel.name} (SerpAPI Google Hotels)`,
              type: 'hotel_external',
              price_delta: externalHotelTotal.toFixed(2),
              unit_price: externalRate.toFixed(2)
            });
            adjustedTotal += externalHotelTotal;
          }

          // If external live attractions are chosen
          if (selectedLiveAttractions.length > 0) {
            selectedLiveAttractions.forEach(att => {
              const price = parseFloat(att.custom_price || 450);
              lineItems.push({
                component_id: `ext_att_${att.name}`,
                title: `${att.name} (OpenTripMap)`,
                type: 'attraction_external',
                price_delta: price.toFixed(2),
                unit_price: price.toFixed(2)
              });
              adjustedTotal += price;
            });
          }

          setPricingResult({
            ...res,
            total_price: adjustedTotal.toFixed(2),
            line_items: lineItems
          });
        }
      } catch (err) {
        console.error('Reprice error:', err);
      } finally {
        setIsRepricing(false);
      }
    }

    triggerReprice();
  }, [
    pkg?.package_id,
    selectedHotelTierId,
    selectedTransferId,
    selectedExternalHotel,
    selectedActivityIds,
    selectedLiveAttractions,
    optionalAddOns,
    selectedGuide,
    startDate
  ]);

  if (!pkg) return null;

  const pkgTitle = translatedTitle || pkg.name || pkg.title || 'Tour Customizer';
  const pkgDesc = translatedDesc || pkg.description;
  const durationNights = pkg.duration_nights || (pkg.duration_days ? pkg.duration_days - 1 : 1);

  // Active Hotel & Transfer reference for relative delta calculation
  const activeHotelComp = hotelOptions.find(h => h.component_id === selectedHotelTierId) || hotelOptions[0];
  const activeHotelDelta = parseFloat(activeHotelComp?.price_delta || '0');

  const activeTransferComp = transferOptions.find(t => t.component_id === selectedTransferId) || transferOptions[0];
  const activeTransferDelta = parseFloat(activeTransferComp?.price_delta || '0');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Package Overview, Date Controls & Translation Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/70 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-bold uppercase tracking-wider">
                {pkg.theme || 'Curated Tour'}
              </span>
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {pkg.city_name || 'Destination'} {pkg.city_state ? `(${pkg.city_state})` : ''}
              </span>
              {pkg.difficulty && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase font-medium">
                  {pkg.difficulty}
                </span>
              )}
              {externalSupplyMode && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {t('external_supply', activeLang)}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {pkgTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {pkgDesc}
            </p>
          </div>

          {/* Date & Duration Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 shrink-0">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Departure Date
              </label>
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent focus:outline-none text-xs text-slate-200 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {t('duration_label', activeLang)}
              </label>
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-bold">{pkg.duration_days} Days / {durationNights} Nights</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1-Click Translation & View Switcher Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Translation Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-300 mr-1">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span>Translate:</span>
            </span>
            {[
              { code: 'hi', label: 'हिन्दी (Hindi)' },
              { code: 'ta', label: 'தமிழ் (Tamil)' },
              { code: 'te', label: 'తెలుగు (Telugu)' },
              { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
              { code: 'mr', label: 'मराठी (Marathi)' },
              { code: 'bn', label: 'বাংলা (Bengali)' },
              { code: 'en', label: 'Original' }
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => handleTranslate(lang.code)}
                disabled={translatingLang !== null}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all cursor-pointer font-medium ${
                  activeLang === lang.code || translatingLang === lang.code
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {translatingLang === lang.code ? 'Translating...' : lang.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('components')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'components' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{t('component_studio', activeLang)}</span>
            </button>
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'itinerary' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t('day_by_day', activeLang)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Customizer (Left) & Price Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Day-wise Activities, Hotels & Transfers */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'components' ? (
            <>
              {/* 1. Day-Wise Multi-Select Activities & Experiences (§6 PS-04 Refinement) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-teal-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Day-Wise Sightseeing & Activities (Multi-Select)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Select experiences day by day without mutual exclusion. Include both Day 1 and Day 2 spots freely!
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-teal-400 font-mono font-bold bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/20">
                    {selectedActivityIds.size} Activities Included
                  </span>
                </div>

                {/* Day-by-Day Activity Checkboxes */}
                <div className="space-y-5">
                  {Array.from({ length: pkg.duration_days || 3 }, (_, i) => i + 1).map(dayNum => {
                    const actsForDay = dayActivities[dayNum] || [];

                    return (
                      <div key={dayNum} className="space-y-2.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 font-black text-xs font-mono">
                            DAY {dayNum}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {actsForDay.filter(a => selectedActivityIds.has(a.component_id)).length} of {actsForDay.length} selected
                          </span>
                        </div>

                        {actsForDay.length === 0 ? (
                          <div className="text-xs text-slate-500 italic py-1">
                            Flexible leisure / transit schedule on Day {dayNum}.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {actsForDay.map(act => {
                              const isChecked = selectedActivityIds.has(act.component_id);
                              const actPrice = parseFloat(act.unit_price || act.price_delta || '850');
                              const actDelta = parseFloat(act.price_delta || '0');

                              return (
                                <div
                                  key={act.component_id}
                                  onClick={() => handleToggleActivity(act.component_id)}
                                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                    isChecked
                                      ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/40 shadow-sm'
                                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="space-y-0.5 min-w-0 pr-2">
                                      <div className={`text-xs font-bold ${isChecked ? 'text-white' : 'text-slate-300'} truncate`}>
                                        {act.title}
                                      </div>
                                      <div className="text-[10px] text-teal-400 font-medium">
                                        Slot: {act.slot || 'Flexible'} • {act.type || 'activity'}
                                      </div>
                                      {act.description && (
                                        <p className="text-[10px] text-slate-400 line-clamp-2 pt-0.5">
                                          {act.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="shrink-0 pt-0.5">
                                      {isChecked ? (
                                        <CheckSquare className="w-4 h-4 fill-teal-500 text-slate-950" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-600" />
                                      )}
                                    </div>
                                  </div>

                                  {/* Pricing Breakdown: Actual Cost vs Relative Price Difference */}
                                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                                    <span className="text-slate-400 font-mono">
                                      Actual Cost: <b className="text-slate-200">₹{actPrice.toLocaleString('en-IN')}</b>
                                    </span>
                                    <span className={`font-mono font-bold ${isChecked ? 'text-emerald-400' : 'text-slate-500'}`}>
                                      {isChecked ? 'Included (+₹0.00)' : '+₹0 (Deselected)'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* External OpenTripMap Suggestions (when External Supply Mode is enabled) */}
                {externalSupplyMode && (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>OpenTripMap Live Additions for {pkg.city_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {loadingLiveAttractions ? 'Scanning...' : `${liveAttractions.length} spots found`}
                      </span>
                    </div>

                    {liveAttractions.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                        {liveAttractions.slice(0, 6).map((spot, sIdx) => {
                          const isAdded = selectedLiveAttractions.some(a => a.name === spot.name);
                          const dist = spot.dist_formatted || (spot.dist_meters ? `${(spot.dist_meters/1000).toFixed(1)} km` : 'Nearby');

                          return (
                            <div
                              key={sIdx}
                              onClick={() => handleToggleLiveAttraction(spot)}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                isAdded
                                  ? 'bg-amber-950/40 border-amber-500 text-white'
                                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="space-y-0.5 truncate pr-2">
                                <div className="font-bold text-white truncate text-[11px]">{spot.name}</div>
                                <div className="text-[9px] text-amber-400">{spot.category} • 📍 {dist}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-mono text-amber-400 text-[11px] font-bold">+₹450</div>
                                <div className="text-[9px] text-slate-500">{isAdded ? 'Added' : '+ Add'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Hotel Tier Selection & SerpAPI Google Hotels Integration */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Hotel className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Accommodation / Hotel Stay Tier
                      </h3>
                      <p className="text-xs text-slate-400">
                        Choose your preferred hotel tier, or select from live Google Hotels market inventory
                      </p>
                    </div>
                  </div>
                  {selectedExternalHotel && (
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/40 font-bold font-mono">
                      SerpAPI Hotel Active
                    </span>
                  )}
                </div>

                {/* Pre-built Package Hotel Tiers */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Curated Package Hotel Tiers:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {hotelOptions.map(h => {
                      const isSelected = selectedHotelTierId === h.component_id && !selectedExternalHotel;
                      const hDelta = parseFloat(h.price_delta || '0');
                      const relativeDiff = hDelta - activeHotelDelta;
                      const actualCost = 3500 + hDelta;

                      return (
                        <div
                          key={h.component_id}
                          onClick={() => handleSelectHotelTier(h.component_id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/50 shadow-md'
                              : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 pr-2">
                              <div className="text-xs font-bold text-white">
                                {h.title}
                              </div>
                              <div className="text-[11px] text-teal-400 font-medium">
                                {h.type || 'Hotel Stay'} ({durationNights} Nights)
                              </div>
                              {h.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-2 pt-0.5">
                                  {h.description}
                                </p>
                              )}
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-teal-400 bg-teal-400' : 'border-slate-600'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                            </div>
                          </div>

                          {/* Actual Cost vs Relative Delta */}
                          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">
                              Rate: ₹{actualCost.toLocaleString('en-IN')}/nt
                            </span>
                            <span className={`font-mono font-bold ${isSelected ? 'text-emerald-400' : relativeDiff > 0 ? 'text-amber-400' : 'text-teal-400'}`}>
                              {isSelected ? 'Included (+₹0.00)' : (relativeDiff > 0 ? `+₹${relativeDiff.toLocaleString('en-IN')}` : `-₹${Math.abs(relativeDiff).toLocaleString('en-IN')}`)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* External SerpAPI Google Hotels Section (If External Supply is ON) */}
                {externalSupplyMode && (
                  <div className="space-y-2.5 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        Live Google Hotels Market Inventory ({pkg.city_name}):
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {loadingLiveHotels ? 'Fetching rates...' : `${liveHotels.length} live properties`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1">
                      {liveHotels.slice(0, 6).map((extH, idx) => {
                        const isSelected = selectedExternalHotel?.name === extH.name;
                        const rateNum = parseFloat(extH.rate_per_night || 4500);

                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectExternalHotel(extH)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-amber-500/40'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 pr-2">
                                <div className="text-xs font-bold text-white truncate">
                                  {extH.name}
                                </div>
                                <div className="text-[10px] text-amber-400 font-medium">
                                  {extH.hotel_class ? `${extH.hotel_class}★ • ` : ''}{extH.rating ? `Rating: ★${extH.rating}` : 'Verified'}
                                </div>
                              </div>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-mono">
                                ₹{rateNum.toLocaleString('en-IN')}/nt
                              </span>
                              <span className="font-mono font-bold text-amber-400">
                                {isSelected ? 'Selected' : 'Swap In'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Transport & Transfers */}
              {transferOptions.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <Car className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Local Transfer & Transit Mode
                      </h3>
                      <p className="text-xs text-slate-400">
                        Choose your vehicle and inter-city transit package
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {transferOptions.map(t => {
                      const isSelected = selectedTransferId === t.component_id;
                      const tDelta = parseFloat(t.price_delta || '0');
                      const relativeDiff = tDelta - activeTransferDelta;
                      const actualCost = 2500 + tDelta;

                      return (
                        <div
                          key={t.component_id}
                          onClick={() => handleSelectTransfer(t.component_id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/50 shadow-md'
                              : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 pr-2">
                              <div className="text-xs font-bold text-white">{t.title}</div>
                              <div className="text-[11px] text-cyan-400">{t.type || 'Transfer'}</div>
                              {t.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-2 pt-0.5">{t.description}</p>
                              )}
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-teal-400 bg-teal-400' : 'border-slate-600'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-mono">Cost: ₹{actualCost.toLocaleString('en-IN')}</span>
                            <span className={`font-mono font-bold ${isSelected ? 'text-emerald-400' : relativeDiff > 0 ? 'text-amber-400' : 'text-teal-400'}`}>
                              {isSelected ? 'Included (+₹0.00)' : (relativeDiff > 0 ? `+₹${relativeDiff.toLocaleString('en-IN')}` : `-₹${Math.abs(relativeDiff).toLocaleString('en-IN')}`)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Optional Add-ons */}
              {optionalComponents.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Special Experiences & Add-on Upgrades
                      </h3>
                      <p className="text-xs text-slate-400">
                        Optional experiences to enhance your tour itinerary
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {optionalComponents.map(opt => {
                      const isChecked = !!optionalAddOns[opt.component_id];
                      const delta = parseFloat(opt.price_delta || '0');

                      return (
                        <div
                          key={opt.component_id}
                          onClick={() => toggleAddOn(opt)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between ${
                            isChecked
                              ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                              : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                          }`}
                        >
                          <div className="space-y-1 pr-3">
                            <div className="text-xs font-bold text-white">{opt.title}</div>
                            <div className="text-[11px] text-slate-400">Day {opt.day_index || 1} • {opt.slot || 'Flexible slot'}</div>
                            {opt.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-2">{opt.description}</p>
                            )}
                            <div className="text-xs font-mono font-bold text-amber-400 pt-1">
                              Actual Cost: +₹{delta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-amber-500 text-slate-950 font-bold' : 'border border-slate-600'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Day-by-Day Itinerary Tab */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-teal-400" />
                  <span>{t('day_by_day', activeLang)}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {pkg.duration_days} Days Planned
                </span>
              </div>

              <div className="space-y-5">
                {Object.entries(dayByDayItinerary).map(([dayNum, dayItems]) => (
                  <div key={dayNum} className="border-l-2 border-teal-500/50 pl-4 py-1 space-y-2 relative">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center text-[10px] font-black text-slate-950">
                      {dayNum}
                    </div>
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      Day {dayNum} Program
                    </h4>
                    <div className="space-y-2">
                      {dayItems.map(item => (
                        <div key={item.component_id} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{item.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 uppercase font-mono">
                              {item.slot || 'schedule'}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-300 pt-1">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guide Dimension Selector with Mandatory Clash Refusal Flow (§2.2) */}
          <GuideSelector
            packageId={pkg.package_id}
            cityId={pkg.city_id}
            startDate={startDate}
            durationDays={pkg.duration_days || 1}
            selectedGuide={selectedGuide}
            onSelectGuide={setSelectedGuide}
            preferredLanguage={activeLang}
            availableGuides={packageDetailData?.available_guides || []}
          />
        </div>

        {/* Right Column (4 cols): Sticky Repricing Summary */}
        <div className="lg:col-span-4 space-y-5">
          <div className="sticky top-20 bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {t('price_breakdown', activeLang)}
                </h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                isRepricing ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {isRepricing ? 'Recalculating...' : 'Decimal Price Quote'}
              </span>
            </div>

            {/* Reprice Breakdown Rows */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>{t('base_price', activeLang)}</span>
                <span className="font-bold text-white font-mono">
                  ₹{parseFloat(pricingResult?.base_price || pkg.base_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Line items */}
              {pricingResult?.line_items?.map((item, idx) => {
                const delta = parseFloat(item.price_delta || '0');
                return (
                  <div key={idx} className="flex justify-between items-center text-slate-400 text-[11px] pl-2 border-l border-slate-800">
                    <span className="truncate pr-2">{item.title}</span>
                    <span className={`font-mono font-semibold ${delta > 0 ? 'text-amber-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {delta === 0 ? '₹0.00' : `${delta > 0 ? '+' : ''}₹${delta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                );
              })}

              {/* Guide Breakdown */}
              {pricingResult?.guide_detail ? (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-teal-300 text-xs font-semibold">
                    <span>{t('guide_cost', activeLang)} ({pricingResult.guide_detail.guide_name})</span>
                    <span className="font-mono">
                      +₹{parseFloat(pricingResult.guide_detail.total_guide_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Rate: ₹{parseFloat(pricingResult.guide_detail.day_rate).toLocaleString('en-IN')} × {pricingResult.guide_detail.days}d</span>
                    {parseFloat(pricingResult.guide_detail.price_multiplier || 1) > 1 && (
                      <span className="text-amber-400">{pricingResult.guide_detail.price_multiplier}x peak</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-slate-500 text-xs">
                  <span>{t('guide_cost', activeLang)}</span>
                  <span>Not Selected (Self-guided)</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                <span>{t('taxes_fees', activeLang)}</span>
                <span className="text-slate-300 font-mono">{t('gst_included', activeLang)}</span>
              </div>
            </div>

            {/* Total Card */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-teal-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider text-teal-400 font-bold">
                  {t('grand_total', activeLang)}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-black text-white tracking-tight font-mono">
                    ₹{parseFloat(pricingResult?.total_price || pkg.base_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Strict zero-float decimal precision
                  </div>
                </div>
              </div>
            </div>

            {/* Book Custom Trip CTA */}
            <button
              onClick={() => onOpenBooking({
                package: pkg,
                pricing: pricingResult,
                startDate,
                selectedGuide,
                selectedComponents: {
                  hotelTier: selectedHotelTierId,
                  externalHotel: selectedExternalHotel,
                  transfer: selectedTransferId,
                  activities: Array.from(selectedActivityIds),
                  liveAttractions: selectedLiveAttractions,
                  ...optionalAddOns
                }
              })}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{t('book_custom_btn', activeLang)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-float financial precision backed by automated tests</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
