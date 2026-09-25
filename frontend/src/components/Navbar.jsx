import React, { useState } from 'react';
import { Bot } from 'lucide-react';
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
  onGoToLanding,
  activeStep,
  onStepChange,
}) {
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentLang = LANGUAGES.find(l => l.code === currentLanguage) || LANGUAGES[0];

  const handleLogoClick = () => {
    onGoToLanding?.();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF8D2]/90 backdrop-blur-md border-b border-[#84D175]/30 shadow-xs transition-all">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 relative flex items-center justify-between">

        {/* ── Left (Desktop): Brand Logo (Redirects to Landing Page) ── */}
        <div
          className="hidden md:flex items-center gap-3 shrink-0 cursor-pointer select-none group"
          onClick={handleLogoClick}
          title="Go to Landing Page"
        >
          <img
            src="/logo.png"
            alt="TripCraft"
            className="h-10 sm:h-11 w-auto object-contain rounded-xl shadow-xs bg-white/70 p-0.5 group-hover:scale-105 transition-transform"
          />
          <span className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#1a2e1a]">
            TripCraft
          </span>
        </div>

        {/* ── Center Navigation Menu (Desktop): Mathematically Centered ── */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1.5 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-[#84D175]/35 shadow-xs">
          <button
            onClick={() => onStepChange?.('discover')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
              activeStep === 'discover' || activeStep === 'customize' || activeStep === 'optimize' || activeStep === 'confirm'
                ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                : 'text-[#1a2e1a] hover:bg-[#84D175]/30 hover:text-[#1a2e1a]'
            }`}
          >
            {t('curated_packages', currentLanguage)}
          </button>

          <button
            onClick={() => onStepChange?.('architect')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer ${
              activeStep === 'architect'
                ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                : 'text-[#1a2e1a] hover:bg-[#84D175]/30 hover:text-[#1a2e1a]'
            }`}
          >
            {t('custom_architect', currentLanguage)}
          </button>

          <button
            onClick={onOpenAiPlanner}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-sm sm:text-base font-bold text-[#1a2e1a] bg-[#84D175]/35 hover:bg-[#84D175]/50 transition-all cursor-pointer border border-[#84D175]/45"
          >
            <Bot className="w-5 h-5 text-[#2D6A24]" />
            <span>{t('ai_builder', currentLanguage)}</span>
          </button>
        </nav>

        {/* ── Right (Desktop): Market Data, Language, Logout (Unified Hover) ── */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Live Market Data toggle */}
          <button
            onClick={() => onToggleRealWorld?.(!realWorldEnabled)}
            className={`px-3.5 py-2 rounded-xl text-sm sm:text-base font-bold border transition-all cursor-pointer ${
              realWorldEnabled
                ? 'bg-[#84D175]/35 border-[#84D175] text-[#2D6A24] shadow-xs hover:bg-[#84D175]/50'
                : 'bg-white/60 border-[#84D175]/35 text-[#1a2e1a] hover:bg-[#84D175]/30'
            }`}
            title="Live SerpAPI & OpenTripMap Market Rates"
          >
            <span>{realWorldEnabled ? t('market_active', currentLanguage) : t('market_data', currentLanguage)}</span>
          </button>

          {/* Language dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="bg-white/60 border border-[#84D175]/35 px-3.5 py-2 rounded-xl text-sm sm:text-base font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 transition-all cursor-pointer shadow-xs"
            >
              <span>{currentLang.short}</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white/95 backdrop-blur-xl border border-[#84D175]/40 rounded-2xl shadow-xl overflow-hidden z-50 py-1.5 animate-in">
                <div className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-[#1a2e1a] border-b border-[#84D175]/20">
                  {t('select_language', currentLanguage)}
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm sm:text-base transition-all cursor-pointer ${
                      lang.code === currentLanguage
                        ? 'bg-[#84D175]/25 text-[#2D6A24] font-bold'
                        : 'text-[#1a2e1a] hover:bg-[#84D175]/30 font-semibold'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#84D175]/20 text-[#2D6A24] font-bold">
                      {lang.short}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={onSignOut}
            className="px-4 py-2 rounded-xl bg-white/60 border border-[#84D175]/35 text-[#1a2e1a] hover:bg-[#84D175]/30 transition-all cursor-pointer text-sm sm:text-base font-bold shadow-xs"
            title="Sign Out to Landing Page"
          >
            Logout
          </button>
        </div>

        {/* ── Mobile Layout (< md): Centered Logo, Menu on Left, Logout on Right Corner ── */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Mobile Left: Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="px-3 py-1.5 rounded-xl bg-white/70 border border-[#84D175]/35 text-[#1a2e1a] hover:bg-[#84D175]/30 transition-all cursor-pointer text-sm font-bold shadow-xs"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? 'Close' : 'Menu'}
          </button>

          {/* Mobile Center: Centered Logo & Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleLogoClick}
            title="Go to Landing Page"
          >
            <img
              src="/logo.png"
              alt="TripCraft"
              className="h-8 w-auto object-contain rounded-xl shadow-xs bg-white/70 p-0.5"
            />
            <span className="text-xl font-serif font-black tracking-tight text-[#1a2e1a]">
              TripCraft
            </span>
          </div>

          {/* Mobile Right Corner: Logout Button (Profile picture removed for space) */}
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-xl bg-white/70 border border-[#84D175]/35 text-[#1a2e1a] hover:bg-[#84D175]/30 transition-all cursor-pointer text-sm font-bold shadow-xs"
            title="Sign Out to Landing Page"
          >
            Logout
          </button>
        </div>

      </div>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-5 bg-[#FFF8D2]/95 backdrop-blur-xl border-b border-[#84D175]/35 space-y-2.5 animate-in">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                onStepChange?.('discover');
                setMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl text-base font-bold transition-all cursor-pointer text-center ${
                activeStep === 'discover' || activeStep === 'customize' || activeStep === 'optimize' || activeStep === 'confirm'
                  ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                  : 'bg-white/70 border border-[#84D175]/35 text-[#1a2e1a] hover:bg-[#84D175]/30'
              }`}
            >
              {t('curated_packages', currentLanguage)}
            </button>

            <button
              onClick={() => {
                onStepChange?.('architect');
                setMobileMenuOpen(false);
              }}
              className={`p-3 rounded-xl text-base font-bold transition-all cursor-pointer text-center ${
                activeStep === 'architect'
                  ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                  : 'bg-white/70 border border-[#84D175]/35 text-[#1a2e1a] hover:bg-[#84D175]/30'
              }`}
            >
              {t('custom_architect', currentLanguage)}
            </button>
          </div>

          <button
            onClick={() => {
              onOpenAiPlanner?.();
              setMobileMenuOpen(false);
            }}
            className="w-full p-3.5 rounded-xl bg-[#84D175]/35 hover:bg-[#84D175]/50 text-[#1a2e1a] font-bold text-base shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-2 border border-[#84D175]/45"
          >
            <Bot className="w-5 h-5 text-[#2D6A24]" />
            <span>{t('ai_builder', currentLanguage)}</span>
          </button>

          {/* Mobile Market Data & Language Selection */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onToggleRealWorld?.(!realWorldEnabled)}
              className={`p-3 rounded-xl text-sm font-bold border transition-all cursor-pointer text-center ${
                realWorldEnabled
                  ? 'bg-[#84D175]/35 border-[#84D175] text-[#2D6A24]'
                  : 'bg-white/70 border-[#84D175]/35 text-[#1a2e1a] hover:bg-[#84D175]/30'
              }`}
            >
              {realWorldEnabled ? t('market_active', currentLanguage) : t('market_data', currentLanguage)}
            </button>

            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="w-full p-3 rounded-xl bg-white/70 border border-[#84D175]/35 text-[#1a2e1a] hover:bg-[#84D175]/30 font-bold text-sm text-center transition-all cursor-pointer"
              >
                {currentLang.label} ({currentLang.short})
              </button>

              {langOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-[#84D175]/40 rounded-2xl shadow-xl overflow-hidden z-50 py-1.5 animate-in">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-sm font-semibold transition-all cursor-pointer ${
                        lang.code === currentLanguage
                          ? 'bg-[#84D175]/25 text-[#2D6A24] font-bold'
                          : 'text-[#1a2e1a] hover:bg-[#84D175]/30'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#84D175]/20 text-[#2D6A24] font-bold">
                        {lang.short}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {langOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
      )}
    </header>
  );
}
