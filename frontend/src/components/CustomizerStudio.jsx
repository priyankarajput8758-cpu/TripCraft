import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import GuideSelector from './GuideSelector';
import AddOnsPanel from './AddOnsPanel';
import OptimizationPanel from './OptimizationPanel';
import SaveShareActions from './SaveShareActions';
import {
  Hotel, Activity, Car, Check, Layers, ArrowRight, ShieldCheck,
  Calendar, Clock, MapPin, Receipt, CalendarRange, Sparkles, UserCheck, Plus, Trash2, X
} from 'lucide-react';

const AVAILABLE_ACTIVITIES = [
  { id: 'act_1', title: 'Heritage Walk (Old Goa)', day: 'Day 2 • 3 Hours', price: 3000 },
  { id: 'act_2', title: 'Goan Food Tour', day: 'Day 2 • 2.5 Hours', price: 3500 },
  { id: 'act_3', title: 'Water Sports Package', day: 'Day 3 • Half Day', price: 3500 },
  { id: 'act_4', title: 'Scuba Diving & Coral Reef', day: 'Day 3 • Full Day', price: 4500 },
  { id: 'act_5', title: 'Spice Plantation Tour & Lunch', day: 'Day 4 • 4 Hours', price: 2000 },
  { id: 'act_6', title: 'Mandovi River Sunset Cruise', day: 'Day 4 • 2 Hours', price: 1500 },
];

