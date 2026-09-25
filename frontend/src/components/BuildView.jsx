import React, { useState, useEffect } from 'react';

const DESTINATIONS = [
  'Goa, India',
  'Jaipur, India',
  'Munnar, India',
  'Varanasi, India',
  'Bengaluru, India',
  'Udaipur, India',
];

const INTERESTS = [
  { id: 'heritage', label: 'Heritage' },
  { id: 'food',      label: 'Food & Cuisine' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'nature',    label: 'Nature' },
  { id: 'wildlife',  label: 'Wildlife' },
  { id: 'culture',   label: 'Culture & Art' },
];

const HERO_TOURISM_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1920&q=85',
    tag: 'Coastal & Tropical Islands',
  },
  {
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1920&q=85',
    tag: 'Royal Heritage & Palaces',
  },
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
    tag: 'Himalayan Mountain Treks',
  },
  {
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=85',
    tag: 'Munnar & Tea Valleys',
  },
  {
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1920&q=85',
    tag: 'Spiritual Heritage & Ghats',
  },
  {
    url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1920&q=85',
    tag: 'Luxury Island Escapes',
  },
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
  const [heroImageIdx, setHeroImageIdx] = useState(0);

  // Rotate hero image every 10 seconds automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIdx((prev) => (prev + 1) % HERO_TOURISM_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="max-w-4xl w-full mx-auto space-y-6 animate-in">
      {/* Top Back Button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm font-bold text-[#1a2e1a] bg-white/70 backdrop-blur-sm border border-[#84D175]/35 hover:bg-white px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          ← Back to Discover
        </button>
      )}

      {/* Main Preference Card with 10s Cross-fading Hero Images */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-xl border border-[#84D175]/40 text-[#1a2e1a]">
        
        {/* 100% visible cross-fading hero images */}
        {HERO_TOURISM_IMAGES.map((img, idx) => (
          <div
            key={img.url}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
              idx === heroImageIdx
                ? 'opacity-100 scale-100 z-0'
                : 'opacity-0 scale-105 pointer-events-none -z-10'
            }`}
            style={{ backgroundImage: `url('${img.url}')` }}
          />
        ))}

        {/* Translucent Frosted Glass Card for Form Content */}
        <div className="relative z-10 bg-white/80 backdrop-blur-md border border-[#84D175]/45 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">

          {/* Header */}
          <div className="border-b border-[#84D175]/30 pb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2D6A24] bg-[#84D175]/25 px-3 py-1 rounded-full border border-[#84D175]/40">
                Custom Destination Architect
              </span>
              <span className="text-xs font-bold text-[#2D6A24] bg-white/80 px-3 py-1 rounded-full border border-[#84D175]/35 hidden sm:inline-block">
                {HERO_TOURISM_IMAGES[heroImageIdx].tag}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a2e1a] tracking-tight">
              Tell us what your perfect trip looks like.
            </h2>
            <p className="text-sm sm:text-base text-[#1a2e1a] font-medium leading-relaxed">
              TripCraft AI will tailor every activity, stay, and guide according to your inputs and catalog availability.
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Row 1: Destination & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Destination */}
            <div>
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] mb-2">
                DESTINATION
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-white/80 backdrop-blur-sm border border-[#84D175]/40 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] transition-colors cursor-pointer shadow-xs"
              >
                {DESTINATIONS.map(d => (
                  <option key={d} value={d} className="bg-white text-[#1a2e1a]">{d}</option>
                ))}
              </select>
            </div>

            {/* Budget Limit Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a]">
                  BUDGET LIMIT
                </label>
                <span className="text-base sm:text-lg font-serif font-bold text-[#2D6A24]">
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
                className="w-full h-2.5 bg-[#84D175]/35 rounded-lg appearance-none cursor-pointer accent-[#2D6A24]"
              />
              <div className="flex justify-between text-xs text-[#1a2e1a] font-bold mt-1.5">
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
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] mb-2">
                DURATION
              </label>
              <div className="flex items-center justify-between bg-white/60 border border-[#84D175]/35 rounded-xl p-1.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => setDurationDays(Math.max(2, durationDays - 1))}
                  className="w-10 h-10 rounded-lg bg-white border border-[#84D175]/40 text-[#1a2e1a] hover:bg-[#84D175]/20 flex items-center justify-center font-bold text-base shadow-xs cursor-pointer"
                >
                  -
                </button>

                <div className="text-xs sm:text-sm font-bold text-[#1a2e1a] text-center">
                  {durationDays} Days / {Math.max(1, durationDays - 1)} Nights
                </div>

                <button
                  type="button"
                  onClick={() => setDurationDays(Math.min(14, durationDays + 1))}
                  className="w-10 h-10 rounded-lg bg-white border border-[#84D175]/40 text-[#1a2e1a] hover:bg-[#84D175]/20 flex items-center justify-center font-bold text-base shadow-xs cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Travel Pace */}
            <div>
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] mb-2">
                TRAVEL PACE
              </label>
              <div className="grid grid-cols-3 gap-2 bg-white/60 border border-[#84D175]/35 p-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs">
                {['relaxed', 'balanced', 'packed'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPace(p)}
                    className={`py-2 rounded-lg capitalize transition-all cursor-pointer ${
                      pace === p
                        ? 'bg-[#84D175] text-[#1a2e1a] font-bold shadow-xs'
                        : 'text-[#1a2e1a] hover:bg-white'
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
            <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a] mb-2">
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
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs border border-[#67C456]'
                        : 'bg-white/60 border border-[#84D175]/35 text-[#1a2e1a] hover:bg-white'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Use Your Previous Bookings */}
          <div className="bg-[#FFF8D2]/80 border border-[#84D175]/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1a2e1a]">
                USE YOUR PREVIOUS BOOKINGS
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#84D175]/30 text-[#2D6A24] font-bold border border-[#84D175]/40">
                Detected 2 Items
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Hotel booking item */}
              <div
                onClick={() => setUseHotelBooking(!useHotelBooking)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between bg-white/70 ${
                  useHotelBooking
                    ? 'border-[#84D175] ring-2 ring-[#84D175]/40 shadow-xs'
                    : 'border-[#84D175]/25 opacity-60'
                }`}
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#1a2e1a]">Hotel already booked</div>
                  <div className="text-xs text-[#1a2e1a] font-medium mt-0.5">Ocean Breeze Resort (2 Nights)</div>
                </div>
                <span className="text-xs uppercase font-bold text-[#2D6A24] bg-[#84D175]/20 px-2 py-0.5 rounded">
                  {useHotelBooking ? 'Active' : 'Off'}
                </span>
              </div>

              {/* Food tour item */}
              <div
                onClick={() => setUseFoodBooking(!useFoodBooking)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between bg-white/70 ${
                  useFoodBooking
                    ? 'border-[#84D175] ring-2 ring-[#84D175]/40 shadow-xs'
                    : 'border-[#84D175]/25 opacity-60'
                }`}
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#1a2e1a]">Food tour previously booked</div>
                  <div className="text-xs text-[#1a2e1a] font-medium mt-0.5">Panjim Old Town Culinary Walk</div>
                </div>
                <span className="text-xs uppercase font-bold text-[#2D6A24] bg-[#84D175]/20 px-2 py-0.5 rounded">
                  {useFoodBooking ? 'Active' : 'Off'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={building}
            className="w-full py-4 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-sm sm:text-base rounded-2xl shadow-md shadow-[#84D175]/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {building ? (
              <span>Generating Customized Package...</span>
            ) : (
              <span>Build My Custom Package →</span>
            )}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
