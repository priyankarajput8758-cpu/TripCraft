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

const CITY_LANDMARK_IMAGES = {
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80', // Taj Mahal
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', // Red Fort / India Gate
  'new delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80', // Gateway of India
  gwalior: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=800&q=80', // Jai Vilas Palace & Fort
  jodhpur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80', // Mehrangarh Fort / Blue City
  hyderabad: 'https://images.unsplash.com/photo-1605007493699-ce65834f8a00?auto=format&fit=crop&w=800&q=80', // Charminar / Golconda
  jaisalmer: 'https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?auto=format&fit=crop&w=800&q=80', // Golden Fort
  leh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80', // Pangong Lake & Ladakh
  ladakh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
  jaipur: 'https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?auto=format&fit=crop&w=800&q=80', // Hawa Mahal
  udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80', // City Palace & Lake Pichola
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80', // Varanasi Ghats
  tirupati: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80', // Tirupati Balaji Temple
  madurai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', // Meenakshi Temple
  thanjavur: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80', // Brihadeeswarar Temple
  lucknow: 'https://images.unsplash.com/photo-1600100397608-f46338b77626?auto=format&fit=crop&w=800&q=80', // Rumi Darwaza
  amritsar: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=800&q=80', // Golden Temple
  shimla: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80', // Shimla Hills & Ridge
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80', // Solang Valley & Pines
  rishikesh: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80', // Ganga & Lakshman Jhula
  nainital: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // Naini Lake
  srinagar: 'https://images.unsplash.com/photo-1598894101832-61a7a02c3809?auto=format&fit=crop&w=800&q=80', // Dal Lake Shikara
  pune: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80', // Shaniwar Wada
  aurangabad: 'https://images.unsplash.com/photo-1600100397608-f46338b77626?auto=format&fit=crop&w=800&q=80', // Ajanta Ellora Caves
  ahmedabad: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', // Sabarmati
  bhuj: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', // White Rann
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80', // Goa Beaches
  panaji: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', // Bangalore Palace
  mysuru: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', // Mysore Palace
  hampi: 'https://images.unsplash.com/photo-1600100397608-f46338b77626?auto=format&fit=crop&w=800&q=80', // Stone Chariot
  gokarna: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', // Om Beach
  chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', // Marina Beach
  ooty: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80', // Nilgiri Toy Train
  puducherry: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', // Promenade Beach
  pondicherry: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  kochi: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80', // Chinese Fishing Nets
  alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80', // Backwaters
  munnar: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80', // Munnar Tea Gardens
  thiruvananthapuram: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', // Kovalam & Temple
  wayanad: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80', // Chembra Peak
  chikmagalur: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80', // Mullayanagiri
  coorg: 'https://images.unsplash.com/photo-1598894101832-61a7a02c3809?auto=format&fit=crop&w=800&q=80', // Abbey Falls
  visakhapatnam: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', // RK Beach
  kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80', // Victoria Memorial
  darjeeling: 'https://images.unsplash.com/photo-1622308644420-a922440fa352?auto=format&fit=crop&w=800&q=80', // Kanchenjunga
  puri: 'https://images.unsplash.com/photo-1600100397608-f46338b77626?auto=format&fit=crop&w=800&q=80', // Jagannath Temple
  bhubaneswar: 'https://images.unsplash.com/photo-1600100397608-f46338b77626?auto=format&fit=crop&w=800&q=80', // Lingaraj Temple
  guwahati: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80', // Kamakhya Temple
  shillong: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // Living Root Bridges
  gangtok: 'https://images.unsplash.com/photo-1622308644420-a922440fa352?auto=format&fit=crop&w=800&q=80', // Rumtek Monastery
  raipur: 'https://images.unsplash.com/photo-1600100397608-f46338b77626?auto=format&fit=crop&w=800&q=80', // Telibandha Marine Drive
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80', // Fushimi Inari Torii Gates
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', // Burj Khalifa
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80', // Marina Bay Sands
  zurich: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80', // Lake Zurich
  bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80', // Wat Arun
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', // Ulun Danu
  kathmandu: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80', // Pashupatinath
  colombo: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=800&q=80', // Sigiriya
  male: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80' // Maldives Overwater
};

