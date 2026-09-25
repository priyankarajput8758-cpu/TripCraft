import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import { t } from '../i18n';
import GuideSelector from './GuideSelector';
import AddOnsPanel from './AddOnsPanel';
import RealWorldPanel from './RealWorldPanel';

export default function CustomizerStudio({
  packageDetailData,
  onProceedToOptimize,
  onBack,
  preferredLanguage = 'en',
  tripPrefs = {},
  realWorldEnabled = false,
  onToggleRealWorld,
}) {
  const pkg = packageDetailData?.package;
  const rawComponents = packageDetailData?.components || [];
  const rawSwapGroups = packageDetailData?.swap_groups || [];

  const [selectedComponents, setSelectedComponents] = useState({});
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedMarketHotel, setSelectedMarketHotel] = useState(null);
  const fixedDurationDays = pkg?.duration_days || 5;

  const calculateEndDate = (start, days) => {
    if (!start) return '';
    const d = new Date(start);
    d.setDate(d.getDate() + Math.max(1, days) - 1);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(tripPrefs.startDate || '2026-09-24');
  const [endDate, setEndDate] = useState(calculateEndDate(tripPrefs.startDate || '2026-09-24', fixedDurationDays));
  const [numTravelers, setNumTravelers] = useState(tripPrefs.numTravelers || 2);
  const [pricingResult, setPricingResult] = useState(null);
  const [isRepricing, setIsRepricing] = useState(false);
  const [addOnTotal, setAddOnTotal] = useState(0);
  const [priceFlash, setPriceFlash] = useState(false);

  const durationDays = fixedDurationDays;
  const durationNights = Math.max(1, durationDays - 1);

  const handleStartDateChange = (newStart) => {
    setStartDate(newStart);
    setEndDate(calculateEndDate(newStart, fixedDurationDays));
  };

  useEffect(() => {
    if (pkg?.duration_days) {
      setEndDate(calculateEndDate(startDate, pkg.duration_days));
    }
  }, [pkg?.duration_days, startDate]);

  const swapGroupsMap = useMemo(() => {
    const map = {};
    if (rawSwapGroups && rawSwapGroups.length > 0) {
      for (const sg of rawSwapGroups) {
        if (sg && sg.swap_group) {
          map[sg.swap_group] = sg.options || [];
        }
      }
    }
    for (const comp of rawComponents) {
      const groupName = comp.swap_group;
      if (groupName) {
        if (!map[groupName]) {
          map[groupName] = [];
        }
        if (!map[groupName].some(c => c.component_id === comp.component_id)) {
          map[groupName].push(comp);
        }
      }
    }
    return map;
  }, [rawSwapGroups, rawComponents]);

  const standaloneComponents = useMemo(() => {
    return rawComponents.filter(c => !c.swap_group);
  }, [rawComponents]);

  useEffect(() => {
    if (!pkg) return;
    const initial = {};
    for (const [groupName, items] of Object.entries(swapGroupsMap)) {
      if (items.length > 0) {
        initial[groupName] = items[0].component_id;
      }
    }
    for (const comp of standaloneComponents) {
      if (comp.is_optional === 0) {
        initial[`standalone_${comp.component_id}`] = comp.component_id;
      }
    }
    setSelectedComponents(initial);
    setSelectedGuide(null);
    setSelectedMarketHotel(null);
  }, [pkg?.package_id]);

  useEffect(() => {
    async function triggerReprice() {
      if (!pkg?.package_id) return;
      let componentIds = Object.values(selectedComponents).filter(Boolean);
      if (selectedMarketHotel) {
        const hotelGroupKeys = Object.keys(swapGroupsMap).filter(k =>
          k.toLowerCase().includes('hotel') || k.toLowerCase().includes('stay')
        );
        const hotelComponentIds = hotelGroupKeys.map(k => selectedComponents[k]).filter(Boolean);
        componentIds = componentIds.filter(id => !hotelComponentIds.includes(id));
      }

      setIsRepricing(true);
      try {
        const res = await api.reprice({
          package_id: pkg.package_id,
          selected_components: componentIds,
          selected_guide_id: selectedGuide?.guide_id || null,
          start_date: startDate,
          duration_days: durationDays,
          num_travelers: numTravelers,
        });
        setPricingResult(res);
        setPriceFlash(true);
        setTimeout(() => setPriceFlash(false), 400);
      } catch (err) {
        console.error('Error in reprice API:', err);
      } finally {
        setIsRepricing(false);
      }
    }
    triggerReprice();
  }, [selectedComponents, selectedGuide?.guide_id, selectedMarketHotel, startDate, numTravelers, pkg?.package_id, durationDays]);

  const handleSwap = (groupName, componentId) => {
    setSelectedComponents(prev => ({
      ...prev,
      [groupName]: componentId
    }));
  };

  const handleToggleStandalone = (componentId) => {
    const key = `standalone_${componentId}`;
    setSelectedComponents(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = componentId;
      }
      return next;
    });
  };

  const handleSelectMarketHotel = (hotel) => {
    setSelectedMarketHotel(hotel);
  };

  const handleProceedToOptimize = () => {
    const chosenComponentsList = Object.values(selectedComponents).filter(Boolean);
    const chosenSwapSelections = [];
    for (const [groupName, compId] of Object.entries(selectedComponents)) {
      if (!groupName.startsWith('standalone_')) {
        chosenSwapSelections.push({
          swap_group: groupName,
          chosen_component_id: compId
        });
      }
    }

    onProceedToOptimize({
      package: pkg,
      selectedComponents: chosenComponentsList,
      selectedSwapSelections: chosenSwapSelections,
      selectedGuide,
      selectedMarketHotel,
      startDate,
      endDate,
      numTravelers,
      durationDays,
      pricing: pricingResult,
      addOnTotal
    });
  };

  if (!pkg) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-sm font-semibold text-[#1a2e1a]">No package selected for customization.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-[#84D175] text-[#1a2e1a] font-bold text-xs"
          >
            ← Back to Curated Packages
          </button>
        )}
      </div>
    );
  }

  const pkgTitle = String(pkg.name || pkg.title || 'Tour Package')
    .replace(/[\ufffd\uFFFD\u2014\u2013\u2015]+/g, '—')
    .replace(/^[—\-\s]+|[—\-\s]+$/g, '')
    .trim();

  const cityName = pkg.city_name || 'India';
  const pkgCurrency = pkg.currency || 'INR';
  const CURRENCY_SYMBOLS = { INR: '₹', JPY: '¥', USD: '$', EUR: '€', GBP: '£', CHF: 'CHF ', AED: 'AED ', SGD: 'S$', THB: '฿' };
  const currencySymbol = CURRENCY_SYMBOLS[pkgCurrency] || `${pkgCurrency} `;

  const baseCalculatedTotal = pricingResult?.total_price
    ? parseFloat(pricingResult.total_price)
    : (parseFloat(pkg.base_price || 32000) * numTravelers);

  const grandCalculatedTotal = Math.max(0, baseCalculatedTotal + (addOnTotal * numTravelers));
  const displayTotal = grandCalculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 animate-in text-[#1a2e1a] pb-12 w-full max-w-7xl mx-auto">

      {/* ── Subheader Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#84D175]/30 pb-5">
        <div className="space-y-1">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center text-xs sm:text-sm font-bold text-[#1a2e1a] bg-white/60 backdrop-blur-sm border border-[#84D175]/35 hover:bg-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer mb-1 shadow-xs"
            >
              ← Back to Discover
            </button>
          )}
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a2e1a] tracking-tight">
            Customize {pkgTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm">
            <span className="font-bold px-3 py-1 rounded-full bg-[#84D175]/30 text-[#1a2e1a] border border-[#84D175]/40">
              {cityName}
            </span>
            <span className="text-[#2D6A24] font-bold">·</span>
            <span className="font-bold px-3 py-1 rounded-full bg-[#84D175]/30 text-[#1a2e1a] border border-[#84D175]/40">
              {durationDays} Days / {durationNights} Nights
            </span>
            <span className="text-[#2D6A24] font-bold">·</span>
            <span className="font-bold px-3 py-1 rounded-full bg-[#84D175]/30 text-[#1a2e1a] border border-[#84D175]/40">
              {numTravelers} Traveler{numTravelers > 1 ? 's' : ''}
            </span>
            <span className="text-[#2D6A24] font-bold">·</span>
            <span className="font-bold px-3 py-1 rounded-full bg-[#84D175]/30 text-[#1a2e1a] border border-[#84D175]/40 capitalize">
              {pkg.theme || 'Curated'} Theme
            </span>
          </div>
        </div>

        <button
          onClick={handleProceedToOptimize}
          className="px-6 py-3 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm shadow-md shadow-[#84D175]/25 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <span>{t('next_verified_itinerary', preferredLanguage)} →</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column (Interactive Swappable Components & Inclusions) ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Party Size & Calendar Date Settings Bar */}
          <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/35 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#84D175]/25 pb-3">
              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1a2e1a] min-w-0 break-words">
                {t('trip_dates_party_size', preferredLanguage)}
              </h3>
              <span className="text-xs sm:text-sm font-bold text-[#2D6A24] bg-[#84D175]/30 px-3 py-1 rounded-full border border-[#84D175]/40 shrink-0">
                {t('live_repricing_active', preferredLanguage)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] mb-1.5">
                  {t('start_date', preferredLanguage)}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-white/90 backdrop-blur-sm border border-[#84D175]/45 rounded-xl px-4 py-3 text-sm sm:text-base font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a]">
                    {t('end_date', preferredLanguage)}
                  </label>
                  <span className="text-xs sm:text-sm text-[#2D6A24] bg-[#84D175]/30 px-2 py-0.5 rounded font-bold border border-[#84D175]/40">
                    Fixed {durationDays} Days
                  </span>
                </div>
                <input
                  type="date"
                  value={endDate}
                  readOnly
                  title={`Package duration is fixed to ${durationDays} days.`}
                  className="w-full bg-white/50 backdrop-blur-sm border border-[#84D175]/30 rounded-xl px-4 py-3 text-sm sm:text-base font-bold text-[#1a2e1a] cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] mb-1.5">
                  {t('party_size', preferredLanguage)}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNumTravelers(count)}
                      className={`py-3 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
                        numTravelers === count
                          ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                          : 'bg-white/70 hover:bg-white text-[#1a2e1a] border border-[#84D175]/40'
                      }`}
                    >
                      {count}p
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Swappable Package Components */}
          {Object.entries(swapGroupsMap).map(([groupName, items]) => {
            const currentSelectedId = selectedComponents[groupName];
            const baseItem = items.find(i => i.is_default) || items[0] || {};
            const baseDelta = parseFloat(baseItem.price_delta || '0');
            const firstItem = items[0] || {};
            const compType = firstItem.component_type || 'component';
            const isHotelGroup = compType === 'hotel' || groupName.toLowerCase().includes('hotel') || groupName.toLowerCase().includes('stay');

            let typeLabel = `Swappable Option (${groupName})`;
            if (isHotelGroup) {
              typeLabel = t('accommodation_hotel_tier', preferredLanguage);
            } else if (compType === 'poi' || groupName.toLowerCase().includes('poi') || groupName.toLowerCase().includes('activity')) {
              typeLabel = t('attraction_experience_options', preferredLanguage);
            } else if (compType === 'guide' || groupName.toLowerCase().includes('guide')) {
              typeLabel = 'Local Guide Delivery Option';
            }

            return (
              <div key={groupName} className="bg-white/60 backdrop-blur-md border border-[#84D175]/35 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#84D175]/25 pb-3">
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1a2e1a] min-w-0 break-words">
                    {typeLabel}
                  </h3>
                  <span className="text-xs sm:text-sm font-bold text-[#1a2e1a] shrink-0">
                    {isHotelGroup && selectedMarketHotel ? 'Custom Live Stay Active' : `${items.length} Choice${items.length > 1 ? 's' : ''} Available`}
                  </span>
                </div>

                {isHotelGroup && selectedMarketHotel && (() => {
                  const marketHotelRooms = Math.ceil(numTravelers / 2);
                  const ratePerNight = parseFloat(selectedMarketHotel.rate_per_night || 0);
                  const totalMarketCost = ratePerNight * durationNights * marketHotelRooms;

                  return (
                    <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-amber-950">
                            {selectedMarketHotel.name}
                          </span>
                          <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                            Live Stay Added
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-950 font-medium">
                          {marketHotelRooms} Room{marketHotelRooms > 1 ? 's' : ''} · {durationNights} nights @ {currencySymbol}{ratePerNight.toLocaleString('en-IN')}/room/night
                          <strong className="block text-amber-950 font-bold mt-0.5 text-sm sm:text-base">
                            Additional Hotel Total: {currencySymbol}{totalMarketCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedMarketHotel(null)}
                        className="px-4 py-2 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Remove Live Stay
                      </button>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {items.map((item) => {
                    const isSelected = currentSelectedId === item.component_id;
                    const itemDelta = parseFloat(item.price_delta || '0');
                    const relativeDelta = itemDelta - baseDelta;
                    const itemTitle = item.title || item.name || 'Component Option';

                    return (
                      <div
                        key={item.component_id}
                        onClick={() => handleSwap(groupName, item.component_id)}
                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#84D175]/35 border-2 border-[#84D175] shadow-xs ring-1 ring-[#84D175]/40'
                            : 'bg-white/60 hover:bg-white border-[#84D175]/35'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="text-sm sm:text-base font-bold text-[#1a2e1a] line-clamp-2">
                            {itemTitle}
                          </div>
                          {item.slot && (
                            <div className="text-xs font-bold text-[#2D6A24] uppercase">
                              Day {item.day_index || 1} · {item.slot}
                            </div>
                          )}
                        </div>

                        <div className="mt-3.5 pt-2.5 border-t border-[#84D175]/25 flex items-center justify-between">
                          <span className={`text-sm sm:text-base font-mono font-bold ${
                            relativeDelta === 0 ? 'text-[#1a2e1a]' : relativeDelta > 0 ? 'text-[#2D6A24]' : 'text-emerald-700'
                          }`}>
                            {relativeDelta === 0
                              ? t('included_base', preferredLanguage)
                              : `${relativeDelta > 0 ? '+' : '-'}${currencySymbol}${Math.abs(relativeDelta).toLocaleString('en-IN')}`}
                          </span>

                          {isSelected && (
                            <span className="text-xs uppercase font-bold text-[#2D6A24] bg-[#84D175]/30 px-2 py-0.5 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Included Non-Swappable Inclusions */}
          {standaloneComponents.length > 0 && (
            <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/35 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#84D175]/25 pb-3">
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1a2e1a]">
                  Included Tour Inclusions & Passes
                </h3>
                <span className="text-xs sm:text-sm font-bold text-[#2D6A24] bg-[#84D175]/25 px-3 py-1 rounded-full border border-[#84D175]/35">
                  Pre-Included in Package
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {standaloneComponents.map((comp) => {
                  const key = `standalone_${comp.component_id}`;
                  const isChecked = selectedComponents[key] !== undefined || comp.is_optional === 0;
                  const delta = parseFloat(comp.price_delta || '0');
                  const isOptional = comp.is_optional === 1;

                  return (
                    <div
                      key={comp.component_id}
                      className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-[#84D175]/25 border-[#84D175]/50 text-[#1a2e1a]'
                          : 'bg-white/40 border-[#84D175]/25 text-[#1a2e1a] opacity-60'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <div className="text-sm sm:text-base font-bold text-[#1a2e1a] truncate">{comp.title || comp.name}</div>
                        <div className="text-xs text-[#1a2e1a] uppercase flex items-center gap-1.5 font-bold">
                          <span>{comp.component_type}</span>
                          <span>·</span>
                          <span className={isOptional ? 'text-amber-800' : 'text-[#2D6A24]'}>
                            {isOptional ? 'Optional Add-on' : 'Included In Package'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm sm:text-base font-mono font-bold text-[#2D6A24]">
                          {delta > 0 ? `+${currencySymbol}${delta.toLocaleString('en-IN')}` : 'Included'}
                        </span>

                        {isOptional && (
                          <button
                            type="button"
                            onClick={() => handleToggleStandalone(comp.component_id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                                : 'bg-[#84D175] text-[#1a2e1a] hover:bg-[#67C456]'
                            }`}
                          >
                            {isChecked ? 'Remove' : 'Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Local Tour Guide Component Selector */}
          <GuideSelector
            packageId={pkg.package_id}
            cityId={pkg.city_id}
            startDate={startDate}
            durationDays={durationDays}
            selectedGuide={selectedGuide}
            onSelectGuide={setSelectedGuide}
            preferredLanguage={preferredLanguage}
            availableGuides={packageDetailData?.guides || []}
            currencySymbol={currencySymbol}
            packageCurrency={pkgCurrency}
          />

          {/* 5. Theme Curated Add-ons Panel */}
          <AddOnsPanel
            packageId={pkg.package_id}
            cityName={pkg.city_name || 'India'}
            theme={pkg.theme || 'Curated'}
            onTotalChange={setAddOnTotal}
            preferredLanguage={preferredLanguage}
            currencySymbol={currencySymbol}
          />

          {/* 6. Live Google Hotels Panel */}
          {realWorldEnabled ? (
            <RealWorldPanel
              cityName={pkg.city_name || 'Goa'}
              onSelectHotel={handleSelectMarketHotel}
              selectedMarketHotel={selectedMarketHotel}
              durationNights={durationNights}
            />
          ) : (
            <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div>
                <h4 className="text-sm font-bold text-[#1a2e1a]">Compare Live Market Rates (Google Hotels)</h4>
                <p className="text-xs text-[#1a2e1a] font-medium">
                  View real-time live hotel pricing in {pkg.city_name || 'this destination'} and swap into your package
                </p>
              </div>
              {onToggleRealWorld && (
                <button
                  type="button"
                  onClick={() => onToggleRealWorld(true)}
                  className="px-4 py-2 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  View Live Market Rates
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Sticky Live Price Summary ── */}
        <div className="lg:col-span-4 space-y-5">
          <div className="sticky top-20 bg-white/75 backdrop-blur-md border border-[#84D175]/45 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#84D175]/25 pb-3">
              <div className="space-y-0.5 min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1a2e1a] truncate" title={t('live_repricing_quote', preferredLanguage)}>
                  {t('live_repricing_quote', preferredLanguage)}
                </h3>
                <span className="text-xs sm:text-sm text-[#1a2e1a] font-bold block truncate">
                  {numTravelers} Traveler{numTravelers > 1 ? 's' : ''} · Exact Decimal
                </span>
              </div>
              <span className={`text-xs sm:text-sm px-3 py-1 rounded-full font-bold shrink-0 ${
                isRepricing ? 'bg-amber-100 text-amber-900 animate-pulse' : 'bg-[#84D175]/30 text-[#2D6A24] border border-[#84D175]/40'
              }`}>
                {isRepricing ? 'Recalculating...' : 'Decimal Verified'}
              </span>
            </div>

            {/* Price Line Items */}
            <div className="space-y-3.5 text-sm sm:text-base">
              <div className="flex justify-between text-[#1a2e1a] font-semibold">
                <div>
                  <span className="block">Base Package ({numTravelers}p × {currencySymbol}{parseFloat(pkg.base_price || 32000).toLocaleString('en-IN')})</span>
                </div>
                <span className="font-mono font-bold text-[#1a2e1a]">
                  {currencySymbol}{(parseFloat(pkg.base_price || 32000) * numTravelers).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {pricingResult?.components_delta_total && parseFloat(pricingResult.components_delta_total) !== 0 && (
                <div className="flex justify-between text-[#1a2e1a] font-semibold">
                  <span>Component Adjustments ({numTravelers}p)</span>
                  <span className={`font-mono font-bold ${
                    parseFloat(pricingResult.components_delta_total) >= 0 ? 'text-[#2D6A24]' : 'text-emerald-700'
                  }`}>
                    {parseFloat(pricingResult.components_delta_total) >= 0 ? '+' : ''}{currencySymbol}{(parseFloat(pricingResult.components_delta_total) * numTravelers).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {selectedMarketHotel && (() => {
                const rooms = Math.ceil(numTravelers / 2);
                const rate = parseFloat(selectedMarketHotel.rate_per_night || 0);
                const totalCost = rate * durationNights * rooms;

                return (
                  <div className="flex justify-between text-amber-950 font-bold bg-amber-50/95 p-3 rounded-xl border border-amber-300">
                    <div className="space-y-0.5">
                      <span className="block">Live Stay: {selectedMarketHotel.name}</span>
                      <span className="text-xs text-amber-900 font-medium">
                        {rooms} Room{rooms > 1 ? 's' : ''} · {durationNights} Nights @ {currencySymbol}{rate.toLocaleString('en-IN')}/room/night
                      </span>
                    </div>
                    <span className="font-mono text-base">
                      +{currencySymbol}{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })()}

              {selectedGuide ? (
                <div className="flex justify-between text-[#2D6A24] font-bold bg-[#84D175]/25 p-3 rounded-xl border border-[#84D175]/40">
                  <div className="space-y-0.5">
                    <span className="block">Guide: {selectedGuide.display_name || selectedGuide.name}</span>
                    <span className="text-xs text-[#1a2e1a] font-semibold">Fixed Rate ({durationDays} Days)</span>
                  </div>
                  <span className="font-mono text-base">
                    +{currencySymbol}{parseFloat(pricingResult?.guide_cost || selectedGuide.day_rate || 3500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-[#1a2e1a] font-semibold">
                  <span>Local Tour Guide</span>
                  <span>Self-Guided ({currencySymbol}0)</span>
                </div>
              )}

              {addOnTotal > 0 && (
                <div className="flex justify-between text-[#2D6A24] font-bold bg-[#84D175]/25 p-2.5 rounded-xl border border-[#84D175]/40">
                  <span>Theme Add-ons ({numTravelers}p)</span>
                  <span className="font-mono font-bold">+{currencySymbol}{(addOnTotal * numTravelers).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Total Package Price Block */}
            <div className="pt-4 border-t border-[#84D175]/25 space-y-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] block">
                    TOTAL VERIFIED PRICE
                  </span>
                  <span className="text-xs text-[#1a2e1a] font-semibold">
                    Tax inclusive (5% GST included)
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-3xl sm:text-4xl font-serif font-bold text-[#1a2e1a] tracking-tight ${
                    priceFlash ? 'text-[#2D6A24] animate-pulse' : ''
                  }`}>
                    {currencySymbol}{displayTotal}
                  </div>
                  {numTravelers > 1 && (
                    <span className="text-xs sm:text-sm text-[#1a2e1a] font-mono block font-bold">
                      ≈ {currencySymbol}{(grandCalculatedTotal / numTravelers).toLocaleString('en-IN', { minimumFractionDigits: 0 })} / person
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleProceedToOptimize}
              className="w-full py-4 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-base sm:text-lg rounded-xl shadow-md shadow-[#84D175]/25 active:scale-[0.99] transition-all text-center cursor-pointer"
            >
              View Optimized Itinerary →
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Price Summary Bar (Screen < lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FFF8D2]/95 border-t border-[#84D175]/35 p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#1a2e1a]">Total Price ({numTravelers}p)</div>
          <div className="text-xl font-serif font-bold text-[#1a2e1a]">{currencySymbol}{displayTotal}</div>
        </div>
        <button
          onClick={handleProceedToOptimize}
          className="flex-1 max-w-xs py-3 px-4 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm rounded-xl shadow-md text-center cursor-pointer active:scale-95 transition-all"
        >
          Next: Itinerary →
        </button>
      </div>
    </div>
  );
}
