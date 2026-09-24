import React, { useState } from 'react';
import { api } from '../api';
import {
  CheckCircle2, X, CreditCard, Calendar, User, Mail, Phone, ShieldCheck,
  Download, Clock, MapPin, UserCheck, Hotel, Activity, Car, Home, Star, Sparkles
} from 'lucide-react';

export default function BookingModal({
  isOpen,
  onClose,
  bookingDetails,
  onBookingConfirmed,
}) {
  const [leadPassengerName, setLeadPassengerName] = useState('Priyanka Rajput');
  const [email, setEmail] = useState('priyanka@example.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [numTravelers, setNumTravelers] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !bookingDetails) return null;

  const pkg = bookingDetails.package;
  const pricing = bookingDetails.pricing;
  const guide = bookingDetails.selectedGuide;
  const startDate = bookingDetails.startDate || '2026-09-24';
  const endDate = bookingDetails.endDate;
  const durationDays = bookingDetails.durationDays || pkg?.duration_days || 3;
  const selectedComponents = bookingDetails.selectedComponents || {};
  const addOnTotal = bookingDetails.addOnTotal || 0;

  const pkgTitle = pkg?.name || pkg?.title || bookingDetails.packageName || 'Custom Tour Itinerary';
  const guideName = guide?.display_name || guide?.name;

  let totalPrice = '0.00';
  if (bookingDetails.totalPrice) {
    totalPrice = bookingDetails.totalPrice;
  } else if (bookingDetails.total) {
    totalPrice = parseFloat(bookingDetails.total).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  } else if (pricing?.total_price) {
    totalPrice = (parseFloat(pricing.total_price) + addOnTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  } else if (pkg?.base_price) {
    totalPrice = parseFloat(pkg.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  const dateRange = startDate
    ? (endDate ? `${startDate} → ${endDate}` : startDate)
    : '2026-09-24';

  const durationNights = Math.max(0, durationDays - 1);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const componentIds = Object.values(selectedComponents).filter(Boolean);
    const idempotencyKey = 'idemp_' + Math.random().toString(36).substring(2, 15);

    try {
      const payload = {
        package_id: pkg?.package_id || 'pkg_custom_architect',
        user_id: 'usr_guest_demo',
        selected_component_ids: componentIds,
        idempotency_key: idempotencyKey,
        guide_id: guide?.guide_id || null,
        start_date: startDate,
        party_size: parseInt(numTravelers) || 2,
        guest_name: leadPassengerName,
        guest_email: email,
        guest_phone: phone,
        notes: `Passenger: ${leadPassengerName} (${email}, ${phone}). Requests: ${specialRequests || 'None'}`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C2D45]/70 backdrop-blur-md animate-in">
      <div className="relative w-full max-w-xl bg-[#FFF8D2]/95 border border-[#84D175]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1a2e1a] backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#84D175]/30 bg-white/75 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#84D175] text-[#1a2e1a] shadow-sm font-black">
              {bookingConfirmed ? <CheckCircle2 className="w-5 h-5 text-[#1a2e1a]" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-[#1a2e1a]">
                {bookingConfirmed ? 'Booking Confirmed' : 'Review & Confirm Booking'}
              </h2>
              <p className="text-xs text-[#4a5e4a] font-medium">
                {bookingConfirmed
                  ? 'Your custom tour package is locked and verified'
                  : 'Review your personalized itinerary and passenger details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-[#84D175]/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {bookingConfirmed ? (
            /* === BOOKING CONFIRMED STATE === */
            <div className="space-y-5">
              <div className="text-center py-4 space-y-3">
                <div className="relative mx-auto w-16 h-16">
                  <div className="w-16 h-16 rounded-full bg-[#84D175]/30 text-[#2D6A24] border border-[#84D175] flex items-center justify-center shadow-md animate-bounce">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#1a2e1a]">
                    Reservation Successfully Confirmed!
                  </h3>
                  <p className="text-xs text-[#4a5e4a] mt-1 font-medium">
                    Booking ID:{' '}
                    <span className="font-mono font-black text-[#2D6A24] text-sm bg-white/80 px-2 py-0.5 rounded border border-[#84D175]/40">
                      {bookingConfirmed.booking_id || bookingConfirmed.id}
                    </span>
                  </p>
                </div>
              </div>

              {/* Trip Summary Card */}
              <div className="bg-white/85 border border-[#84D175]/40 rounded-2xl p-4 space-y-2 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-black text-[#1a2e1a]">{pkgTitle}</div>
                    <div className="text-[11px] text-[#4a5e4a]">{dateRange} · {durationDays} Days</div>
                    {guide && (
                      <div className="text-[11px] text-[#2D6A24] font-bold mt-0.5 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Guide: {guideName}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-[#2D6A24] font-mono">₹{totalPrice}</div>
                    <div className="text-[10px] text-[#4a5e4a]">Tax Inclusive (5% GST)</div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 py-2.5 bg-white/80 hover:bg-white text-[#1a2e1a] border border-[#84D175]/30 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Home className="w-3.5 h-3.5 text-[#3C8B30]" />
                  Back to Dashboard
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 py-2.5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-[#84D175]/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print Receipt
                </button>
              </div>
            </div>
          ) : (
            /* === CHECKOUT FORM === */
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Trip Snapshot Banner */}
              <div className="bg-white/85 border border-[#84D175]/40 rounded-2xl p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-[#1a2e1a] text-sm">{pkgTitle}</div>
                    <div className="text-[#4a5e4a] text-[11px] mt-0.5 font-semibold">
                      {dateRange} · {durationDays} Days · {durationNights} Nights
                    </div>
                    {guide && (
                      <div className="text-[#2D6A24] text-[11px] font-bold flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3" /> Guide: {guideName}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#2D6A24] font-mono">
                      ₹{totalPrice}
                    </div>
                    <div className="text-[10px] text-[#4a5e4a] font-medium">All Taxes Included (5% GST)</div>
                  </div>
                </div>
              </div>

              {/* Traveler Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#4a5e4a] uppercase tracking-wider mb-1">
                    Lead Passenger Name
                  </label>
                  <input
                    type="text"
                    value={leadPassengerName}
                    onChange={(e) => setLeadPassengerName(e.target.value)}
                    required
                    className="w-full bg-white border border-[#84D175]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#4a5e4a] uppercase tracking-wider mb-1">
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numTravelers}
                    onChange={(e) => setNumTravelers(e.target.value)}
                    required
                    className="w-full bg-white border border-[#84D175]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#4a5e4a] uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-[#84D175]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#4a5e4a] uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full bg-white border border-[#84D175]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[#4a5e4a] uppercase tracking-wider mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="E.g., Vegetarian meals, ground floor room, airport pickup"
                  className="w-full bg-white border border-[#84D175]/40 rounded-xl p-2.5 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-sm rounded-xl shadow-lg shadow-[#84D175]/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-[#1a2e1a]" />
                    <span>Processing Secure Reservation...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-[#1a2e1a]" />
                    <span>Confirm & Book — ₹{totalPrice}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#4a5e4a] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D6A24]" />
                <span>Idempotency-protected · Instant confirmation · Decimal precision</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
