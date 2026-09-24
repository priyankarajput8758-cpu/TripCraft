import React, { useState, useMemo } from 'react';
import {
  Sparkles, Clock, MapPin, Mountain, Heart, Landmark, Users, Castle,
  Compass, ArrowRight, Search, Filter, ArrowUpDown, ChevronRight, Check,
  Bot, ShieldCheck, Star, Globe, Plane
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
  wildlife:   { labelKey: 'theme_all',        bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' },
  food_trail: { labelKey: 'theme_all',        bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' },
};

const THEME_FALLBACK_IMAGES = {
  adventure: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  honeymoon: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  pilgrimage: 'https://images.unsplash.com/photo-1600100397608-f010e423b971?auto=format&fit=crop&w=600&q=80',
  family: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  heritage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80',
  wildlife: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80',
  food_trail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
};

export default function PackageCatalog({
  packages = [],
  selectedPackageId,
  onSelectPackage,
  onBack,
  onOpenAiBuild,
  preferredLanguage = 'en',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  const allPackages = packages || [];

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const set = new Set();
    for (const p of allPackages) {
      if (p.city_name) set.add(p.city_name);
    }
    return Array.from(set).sort();
  }, [allPackages]);

  // Filter and sort packages
  const processedPackages = useMemo(() => {
    let result = [...allPackages];

    // 1. City Filter
    if (selectedCity !== 'all') {
      result = result.filter(p => p.city_name === selectedCity || p.city_id === selectedCity);
    }

    // 2. Theme Filter
    if (selectedTheme !== 'all') {
      result = result.filter(p => p.theme === selectedTheme || p.theme?.includes(selectedTheme));
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.city_name && p.city_name.toLowerCase().includes(q)) ||
        (p.theme && p.theme.toLowerCase().includes(q)) ||
        (p.overview && p.overview.toLowerCase().includes(q))
      );
    }

    // 4. Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => parseFloat(a.base_price || 0) - parseFloat(b.base_price || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => parseFloat(b.base_price || 0) - parseFloat(a.base_price || 0));
    } else if (sortBy === 'duration_asc') {
      result.sort((a, b) => (a.duration_days || 0) - (b.duration_days || 0));
    } else if (sortBy === 'duration_desc') {
      result.sort((a, b) => (b.duration_days || 0) - (a.duration_days || 0));
    }

    return result;
  }, [allPackages, selectedCity, selectedTheme, searchQuery, sortBy]);

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900 pb-12">

      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-xl transition-all cursor-pointer mb-1 shadow-xs"
            >
              ← {t('back_to_discover', preferredLanguage)}
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{t('package_catalog_title', preferredLanguage)}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {processedPackages.length} Available
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {t('package_catalog_sub', preferredLanguage)}
          </p>
        </div>

        {onOpenAiBuild && (
          <button
            onClick={onOpenAiBuild}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Bot className="w-4 h-4" />
            <span>{t('custom_ai_brief', preferredLanguage)}</span>
          </button>
        )}
      </div>

      {/* ── Search and Filter Controls ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_packages_placeholder', preferredLanguage)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition-all"
            />
          </div>

          {/* City Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
            >
              <option value="all">{t('all_cities_option', preferredLanguage)} ({uniqueCities.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Theme Filter */}
          <div>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
            >
              {THEMES_CONFIG.map((th) => (
                <option key={th.id} value={th.id}>{t(th.key, preferredLanguage)}</option>
              ))}
            </select>
          </div>

          {/* Sort Control */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 transition-all cursor-pointer"
            >
              <option value="default">{t('sort_featured', preferredLanguage)}</option>
              <option value="price_asc">{t('sort_price_low_high', preferredLanguage)}</option>
              <option value="price_desc">{t('sort_price_high_low', preferredLanguage)}</option>
              <option value="duration_asc">{t('sort_duration_short', preferredLanguage)}</option>
              <option value="duration_desc">{t('sort_duration_long', preferredLanguage)}</option>
            </select>
          </div>
        </div>

        {/* Theme Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          {THEMES_CONFIG.map(({ id, key, icon: Icon }) => {
            const isActive = selectedTheme === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedTheme(id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t(key, preferredLanguage)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Package Grid ── */}
      {processedPackages.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Compass className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">{t('no_packages_matching', preferredLanguage)}</h3>
          <p className="text-xs text-slate-500">{t('no_packages_try_reset', preferredLanguage)}</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCity('all'); setSelectedTheme('all'); }}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {t('reset_all_filters', preferredLanguage)}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {processedPackages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.package_id;
            const badge = THEME_BADGES[pkg.theme] || { labelKey: 'theme_all', bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' };
            const price = parseFloat(pkg.base_price || 32000);
            const heroImg = pkg.hero_image || THEME_FALLBACK_IMAGES[pkg.theme] || THEME_FALLBACK_IMAGES.adventure;
            const rawTitle = pkg.name || pkg.title || 'Tour Package';
            const displayTitle = rawTitle.replace(/^[—\-\s]+|[—\-\s]+$/g, '').trim();

            return (
              <div
                key={pkg.package_id}
                onClick={() => onSelectPackage(pkg.package_id)}
                className={`group relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 bg-white ${
                  isSelected
                    ? 'border-2 border-teal-500 ring-4 ring-teal-500/20 shadow-lg'
                    : 'border-slate-200 hover:border-teal-400'
                }`}
              >
                {/* Image Header */}
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={heroImg}
                    alt={pkg.hero_alt || displayTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Theme Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs ${badge.bg}`}>
                      {t(badge.labelKey, preferredLanguage)}
                    </span>
                  </div>

                  {/* City Location */}
                  <div className="absolute bottom-3 left-3 flex items-center space-x-1.5 text-white text-xs font-bold drop-shadow">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>{pkg.city_name || 'India'}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                      {displayTitle}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pkg.duration_days || 5} {t('days', preferredLanguage)} • {Math.max(1, (pkg.duration_days || 5) - 1)} {t('nights', preferredLanguage)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(pkg.tags || ['Customizable', 'Verified Hotels']).map((tagItem, idx) => (
                        <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {tagItem}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 space-y-2.5 mt-auto">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        {t('starting_from', preferredLanguage)}
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectPackage(pkg.package_id); }}
                      className="w-full py-2.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                    >
                      <span>{t('customize_package', preferredLanguage)}</span>
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
  );
}
