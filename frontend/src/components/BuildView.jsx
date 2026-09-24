import React, { useState } from 'react';
import { Sparkles, MapPin, Plus, Minus, Check, ArrowRight, Hotel, Utensils } from 'lucide-react';

const DESTINATIONS = [
  'Goa, India',
  'Jaipur, India',
  'Munnar, India',
  'Varanasi, India',
  'Bengaluru, India',
  'Udaipur, India',
];

const INTERESTS = [
  { id: 'heritage', label: 'Heritage', icon: '🏛️' },
  { id: 'food',      label: 'Food',     icon: '🍛' },
  { id: 'adventure', label: 'Adventure',icon: '⛰️' },
  { id: 'nature',    label: 'Nature',   icon: '🍃' },
  { id: 'wildlife',  label: 'Wildlife', icon: '🐯' },
  { id: 'culture',   label: 'Culture',  icon: '🪔' },
];

export default function BuildView({
  onBuildSubmit,
  currentLanguage,
  onBack,
}) {
  const [destination, setDestination] = useState('Goa, India');
  const [budget, setBudget] = useState(50000);
  const [durationDays, setDurationDays] = useState(5);
  const [pace, setPace] = useState('balanced');
  const [selectedInterests, setSelectedInterests] = useState(['heritage', 'food', 'adventure', 'nature']);
  const [useHotelBooking, setUseHotelBooking] = useState(true);
  const [useFoodBooking, setUseFoodBooking] = useState(true);
  const [building, setBuilding] = useState(false);

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setBuilding(true);

    setTimeout(() => {
      setBuilding(false);
      onBuildSubmit?.({
        destination,
        budget,
        durationDays,
        pace,
        interests: selectedInterests,
        previousBookings: {
          hotel: useHotelBooking ? 'Ocean Breeze Resort' : null,
          foodTour: useFoodBooking ? 'Panjim Old Town Culinary Walk' : null,
        }
      });
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in">
      {/* Top Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          ← Back to Discover
        </button>
      )}

      {/* Main Preference Card (Pure White Card matching Screenshot 2) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 text-slate-900">

        {/* Header */}
        <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Tell us what your perfect trip looks like.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              TripCraft AI will tailor every activity, stay, and guide according to your inputs.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Row 1: Destination & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Destination */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                DESTINATION
              </label>
              <div className="relative">
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600 transition-colors appearance-none cursor-pointer"
                >
                  {DESTINATIONS.map(d => (
                    <option key={d} value={d} className="bg-white text-slate-900">{d}</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-rose-500 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Budget Limit Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  BUDGET LIMIT
                </label>
                <span className="text-sm font-black text-blue-600 font-mono">
                  ₹{budget.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={20000}
                max={100000}
                step={5000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mt-1">
                <span>₹20k</span>
                <span>₹50k</span>
                <span>₹100k+</span>
              </div>
            </div>
          </div>

          {/* Row 2: Duration & Travel Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Duration Stepper */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                DURATION
              </label>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={() => setDurationDays(Math.max(2, durationDays - 1))}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold shadow-sm"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="text-sm font-extrabold text-slate-900 text-center">
                  {durationDays} Days / {Math.max(1, durationDays - 1)} Nights
                </div>

                <button
                  type="button"
                  onClick={() => setDurationDays(Math.min(14, durationDays + 1))}
                  className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Travel Pace */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                TRAVEL PACE
              </label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
                {['relaxed', 'balanced', 'packed'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPace(p)}
                    className={`py-2 rounded-lg capitalize transition-all ${
                      pace === p
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Interests & Preferences */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              INTERESTS & PREFERENCES
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((item) => {
                const isChecked = selectedInterests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleInterest(item.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isChecked
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Use Your Previous Bookings (Light Tinted Card) */}
          <div className="bg-[#fff8f6] border border-rose-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">🏨</span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  USE YOUR PREVIOUS BOOKINGS
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold border border-blue-200">
                Detected 2 Items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Hotel booking item */}
              <div
                onClick={() => setUseHotelBooking(!useHotelBooking)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 bg-white ${
                  useHotelBooking
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center ${
                  useHotelBooking ? 'bg-blue-600 text-white' : 'border border-slate-300'
                }`}>
                  {useHotelBooking && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Hotel already booked</div>
                  <div className="text-[11px] text-slate-500 font-medium">Ocean Breeze Resort (2 Nights)</div>
                </div>
              </div>

              {/* Food tour item */}
              <div
                onClick={() => setUseFoodBooking(!useFoodBooking)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 bg-white ${
                  useFoodBooking
                    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 opacity-60'
                }`}
              >
                <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center ${
                  useFoodBooking ? 'bg-blue-600 text-white' : 'border border-slate-300'
                }`}>
                  {useFoodBooking && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Food tour previously booked</div>
                  <div className="text-[11px] text-slate-500 font-medium">Panjim Old Town Culinary Walk</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Banner Engine */}
          <div className="rounded-2xl bg-[#0f172a] text-white p-4 flex items-center gap-3 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold">
              ⚡
            </div>
            <div>
              <div className="text-xs font-bold text-white">TripCraft AI Builder Engine</div>
              <div className="text-[11px] text-slate-300">
                TripCraft AI will combine your preferences, budget and booking history to build your package.
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={building}
            className="w-full py-4 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-sm rounded-2xl shadow-xl shadow-blue-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {building ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Customized Package...</span>
              </>
            ) : (
              <>
                <span>Build My Package →</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
