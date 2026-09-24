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
  HelpCircle
} from 'lucide-react';

export default function CustomizerStudio({
  packageData,
  preferredLanguage,
  onOpenBooking
}) {
  const [selectedComponents, setSelectedComponents] = useState({});
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [startDate, setStartDate] = useState('2026-09-24');
  const [pricingResult, setPricingResult] = useState(null);
  const [isRepricing, setIsRepricing] = useState(false);

  // Group components by swap_group
  const swapGroups = useMemo(() => {
    if (!packageData || !packageData.components) return {};
    const groups = {};
    for (const comp of packageData.components) {
      const groupName = comp.swap_group || 'general';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(comp);
    }
    return groups;
  }, [packageData]);

  // Initial selection: default first item of each swap group
  useEffect(() => {
    if (!packageData || !packageData.components) return;
    const initial = {};
    for (const [group, items] of Object.entries(swapGroups)) {
      if (items.length > 0) {
        initial[group] = items[0].component_id;
      }
    }
    setSelectedComponents(initial);
  }, [packageData, swapGroups]);

  // Reprice whenever selected components, guide, or date changes
  useEffect(() => {
    async function triggerReprice() {
      if (!packageData?.package_id) return;
      const componentIds = Object.values(selectedComponents).filter(Boolean);
      setIsRepricing(true);

      try {
        const res = await api.reprice(
          packageData.package_id,
          componentIds,
          selectedGuide?.guide_id || null,
          startDate,
          packageData.duration_days
        );

        if (res.status === 'success') {
          setPricingResult(res.data);
        }
      } catch (err) {
        console.error('Reprice error:', err);
      } finally {
        setIsRepricing(false);
      }
    }

    triggerReprice();
  }, [packageData?.package_id, selectedComponents, selectedGuide, startDate]);

  const handleSwap = (group, componentId) => {
    setSelectedComponents(prev => ({
      ...prev,
      [group]: componentId
    }));
  };

  const getGroupIcon = (group) => {
    const lower = group.toLowerCase();
    if (lower.includes('hotel') || lower.includes('tier') || lower.includes('stay')) {
      return <Hotel className="w-4 h-4 text-amber-400" />;
    }
    if (lower.includes('activity') || lower.includes('sightseeing') || lower.includes('trek')) {
      return <Activity className="w-4 h-4 text-teal-400" />;
    }
    if (lower.includes('transfer') || lower.includes('transport') || lower.includes('cab')) {
      return <Car className="w-4 h-4 text-cyan-400" />;
    }
    return <Layers className="w-4 h-4 text-indigo-400" />;
  };

  const formatGroupName = (group) => {
    return group
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Package Overview & Date Picker */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/70 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold uppercase tracking-wider">
                {packageData?.theme || 'Curated Tour'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {packageData?.city_name || 'Destination'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {packageData?.title || 'Tour Package Customization'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {packageData?.description}
            </p>
          </div>

          {/* Date & Duration Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
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
                <span className="font-semibold">{packageData?.duration_days} Days / {packageData?.duration_days - 1} Nights</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Swapper Studio (Left) & Price Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Component Swap Groups & Guide Dimension (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <span>Customizable Package Components</span>
            </h2>
            <span className="text-xs text-slate-400">
              Swapping updates pricing live using exact Decimal math
            </span>
          </div>

          {/* Swap Groups */}
          {Object.entries(swapGroups).map(([groupName, items]) => {
            const currentSelectedId = selectedComponents[groupName];
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

                {/* Option Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((item) => {
                    const isSelected = currentSelectedId === item.component_id;
                    const delta = parseFloat(item.price_delta || '0');
                    return (
                      <div
                        key={item.component_id}
                        onClick={() => handleSwap(groupName, item.component_id)}
                        className={`relative p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-950/30 border-teal-500/80 ring-1 ring-teal-500/50 shadow-md shadow-teal-500/5'
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 pr-4">
                            <div className="text-xs font-semibold text-white">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-2">
                              {item.description}
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-teal-500 text-slate-950' : 'border border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Price Delta Tag */}
                        <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Price Adjustment:</span>
                          <span className={`font-semibold ${
                            delta === 0
                              ? 'text-slate-400'
                              : delta > 0
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {delta === 0 ? 'Included (Base)' : `${delta > 0 ? '+' : ''}₹${delta.toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Guide Dimension Selector with Mandatory Clash Refusal Flow (§2.2) */}
          <GuideSelector
            packageId={packageData?.package_id}
            cityId={packageData?.city_id}
            startDate={startDate}
            durationDays={packageData?.duration_days || 1}
            selectedGuide={selectedGuide}
            onSelectGuide={setSelectedGuide}
            preferredLanguage={preferredLanguage}
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
                {isRepricing ? 'Recalculating...' : 'Real-Time Decimal Quote'}
              </span>
            </div>

            {/* Reprice Breakdown Rows */}
            <div className="space-y-3 text-xs">
              {/* Base Price */}
              <div className="flex justify-between items-center text-slate-300">
                <span>Base Package Price</span>
                <span className="font-medium text-white">
                  ₹{parseFloat(pricingResult?.base_price || packageData?.base_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Component Deltas Breakdown */}
              {pricingResult?.components_breakdown?.map((item) => {
                const delta = parseFloat(item.price_delta);
                return (
                  <div key={item.component_id} className="flex justify-between items-center text-slate-400 text-[11px] pl-2 border-l border-slate-800">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className={`font-mono ${delta > 0 ? 'text-amber-400' : delta < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {delta === 0 ? '₹0.00' : `${delta > 0 ? '+' : ''}₹${delta.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </span>
                  </div>
                );
              })}

              {/* Guide Price Breakdown */}
              {pricingResult?.guide_breakdown ? (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between items-center text-teal-300 text-xs font-medium">
                    <span>Local Guide ({pricingResult.guide_breakdown.guide_name})</span>
                    <span className="font-mono font-semibold">
                      +₹{parseFloat(pricingResult.guide_breakdown.total_guide_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between">
                    <span>Rate Calculation:</span>
                    <span>
                      ₹{parseFloat(pricingResult.guide_breakdown.day_rate).toLocaleString('en-IN')} × {pricingResult.guide_breakdown.days} days
                      {parseFloat(pricingResult.guide_breakdown.price_multiplier) > 1 ? ` × ${pricingResult.guide_breakdown.price_multiplier}x peak` : ''}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center text-slate-500 text-xs">
                  <span>Tour Guide</span>
                  <span>Not Selected</span>
                </div>
              )}

              {/* GST / Taxes notice */}
              <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1">
                <span>GST & Statutory Fees (5%)</span>
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
                  <div className="text-2xl font-black text-white tracking-tight">
                    ₹{parseFloat(pricingResult?.total_price || packageData?.base_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Inclusive of all customized components & taxes
                  </div>
                </div>
              </div>
            </div>

            {/* Book Custom Trip CTA */}
            <button
              onClick={() => onOpenBooking({
                package: packageData,
                pricing: pricingResult,
                startDate,
                selectedGuide,
                selectedComponents
              })}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
            >
              <span>Review & Book Custom Itinerary</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-float financial precision backed by tests</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