export default function CustomizerStudio({
  packageDetailData,
  preferredLanguage,
  onOpenBooking,
  tripPrefs = {},
  onNextToOptimize,
  onBack,
}) {
  const pkg = packageDetailData?.package;
  const components = packageDetailData?.components || [];
  const initialSwapGroups = packageDetailData?.swap_groups || [];

  const [selectedComponents, setSelectedComponents] = useState({});
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [startDate, setStartDate] = useState(tripPrefs.startDate || '2026-09-24');
  const [endDate, setEndDate] = useState(tripPrefs.endDate || '2026-09-28');
  const [pricingResult, setPricingResult] = useState(null);
  const [isRepricing, setIsRepricing] = useState(false);
  const [addOnTotal, setAddOnTotal] = useState(0);
  const [priceFlash, setPriceFlash] = useState(false);
  const [transferType, setTransferType] = useState('private');

  /* Interactive Activities State */
  const [activitiesList, setActivitiesList] = useState([
    AVAILABLE_ACTIVITIES[0],
    AVAILABLE_ACTIVITIES[1],
    AVAILABLE_ACTIVITIES[2],
  ]);
  const [swapModalIdx, setSwapModalIdx] = useState(null);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);

  // Compute duration from dates
  const durationDays = useMemo(() => {
    if (startDate && endDate) {
      const diff = Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
      return Math.max(1, diff);
    }
    return pkg?.duration_days || 5;
  }, [startDate, endDate, pkg?.duration_days]);

  // Group components by swap_group
  const swapGroups = useMemo(() => {
    if (initialSwapGroups && initialSwapGroups.length > 0) {
      const map = {};
      for (const sg of initialSwapGroups) {
        map[sg.swap_group] = sg.options || [];
      }
      return map;
    }
    const groups = {};
    for (const comp of components) {
      const groupName = comp.swap_group || 'general_options';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(comp);
    }
    return groups;
  }, [initialSwapGroups, components]);

  // Initial selection: first item of each swap group
  useEffect(() => {
    if (!pkg) return;
    const initial = {};
    for (const [group, items] of Object.entries(swapGroups)) {
      if (items.length > 0) initial[group] = items[0].component_id;
    }
    setSelectedComponents(initial);
    setSelectedGuide(null);
  }, [pkg?.package_id]);

  // Total activity cost calculation
  const totalActivitiesCost = useMemo(() => {
    return activitiesList.reduce((sum, act) => sum + act.price, 0);
  }, [activitiesList]);

  // Live repricing from scratch on every change
  useEffect(() => {
    async function triggerReprice() {
      if (!pkg?.package_id) return;
      const componentIds = Object.values(selectedComponents).filter(Boolean);
      setIsRepricing(true);
      try {
        const res = await api.reprice(
          pkg.package_id,
          componentIds,
          selectedGuide?.guide_id || null,
          startDate,
          durationDays
        );
        if (res && res.total_price) {
          setPricingResult(res);
          setPriceFlash(true);
          setTimeout(() => setPriceFlash(false), 900);
        }
      } catch (err) {
        console.error('Reprice error:', err);
      } finally {
        setIsRepricing(false);
      }
    }
    triggerReprice();
  }, [pkg?.package_id, selectedComponents, selectedGuide, startDate, durationDays, transferType, activitiesList]);

  const handleSwap = (group, componentId) => {
    setSelectedComponents(prev => ({ ...prev, [group]: componentId }));
  };

  const handleRemoveActivity = (idx) => {
    setActivitiesList(prev => prev.filter((_, i) => i !== idx));
    setPriceFlash(true);
  };

  const handleSwapActivity = (idx, newAct) => {
    setActivitiesList(prev => {
      const copy = [...prev];
      copy[idx] = newAct;
      return copy;
    });
    setSwapModalIdx(null);
    setPriceFlash(true);
  };

  const handleAddActivity = (newAct) => {
    if (!activitiesList.some(a => a.id === newAct.id)) {
      setActivitiesList(prev => [...prev, newAct]);
      setPriceFlash(true);
    }
    setIsAddActivityOpen(false);
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
      addOnTotal,
      transferType,
      activitiesList,
      totalPrice: displayTotal,
    });
  };

  if (!pkg) return null;

  const pkgTitle = pkg.name || pkg.title || 'Tour Customizer';
  const cityName = pkg.city_name || 'Goa';
  const durationNights = Math.max(1, durationDays - 1);

  const basePriceNum = parseFloat(pricingResult?.total_price || pkg.base_price || 35000);
  const transferAdjust = transferType === 'shared' ? -2500 : 0;
  const activityAdjust = totalActivitiesCost - 10000;
  const computedTotal = Math.max(0, basePriceNum + addOnTotal + transferAdjust + activityAdjust);
  const displayTotal = computedTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 });

  return (
    <div className="space-y-6 animate-in">

      {/* ── Subheader Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-xl transition-all cursor-pointer mb-1 shadow-sm"
            >
              ← Back
            </button>
          )}
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customize Your Package
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800">
              {cityName}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800">
              {durationDays} Days / {durationNights} Nights
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-800">
              2 Travelers
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Balanced Pace
            </span>
          </div>
        </div>

        <button
          onClick={handleProceedToOptimize}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <span>Next: View Itinerary →</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column (Hotel Tier, Activities, Guide, Transfer, Add-ons) ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Hotel Tier Selector (Pure White Card matching Screenshot 3) */}
          {Object.entries(swapGroups).filter(([name]) => name.toLowerCase().includes('hotel') || name.toLowerCase().includes('tier') || name.toLowerCase().includes('stay')).map(([groupName, items]) => {
            const currentSelectedId = selectedComponents[groupName];
            return (
              <div key={groupName} className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Hotel className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Hotel Tier
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Current: Premium
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {items.map((item) => {
                    const isSelected = currentSelectedId === item.component_id;
                    const delta = parseFloat(item.price_delta || '0');
                    const itemTitle = item.title || item.name || 'Tier';

                    return (
                      <div
                        key={item.component_id}
                        onClick={() => handleSwap(groupName, item.component_id)}
                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/50 border-2 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{itemTitle}</div>
                        <div className="text-sm font-extrabold text-blue-600 font-mono mt-1">
                          ₹{(18000 + delta).toLocaleString('en-IN')}
                        </div>
                        <div className={`text-[10px] font-bold mt-1 ${
                          delta === 0 ? 'text-slate-400' : delta > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {delta === 0 ? 'Standard Rate' : `${delta > 0 ? '+' : ''}₹${delta.toLocaleString('en-IN')}`}
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 2. Selected Activities List (Interactive Swap, Remove & Add) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Selected Activities ({activitiesList.length})
                </h3>
              </div>
              <button
                onClick={() => setIsAddActivityOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Add Activity
              </button>
            </div>

            <div className="space-y-2.5">
              {activitiesList.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No activities selected. Click "+ Add Activity" to browse available tours.
                </div>
              ) : (
                activitiesList.map((act, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{act.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{act.day}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        ₹{act.price.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => setSwapModalIdx(idx)}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-700 hover:bg-slate-100 text-[11px] font-bold border border-slate-300 shadow-sm cursor-pointer"
                      >
                        Swap
                      </button>
                      <button
                        onClick={() => handleRemoveActivity(idx)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold border border-rose-200 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Optional Local Tour Guide Component (High Impact Amber Box matching Screenshot 3) */}
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

          {/* 4. Transfer Type & Trip Duration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Transfer Type Toggle */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transfer Type
                </span>
                <span className="text-xs font-bold text-blue-600 capitalize">{transferType}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTransferType('private')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    transferType === 'private'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Private (₹5k)
                </button>

                <button
                  type="button"
                  onClick={() => setTransferType('shared')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    transferType === 'shared'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Shared (₹2.5k)
                </button>
              </div>
            </div>

            {/* Trip Duration Indicator */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Trip Duration
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  Live
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center text-xs font-bold text-slate-900">
                {durationDays} Days / {durationNights} Nights
              </div>
            </div>
          </div>

          {/* 5. Recommended Add-ons Panel */}
          <AddOnsPanel
            selectedTheme={pkg.theme}
            onAddOnsChange={handleAddOnsChange}
          />
        </div>

        {/* ── Right Column: Sticky Live Price Summary (Pure White Card matching Screenshot 3) ── */}
        <div className="lg:col-span-4 space-y-5">
          <div className="sticky top-20 bg-white border-2 border-blue-500/80 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Live Price Summary
              </h3>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                isRepricing ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {isRepricing ? '⟳ Recalculating...' : 'Real-Time'}
              </span>
            </div>

            {/* Price Line Items */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>Hotel (Premium 4N)</span>
                <span className="font-mono font-bold text-slate-900">₹18,000</span>
              </div>

              <div className="flex justify-between text-slate-700 font-medium">
                <span>Activities ({activitiesList.length} Selected)</span>
                <span className="font-mono font-bold text-slate-900">₹{totalActivitiesCost.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-700 font-medium">
                <span>{transferType === 'shared' ? 'Shared Transfers' : 'Private Transfers'}</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{transferType === 'shared' ? '2,500' : '5,000'}
                </span>
              </div>

              {selectedGuide ? (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>{selectedGuide.display_name || selectedGuide.name || 'Tamil Tour Guide'}</span>
                  <span className="font-mono">
                    +₹{parseFloat(pricingResult?.guide_detail?.total_guide_cost || selectedGuide.day_rate || 3500).toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-slate-400">
                  <span>Local Tour Guide</span>
                  <span>Not Added</span>
                </div>
              )}

              {addOnTotal > 0 && (
                <div className="flex justify-between text-indigo-700 font-medium">
                  <span>Taxes & Add-ons</span>
                  <span className="font-mono font-bold">+₹{addOnTotal.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Total Package Price Block */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  TOTAL PACKAGE
                </span>
                <div className="text-right">
                  <div className={`text-3xl font-black text-slate-900 font-mono tracking-tight ${
                    priceFlash ? 'text-blue-600 animate-pulse' : ''
                  }`}>
                    ₹{displayTotal}
                  </div>
                  {selectedGuide && (
                    <span className="inline-block text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200 mt-1">
                      +₹{parseFloat(selectedGuide.day_rate || 3500).toLocaleString('en-IN')} Guide Included
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* View Optimized Itinerary CTA */}
            <button
              onClick={handleProceedToOptimize}
              className="w-full py-3.5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-sm rounded-xl shadow-lg shadow-[#84D175]/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Optimized Itinerary →</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Price Summary Bar (Screen < lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 border-t border-[#84D175]/40 p-4 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-[#4a5e4a]">Total Package</div>
          <div className="text-xl font-black text-[#1a2e1a] font-mono">₹{displayTotal}</div>
        </div>
        <button
          onClick={handleProceedToOptimize}
          className="flex-1 max-w-xs py-3 px-4 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <span>Next: Itinerary</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Swap Activity Modal ── */}
      {swapModalIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Swap Activity</h3>
              <button onClick={() => setSwapModalIdx(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {AVAILABLE_ACTIVITIES.map((act) => (
                <div
                  key={act.id}
                  onClick={() => handleSwapActivity(swapModalIdx, act)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{act.title}</div>
                    <div className="text-[11px] text-slate-500">{act.day}</div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 font-mono">₹{act.price.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Activity Modal ── */}
      {isAddActivityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Add New Activity to Package</h3>
              <button onClick={() => setIsAddActivityOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {AVAILABLE_ACTIVITIES.filter(a => !activitiesList.some(act => act.id === a.id)).map((act) => (
                <div
                  key={act.id}
                  onClick={() => handleAddActivity(act)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{act.title}</div>
                    <div className="text-[11px] text-slate-500">{act.day}</div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 font-mono">+₹{act.price.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
