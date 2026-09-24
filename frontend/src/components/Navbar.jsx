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
import { t } from '../i18n';

export default function Navbar({
  currentLanguage = 'en',
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

  const handleSelectLanguage = (langCode) => {
    try {
      localStorage.setItem('tripcraft_lang', langCode);
    } catch (e) {
      console.warn('Could not save language to localStorage', e);
    }
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mode Switcher */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          <div className="flex items-center space-x-2.5">
            <img
              src="/logo.png"
              alt="TripCraft Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain shadow-lg shadow-teal-500/20 shrink-0 border border-slate-700 bg-slate-950 p-0.5"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">TripCraft</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold font-mono">
                  PS-04
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xl:block font-medium">Dynamic Tour Packages & AI Engine</p>
            </div>
          </div>

          {/* Core View Switcher Tabs (Desktop / Tablet) */}
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
              <span>{t('curated_packages', currentLanguage)}</span>
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
              <span>{t('custom_architect', currentLanguage)}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
                Any City
              </span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Real-World Live API Toggle */}
          <button
            onClick={() => onToggleRealWorld(!realWorldEnabled)}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              realWorldEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Live SerpAPI Google Hotels & OpenTripMap integrations"
          >
            <Zap className={`w-3.5 h-3.5 ${realWorldEnabled ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="hidden md:inline">{t('external_supply', currentLanguage)}</span>
            <span className={`w-2 h-2 rounded-full ${realWorldEnabled ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
          </button>

          {/* Multilingual BCP-47 Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 border border-slate-700/80 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs">
            <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <select
              value={currentLanguage}
              onChange={(e) => handleSelectLanguage(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs pr-1 font-bold"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Grounded AI Trip Planner Button */}
          <button
            onClick={onOpenAiPlanner}
            className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('ai_planner', currentLanguage)}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
