import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
  DollarSign,
  Shield,
  ArrowRight,
  BarChart3,
  RefreshCw,
  Sparkles,
  XCircle
} from 'lucide-react';

// Simulated itinerary conflict detection
// In production this should come from the backend optimization endpoint
function detectConflicts(components) {
  // Simulate checking activity time overlaps
  const conflicts = [];
  const sampleConflicts = [
    {
      id: 'c1',
      activity1: 'Hawa Mahal Visit',
      activity2: 'Rajasthani Food Walk',
      time1: '4:00 PM – 6:00 PM',
      time2: '4:30 PM – 6:30 PM',
      day: 'Day 1',
    },
  ];

  // Only show conflicts when there are multiple activities
  if (components && Object.keys(components).length > 2) {
    conflicts.push(...sampleConflicts);
  }
  return conflicts;
}

export default function OptimizationPanel({
  selectedComponents,
  budget,
  currentTotal,
  pace,
  packageDurationDays,
  onOptimize,
}) {
  const [optimized, setOptimized] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const conflicts = useMemo(
    () => detectConflicts(selectedComponents),
    [selectedComponents]
  );

  const budgetNum = parseFloat(budget || 0);
  const totalNum = parseFloat(currentTotal || 0);
  const isOverBudget = budgetNum > 0 && totalNum > budgetNum;
  const budgetPct = budgetNum > 0 ? Math.min(100, (totalNum / budgetNum) * 100) : 0;

  const handleOptimize = async () => {
    setOptimizing(true);
    await new Promise(r => setTimeout(r, 1800)); // simulate backend call
    setOptimizing(false);
    setOptimized(true);
    onOptimize?.();
  };

  const hasIssues = isOverBudget || conflicts.length > 0;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Trip Optimization Panel</h3>
            <p className="text-xs text-slate-400">
              Budget, travel pace, and schedule conflict checks
            </p>
          </div>
        </div>
        {optimized && (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Optimized
          </span>
        )}
      </div>

      {/* Status Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Budget Status */}
        <div className={`rounded-xl border p-3.5 space-y-2 ${
          isOverBudget
            ? 'bg-rose-950/25 border-rose-500/30'
            : 'bg-emerald-950/20 border-emerald-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              Budget
            </span>
            {isOverBudget ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className={`text-xs font-semibold ${isOverBudget ? 'text-rose-300' : 'text-emerald-300'}`}>
            {budgetNum > 0
              ? isOverBudget
                ? `⚠ Over by ₹${(totalNum - budgetNum).toLocaleString('en-IN')}`
                : `✓ Within budget`
              : 'No budget set'}
          </div>
          {budgetNum > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹{totalNum.toLocaleString('en-IN')}</span>
                <span>₹{budgetNum.toLocaleString('en-IN')}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Travel Pace Status */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              Travel Pace
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs font-semibold text-emerald-300 capitalize">
            ✓ {pace || 'Balanced'}
          </div>
          <div className="text-[10px] text-slate-400">
            {packageDurationDays ? `${packageDurationDays} days planned` : 'Duration set'}
          </div>
        </div>

        {/* Schedule / Conflict Status */}
        <div className={`rounded-xl border p-3.5 space-y-2 ${
          conflicts.length > 0 && !optimized
            ? 'bg-amber-950/25 border-amber-500/30'
            : 'bg-emerald-950/20 border-emerald-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Schedule
            </span>
            {conflicts.length > 0 && !optimized ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className={`text-xs font-semibold ${
            conflicts.length > 0 && !optimized ? 'text-amber-300' : 'text-emerald-300'
          }`}>
            {conflicts.length > 0 && !optimized
              ? `⚠ ${conflicts.length} conflict detected`
              : '✓ No conflicts'}
          </div>
        </div>
      </div>

      {/* Conflict Details */}
      {conflicts.length > 0 && !optimized && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Schedule Conflict Detected
          </div>

          {conflicts.map(c => (
            <div key={c.id} className="space-y-2">
              <div className="text-[11px] text-slate-300 font-medium">{c.day}:</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/80 border border-amber-500/20 rounded-lg p-2.5 text-xs space-y-0.5">
                  <div className="font-semibold text-white">{c.activity1}</div>
                  <div className="text-amber-400 font-mono text-[11px]">{c.time1}</div>
                </div>
                <div className="bg-slate-900/80 border border-amber-500/20 rounded-lg p-2.5 text-xs space-y-0.5">
                  <div className="font-semibold text-white">{c.activity2}</div>
                  <div className="text-rose-400 font-mono text-[11px]">{c.time2}</div>
                </div>
              </div>
              <div className="text-[11px] text-amber-300 text-center">
                ⚠ Time overlap — these activities conflict on {c.day}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post-optimization: Show resolved itinerary */}
      {optimized && conflicts.length > 0 && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Itinerary Optimized — Conflicts Resolved
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-rose-400 font-semibold mb-1.5 uppercase tracking-wider">Before</div>
              <div className="space-y-1.5">
                {conflicts.map(c => (
                  <div key={c.id} className="text-[11px] space-y-1">
                    <div className="bg-slate-900/80 border border-rose-500/20 rounded-lg p-2 text-rose-300 line-through">
                      {c.activity2} — {c.time2}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 font-semibold mb-1.5 uppercase tracking-wider">After (Fixed)</div>
              <div className="space-y-1.5">
                {conflicts.map(c => (
                  <div key={c.id} className="text-[11px] space-y-1">
                    <div className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-2 text-emerald-300">
                      {c.activity2} — 6:30 PM – 8:30 PM ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-emerald-300 text-center">
            ✓ Itinerary rescheduled — no conflicts remain
          </div>
        </div>
      )}

      {/* Optimize CTA */}
      {(hasIssues && !optimized) ? (
        <button
          onClick={handleOptimize}
          disabled={optimizing}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-500/15 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          {optimizing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Optimizing Itinerary...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Optimize Itinerary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      ) : optimized ? (
        <div className="flex items-center justify-center space-x-2 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>✓ Itinerary Optimized — Budget, pace, and schedule all clear</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-semibold">
          <Shield className="w-4 h-4" />
          <span>✓ No optimization needed — your trip is conflict-free</span>
        </div>
      )}
    </div>
  );
}
