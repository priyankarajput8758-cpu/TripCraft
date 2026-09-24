import React from 'react';
import {
  Sparkles,
  Globe,
  Compass,
  Layers,
  Search,
  Zap,
  MapPin,
  CreditCard
} from 'lucide-react';

export default function Navbar({
  currentLanguage,
  onLanguageChange,
  onOpenAiPlanner,
  realWorldEnabled,
  onToggleRealWorld
}) {
  const languages = [
    { code: 'en', label: 'English (en)' },
    { code: 'ta', label: 'தமிழ் (ta - Tamil)' },
    { code: 'hi', label: 'हिन्दी (hi - Hindi)' },
    { code: 'te', label: 'తెలుగు (te - Telugu)' },
    { code: 'kn', label: 'ಕನ್ನಡ (kn - Kannada)' },
    { code: 'mr', label: 'मराठी (mr - Marathi)' },
    { code: 'bn', label: 'বাংলা (bn - Bengali)' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Compass className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">TripCraft</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">PS-04</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Dynamic Custom Tour Packages & Grounded AI</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Real-World Live API Toggle */}
          <button
            onClick={() => onToggleRealWorld(!realWorldEnabled)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              realWorldEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live SerpAPI Google Hotels & OpenTripMap integrations"
          >
            <Zap className={`w-3.5 h-3.5 ${realWorldEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden md:inline">Live External Supply</span>
            <span className={`w-2 h-2 rounded-full ${realWorldEnabled ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
          </button>

          {/* Multilingual BCP-47 Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs">
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs pr-1 font-medium"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* AI Trip Planner Button */}
          <button
            onClick={onOpenAiPlanner}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold text-xs shadow-md shadow-teal-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Grounded AI Planner</span>
          </button>
        </div>
      </div>
    </header>
  );
}
