import React from 'react';
import {
  Sparkles,
  Globe,
  Compass,
  Layers,
  Search,
  Zap,
  MapPin,
  CalendarCheck,
  CompassIcon
} from 'lucide-react';

export default function Navbar({
  currentLanguage,
  onLanguageChange,
  onOpenAiPlanner,
  realWorldEnabled,
  onToggleRealWorld,
  activeMode = 'curated',
  onModeChange
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Compass className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">TripCraft</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">PS-04</span>
              </div>
              <p className="text-[10px] text-slate-400 hidden lg:block">Dynamic Tour Packages & AI Engine</p>
            </div>
          </div>

          {/* Core View Switcher Tabs */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onModeChange && onModeChange('curated')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'curated'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Curated Packages</span>
            </button>

            <button
              onClick={() => onModeChange && onModeChange('custom_destination')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'custom_destination'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CompassIcon className="w-3.5 h-3.5" />
              <span>Custom Destination Architect</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
                Any City
              </span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Real-World Live API Toggle */}
          <button
            onClick={() => onToggleRealWorld(!realWorldEnabled)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
              realWorldEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live SerpAPI Google Hotels & OpenTripMap integrations"
          >
            <Zap className={`w-3.5 h-3.5 ${realWorldEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden md:inline font-bold">External Supply Mode</span>
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

          {/* Grounded AI Trip Planner Button */}
          <button
            onClick={onOpenAiPlanner}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Planner</span>
          </button>
        </div>
      </div>
    </header>
  );
}
