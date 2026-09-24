import React, { useState } from 'react';
import { Globe, Zap, LogOut, Compass, Sparkles, Layers, Menu, X } from 'lucide-react';
import { t } from '../i18n';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ta', label: 'Tamil (தமிழ்)', short: 'TA' },
  { code: 'hi', label: 'Hindi (हिन्दी)', short: 'HI' },
  { code: 'te', label: 'Telugu (తెలుగు)', short: 'TE' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)', short: 'KN' },
  { code: 'mr', label: 'Marathi (मराठी)', short: 'MR' },
  { code: 'bn', label: 'Bengali (বাংলা)', short: 'BN' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)', short: 'GU' },
];

export default function Navbar({
  currentLanguage,
  onLanguageChange,
  onOpenAiPlanner,
  realWorldEnabled,
  onToggleRealWorld,
  user,
  onSignOut,
  activeStep,
  onStepChange,
}) {
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF8D2]/95 border-b border-[#84D175]/30 shadow-sm backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">

        {/* ── Brand Logo ── */}
        <div
          className="flex items-center gap-2.5 shrink-0 cursor-pointer select-none"
          onClick={() => {
            onStepChange?.('discover');
            setMobileMenuOpen(false);
          }}
        >
          <img
            src="/logo.png"
            alt="TripCraft"
            className="h-9 w-auto object-contain rounded-xl shadow-sm bg-white/80 p-0.5"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-[#1a2e1a]">TripCraft</span>
          </div>
        </div>

        {/* ── Desktop Center Mode Switcher ── */}
        <nav className="hidden md:flex items-center gap-1 bg-white/75 p-1 rounded-2xl border border-[#84D175]/30 shadow-xs">
          <button
            onClick={() => onStepChange?.('discover')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStep === 'discover' || activeStep === 'customize' || activeStep === 'optimize' || activeStep === 'confirm'
                ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                : 'text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-[#FFF8D2]/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('curated_packages', currentLanguage)}</span>
          </button>

          <button
            onClick={() => onStepChange?.('architect')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeStep === 'architect'
                ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                : 'text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-[#FFF8D2]/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{t('custom_architect', currentLanguage)}</span>
          </button>

          <button
            onClick={onOpenAiPlanner}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1a2e1a] bg-[#84D175]/20 hover:bg-[#84D175]/35 transition-all cursor-pointer border border-[#84D175]/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3C8B30]" />
            <span>{t('ai_builder', currentLanguage)}</span>
          </button>
        </nav>

        {/* ── Actions (right) ── */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* Live Market Data toggle */}
          <button
            onClick={() => onToggleRealWorld?.(!realWorldEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              realWorldEnabled
                ? 'bg-[#84D175]/25 border-[#84D175] text-[#2D6A24] shadow-xs'
                : 'bg-white/80 border-[#84D175]/30 text-[#4a5e4a] hover:text-[#1a2e1a]'
            }`}
            title="Live SerpAPI & OpenTripMap Market Data"
          >
            <Zap className={`w-3.5 h-3.5 ${realWorldEnabled ? 'text-[#2D6A24] fill-[#2D6A24]' : 'text-[#84D175]'}`} />
            <span className="hidden lg:inline">{realWorldEnabled ? t('market_active', currentLanguage) : t('market_data', currentLanguage)}</span>
          </button>

          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 bg-white/80 border border-[#84D175]/30 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-[#1a2e1a] hover:border-[#84D175] transition-all cursor-pointer shadow-xs"
            >
              <Globe className="w-3.5 h-3.5 text-[#3C8B30]" />
              <span className="hidden sm:inline">{currentLang.short}</span>
              <span className="text-[10px] text-[#4a5e4a]">▼</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 border border-[#84D175]/40 rounded-2xl shadow-xl overflow-hidden z-50 py-1 backdrop-blur-md animate-in">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#4a5e4a] border-b border-[#84D175]/20">
                  {t('select_language', currentLanguage)}
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-all cursor-pointer ${
                      lang.code === currentLanguage
                        ? 'bg-[#84D175]/20 text-[#2D6A24] font-black'
                        : 'text-[#1a2e1a] hover:bg-[#FFF8D2] font-semibold'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#84D175]/20 text-[#2D6A24] font-bold">
                      {lang.short}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile & Sign Out / Logout */}
          <div className="flex items-center gap-1.5 bg-white/80 border border-[#84D175]/30 px-2 sm:px-2.5 py-1 rounded-xl shadow-xs">
            <div className="w-6 h-6 rounded-full bg-[#84D175] text-[#1a2e1a] font-black text-[11px] flex items-center justify-center shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[#4a5e4a] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs font-bold"
              title="Sign Out to Landing Page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/80 border border-[#84D175]/30 text-[#1a2e1a] hover:bg-[#FFF8D2] transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 bg-[#FFF8D2]/95 border-b border-[#84D175]/40 space-y-2 animate-in backdrop-blur-lg">
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onStepChange?.('discover');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeStep === 'discover' || activeStep === 'customize' || activeStep === 'optimize' || activeStep === 'confirm'
                  ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                  : 'bg-white/80 border border-[#84D175]/30 text-[#1a2e1a]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t('curated_packages', currentLanguage)}</span>
            </button>

            <button
              onClick={() => {
                onStepChange?.('architect');
                setMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeStep === 'architect'
                  ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                  : 'bg-white/80 border border-[#84D175]/30 text-[#1a2e1a]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{t('custom_architect', currentLanguage)}</span>
            </button>
          </div>

          <button
            onClick={() => {
              onOpenAiPlanner?.();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('ai_builder', currentLanguage)}</span>
          </button>

          <button
            onClick={() => {
              onSignOut?.();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white border border-rose-200 text-rose-700 font-bold text-xs shadow-xs hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out to Landing Page</span>
          </button>
        </div>
      )}

      {langOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
      )}
    </header>
  );
}
