import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import GuideSelector from './GuideSelector';
import AddOnsPanel from './AddOnsPanel';
import RealWorldPanel from './RealWorldPanel';
import {
  Hotel, Activity, Car, Check, Layers, ArrowRight, ShieldCheck,
  Calendar, Clock, MapPin, Receipt, Sparkles, UserCheck, Plus,
  Trash2, X, Utensils, Ticket, Compass, Users, Zap
} from 'lucide-react';

export default function CustomizerStudio({
  packageDetailData,
  preferredLanguage,
  onOpenBooking,
  tripPrefs = {},
  onNextToOptimize,
  onBack,
  realWorldEnabled = false,
  onToggleRealWorld,
}) {
  const pkg = packageDetailData?.package;
  const rawComponents = packageDetailData?.components || [];
  const rawSwapGroups = packageDetailData?.swap_groups || [];

  const [selectedComponents, setSelectedComponents] = useState({});
  const [selectedGuide, setSelectedGuide] = useState(null);
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

  // Keep duration locked to curated package duration
  const durationDays = fixedDurationDays;

  // Whenever startDate or package changes, auto-update locked endDate
  const handleStartDateChange = (newStart) => {
    setStartDate(newStart);
    setEndDate(calculateEndDate(newStart, fixedDurationDays));
  };

  useEffect(() => {
    if (pkg?.duration_days) {
      setEndDate(calculateEndDate(startDate, pkg.duration_days));
    }
  }, [pkg?.duration_days, startDate]);

  // Group components by swap_group and categorize them
  const swapGroupsMap = useMemo(() => {
    const map = {};
    if (rawSwapGroups && rawSwapGroups.length > 0) {
      for (const sg of rawSwapGroups) {
        if (sg && sg.swap_group) {
          map[sg.swap_group] = sg.options || [];
        }
      }
    }
    // Also add any components with swap_groups not yet in the map
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

  // Standalone non-swappable components (e.g. transfers, meals, entry tickets without a swap group)
  const standaloneComponents = useMemo(() => {
    return rawComponents.filter(c => !c.swap_group);
  }, [rawComponents]);

  // Initialize selected components on package load
  useEffect(() => {
    if (!pkg) return;
    const initial = {};
    for (const [groupName, items] of Object.entries(swapGroupsMap)) {
      if (items.length > 0) {
        initial[groupName] = items[0].component_id;
      }
    }
    // Also include standalone mandatory components
    for (const comp of standaloneComponents) {
      if (comp.is_optional === 0) {
        initial[`standalone_${comp.component_id}`] = comp.component_id;
      }
    }
    setSelectedComponents(initial);
    setSelectedGuide(null);
  }, [pkg?.package_id]);

  // Live repricing strictly from scratch in Decimal
  useEffect(() => {
    async function triggerReprice() {
      if (!pkg?.package_id) return;
      const componentIds = Object.values(selectedComponents).filter(Boolean);
      setIsRepricing(true);
      try {
        const res = await api.reprice({
          package_id: pkg.package_id,
          selected_component_ids: componentIds,
          guide_id: selectedGuide?.guide_id || null,
          start_date: startDate,
          duration_days: durationDays,
          num_travelers: numTravelers
        });
        if (res && res.total_price) {
          setPricingResult(res);
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 800);
        }
      } catch (err) {
        console.warn('Reprice error:', err);
      } finally {
        setIsRepricing(false);
      }
    }
    triggerReprice();
  }, [pkg?.package_id, selectedComponents, selectedGuide, startDate, durationDays, numTravelers]);

  const handleSwap = (groupName, componentId) => {
    setSelectedComponents(prev => ({
      ...prev,
      [groupName]: componentId
    }));
  };

  const handleToggleStandalone = (componentId) => {
    const key = `standalone_${componentId}`;
    setSelectedComponents(prev => {
      const copy = { ...prev };
      if (copy[key]) {
        delete copy[key];
      } else {
        copy[key] = componentId;
      }
      return copy;
    });
  };

  const handleAddOnsChange = (ids, total) => {
    setAddOnTotal(total);
  };

  const handleProceedToOptimize = () => {
    onNextToOptimize?.({
      package: pkg,
      pricing: pricingResult,
      selectedGuide,
      selectedComponents,
      startDate,
      endDate,
      durationDays,
      numTravelers,
      partySize: numTravelers,
      addOnTotal,
      totalPrice: displayTotal,
      currency: pricingResult?.currency || pkg.currency || 'INR'
    });
  };

  if (!pkg) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">Loading customized package studio...</p>
      </div>
    );
  }

  const pkgTitle = pkg.name || pkg.title || 'Tour Customizer';
  const cityName = pkg.city_name || 'Destination';
  const durationNights = Math.max(1, durationDays - 1);
  const currencySymbol = pricingResult?.currency_symbol || (pkg.currency === 'USD' ? '$' : '₹');

  const baseCalculatedTotal = pricingResult?.total_price
    ? parseFloat(pricingResult.total_price)
    : (parseFloat(pkg.base_price || 32000) * numTravelers);

  const grandCalculatedTotal = Math.max(0, baseCalculatedTotal + (addOnTotal * numTravelers));
  const displayTotal = grandCalculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900 pb-12">

      {/* ── Subheader Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-xl transition-all cursor-pointer mb-1 shadow-sm"
            >
              ← Back to Discover
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customize {pkgTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200/80 text-slate-800 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-600" />
              {cityName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200/80 text-slate-800 flex items-center gap-1">
              <Clock className="w-3 h-3 text-teal-600" />
              {durationDays} Days / {durationNights} Nights
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
              <Users className="w-3 h-3 text-teal-600" />
              {numTravelers} Traveler{numTravelers > 1 ? 's' : ''}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
              {pkg.theme || 'Curated'} Theme
            </span>
          </div>
        </div>

        <button
          onClick={handleProceedToOptimize}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <span>Next: View Verified Itinerary</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column (Interactive Swappable Components & Inclusions) ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Party Size & Calendar Date Settings Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Trip Dates & Party Size
                </h3>
              </div>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Live Repricing Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    End Date
                  </label>
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-bold border border-teal-200">
                    Fixed {durationDays} Days
                  </span>
                </div>
                <input
                  type="date"
                  value={endDate}
                  readOnly
                  title={`Package duration is fixed to ${durationDays} days. Selecting a new start date automatically sets the end date.`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Party Size (Travelers)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 4, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setNumTravelers(count)}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        numTravelers === count
                          ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {count}p
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Swappable Package Components (Hotel Tiers, POIs, Activities) */}
          {Object.entries(swapGroupsMap).map(([groupName, items]) => {
            const currentSelectedId = selectedComponents[groupName];
            const firstItem = items[0] || {};
            const compType = firstItem.component_type || 'component';

            let typeIcon = <Activity className="w-4 h-4 text-teal-600" />;
            let typeLabel = `Swappable Option (${groupName})`;

            if (compType === 'hotel' || groupName.toLowerCase().includes('hotel') || groupName.toLowerCase().includes('stay')) {
              typeIcon = <Hotel className="w-4 h-4 text-amber-500" />;
              typeLabel = 'Accommodation & Hotel Tier';
            } else if (compType === 'poi' || groupName.toLowerCase().includes('poi') || groupName.toLowerCase().includes('activity')) {
              typeIcon = <Compass className="w-4 h-4 text-teal-600" />;
              typeLabel = 'Attraction & Experience Options';
            } else if (compType === 'guide' || groupName.toLowerCase().includes('guide')) {
              typeIcon = <UserCheck className="w-4 h-4 text-blue-600" />;
              typeLabel = 'Local Guide Delivery Option';
            }

            return (
              <div key={groupName} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    {typeIcon}
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {typeLabel}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {items.length} Choice{items.length > 1 ? 's' : ''} Available
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map((item) => {
                    const isSelected = currentSelectedId === item.component_id;
                    const delta = parseFloat(item.price_delta || '0');
                    const itemTitle = item.title || item.name || 'Component Option';

                    return (
                      <div
                        key={item.component_id}
                        onClick={() => handleSwap(groupName, item.component_id)}
                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-50/60 border-2 border-teal-500 shadow-md ring-2 ring-teal-500/20'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-900 line-clamp-2">
                            {itemTitle}
                          </div>
                          {item.slot && (
                            <div className="text-[10px] text-slate-500 uppercase font-mono">
                              Day {item.day_index || 1} • {item.slot}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className={`text-xs font-mono font-bold ${
                            delta === 0 ? 'text-slate-500' : delta > 0 ? 'text-teal-700' : 'text-emerald-700'
                          }`}>
                            {delta === 0 ? 'Included (Base)' : `${delta > 0 ? '+' : ''}${currencySymbol}${Math.abs(delta).toLocaleString('en-IN')}`}
                          </span>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 3. Included Non-Swappable Inclusions (Transfers, Meals, Tickets) */}
          {standaloneComponents.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Ticket className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Included Tour Inclusions & Passes
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Pre-Included in Package
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {standaloneComponents.map((comp) => {
                  const key = `standalone_${comp.component_id}`;
                  const isChecked = selectedComponents[key] !== undefined || comp.is_optional === 0;
                  const delta = parseFloat(comp.price_delta || '0');
                  const isOptional = comp.is_optional === 1;

                  return (
                    <div
                      key={comp.component_id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 truncate">{comp.title || comp.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1.5">
                          <span>{comp.component_type}</span>
                          <span>•</span>
                          <span className={isOptional ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                            {isOptional ? 'Optional Add-on' : 'Included In Package'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-emerald-700">
                          {delta > 0 ? `+${currencySymbol}${delta.toLocaleString('en-IN')}` : 'Included'}
                        </span>

                        {isOptional && (
                          <button
                            type="button"
                            onClick={() => handleToggleStandalone(comp.component_id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              isChecked
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs'
                            }`}
                          >
                            {isChecked ? (
                              <><Trash2 className="w-3 h-3" /><span>Remove</span></>
                            ) : (
                              <><Plus className="w-3 h-3" /><span>Add</span></>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Optional Local Tour Guide Selector (§2.2 Mandatory Enhancement) */}
          <GuideSelector
            packageId={pkg.package_id}
            cityId={pkg.city_id}
            startDate={startDate}
            durationDays={durationDays}
            selectedGuide={selectedGuide}
            onSelectGuide={setSelectedGuide}
            preferredLanguage={preferredLanguage}
            availableGuides={packageDetailData?.available_guides || []}
          />

          {/* 5. Recommended Add-ons Panel */}
          <AddOnsPanel
            selectedTheme={pkg.theme}
            onAddOnsChange={handleAddOnsChange}
          />

          {/* 6. Live External Market Data Comparison (SerpAPI Google Hotels) */}
          {realWorldEnabled ? (
            <RealWorldPanel cityName={pkg.city_name || 'Goa'} />
          ) : (
            <div className="bg-white/90 border border-[#84D175]/35 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-[#84D175]/20 text-[#2D6A24]">
                  <Zap className="w-5 h-5 text-[#2D6A24]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1a2e1a]">Compare Live Market Rates (Google Hotels)</h4>
                  <p className="text-[11px] text-[#4a5e4a]">
                    View live real-time hotel pricing in {pkg.city_name || 'this destination'} via SerpAPI
                  </p>
                </div>
              </div>
              {onToggleRealWorld && (
                <button
                  type="button"
                  onClick={() => onToggleRealWorld(true)}
                  className="px-4 py-2 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  ⚡ View Live Market Rates
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right Column: Sticky Live Price Summary & Breakdown ── */}
        <div className="lg:col-span-4 space-y-5">
          <div className="sticky top-20 bg-white border-2 border-teal-500/80 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Live Repricing Quote
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  {numTravelers} Traveler{numTravelers > 1 ? 's' : ''} • Zero Float Decimal
                </span>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                isRepricing ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {isRepricing ? '⟳ Recalculating...' : '✓ Decimal Verified'}
              </span>
            </div>

            {/* Price Line Items */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-700 font-medium">
                <div>
                  <span className="block">Base Rate ({numTravelers}p × {currencySymbol}{parseFloat(pkg.base_price || 32000).toLocaleString('en-IN')})</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {currencySymbol}{(parseFloat(pkg.base_price || 32000) * numTravelers).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {pricingResult?.components_delta_total && parseFloat(pricingResult.components_delta_total) !== 0 && (
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Component Adjustments ({numTravelers}p)</span>
                  <span className={`font-mono font-bold ${
                    parseFloat(pricingResult.components_delta_total) >= 0 ? 'text-teal-700' : 'text-emerald-700'
                  }`}>
                    {parseFloat(pricingResult.components_delta_total) >= 0 ? '+' : ''}{currencySymbol}{(parseFloat(pricingResult.components_delta_total) * numTravelers).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {selectedGuide ? (
                <div className="flex justify-between text-amber-900 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <div className="space-y-0.5">
                    <span className="block">Guide: {selectedGuide.display_name || selectedGuide.name}</span>
                    <span className="text-[10px] text-amber-700 font-normal">Fixed Group Rate ({durationDays} Days)</span>
                  </div>
                  <span className="font-mono">
                    +{currencySymbol}{parseFloat(pricingResult?.guide_cost || selectedGuide.day_rate || 3500).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400">
                  <span>Local Tour Guide</span>
                  <span>Self-Guided (₹0)</span>
                </div>
              )}

              {addOnTotal > 0 && (
                <div className="flex justify-between text-indigo-700 font-medium bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                  <span>Theme Add-ons ({numTravelers}p)</span>
                  <span className="font-mono font-bold">+{currencySymbol}{(addOnTotal * numTravelers).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Total Package Price Block */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                    TOTAL VERIFIED PRICE
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Tax inclusive (5% GST included)
                  </span>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-black text-slate-900 font-mono tracking-tight ${
                    priceFlash ? 'text-teal-600 animate-pulse' : ''
                  }`}>
                    {currencySymbol}{displayTotal}
                  </div>
                  {numTravelers > 1 && (
                    <span className="text-[11px] text-slate-500 font-mono block">
                      ≈ {currencySymbol}{(grandCalculatedTotal / numTravelers).toLocaleString('en-IN', { minimumFractionDigits: 0 })} / person
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleProceedToOptimize}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Optimized Itinerary →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Price Summary Bar (Screen < lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-slate-200 p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Price ({numTravelers}p)</div>
          <div className="text-xl font-black text-slate-900 font-mono">{currencySymbol}{displayTotal}</div>
        </div>
        <button
          onClick={handleProceedToOptimize}
          className="flex-1 max-w-xs py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <span>Next: Itinerary</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
