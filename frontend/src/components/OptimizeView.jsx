import React, { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Clock, MapPin, ArrowRight, Share2, DollarSign } from 'lucide-react';

export default function OptimizeView({
  activePackage,
  pricing,
  guide,
  onProceedToBook,
  onBack,
}) {
  const [activeDay, setActiveDay] = useState(2);
  const [conflictResolved, setConflictResolved] = useState(false);

  const cityName = activePackage?.city_name || 'Goa';
  const durationDays = activePackage?.duration_days || 5;

  const daysList = Array.from({ length: durationDays }, (_, i) => ({
    num: i + 1,
    label: i === 1 ? `Day ${i + 1} — Heritage & Food` : `Day ${i + 1}`
  }));

  return (
    <div className="space-y-6 animate-in text-slate-900">

      {/* ── Subheader Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-xl transition-all cursor-pointer mb-2 shadow-sm"
            >
              ← Back to Customizer
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">Your Optimized Trip</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#84D175] text-[#1a2e1a] flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3 text-[#1a2e1a]" />
              Optimized by TripCraft AI
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {cityName} • 10 Oct – 14 Oct • {durationDays} Days • 2 Travelers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigator.clipboard?.writeText?.(window.location.href)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-300 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Package</span>
          </button>
          <button
            onClick={onProceedToBook}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] text-xs font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
          >
            <span>Save & Continue to Book →</span>
          </button>
        </div>
      </div>

      {/* ── Day Tabs Row ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {daysList.map((d) => (
          <button
            key={d.num}
            onClick={() => setActiveDay(d.num)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeDay === d.num
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* ── Schedule Conflict Warning Banner (Matching Screenshot 4) ── */}
      {!conflictResolved ? (
        <div className="rounded-3xl bg-[#fffbeb] border-2 border-[#fcd34d] p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-black">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              <span>SCHEDULE CONFLICT DETECTED</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 font-extrabold border border-amber-300">
              AI Warning
            </span>
          </div>

          <div className="text-sm font-bold text-slate-900">
            Heritage Walk overlaps with the Food Tour timing.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold shadow-sm">
              <span>💡</span>
              <span>AI Rec: Move Food Tour to 6:00 PM</span>
            </div>

            <button
              onClick={() => setConflictResolved(true)}
              className="px-5 py-2 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Apply Optimization
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            <span>✓ Optimization Applied — Schedule conflicts resolved. Food Tour moved to 6:00 PM.</span>
          </div>
          <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold border border-emerald-200">Rescheduled</span>
        </div>
      )}

      {/* ── Main Content Grid (Timeline + Right Panel) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Timeline Column (Left 7) - Pure White Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Itinerary Timeline — Day {activeDay}
            </h3>
            <span className="text-xs text-slate-500 font-medium">4 Events Planned</span>
          </div>

          {/* Vertical Timeline Nodes */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">

            {/* Event 1 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-extrabold text-blue-600 font-mono">09:00 AM</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Breakfast at Hotel</h4>
                  <p className="text-xs text-slate-500 font-medium">Ocean Breeze Resort Dining</p>
                </div>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  Included Breakfast
                </span>
              </div>
            </div>

            {/* Event 2 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-extrabold text-blue-600 font-mono">10:00 AM</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Heritage Walk (Old Goa)</h4>
                  <p className="text-xs text-slate-500 font-medium max-w-sm">
                    Explore Basilica of Bom Jesus with your Tamil-speaking heritage guide.
                  </p>
                </div>
                <span className="text-[10px] text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-bold shrink-0">
                  Tamil Guide Attached
                </span>
              </div>
            </div>

            {/* Event 3 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-extrabold text-blue-600 font-mono">01:00 PM</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Lunch Break</h4>
                  <p className="text-xs text-slate-500 font-medium">Local Goan Thali at Viva Panjim</p>
                </div>
              </div>
            </div>

            {/* Event 4 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-extrabold text-blue-600 font-mono">03:00 PM</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Museum Visit</h4>
                  <p className="text-xs text-slate-500 font-medium">Goa State Museum Exploration</p>
                </div>
              </div>
            </div>

            {/* Event 5 (Rescheduled) */}
            <div className="relative">
              <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                conflictResolved ? 'bg-emerald-600' : 'bg-amber-500'
              }`} />
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-xs font-extrabold font-mono ${conflictResolved ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {conflictResolved ? '06:00 PM' : '04:30 PM (Conflict)'}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">Goan Food Tour</h4>
                  <p className="text-xs text-slate-500 font-medium max-w-sm">
                    Street food sampling around Fontainhas Latin Quarter.
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                  conflictResolved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {conflictResolved ? 'Rescheduled' : 'Overlap'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Map + Budget + Pace) (Right 5) */}
        <div className="lg:col-span-5 space-y-5">

          {/* Interactive Trip Map Box (Dark navy container matching Screenshot 4) */}
          <div className="bg-[#0c102a] text-white border border-slate-800 rounded-3xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                INTERACTIVE TRIP MAP
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                Route Connected
              </span>
            </div>

            {/* Graphical Route Representation */}
            <div className="relative h-36 bg-slate-950 rounded-2xl border border-slate-800/80 p-4 flex items-center justify-between">
              <div className="flex flex-col items-center gap-1 z-10">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">1. Hotel</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold">2. Heritage</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold">3. Museum</span>
              </div>
              <div className="flex flex-col items-center gap-1 z-10">
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold">4. Food Tour</span>
              </div>

              {/* Connecting Dashed Line */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-blue-500/40 pointer-events-none" />
            </div>
          </div>

          {/* Budget Optimization Box (Pure White Card) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                BUDGET OPTIMIZATION
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Within budget ✓
              </span>
            </div>

            <div className="flex justify-between items-baseline text-xs text-slate-500 font-medium">
              <span>Target: ₹50,000</span>
              <span className="text-sm font-black text-slate-900 font-mono">Current: ₹48,500</span>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-blue-900 font-semibold">Switch to Standard hotel to save ₹4,000.</span>
              <button className="px-3 py-1 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] rounded-lg font-bold transition-all text-[11px] cursor-pointer">
                Apply
              </button>
            </div>
          </div>

          {/* Travel Pace Box */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-700">TRAVEL PACE</div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">Activities spaced evenly to prevent fatigue during your trip.</div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              Balanced Pace
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
