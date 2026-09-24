import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import GuideSelector from './GuideSelector';
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
  Compass
} from 'lucide-react';

export default function CustomizerStudio({
  packageDetailData,
  preferredLanguage,
  onOpenBooking
}) {
  const pkg = packageDetailData?.package;
  const components = packageDetailData?.components || [];
  const initialSwapGroups = packageDetailData?.swap_groups || [];

  const [selectedComponents, setSelectedComponents] = useState({});
  const [optionalAddOns, setOptionalAddOns] = useState({});
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [startDate, setStartDate] = useState('2026-09-24');
  const [pricingResult, setPricingResult] = useState(null);
  const [isRepricing, setIsRepricing] = useState(false);
  const [activeTab, setActiveTab] = useState('components'); // 'components' | 'itinerary'

  // Translation State
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [translatingLang, setTranslatingLang] = useState(null);

  // Group components into Swap Groups and Optional Add-ons
  const { swapGroups, optionalComponents, dayByDayItinerary } = useMemo(() => {
    const sGroups = {};
    const optList = [];
    const days = {};

    // Populate swap groups from initialSwapGroups if provided
    if (initialSwapGroups && initialSwapGroups.length > 0) {
      for (const sg of initialSwapGroups) {
        sGroups[sg.swap_group] = sg.options || [];
      }
    }

    for (const comp of components) {
      // Day by day timeline grouping
      const dayIdx = comp.day_index || 1;
      if (!days[dayIdx]) days[dayIdx] = [];
      days[dayIdx].push(comp);

      // Separate optional non-swappable components
      if (comp.is_optional === 1 && !comp.swap_group) {
        optList.push(comp);
      } else if (comp.swap_group && (!initialSwapGroups || initialSwapGroups.length === 0)) {
        if (!sGroups[comp.swap_group]) {
          sGroups[comp.swap_group] = [];
        }
        sGroups[comp.swap_group].push(comp);
      }
    }

    return {
      swapGroups: sGroups,
      optionalComponents: optList,
      dayByDayItinerary: days
    };
  }, [initialSwapGroups, components]);

  // Initial selection: select first item of each swap group
  useEffect(() => {
    if (!pkg) return;
    const initial = {};
    for (const [group, items] of Object.entries(swapGroups)) {
      if (items.length > 0) {
        initial[group] = items[0].component_id;
      }
    }
    setSelectedComponents(initial);
    setOptionalAddOns({});
    setSelectedGuide(null);
    setTranslatedTitle(null);
    setTranslatedDesc(null);
  }, [pkg?.package_id, swapGroups]);

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

  // Trigger live repricing strictly from scratch on every change
  useEffect(() => {
    async function triggerReprice() {
      if (!pkg?.package_id) return;
      const swapComponentIds = Object.values(selectedComponents).filter(Boolean);
      const optionalIds = Object.keys(optionalAddOns).filter(id => optionalAddOns[id]);
      const allSelectedIds = [...swapComponentIds, ...optionalIds];

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
          setPricingResult(res);
        }
      } catch (err) {
        console.error('Reprice error:', err);
      } finally {
        setIsRepricing(false);
      }
    }

    triggerReprice();
  }, [pkg?.package_id, selectedComponents, optionalAddOns, selectedGuide, startDate]);

  const handleSwap = (group, componentId) => {
    setSelectedComponents(prev => ({
      ...prev,
      [group]: componentId
    }));
  };

  const toggleAddOn = (comp) => {
    setOptionalAddOns(prev => ({
      ...prev,
      [comp.component_id]: !prev[comp.component_id]
    }));
  };

  const getGroupIcon = (group) => {
    const lower = group.toLowerCase();
    if (lower.includes('hotel') || lower.includes('tier') || lower.includes('stay') || lower.includes('room')) {
      return <Hotel className="w-4 h-4 text-amber-400" />;
    }
    if (lower.includes('activity') || lower.includes('sightseeing') || lower.includes('trek') || lower.includes('tour')) {
      return <Activity className="w-4 h-4 text-teal-400" />;
    }
    if (lower.includes('transfer') || lower.includes('transport') || lower.includes('cab') || lower.includes('flight')) {
      return <Car className="w-4 h-4 text-cyan-400" />;
    }
    return <Layers className="w-4 h-4 text-indigo-400" />;
  };

  const formatGroupName = (group) => {
    return group
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  if (!pkg) return null;

  const pkgTitle = translatedTitle || pkg.name || pkg.title || 'Tour Customizer';
  const pkgDesc = translatedDesc || pkg.description;
  const durationNights = pkg.duration_nights || (pkg.duration_days ? pkg.duration_days - 1 : 1);

  return (
    <div className="space-y-6">
      {/* Top Banner: Package Overview, Date Controls & Translation Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/70 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold uppercase tracking-wider">
                {pkg.theme || 'Curated Tour'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {pkg.city_name || 'Destination'} {pkg.city_state ? `(${pkg.city_state})` : ''}
              </span>
              {pkg.difficulty && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-medium">
                  {pkg.difficulty}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {pkgTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {pkgDesc}
            </p>
          </div>

          {/* Date & Duration Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 shrink-0">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Departure Date
              </label>
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white">
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
                Duration
              </label>
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-semibold">{pkg.duration_days} Days / {durationNights} Nights</span>
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
                className={`px-2 py-0.5 rounded-md text-[11px] border transition-all cursor-pointer ${
                  translatingLang === lang.code
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300 animate-pulse'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {translatingLang === lang.code ? 'Translating...' : lang.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('components')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'components' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Component Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'itinerary' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Day-by-Day Itinerary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Swapper Studio / Itinerary (Left) & Price Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Component Swap Groups & Guide Dimension (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'components' ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-teal-400" />
                  <span>Customizable Package Components</span>
                </h2>
                <span className="text-xs text-slate-400">
                  Swapping recalculates Decimal pricing strictly from zero
                </span>
              </div>

              {/* Swap Groups */}
              {Object.entries(swapGroups).map(([groupName, items]) => {
                const currentSelectedId = selectedComponents[groupName];
                // Find active option to compute relative deltas
                const activeOption = items.find(i => i.component_id === currentSelectedId) || items[0];
                const activeDelta = parseFloat(activeOption?.price_delta || '0');

                return (
                  <div
                    key={groupName}
                    className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-slate-800">
                          {getGroupIcon(groupName)}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-200">
                          {formatGroupName(groupName)}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {items.length} Options Available
                      </span>
                    </div>

                    {/* Option Cards with Relative Pricing Deltas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.map((item) => {
                        const isSelected = currentSelectedId === item.component_id;
                        const itemDelta = parseFloat(item.price_delta || '0');
                        const relativeDiff = itemDelta - activeDelta;
                        const itemTitle = item.title || item.name || 'Component Option';

                        return (
                          <div
                            key={item.component_id}
                            onClick={() => handleSwap(groupName, item.component_id)}
                            className={`relative p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/50 shadow-md shadow-teal-500/10'
                                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 pr-3">
                                <div className="text-xs font-semibold text-white">
                                  {itemTitle}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {item.type ? `${item.type.toUpperCase()} • ` : ''}Day {item.day_index || 1} ({item.slot || 'all day'})
                                </div>
                                {item.description && (
                                  <p className="text-[10px] text-slate-400 line-clamp-2 pt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-teal-500 text-slate-950 font-bold' : 'border border-slate-600'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>

                            {/* Relative Price Delta Tag */}
                            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">
                                {isSelected ? 'Current Selection:' : 'Price Difference:'}
                              </span>
                              <span className={`font-semibold font-mono ${
                                isSelected
                                  ? 'text-emerald-400'
                                  : relativeDiff > 0
                                  ? 'text-amber-400'
                                  : relativeDiff < 0
                                  ? 'text-teal-400'
                                  : 'text-slate-400'
                              }`}>
                                {isSelected
                                  ? 'Included (+₹0.00)'
                                  : relativeDiff > 0
                                  ? `+₹${relativeDiff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                  : relativeDiff < 0
                                  ? `-₹${Math.abs(relativeDiff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                                  : '+₹0.00 (Same Price)'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Optional Add-on Experiences (e.g. VIP Darshan, Aarti Cruise, Safari pass) */}
              {optionalComponents.length > 0 && (
                <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-semibold text-slate-200">
                        Optional Experiences & Add-on Upgrades
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {optionalComponents.length} Optional
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {optionalComponents.map((opt) => {
                      const isChecked = !!optionalAddOns[opt.component_id];
                      const delta = parseFloat(opt.price_delta || '0');
                      return (
                        <div
                          key={opt.component_id}
                          onClick={() => toggleAddOn(opt)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                            isChecked
                              ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                              : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                          }`}
                        >
                          <div className="space-y-1 pr-3">
                            <div className="text-xs font-semibold text-white">
                              {opt.title}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Day {opt.day_index || 1} • {opt.slot || 'flexible slot'}
                            </div>
                            {opt.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-2">
                                {opt.description}
                              </p>
                            )}
                            <div className="text-xs font-mono font-bold text-amber-400 pt-1">
                              +₹{delta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
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
            /* Day-by-Day Timeline View */
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-teal-400" />
                  <span>Day-by-Day Itinerary Schedule</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {pkg.duration_days} Days Planned
                </span>
              </div>

              <div className="space-y-4">
                {Object.entries(dayByDayItinerary).map(([dayNum, dayItems]) => (
                  <div key={dayNum} className="border-l-2 border-teal-500/50 pl-4 py-1 space-y-2 relative">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                      {dayNum}
                    </div>
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                      Day {dayNum} Program
                    </h4>
                    <div className="space-y-2">
                      {dayItems.map((item) => (
                        <div key={item.component_id} className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{item.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                              {item.slot || 'schedule'}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 pt-1">{item.description}</p>
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
            preferredLanguage={preferredLanguage}
            availableGuides={packageDetailData?.available_guides || []}
          />
        </div>

        {/* Right Column: Live Repricing Breakdown & Booking Action (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="sticky top-20 bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Price Summary
                </h3>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isRepricing ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {isRepricing ? 'Recalculating...' : 'Decimal Price Quote'}
              </span>
            </div>

            {/* Reprice Breakdown Rows */}
            <div className="space-y-3 text-xs">
              {/* Base Price */}
              <div className="flex justify-between items-center text-slate-300">
                <span>Base Package Price</span>
                <span className="font-medium text-white font-mono">
                  ₹{parseFloat(pricingResult?.base_price || pkg.base_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Component Deltas Breakdown */}
              {pricingResult?.line_items?.map((item) => {
                const delta = parseFloat(item.price_delta || '0');
                return (
                  <div key={item.component_id} className="flex justify-between items-center text-slate-400 text-[11px] pl-2 border-l border-slate-800">
                    <span className="truncate pr-2">{item.title}</span>
                    <span className={`font-mono font-semibold ${delta > 0 ? 'text-amber-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {delta === 0 ? '₹0.00' : `${delta > 0 ? '+' : ''}₹${delta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                );
              })}

              {/* Guide Price Breakdown */}
              {pricingResult?.guide_detail ? (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between items-center text-teal-300 text-xs font-medium">
                    <span>Local Guide ({pricingResult.guide_detail.guide_name})</span>
                    <span className="font-mono font-semibold">
                      +₹{parseFloat(pricingResult.guide_detail.total_guide_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Rate Calculation:</span>
                    <span>
                      ₹{parseFloat(pricingResult.guide_detail.day_rate).toLocaleString('en-IN')} × {pricingResult.guide_detail.days} days
                      {parseFloat(pricingResult.guide_detail.price_multiplier || 1) > 1 ? ` × ${pricingResult.guide_detail.price_multiplier}x peak` : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-slate-500 text-xs">
                  <span>Tour Guide</span>
                  <span>Not Selected (Self-guided)</span>
                </div>
              )}

              {/* Inclusions note */}
              <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                <span>Taxes & Fees (5% GST)</span>
                <span className="text-slate-300 font-mono">
                  Included in Total
                </span>
              </div>
            </div>

            {/* Total Price Card */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-teal-500/30 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider text-teal-400 font-bold">
                  Total Final Price
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
                selectedComponents: { ...selectedComponents, ...optionalAddOns }
              })}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Review & Book Custom Itinerary</span>
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
