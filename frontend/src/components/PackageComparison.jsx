import React, { useState } from 'react';
import {
  Package,
  Check,
  ArrowRight,
  Clock,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Zap,
  Layers
} from 'lucide-react';

export default function PackageComparison({ packages, selectedPackageId, onSelectPackage }) {
  const [compareIds, setCompareIds] = useState(() => {
    // Auto-select first 3 packages for comparison
    return packages.slice(0, 3).map(p => p.package_id);
  });

  const comparePackages = packages.filter(p => compareIds.includes(p.package_id));

  const togglePackage = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id]; // Slide out oldest
      }
      return [...prev, id];
    });
  };

  if (!packages || packages.length === 0) return null;

  const sortedByPrice = [...comparePackages].sort(
    (a, b) => parseFloat(a.base_price) - parseFloat(b.base_price)
  );

  const lowestPrice = sortedByPrice[0]?.base_price;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Package Comparison</h3>
            <p className="text-xs text-slate-400">
              Compare options side-by-side — click to customize any package
            </p>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
          {comparePackages.length} packages compared
        </span>
      </div>

      {/* Package Selector Pills */}
      {packages.length > 3 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 self-center">Compare:</span>
          {packages.slice(0, 8).map(pkg => (
            <button
              key={pkg.package_id}
              onClick={() => togglePackage(pkg.package_id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                compareIds.includes(pkg.package_id)
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {pkg.name?.split('—')[0]?.trim() || pkg.city_name}
            </button>
          ))}
        </div>
      )}

      {/* Comparison Grid */}
      <div className={`grid gap-4 ${
        comparePackages.length === 1 ? 'grid-cols-1' :
        comparePackages.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
        'grid-cols-1 sm:grid-cols-3'
      }`}>
        {comparePackages.map((pkg) => {
          const isSelected = selectedPackageId === pkg.package_id;
          const price = parseFloat(pkg.base_price || 0);
          const isLowest = pkg.base_price === lowestPrice;
          const priceDiff = price - parseFloat(lowestPrice || price);

          return (
            <div
              key={pkg.package_id}
              className={`relative rounded-xl border p-4 space-y-4 transition-all ${
                isSelected
                  ? 'bg-teal-950/30 border-teal-500/60 ring-1 ring-teal-500/40 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              {/* Best Value badge */}
              {isLowest && comparePackages.length > 1 && (
                <div className="absolute -top-2.5 left-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold">
                    Best Value
                  </span>
                </div>
              )}

              {/* Theme + Duration */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-teal-400 font-semibold uppercase tracking-wider border border-teal-500/20">
                  {pkg.theme}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {pkg.duration_days}D {pkg.duration_nights || pkg.duration_days - 1}N
                </span>
              </div>

              {/* Name */}
              <div>
                <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                  {pkg.name || pkg.title}
                </h4>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {pkg.city_name}
                </div>
              </div>

              {/* Description snippet */}
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {pkg.description || 'Customizable tour package with curated experiences.'}
              </p>

              {/* Language offered */}
              {pkg.languages_offered && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  🌐 {pkg.languages_offered}
                </div>
              )}

              {/* Price */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Starting from</span>
                    <span className="text-xl font-black text-white font-mono">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {priceDiff > 0 && comparePackages.length > 1 && (
                    <span className="text-[11px] text-amber-400 font-mono">
                      +₹{priceDiff.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => onSelectPackage(pkg.package_id)}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {isSelected ? (
                  <><Check className="w-3.5 h-3.5" /> Selected — Customizing</>
                ) : (
                  <>Select & Customize <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