export default function DiscoverView({
  packages = [],
  selectedPackageId,
  onSelectPackage,
  onOpenAiBuild,
  onStartBuild,
  onExploreCatalog,
  language = 'en',
}) {
  const [activeTheme, setActiveTheme] = useState('all');

  const filteredPackages = activeTheme === 'all'
    ? packages
    : packages.filter(p => p.theme === activeTheme || p.theme?.includes(activeTheme));

  // Homepage displays a curated set of up to 8 featured packages across themes
  const curatedPackages = filteredPackages.slice(0, 8);
  const handleExplore = onExploreCatalog || onStartBuild;

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
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#84D175]/20 border border-[#84D175]/40 text-[#84D175] text-xs font-bold tracking-wide backdrop-blur-sm">
            <span className="text-sm">✈</span>
            <span>{t('hero_eyebrow', language)}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#FFF8D2] tracking-tight leading-tight">
            {t('hero_headline', language)}
          </h1>

          <p className="text-sm sm:text-base text-[#D3E8D0] leading-relaxed max-w-2xl font-normal">
            {t('hero_subheadline', language)}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExplore}
              className="px-6 py-3 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs sm:text-sm transition-all shadow-lg shadow-[#84D175]/25 flex items-center space-x-2 active:scale-95 cursor-pointer"
            >
              <span>{t('explore_packages', language)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenAiBuild && (
              <button
                onClick={onOpenAiBuild}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFF8D2] font-black text-xs sm:text-sm border border-white/20 transition-all backdrop-blur-sm flex items-center space-x-2 active:scale-95 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-[#84D175]" />
                <span>{t('ai_trip_builder', language)}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Theme Filter Tabs ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-[#1a2e1a] tracking-tight">
              {t('curated_packages', language)}
            </h2>
            <p className="text-xs sm:text-sm text-[#4a5e4a] font-medium">
              {t('curated_packages_sub', language)}
            </p>
          </div>

          {handleExplore && (
            <button
              onClick={handleExplore}
              className="text-xs font-black text-[#3C8B30] hover:text-[#2D6A24] flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>{t('view_all_packages', language)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Theme pill buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {THEMES_CONFIG.map(({ id, key, icon: Icon }) => {
            const isActive = activeTheme === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTheme(id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#84D175] text-[#1a2e1a] shadow-md shadow-[#84D175]/25 border border-[#67C456]'
                    : 'bg-white/80 text-[#2D6A24] border border-[#84D175]/30 hover:bg-[#84D175]/15 hover:border-[#84D175]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1a2e1a]' : 'text-[#3C8B30]'}`} />
                <span>{t(key, language)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Curated Package Grid (8 Featured Items) ── */}
      <div className="space-y-4">
        {curatedPackages.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-white/60 rounded-3xl border border-[#84D175]/30 p-6">
            <Compass className="w-8 h-8 text-[#3C8B30] mx-auto opacity-60" />
            <p className="text-sm font-bold text-[#1a2e1a]">No packages found for this theme filter.</p>
            <button
              onClick={() => setActiveTheme('all')}
              className="text-xs text-[#3C8B30] font-bold underline cursor-pointer"
            >
              Click "All Themes" to view all
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {curatedPackages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.package_id;
              const badge = THEME_BADGES[pkg.theme] || { labelKey: 'theme_all', bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' };
              const price = parseFloat(pkg.base_price || 32000) || 32000;
              const pkgCurrency = pkg.currency || 'INR';
              const CURRENCY_SYMBOLS = { INR: '₹', JPY: '¥', USD: '$', EUR: '€', GBP: '£', CHF: 'CHF ', AED: 'AED ', SGD: 'S$', THB: '฿' };
              const currencySymbol = CURRENCY_SYMBOLS[pkgCurrency] || `${pkgCurrency} `;
              const cityKey = (pkg.city_name || '').toLowerCase().trim();
              const nameKey = (pkg.name || '').toLowerCase();
              const cityImg = CITY_LANDMARK_IMAGES[cityKey] || Object.entries(CITY_LANDMARK_IMAGES).find(([k]) => cityKey.includes(k) || nameKey.includes(k))?.[1];

              const heroImg = (pkg.hero_image && (pkg.hero_image.startsWith('http') || pkg.hero_image.startsWith('/')))
                ? pkg.hero_image
                : (cityImg || THEME_FALLBACK_IMAGES[pkg.theme] || THEME_FALLBACK_IMAGES.adventure);
              const rawTitle = String(pkg.name || pkg.title || 'Tour Package');
              const displayTitle = rawTitle.replace(/[\ufffd\uFFFD\u2014\u2013\u2015]+/g, '—').replace(/^[—\-\s]+|[—\-\s]+$/g, '').trim();
              const tagsList = Array.isArray(pkg.tags)
                ? pkg.tags
                : (typeof pkg.tags === 'string' ? pkg.tags.split(',') : ['Customizable', 'Verified Hotels']);

              return (
                <div
                  key={pkg.package_id}
                  onClick={() => onSelectPackage(pkg.package_id)}
                  className={`group relative rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                    isSelected
                      ? 'border-[#84D175] bg-white ring-2 ring-[#84D175]/40 shadow-lg'
                      : 'border-[#84D175]/30 bg-white/80 hover:bg-white hover:border-[#84D175]'
                  }`}
                >
                  {/* Card Media Header */}
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={heroImg}
                      alt={pkg.hero_alt || displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Theme Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs ${badge.bg}`}>
                        {t(badge.labelKey, language)}
                      </span>
                    </div>

                    {/* City Location Tag */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center space-x-1 text-white text-xs font-bold drop-shadow">
                      <MapPin className="w-3.5 h-3.5 text-[#84D175]" />
                      <span>{pkg.city_name || 'India'}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white/90">
                    <div className="space-y-2">
                      <h3 className="font-bold text-[#1a2e1a] text-base leading-snug group-hover:text-[#3C8B30] transition-colors line-clamp-2">
                        {displayTitle}
                      </h3>
                      <div className="text-xs text-[#4a5e4a] font-medium">
                        {pkg.duration_days || 5} {t('days', language)} • {Math.max(1, (pkg.duration_days || 5) - 1)} {t('nights', language)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tagsList.map((tagItem, idx) => (
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
                          {currencySymbol}{price.toLocaleString('en-IN')}
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

        {/* Explore All 60+ Packages Catalog Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white/85 border border-[#84D175]/40 shadow-sm mt-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-[#1a2e1a]">{t('all_packages_title', language)}</h4>
            <p className="text-xs text-[#4a5e4a] font-medium">{t('all_packages_subtitle', language)}</p>
          </div>
          <button
            onClick={handleExplore}
            className="px-5 py-2.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <span>{t('browse_catalog_btn', language)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
