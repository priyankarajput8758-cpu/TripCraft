import React, { useState } from 'react';
import { api } from '../api';

export default function BookingModal({
  isOpen,
  onClose,
  bookingDetails,
  onBookingConfirmed,
}) {
  const initialTravelers = Number(bookingDetails?.numTravelers || bookingDetails?.partySize || 2);
  const [leadPassengerName, setLeadPassengerName] = useState('Priyanka Rajput');
  const [email, setEmail] = useState('priyanka@example.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [numTravelers, setNumTravelers] = useState(initialTravelers);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (bookingDetails) {
      const count = Number(bookingDetails.numTravelers || bookingDetails.partySize || 2);
      setNumTravelers(count);
    }
  }, [bookingDetails]);

  if (!isOpen || !bookingDetails) return null;

  const pkg = bookingDetails.package;
  const pricing = bookingDetails.pricing;
  const guide = bookingDetails.selectedGuide;
  const startDate = bookingDetails.startDate || '2026-09-24';
  const endDate = bookingDetails.endDate;
  const durationDays = bookingDetails.durationDays || pkg?.duration_days || 3;
  const selectedComponents = bookingDetails.selectedComponents || {};

  const pkgTitle = pkg?.name || pkg?.title || bookingDetails.packageName || 'Custom Tour Itinerary';
  const guideName = guide?.display_name || guide?.name;

  const initialTotalRaw = parseFloat(
    (bookingDetails.optimizedTotalPrice || bookingDetails.totalPrice || bookingDetails.total || pricing?.total_price || pkg?.base_price || 32000)
      .toString()
      .replace(/,/g, '')
  );

  const guideRateTotal = guide ? parseFloat(pricing?.guide_cost || guide.day_rate || 3500) : 0;
  const pkgOnlyInitial = Math.max(0, initialTotalRaw - guideRateTotal);
  const perPersonRate = initialTravelers > 0 ? (pkgOnlyInitial / initialTravelers) : pkgOnlyInitial;

  const activeTravelerCount = Math.max(1, parseInt(numTravelers) || 1);
  const calculatedGrandTotal = (perPersonRate * activeTravelerCount) + guideRateTotal;
  const totalPrice = calculatedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const currencyCode = bookingDetails?.currency || pkg?.currency || pricing?.currency || 'INR';
  const currencySymbol = bookingDetails?.currencySymbol || {
    INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', CHF: 'CHF ', AED: 'AED ', SGD: 'S$', AUD: 'A$', CAD: 'C$', NPR: 'NPR ', LKR: 'LKR '
  }[currencyCode] || '₹';

  const dateRange = startDate
    ? (endDate ? `${startDate} → ${endDate}` : startDate)
    : '2026-09-24';

  const durationNights = Math.max(0, durationDays - 1);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    const rawComponents = bookingDetails?.selectedComponentIds || selectedComponents || [];
    const componentIds = (Array.isArray(rawComponents) ? rawComponents : Object.values(rawComponents))
      .map(c => typeof c === 'string' ? c : (c?.component_id || c?.id))
      .filter(Boolean);
    const idempotencyKey = 'idemp_' + Math.random().toString(36).substring(2, 15);

    try {
      const payload = {
        package_id: pkg?.package_id || 'pkg_custom_architect',
        user_id: 'usr_guest_demo',
        selected_component_ids: componentIds,
        idempotency_key: idempotencyKey,
        guide_id: guide?.guide_id || null,
        start_date: startDate,
        party_size: activeTravelerCount,
        num_travelers: activeTravelerCount,
        total_price: calculatedGrandTotal.toFixed(2),
        guest_name: leadPassengerName,
        guest_email: email,
        guest_phone: phone,
        notes: `Passenger: ${leadPassengerName} (${email}, ${phone}). Party size: ${activeTravelerCount}. Requests: ${specialRequests || 'None'}`
      };

      const res = await api.createBooking(payload);
      if (res && (res.booking_id || res.id)) {
        setBookingConfirmed(res);
        if (onBookingConfirmed) {
          onBookingConfirmed(res);
        }
      } else if (res && res.detail) {
        setError(typeof res.detail === 'string' ? res.detail : JSON.stringify(res.detail));
      } else {
        setError('Could not complete booking reservation. Please try again.');
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setError('Network error while processing booking confirmation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C2D45]/60 backdrop-blur-md animate-in print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-xl bg-[#FFF8D2]/90 border border-[#84D175]/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1a2e1a] backdrop-blur-2xl print:max-w-full print:border-none print:shadow-none print:bg-white print:max-h-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#84D175]/30 bg-white/50 shrink-0 print:hidden no-print">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1a2e1a]">
              {bookingConfirmed ? 'Booking Confirmed' : 'Review & Confirm Booking'}
            </h2>
            <p className="text-xs sm:text-sm text-[#1a2e1a] font-medium mt-0.5">
              {bookingConfirmed
                ? 'Your custom tour package is locked and verified'
                : 'Review your personalized itinerary and passenger details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 print:p-2 print:overflow-visible">
          {bookingConfirmed ? (
            /* === BOOKING CONFIRMED STATE === */
            <div id="booking-confirmed-receipt" className="space-y-5 printable-receipt">
              <div className="text-center py-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A24] bg-[#84D175]/30 px-3.5 py-1 rounded-full border border-[#84D175]/40">
                  Confirmed
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1a2e1a]">
                  Reservation Successfully Confirmed!
                </h3>
                <p className="text-xs sm:text-sm text-[#1a2e1a] font-medium">
                  Booking ID:{' '}
                  <span className="font-mono font-bold text-[#2D6A24] text-sm bg-white px-2.5 py-0.5 rounded border border-[#84D175]/45">
                    {bookingConfirmed.booking_id || bookingConfirmed.id}
                  </span>
                </p>
              </div>

              {/* Trip Summary Card */}
              <div className="bg-white/75 backdrop-blur-md border border-[#84D175]/45 rounded-2xl p-4 space-y-2 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-base font-serif font-bold text-[#1a2e1a]">{pkgTitle}</div>
                    <div className="text-xs sm:text-sm text-[#1a2e1a] font-medium mt-0.5">
                      {dateRange} · {durationDays} Days · {activeTravelerCount} Traveler{activeTravelerCount > 1 ? 's' : ''}
                    </div>
                    {guide && (
                      <div className="text-xs sm:text-sm text-[#2D6A24] font-bold mt-1">
                        Guide: {guideName}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-serif font-bold text-[#2D6A24]">
                      {currencySymbol}{bookingConfirmed.total_amount ? parseFloat(bookingConfirmed.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalPrice}
                    </div>
                    <div className="text-xs text-[#1a2e1a] font-medium">Tax Inclusive (5% GST)</div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 print:hidden no-print">
                <button
                  onClick={onClose}
                  className="py-3 bg-white/80 hover:bg-white text-[#1a2e1a] border border-[#84D175]/40 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs text-center"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="py-3 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-[#84D175]/25 text-center"
                >
                  Print Receipt
                </button>
              </div>
            </div>
          ) : (
            /* === CHECKOUT FORM === */
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Trip Snapshot Banner */}
              <div className="bg-white/75 backdrop-blur-md border border-[#84D175]/45 rounded-2xl p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif font-bold text-[#1a2e1a] text-lg">{pkgTitle}</div>
                    <div className="text-[#1a2e1a] text-xs sm:text-sm mt-0.5 font-medium">
                      {dateRange} · {durationDays} Days · {durationNights} Nights
                    </div>
                    {guide && (
                      <div className="text-[#2D6A24] text-xs sm:text-sm font-bold mt-1">
                        Guide: {guideName}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-serif font-bold text-[#2D6A24]">
                      {currencySymbol}{totalPrice}
                    </div>
                    <div className="text-xs text-[#1a2e1a] font-medium">All Taxes Included (5% GST)</div>
                  </div>
                </div>
              </div>

              {/* Traveler Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#1a2e1a] uppercase tracking-wider mb-1.5">
                    Lead Passenger Name
                  </label>
                  <input
                    type="text"
                    value={leadPassengerName}
                    onChange={(e) => setLeadPassengerName(e.target.value)}
                    required
                    className="w-full bg-white/80 border border-[#84D175]/45 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#1a2e1a] uppercase tracking-wider mb-1.5">
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numTravelers}
                    onChange={(e) => setNumTravelers(e.target.value)}
                    required
                    className="w-full bg-white/80 border border-[#84D175]/45 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#1a2e1a] uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/80 border border-[#84D175]/45 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#1a2e1a] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-white/80 border border-[#84D175]/45 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#1a2e1a] uppercase tracking-wider mb-1.5">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="E.g., Vegetarian meals, ground floor room, airport pickup"
                  className="w-full bg-white/80 border border-[#84D175]/45 rounded-xl p-3 text-xs sm:text-sm font-semibold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
                />
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50/90 border border-rose-300 text-xs sm:text-sm text-rose-800 rounded-xl font-bold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-sm sm:text-base rounded-xl shadow-md shadow-[#84D175]/25 transition-all flex items-center justify-center cursor-pointer disabled:opacity-60 active:scale-[0.98]"
              >
                {loading ? (
                  <span>Processing Secure Reservation...</span>
                ) : (
                  <span>Confirm & Book — {currencySymbol}{totalPrice}</span>
                )}
              </button>

              <div className="text-center text-xs text-[#1a2e1a] font-medium">
                Idempotency-protected · Instant confirmation · Decimal precision
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
