import React from 'react';
import { CheckCircle2, Share2, Download, Home, ArrowLeft } from 'lucide-react';

export default function ConfirmView({
  bookingResult,
  bookingDetails,
  onReset,
  onBack,
}) {
  const pkg = bookingDetails?.package || {};
  const guide = bookingDetails?.selectedGuide || {};

  const bookingId = bookingResult?.booking_id || 'PP-482731';
  const cityName = pkg.city_name || 'Goa, India';
  const startDate = bookingDetails?.startDate || '10 Oct 2026';
  const endDate = bookingDetails?.endDate || '14 Oct 2026';
  const travelers = bookingDetails?.partySize || 2;

  const guideName = guide.display_name || guide.name || 'Tamil-speaking Heritage Guide';
  const guideLang = guide.languages || 'Tamil';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in text-slate-900">

      {/* ── Top Header Success Banner ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Your Trip is Confirmed!
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Your customized PackagePro trip is ready.
          </p>
        </div>

        <div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Booking ID: {bookingId}
          </span>
        </div>
      </div>

      {/* ── Main Receipt Card (Pure White Card matching Screenshot 5) ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{cityName}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {startDate} – {endDate} • {travelers} Travelers
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Confirmed & Reserved
          </span>
        </div>

        {/* Booked Components Grid */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">
            BOOKED COMPONENTS
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Hotel */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">HOTEL</div>
              <div className="text-xs font-bold text-slate-900">Premium Hotel (4 Nights)</div>
            </div>

            {/* Activities */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">ACTIVITIES</div>
              <div className="text-xs font-bold text-slate-900">Heritage Walk, Food Tour, Water Sports</div>
            </div>

            {/* Transfer */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">TRANSFER</div>
              <div className="text-xs font-bold text-slate-900">Private Airport & Sightseeing Transfer</div>
            </div>

            {/* Local Guide (Highlighted Amber Box matching Screenshot 5) */}
            <div className="bg-[#fffbeb] border border-amber-300 rounded-xl p-3.5 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-800">LOCAL GUIDE</div>
              <div className="text-xs font-bold text-amber-900">{guideName}</div>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">
            PRICE BREAKDOWN
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Hotel</span>
              <span className="font-mono font-bold text-slate-900">₹18,000</span>
            </div>
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Activities</span>
              <span className="font-mono font-bold text-slate-900">₹10,000</span>
            </div>
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Transfer</span>
              <span className="font-mono font-bold text-slate-900">₹5,000</span>
            </div>
            <div className="flex justify-between text-amber-900 font-bold">
              <span>Tamil Tour Guide</span>
              <span className="font-mono font-bold">₹3,500</span>
            </div>
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Add-ons</span>
              <span className="font-mono font-bold text-slate-900">₹2,000</span>
            </div>

            {/* Total Paid */}
            <div className="flex justify-between items-baseline pt-3 border-t border-slate-100 text-sm">
              <span className="font-bold text-slate-900">Total Paid</span>
              <span className="text-xl font-black text-blue-600 font-mono">₹38,500</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div>Preferred Language: <span className="text-slate-900 font-bold">English</span></div>
          <div>Guide Language: <span className="text-blue-600 font-bold">{guideLang}</span></div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            ← Back to Itinerary
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          Print Voucher
        </button>
        <button
          onClick={() => navigator.clipboard?.writeText?.(window.location.href)}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition-all cursor-pointer shadow-sm"
        >
          Share Trip
        </button>
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition-all cursor-pointer shadow-sm"
        >
          Back to Discover
        </button>
      </div>
    </div>
  );
}
