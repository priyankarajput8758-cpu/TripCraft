import React, { useState } from 'react';
import {
  Sparkles, Clock, MapPin, Mountain, Heart, Landmark, Users, Castle,
  Utensils, Plane, Bot, ArrowRight, ShieldCheck, Compass
} from 'lucide-react';
import { t } from '../i18n';

const THEMES_CONFIG = [
  { id: 'all',        key: 'theme_all',        icon: Sparkles },
  { id: 'adventure',  key: 'theme_adventure',  icon: Mountain },
  { id: 'honeymoon',  key: 'theme_honeymoon',  icon: Heart },
  { id: 'pilgrimage', key: 'theme_pilgrimage', icon: Landmark },
  { id: 'family',     key: 'theme_family',     icon: Users },
  { id: 'heritage',   key: 'theme_heritage',   icon: Castle },
];

const THEME_BADGES = {
  adventure:  { labelKey: 'theme_adventure',  bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' },
  honeymoon:  { labelKey: 'theme_honeymoon',  bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' },
  pilgrimage: { labelKey: 'theme_pilgrimage', bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' },
  family:     { labelKey: 'theme_family',     bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' },
  heritage:   { labelKey: 'theme_heritage',   bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' },
};

const DEFAULT_PREBUILT_PACKAGES = [
  {
    package_id: 'pkg_goa_trek_01',
    name: 'Goa Coastal Trek',
    title: 'Goa Coastal Trek',
    theme: 'adventure',
    duration_days: 5,
    city_name: 'Goa, India',
    base_price: '32000.00',
    tags: ['Scuba Diving', 'Cliff Trek'],
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  {
    package_id: 'pkg_beach_resort_02',
    name: 'Romantic Beach Resort',
    title: 'Romantic Beach Resort',
    theme: 'honeymoon',
    duration_days: 5,
    city_name: 'Goa, India',
    base_price: '45000.00',
    tags: ['Luxury Stay', 'Sunset Sail'],
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  },
  {
    package_id: 'pkg_temples_trail_03',
    name: 'Ancient Temples Trail',
    title: 'Ancient Temples Trail',
    theme: 'pilgrimage',
    duration_days: 5,
    city_name: 'Goa, India',
    base_price: '28000.00',
    tags: ['Guided Tours', 'Transfers'],
    image_url: 'https://images.unsplash.com/photo-1600100397608-f010e423b971?auto=format&fit=crop&w=600&q=80',
  },
  {
    package_id: 'pkg_family_wildlife_04',
    name: 'Family Beach & Wildlife',
    title: 'Family Beach & Wildlife',
    theme: 'family',
    duration_days: 5,
    city_name: 'Goa, India',
    base_price: '38000.00',
    tags: ['Resort Stay', 'Spice Tour'],
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  },
];

export default function DiscoverView({
  packages = [],
  selectedPackageId,
  onSelectPackage,
  onOpenAiBuild,
  onStartBuild,
  language = 'en',
}) {
  const [activeTheme, setActiveTheme] = useState('all');

  const displayPackages = (packages && packages.length > 0) ? packages : DEFAULT_PREBUILT_PACKAGES;

  const filteredPackages = activeTheme === 'all'
    ? displayPackages
    : displayPackages.filter(p => p.theme === activeTheme || p.theme?.includes(activeTheme));

  return (
    <div className="space-y-10 animate-in">

      {/* ── 1. Top Hero Banner with Translucent Background Image ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 shadow-2xl border border-[#84D175]/30">

        {/* Translucent background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 scale-105 transition-transform duration-700 hover:scale-100"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80')` }}
        />

        {/* Gradient dark overlay for crystal-clear readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C2D45] via-[#0C2D45]/90 to-[#0C2D45]/75" />

        {/* Moss glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#84D175]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#84D175]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          {/* Eyebrow badge with solid plane symbol */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#84D175]/20 border border-[#84D175]/40 text-[#84D175] text-xs font-bold backdrop-blur-md">
            <Plane className="w-3.5 h-3.5 text-[#84D175]" />
            <span>{t('next_gen_travel', language)}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {t('build_trip_title', language)}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl font-medium">
            {t('hero_subtitle', language)}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onOpenAiBuild}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-sm shadow-xl shadow-[#84D175]/30 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#1a2e1a]" />
              <span>{t('build_with_ai', language)}</span>
            </button>
            <button
              onClick={onStartBuild}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm transition-all cursor-pointer backdrop-blur-sm"
            >
              <Compass className="w-4 h-4 text-[#84D175]" />
              <span>{t('explore_packages', language)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Curated Packages by Theme ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#1a2e1a] tracking-tight">
              {t('curated_by_theme', language)}
            </h2>
            <p className="text-xs text-[#4a5e4a] mt-0.5 font-medium">
              {t('curated_subtitle', language)}
            </p>
          </div>
          <button
            onClick={() => setActiveTheme('all')}
            className="text-xs font-bold text-[#3C8B30] hover:text-[#2D6A24] transition-colors self-start sm:self-auto"
          >
            {t('view_all_themes', language)}
          </button>
        </div>

        {/* Theme Pills Row */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {THEMES_CONFIG.map((tItem) => {
            const IconComponent = tItem.icon;
            const isSelected = activeTheme === tItem.id;
            return (
              <button
                key={tItem.id}
                onClick={() => setActiveTheme(tItem.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#84D175] text-[#1a2e1a] shadow-md shadow-[#84D175]/25'
                    : 'bg-white/85 border border-[#84D175]/30 text-[#1a2e1a] hover:bg-[#FFF8D2] shadow-sm'
                }`}
              >
                <IconComponent className="w-4 h-4 text-[#1a2e1a]" />
                <span>{t(tItem.key, language)}</span>
              </button>
            );
          })}
        </div>

        {/* Packages Cards Grid */}
        {filteredPackages.length === 0 ? (
          <div className="bg-white/80 border border-[#84D175]/30 rounded-2xl p-10 text-center text-[#4a5e4a] text-xs font-medium">
            {t('no_packages_found', language)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPackages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.package_id;
              const badgeConfig = THEME_BADGES[pkg.theme];
              const badgeLabel = badgeConfig ? t(badgeConfig.labelKey, language).toUpperCase() : (pkg.theme || 'TOUR').toUpperCase();
              const badgeBg = badgeConfig?.bg || 'bg-[#84D175] text-[#1a2e1a] font-bold';
              const price = parseFloat(pkg.base_price || 0);

              const defaultImages = {
                adventure: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
                honeymoon: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
                pilgrimage: 'https://images.unsplash.com/photo-1600100397608-f010e423b971?auto=format&fit=crop&w=600&q=80',
                family: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
                heritage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80',
              };
              const imageUrl = pkg.image_url || defaultImages[pkg.theme] || defaultImages.adventure;

              return (
                <div
                  key={pkg.package_id}
                  className={`group rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#84D175] ring-2 ring-[#84D175]/30 shadow-xl'
                      : 'bg-white/90 border-[#84D175]/20 hover:border-[#84D175]/60 hover:shadow-xl'
                  }`}
                  onClick={() => onSelectPackage(pkg.package_id)}
                >
                  {/* Image Header */}
                  <div className="relative h-36 w-full overflow-hidden bg-[#0C2D45]">
                    <img
                      src={imageUrl}
                      alt={pkg.name || pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C2D45]/85 via-transparent to-black/20 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider ${badgeBg}`}>
                          {badgeLabel}
                        </span>
                        <span className="text-[11px] text-white font-bold bg-[#0C2D45]/60 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#84D175]" />
                          {pkg.duration_days}D
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1 drop-shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-[#84D175]" />
                        {pkg.city_name || 'Goa, India'}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white/90">
                    <div className="space-y-2">
                      <h3 className="font-bold text-[#1a2e1a] text-base leading-snug group-hover:text-[#3C8B30] transition-colors">
                        {pkg.name || pkg.title}
                      </h3>
                      <div className="text-xs text-[#4a5e4a] font-medium">
                        {pkg.duration_days || 5} {t('days', language)} • {Math.max(1, (pkg.duration_days || 5) - 1)} {t('nights', language)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(pkg.tags || ['Customizable', 'Sightseeing']).map((tagItem, idx) => (
                          <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FFF8D2] text-[#3C8B30] border border-[#84D175]/30">
                            {tagItem}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#84D175]/20 space-y-2 mt-auto">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-[#4a5e4a] font-bold">
                          {t('starting_from', language)}
                        </span>
                        <span className="text-base font-black text-[#1a2e1a] font-mono">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectPackage(pkg.package_id); }}
                        className="w-full py-2 px-3 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      >
                        <span>{t('customize_package', language)}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. Recommended for You ── */}
      <div className="rounded-2xl bg-[#84D175]/10 border border-[#84D175]/30 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#84D175] text-[#1a2e1a] shadow-sm">
              <Bot className="w-5 h-5 text-[#1a2e1a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1a2e1a]">Recommended for You</h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#84D175]/20 text-[#3C8B30] font-bold border border-[#84D175]/30">
                  Personalized
                </span>
              </div>
              <p className="text-xs text-[#4a5e4a] mt-0.5 font-medium">
                Recommended based on your preferences & booking history
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'pkg_rec_1', name: 'Goa Heritage & Culinary Express', detail: 'Heritage • 4 Days', price: '₹38,500' },
            { id: 'pkg_rec_2', name: 'South Goa Quiet Retreat', detail: 'Honeymoon • 5 Days', price: '₹34,000' },
            { id: 'pkg_rec_3', name: 'North Goa Adventure Special', detail: 'Adventure • 6 Days', price: '₹41,200' },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectPackage(packages[0]?.package_id || 'pkg_001')}
              className="bg-white/80 border border-[#84D175]/25 hover:border-[#84D175] rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-sm hover:shadow-md"
            >
              <div>
                <div className="text-xs font-bold text-[#1a2e1a]">{item.name}</div>
                <div className="text-[11px] text-[#4a5e4a] mt-0.5">{item.detail}</div>
              </div>
              <div className="text-sm font-bold text-[#3C8B30] font-mono">{item.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
