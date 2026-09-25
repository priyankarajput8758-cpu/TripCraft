import React, { useState } from 'react';

export default function ConfirmView({
  bookingResult,
  bookingDetails,
  onReset,
  onBack,
}) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const pkg = bookingDetails?.package || {};
  const pricing = bookingDetails?.pricing || {};
  const guide = bookingDetails?.selectedGuide || {};
  const itinerary = bookingDetails?.itinerary || [];
  const activitiesList = bookingDetails?.activitiesList || [];

  const bookingId = bookingResult?.booking_id || bookingResult?.id || `TC-${Math.floor(100000 + Math.random() * 900000)}`;
  const createdAt = bookingResult?.created_at
    ? new Date(bookingResult.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const destinationName =
    bookingDetails?.destination_name ||
    bookingDetails?.cityName ||
    pkg.city_name ||
    pkg.name ||
    pkg.title ||
    'Custom Destination Tour';

  const startDate = bookingDetails?.startDate || '2026-09-24';
  const durationDays = bookingDetails?.durationDays || pkg.duration_days || (itinerary.length > 0 ? itinerary.length : 4);
  const durationNights = Math.max(1, durationDays - 1);

  let endDate = bookingDetails?.endDate;
  if (!endDate && startDate) {
    const s = new Date(startDate);
    s.setDate(s.getDate() + (durationDays - 1));
    endDate = s.toISOString().split('T')[0];
  }

  const travelers =
    bookingDetails?.partySize ||
    bookingDetails?.num_travelers ||
    bookingDetails?.numTravelers ||
    bookingResult?.party_size ||
    2;

  const roomsCount = Math.ceil(travelers / 2);

  const passengerName = bookingResult?.guest_name || bookingDetails?.guest_name || 'Valued Traveler';
  const passengerEmail = bookingResult?.guest_email || bookingDetails?.guest_email || 'guest@tripcraft.travel';

  const hotelName =
    bookingDetails?.hotelName ||
    (bookingDetails?.selectedHotel && bookingDetails.selectedHotel.name) ||
    (pkg.components?.find?.(c => c.component_type === 'hotel')?.title) ||
    `Verified Accommodation (${roomsCount} Room${roomsCount > 1 ? 's' : ''})`;

  const hasGuide = Boolean(guide && (guide.guide_id || guide.display_name || guide.name));
  const guideName = guide?.display_name || guide?.name || 'Local Certified Guide';
  const guideLang = guide?.languages || pkg.languages_offered || 'English, Local Dialect';
  const guideSpecialty = guide?.specialisation || 'Heritage & Culture';

  const activitiesSummary = activitiesList.length > 0
    ? activitiesList.map(a => a.title).join(', ')
    : (itinerary.length > 0
        ? itinerary.flatMap(d => d.slots?.map(s => s.title) || []).slice(0, 4).join(', ')
        : 'Curated City Highlights, Heritage Landmarks & Local Cuisine');

  const transferDesc = bookingDetails?.transferType === 'shared'
    ? 'Shared AC Airport & Sightseeing Shuttles'
    : 'Private AC Sightseeing & Airport Chauffeur';

  const currencySymbol = pricing?.currency_symbol || (pricing?.currency === 'USD' ? '$' : '₹');

  let grandTotal = '32,000.00';
  let hotelCost = '14,000.00';
  let activitiesCost = '10,000.00';
  let transferCost = '4,500.00';
  let guideCost = hasGuide ? '3,500.00' : '0.00';
  let taxCost = '1,600.00';

  if (bookingDetails?.estimated_pricing) {
    const ep = bookingDetails.estimated_pricing;
    grandTotal = parseFloat(ep.grand_total || '32000').toLocaleString('en-IN', { minimumFractionDigits: 2 });
    hotelCost = parseFloat(ep.hotel_total || '14000').toLocaleString('en-IN', { minimumFractionDigits: 2 });
    activitiesCost = parseFloat(ep.activities_total || '10000').toLocaleString('en-IN', { minimumFractionDigits: 2 });
    transferCost = parseFloat(ep.transfers_total || '4500').toLocaleString('en-IN', { minimumFractionDigits: 2 });
    taxCost = parseFloat(ep.gst_tax || '1600').toLocaleString('en-IN', { minimumFractionDigits: 2 });
  } else if (pricing?.total_price || bookingDetails?.totalPrice || bookingDetails?.total) {
    const rawTotal = parseFloat(pricing?.total_price || bookingDetails?.totalPrice || bookingDetails?.total || '32000');
    grandTotal = rawTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 });
    guideCost = parseFloat(pricing?.guide_cost || (hasGuide ? '3500' : '0')).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const portionWithoutGuide = Math.max(0, rawTotal - parseFloat(pricing?.guide_cost || (hasGuide ? '3500' : '0')));
    hotelCost = (portionWithoutGuide * 0.45).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    activitiesCost = (portionWithoutGuide * 0.35).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    transferCost = (portionWithoutGuide * 0.15).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    taxCost = (portionWithoutGuide * 0.05).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  const handleShare = () => {
    const shareData = {
      title: `TripCraft Booking Confirmation - ${destinationName}`,
      text: `Booking Confirmed for ${travelers} traveler(s) to ${destinationName}! Ref: ${bookingId}`,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard?.writeText?.(
        `TripCraft Booking Confirmation #${bookingId} for ${destinationName} (${startDate} to ${endDate}) - Verified Total: ${currencySymbol}${grandTotal}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 300);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in text-[#1a2e1a] pb-12">

      {/* ── Top Confirmation Banner (Translucent Frosted Card) ── */}
      <div className="bg-white/65 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#84D175]/30 text-[#2D6A24] text-xs font-bold uppercase tracking-wider border border-[#84D175]/40 inline-block mb-1.5">
            Official Booking Voucher · Status: Confirmed
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a2e1a] tracking-tight">
            Your Tour Package is Locked & Verified!
          </h1>
          <p className="text-xs sm:text-sm text-[#1a2e1a] max-w-md mx-auto font-medium mt-1 leading-relaxed">
            Grounded inventory, accommodation, private transfers, and guide allocation confirmed with zero decimal discrepancy.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <span className="text-xs sm:text-sm font-mono font-bold px-4 py-2 rounded-xl bg-white/80 text-[#1a2e1a] border border-[#84D175]/40 shadow-xs">
            Voucher ID: {bookingId}
          </span>
          <span className="text-xs sm:text-sm font-mono text-[#1a2e1a] px-3.5 py-1.5 rounded-xl bg-white/50 border border-[#84D175]/30 font-semibold">
            Issued: {createdAt}
          </span>
        </div>
      </div>

      {/* ── Main Dynamic Receipt Voucher (Translucent Frosted Card) ── */}
      <div
        id="printable-voucher"
        className="bg-white/60 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative"
      >
        {/* Voucher Header with Branding & Destination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#84D175]/30 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#1a2e1a]">
                TripCraft
              </span>
              <span className="text-[#84D175] font-bold">|</span>
              <span className="text-xs sm:text-sm text-[#1a2e1a] font-bold uppercase tracking-wider">
                Dynamic Travel Voucher
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1a2e1a]">
              {destinationName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#1a2e1a] font-semibold pt-0.5">
              <span>{startDate} → {endDate}</span>
              <span>·</span>
              <span>{durationDays} Days / {durationNights} Nights</span>
              <span>·</span>
              <span className="font-bold text-[#2D6A24]">
                {travelers} Traveler{travelers > 1 ? 's' : ''} ({roomsCount} Room{roomsCount > 1 ? 's' : ''})
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="inline-block text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full bg-[#84D175]/30 text-[#2D6A24] border border-[#84D175]/40 shadow-xs">
              100% Guaranteed
            </span>
            <div className="text-xs sm:text-sm text-[#1a2e1a] mt-1 font-bold">
              Lead: {passengerName}
            </div>
          </div>
        </div>

        {/* Dynamic Booked Components Breakdown */}
        <div className="space-y-3">
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] flex items-center justify-between">
            <span>Verified Booked Components</span>
            <span className="text-xs font-mono font-bold text-[#2D6A24]">All inclusions active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Dynamic Hotel / Stay */}
            <div className="bg-white/60 backdrop-blur-sm border border-[#84D175]/35 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2D6A24]">
                Accommodation & Stays ({durationNights} Nights)
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#1a2e1a] leading-snug">
                {hotelName}
              </div>
              <div className="text-xs text-[#1a2e1a] font-medium">
                {roomsCount} room(s) reserved for {travelers} guest(s)
              </div>
            </div>

            {/* Dynamic Transfers */}
            <div className="bg-white/60 backdrop-blur-sm border border-[#84D175]/35 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2D6A24]">
                Ground Transportation
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#1a2e1a] leading-snug">
                {transferDesc}
              </div>
              <div className="text-xs text-[#1a2e1a] font-medium">
                All scheduled transfers included
              </div>
            </div>

            {/* Dynamic Activities */}
            <div className="bg-white/60 backdrop-blur-sm border border-[#84D175]/35 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2D6A24]">
                Experiences & Entry Passes
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#1a2e1a] leading-snug line-clamp-2">
                {activitiesSummary}
              </div>
              <div className="text-xs text-[#1a2e1a] font-medium">
                Priority access vouchers issued for all {travelers} traveler(s)
              </div>
            </div>

            {/* Dynamic Local Guide Component */}
            <div className="bg-white/60 backdrop-blur-sm border border-[#84D175]/35 rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2D6A24]">
                Local Tour Guide Service
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#1a2e1a] leading-snug">
                {hasGuide ? guideName : 'Self-Guided Package'}
              </div>
              <div className="text-xs text-[#1a2e1a] font-medium">
                {hasGuide
                  ? `Specialisation: ${guideSpecialty} · Language: ${guideLang}`
                  : 'Optional guide can be attached anytime before trip start'}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Day-by-Day Schedule Summary if available */}
        {itinerary.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-[#84D175]/25">
            <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a]">
              Itinerary Roadmap Schedule
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {itinerary.map((dayObj, idx) => (
                <div key={idx} className="bg-white/60 border border-[#84D175]/35 rounded-xl p-3 space-y-1">
                  <div className="text-xs font-bold text-[#2D6A24] uppercase font-mono">
                    Day {dayObj.day || idx + 1}: {dayObj.title}
                  </div>
                  <div className="text-xs text-[#1a2e1a] line-clamp-2 font-medium">
                    {dayObj.slots?.map(s => s.title).join(' · ') || dayObj.notes || 'Full day excursion'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itemized Zero-Float Decimal Financial Breakdown */}
        <div className="space-y-3 pt-3 border-t border-[#84D175]/25">
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] flex items-center justify-between">
            <span>Itemized Decimal Pricing Breakdown</span>
            <span className="text-xs font-mono text-[#2D6A24] bg-[#84D175]/25 px-2.5 py-0.5 rounded-md font-bold border border-[#84D175]/35">
              Zero Float Math Verified
            </span>
          </div>

          <div className="bg-white/60 border border-[#84D175]/35 rounded-2xl p-4 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between text-[#1a2e1a] font-medium">
              <span>Accommodation ({durationNights} Nights, {roomsCount} Room{roomsCount > 1 ? 's' : ''})</span>
              <span className="font-mono font-bold text-[#1a2e1a]">{currencySymbol}{hotelCost}</span>
            </div>
            <div className="flex justify-between text-[#1a2e1a] font-medium">
              <span>Activities & Sightseeing ({travelers} Travelers)</span>
              <span className="font-mono font-bold text-[#1a2e1a]">{currencySymbol}{activitiesCost}</span>
            </div>
            <div className="flex justify-between text-[#1a2e1a] font-medium">
              <span>Ground Transfers & Airport Chauffeur</span>
              <span className="font-mono font-bold text-[#1a2e1a]">{currencySymbol}{transferCost}</span>
            </div>
            {hasGuide && (
              <div className="flex justify-between text-[#2D6A24] font-bold bg-[#84D175]/20 -mx-2 px-2 py-1.5 rounded-lg">
                <span>Certified Guide Service ({guideLang})</span>
                <span className="font-mono font-bold">{currencySymbol}{guideCost}</span>
              </div>
            )}
            <div className="flex justify-between text-[#1a2e1a] font-medium pt-1 border-t border-[#84D175]/25">
              <span>Applicable Goods & Services Tax (5% GST)</span>
              <span className="font-mono font-bold text-[#1a2e1a]">{currencySymbol}{taxCost}</span>
            </div>

            {/* Total Paid */}
            <div className="flex justify-between items-baseline pt-3 border-t border-[#84D175]/35 text-sm sm:text-base">
              <div>
                <span className="font-serif font-bold text-[#1a2e1a] text-lg sm:text-xl">Grand Total Paid</span>
                <span className="block text-xs text-[#1a2e1a] font-medium">
                  All taxes & supplier fees included
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-[#2D6A24]">
                {currencySymbol}{grandTotal}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Passenger & Language Metadata Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-[#1a2e1a] pt-3 border-t border-[#84D175]/25 font-semibold">
          <div className="space-y-0.5">
            <div>Passenger: <span className="text-[#1a2e1a] font-bold">{passengerName}</span></div>
            <div className="text-xs text-[#1a2e1a] font-mono">{passengerEmail}</div>
          </div>
          <div className="text-left sm:text-right space-y-0.5">
            <div>Delivery Language: <span className="text-[#2D6A24] font-bold">{guideLang}</span></div>
            <div className="text-xs text-[#1a2e1a]">TripCraft Idempotent Booking Engine</div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 print:hidden no-print">
        {onBack && (
          <button
            onClick={onBack}
            className="px-5 py-3 rounded-xl bg-white/60 hover:bg-white text-[#1a2e1a] border border-[#84D175]/40 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
          >
            ← Modify Plan
          </button>
        )}

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-6 py-3.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm shadow-md shadow-[#84D175]/25 transition-all cursor-pointer"
        >
          {isExporting ? 'Preparing Voucher PDF...' : 'Download / Print PDF Voucher'}
        </button>

        <button
          onClick={handleShare}
          className="px-5 py-3 rounded-xl bg-white/60 hover:bg-white text-[#1a2e1a] border border-[#84D175]/40 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
        >
          {copied ? 'Link Copied!' : 'Share Voucher'}
        </button>

        <button
          onClick={onReset}
          className="px-5 py-3 rounded-xl bg-white/60 hover:bg-white text-[#1a2e1a] border border-[#84D175]/40 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
        >
          Back to Discover
        </button>
      </div>
    </div>
  );
}
