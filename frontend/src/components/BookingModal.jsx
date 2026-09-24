import React, { useState } from 'react';
import { api } from '../api';
import {
  CheckCircle2,
  X,
  CreditCard,
  Calendar,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Receipt,
  Sparkles,
  Download,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function BookingModal({
  isOpen,
  onClose,
  bookingDetails
}) {
  const [leadPassengerName, setLeadPassengerName] = useState('Divyansh Duggad');
  const [email, setEmail] = useState('divyansh@example.com');
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
  const startDate = bookingDetails.startDate;
  const selectedComponents = bookingDetails.selectedComponents || {};

  const pkgTitle = pkg?.name || pkg?.title || 'Custom Tour Itinerary';
  const guideName = guide?.display_name || guide?.name;

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const componentIds = Object.values(selectedComponents).filter(Boolean);
    const idempotencyKey = 'idemp_' + Math.random().toString(36).substring(2, 15);

    try {
      const payload = {
        package_id: pkg.package_id,
        user_id: 'usr_guest_demo',
        selected_component_ids: componentIds,
        idempotency_key: idempotencyKey,
        guide_id: guide?.guide_id || null,
        start_date: startDate,
        party_size: parseInt(numTravelers) || 2,
        notes: `Passenger: ${leadPassengerName} (${email}, ${phone}). Requests: ${specialRequests || 'None'}`
      };

      const res = await api.createBooking(payload);
      if (res && res.booking_id) {
        setBookingConfirmed(res);
      } else if (res && res.detail) {
        setError(res.detail);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {bookingConfirmed ? 'Booking Confirmed' : 'Instant Reservation & Confirmation'}
              </h2>
              <p className="text-xs text-slate-400">
                {bookingConfirmed ? 'Your custom tour is locked and verified' : 'Review your customized itinerary before locking'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {bookingConfirmed ? (
            /* Success State */
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">
                  Reservation Successfully Confirmed!
                </h3>
                <p className="text-xs text-slate-400">
                  Booking ID: <span className="font-mono font-bold text-teal-400 text-xs">{bookingConfirmed.booking_id}</span>
                </p>
              </div>

              {/* Receipt Breakdown Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-left text-xs space-y-2.5">
                <div className="flex justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Tour Package</span>
                  <span className="font-semibold text-white">{pkgTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Travel Date</span>
                  <span className="text-slate-200">{startDate} ({pkg.duration_days} Days)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lead Passenger</span>
                  <span className="text-slate-200">{leadPassengerName} ({numTravelers} Travelers)</span>
                </div>
                {guide && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Guide</span>
                    <span className="text-teal-400 font-medium">{guideName} ({guide.specialisation})</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-300 font-bold uppercase tracking-wider">Total Amount Paid</span>
                  <span className="text-base font-extrabold text-teal-400 font-mono">
                    ₹{parseFloat(bookingConfirmed.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 pt-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Idempotency token verified. Versioned itinerary locked in database.</span>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close & Return to Itinerary
              </button>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Trip Snapshot Banner */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{pkgTitle}</div>
                  <div className="text-slate-400 text-[11px]">{startDate} • {pkg.duration_days} Days • {guide ? `Guide: ${guideName}` : 'Self-guided'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-teal-400 font-mono">
                    ₹{parseFloat(pricing?.total_price || pkg.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500">All Taxes Included</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Lead Passenger Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={leadPassengerName}
                      onChange={(e) => setLeadPassengerName(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Number of Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={numTravelers}
                    onChange={(e) => setNumTravelers(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Special Dietary or Accessibility Requests (Optional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="E.g., Vegetarian meal preference, ground floor room request"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Reservation...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Confirm & Lock Package (₹{parseFloat(pricing?.total_price || pkg.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
