import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  IndianRupee,
  Heart,
  Zap,
  Globe,
  ArrowRight,
  Compass,
  Sparkles,
  Mountain,
  Utensils,
  Camera,
  Users,
  ChevronDown
} from 'lucide-react';

const THEMES = [
  { id: 'heritage', label: 'Heritage & Culture', icon: '🏛️' },
  { id: 'adventure', label: 'Adventure', icon: '⛰️' },
  { id: 'food_trail', label: 'Food & Culinary', icon: '🍛' },
  { id: 'wildlife', label: 'Wildlife Safari', icon: '🐯' },
  { id: 'pilgrimage', label: 'Pilgrimage', icon: '🛕' },
  { id: 'honeymoon', label: 'Honeymoon', icon: '💕' },
];

const PACE_OPTIONS = [
  { id: 'relaxed', label: 'Relaxed', desc: '1–2 activities/day', icon: '🌅' },
  { id: 'balanced', label: 'Balanced', desc: '3–4 activities/day', icon: '⚖️' },
  { id: 'packed', label: 'Packed', desc: '5+ activities/day', icon: '🚀' },
];

const DESTINATIONS = [
  'Jaipur', 'Bengaluru', 'Goa', 'Munnar', 'Varanasi',
  'Mysuru', 'Udaipur', 'Agra', 'Ooty', 'Tirupati'
];

export default function HeroSection({ onBuildTrip, currentLanguage }) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [pace, setPace] = useState('balanced');
  const [showForm, setShowForm] = useState(false);

  const toggleTheme = (id) => {
    setSelectedThemes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate) return;

    // Compute duration from dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    onBuildTrip({
      destination,
      startDate,
      endDate,
      durationDays,
      budget: budget ? parseFloat(budget) : null,
      themes: selectedThemes,
      pace,
      language: currentLanguage,
    });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#090d16] to-teal-950/20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Hero headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6 mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KogniVera Hackathon 2026 — PS-04 Dynamic Tour Packages</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Your Dream Trip,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              Crafted Live
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Browse curated packages, let AI build one for you, or customize every detail —
            hotel tier, activities, guides, transfers — and watch your price update in real time.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {[
              { icon: '🗓️', text: 'Live Repricing' },
              { icon: '🧑‍🏫', text: 'Expert Local Guides' },
              { icon: '🤖', text: 'Grounded AI Builder' },
              { icon: '🗺️', text: 'Interactive Trip Map' },
              { icon: '✅', text: 'Guide Availability Check' },
            ].map(f => (
              <span key={f.text} className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                <span>{f.icon}</span>{f.text}
              </span>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/30 active:scale-95 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Set My Preferences & Build Trip</span>
            </button>
            <button
              onClick={() => document.getElementById('package-catalog')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center space-x-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-all"
            >
              <span>Browse Curated Packages</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preference Form (expanded) */}
        {showForm && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-teal-400" />
                    Set Your Travel Preferences
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Duration is automatically calculated from your selected dates
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-500 hover:text-slate-300 text-xs border border-slate-700 rounded-lg px-2 py-1"
                >
                  Collapse
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Destination + Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      <MapPin className="w-3 h-3 inline mr-1 text-teal-400" />
                      Destination
                    </label>
                    <input
                      list="destinations-list"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="E.g. Jaipur"
                      required
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <datalist id="destinations-list">
                      {DESTINATIONS.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      <Calendar className="w-3 h-3 inline mr-1 text-teal-400" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      <Calendar className="w-3 h-3 inline mr-1 text-teal-400" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                    />
                    {startDate && endDate && (
                      <p className="text-[11px] text-teal-400 mt-1">
                        📅 {Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1)} days auto-calculated
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    <IndianRupee className="w-3 h-3 inline mr-1 text-teal-400" />
                    Budget (₹ INR, optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="E.g. 30000"
                      min="0"
                      className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <div className="flex gap-2">
                      {['15000','30000','50000'].map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBudget(b)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            budget === b
                              ? 'bg-teal-500/10 border-teal-500/40 text-teal-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          ₹{parseInt(b).toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3: Interests (Themes) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <Heart className="w-3 h-3 inline mr-1 text-teal-400" />
                    Interests (select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTheme(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                          selectedThemes.includes(t.id)
                            ? 'bg-teal-500/15 border-teal-500/60 text-teal-300 shadow-sm shadow-teal-500/10'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 4: Travel Pace */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <Zap className="w-3 h-3 inline mr-1 text-teal-400" />
                    Travel Pace
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {PACE_OPTIONS.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPace(p.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          pace === p.id
                            ? 'bg-teal-950/40 border-teal-500/60 ring-1 ring-teal-500/40'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-lg mb-1">{p.icon}</div>
                        <div className="text-xs font-semibold text-white">{p.label}</div>
                        <div className="text-[10px] text-slate-400">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language note */}
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                  <Globe className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="text-xs text-slate-300">
                    Guide language preference is set via the{' '}
                    <span className="text-teal-400 font-semibold">Language Selector</span>{' '}
                    in the top navbar (currently: <span className="font-mono text-teal-300">{currentLanguage}</span>).
                    This filters packages and guides automatically.
                  </span>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
                >
                  <Compass className="w-4 h-4" />
                  <span>Build My Trip</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {!showForm && (
          <div className="max-w-3xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: '60+', label: 'Curated Packages' },
              { value: '21', label: 'Cities Available' },
              { value: '100%', label: 'Decimal Precision' },
              { value: 'Live', label: 'Guide Availability' },
            ].map(s => (
              <div key={s.label} className="text-center bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                <div className="text-lg font-black text-teal-400">{s.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
