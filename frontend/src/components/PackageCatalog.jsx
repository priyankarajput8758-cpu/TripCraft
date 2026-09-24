import React, { useState, useMemo } from 'react';
import {
  Sparkles, Clock, MapPin, Mountain, Heart, Landmark, Users, Castle,
  Compass, ArrowRight, Search, Filter, ArrowUpDown, ChevronRight, Check,
  Bot, ShieldCheck, Star, Globe, Plane
} from 'lucide-react';
import { t } from '../i18n';
import { FALLBACK_PACKAGES } from '../data/fallbackCatalog';

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
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc'

  const allPackages = (packages && packages.length > 0) ? packages : FALLBACK_PACKAGES;

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
      result = result.filter(p => {
        const name = (p.name || p.title || '').toLowerCase();
        const nameTr = (p.title_translated || '').toLowerCase();
        const city = (p.city_name || '').toLowerCase();
        const cityTr = (p.city_name_translated || '').toLowerCase();
        const theme = (p.theme || '').toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
        return name.includes(q) || nameTr.includes(q) || city.includes(q) || cityTr.includes(q) || theme.includes(q) || tags.includes(q);
      });
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
  }, [packages, selectedCity, selectedTheme, searchQuery, sortBy]);

  return (
    <div className="space-y-8 animate-in text-[#1a2e1a] pb-12">
      {/* ── 1. Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-xl border border-[#84D175]/30 bg-gradient-to-r from-[#0C2D45] via-[#0C2D45]/95 to-[#0C2D45]/85 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#84D175]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#84D175]/20 border border-[#84D175]/40 text-[#84D175] text-xs font-bold">
              <Compass className="w-3.5 h-3.5 text-[#84D175]" />
              <span>{t('all_packages_title', preferredLanguage)}</span>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <span>← Back to Home</span>
              </button>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {t('all_packages_title', preferredLanguage)}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-medium">
              {t('all_packages_subtitle', preferredLanguage)}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Filter & Search Controls Bar ── */}
      <div className="bg-white/90 border border-[#84D175]/35 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#4a5e4a] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_packages_placeholder', preferredLanguage)}
              className="w-full bg-[#FFF8D2]/40 border border-[#84D175]/40 rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-[#1a2e1a] placeholder:text-[#4a5e4a]/60 focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-[#4a5e4a] hover:text-[#1a2e1a]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Destination Dropdown */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-[#FFF8D2]/40 border border-[#84D175]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
            >
              <option value="all">{t('all_destinations', preferredLanguage)} ({uniqueCities.length})</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#FFF8D2]/40 border border-[#84D175]/40 rounded-xl px-3 py-2 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
            >
              <option value="default">{t('sort_by', preferredLanguage)}: Featured</option>
              <option value="price_asc">{t('sort_price_low', preferredLanguage)}</option>
              <option value="price_desc">{t('sort_price_high', preferredLanguage)}</option>
              <option value="duration_asc">{t('sort_duration_short', preferredLanguage)}</option>
              <option value="duration_desc">{t('sort_duration_long', preferredLanguage)}</option>
            </select>
          </div>
        </div>

        {/* Theme Pills */}
        <div className="flex gap-2 overflow-x-auto pt-1 border-t border-[#84D175]/20">
          {THEMES_CONFIG.map((tItem) => {
            const IconComponent = tItem.icon;
            const isSelected = selectedTheme === tItem.id;
            return (
              <button
                key={tItem.id}
                onClick={() => setSelectedTheme(tItem.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                    : 'bg-white/80 border border-[#84D175]/30 text-[#1a2e1a] hover:bg-[#FFF8D2]'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 text-[#1a2e1a]" />
                <span>{t(tItem.key, preferredLanguage)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Results Header ── */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-bold text-[#4a5e4a]">
          Showing <span className="text-[#1a2e1a] font-black">{processedPackages.length}</span> verified tour package{processedPackages.length !== 1 ? 's' : ''}
        </div>
        {(selectedCity !== 'all' || selectedTheme !== 'all' || searchQuery) && (
          <button
            onClick={() => { setSelectedCity('all'); setSelectedTheme('all'); setSearchQuery(''); }}
            className="text-xs font-bold text-[#3C8B30] hover:text-[#2D6A24] cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ── 4. Comprehensive Package Grid ── */}
      {processedPackages.length === 0 ? (
        <div className="bg-white/80 border border-[#84D175]/30 rounded-3xl p-12 text-center space-y-3">
          <div className="text-4xl">🗺️</div>
          <h3 className="text-base font-bold text-[#1a2e1a]">{t('no_packages_found', preferredLanguage)}</h3>
          <p className="text-xs text-[#4a5e4a]">
            Try adjusting your search query or theme filters to see more results.
          </p>
          <button
            onClick={() => { setSelectedCity('all'); setSelectedTheme('all'); setSearchQuery(''); }}
            className="px-4 py-2 rounded-xl bg-[#84D175] text-[#1a2e1a] text-xs font-bold cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {processedPackages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.package_id;
            const badgeConfig = THEME_BADGES[pkg.theme];
            const badgeLabel = badgeConfig ? t(badgeConfig.labelKey, preferredLanguage).toUpperCase() : (pkg.theme || 'TOUR').toUpperCase();
            const badgeBg = badgeConfig?.bg || 'bg-[#84D175] text-[#1a2e1a] font-bold';
            const price = parseFloat(pkg.base_price || 0);
            const imageUrl = pkg.image_url || THEME_FALLBACK_IMAGES[pkg.theme] || THEME_FALLBACK_IMAGES.adventure;
            const displayTitle = pkg.title_translated || pkg.title || pkg.name;
            const displayCity = pkg.city_name_translated || pkg.city_name || 'India';

            return (
              <div
                key={pkg.package_id}
                onClick={() => onSelectPackage(pkg.package_id)}
                className={`group rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#84D175] ring-2 ring-[#84D175]/30 shadow-xl'
                    : 'bg-white/90 border-[#84D175]/20 hover:border-[#84D175]/60 hover:shadow-xl'
                }`}
              >
                {/* Image Header */}
                <div className="relative h-40 w-full overflow-hidden bg-[#0C2D45]">
                  <img
                    src={imageUrl}
                    alt={displayTitle}
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
                      {displayCity}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white/90">
                  <div className="space-y-2">
                    <h3 className="font-bold text-[#1a2e1a] text-sm leading-snug group-hover:text-[#3C8B30] transition-colors line-clamp-2">
                      {displayTitle}
                    </h3>
                    <div className="text-xs text-[#4a5e4a] font-medium">
                      {pkg.duration_days || 5} {t('days', preferredLanguage)} • {Math.max(1, (pkg.duration_days || 5) - 1)} {t('nights', preferredLanguage)}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(pkg.tags || ['Customizable', 'Verified Itinerary']).slice(0, 2).map((tagItem, idx) => (
                        <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FFF8D2] text-[#3C8B30] border border-[#84D175]/30">
                          {tagItem}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#84D175]/20 space-y-2 mt-auto">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#4a5e4a] font-bold">
                        {t('starting_from', preferredLanguage)}
                      </span>
                      <span className="text-base font-black text-[#1a2e1a] font-mono">
                        ₹{price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectPackage(pkg.package_id); }}
                      className="w-full py-2 px-3 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
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
