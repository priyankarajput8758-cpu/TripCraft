import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { t } from '../i18n';

const THEMES_CONFIG = [
  { id: 'all',        key: 'theme_all' },
  { id: 'adventure',  key: 'theme_adventure' },
  { id: 'honeymoon',  key: 'theme_honeymoon' },
  { id: 'pilgrimage', key: 'theme_pilgrimage' },
  { id: 'family',     key: 'theme_family' },
  { id: 'heritage',   key: 'theme_heritage' },
];

const THEME_BADGES = {
  adventure:  { labelKey: 'theme_adventure',  bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' },
  honeymoon:  { labelKey: 'theme_honeymoon',  bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' },
  pilgrimage: { labelKey: 'theme_pilgrimage', bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' },
  family:     { labelKey: 'theme_family',     bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' },
  heritage:   { labelKey: 'theme_heritage',   bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' },
  wildlife:   { labelKey: 'theme_all',        bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' },
  food_trail: { labelKey: 'theme_all',        bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' },
  wellness:   { labelKey: 'theme_all',        bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' },
};

const THEME_FALLBACK_IMAGES = {
  adventure: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  honeymoon: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  pilgrimage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Shri_Jagannath_temple.jpg/960px-Shri_Jagannath_temple.jpg',
  family: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  heritage: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/960px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
  wildlife: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80',
  food_trail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
  wellness: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
};

const CITY_LANDMARK_IMAGES = {
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  'new delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  gwalior: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=800&q=80',
  jodhpur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
  hyderabad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/960px-Charminar_Hyderabad_1.jpg',
  jaisalmer: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Jaisalmer_forteresse.jpg/960px-Jaisalmer_forteresse.jpg',
  leh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
  ladakh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
  jaipur: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/960px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
  udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80',
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
  tirupati: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Tirumala_Venkateswara_Temple.jpg/960px-Tirumala_Venkateswara_Temple.jpg',
  madurai: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Madurai_Meenakshi_Amman_temple_Gopuram.jpg/960px-Madurai_Meenakshi_Amman_temple_Gopuram.jpg',
  thanjavur: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Brihadisvara_Temple_Thanjavur.jpg/960px-Brihadisvara_Temple_Thanjavur.jpg',
  lucknow: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Rumi_Darwaza_-_DSC2797-01.jpg/960px-Rumi_Darwaza_-_DSC2797-01.jpg',
  amritsar: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
  shimla: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=800&q=80',
  manali: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=800&q=80',
  rishikesh: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
  nainital: 'https://images.unsplash.com/photo-1626014303757-646654714152?auto=format&fit=crop&w=800&q=80',
  srinagar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg',
  pune: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Front_view_of_Shaniwar_Wada_illuminated.jpg/960px-Front_view_of_Shaniwar_Wada_illuminated.jpg',
  aurangabad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Ajanta_%2863%29.jpg/960px-Ajanta_%2863%29.jpg',
  ahmedabad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Adalaj_stepwell_01.jpg/960px-Adalaj_stepwell_01.jpg',
  bhuj: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/White_Rann_of_Kutch_Gujarat.jpg/960px-White_Rann_of_Kutch_Gujarat.jpg',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  panaji: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  mysuru: 'https://images.unsplash.com/photo-1600100397608-f010f4439066?auto=format&fit=crop&w=800&q=80',
  hampi: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/960px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg',
  gokarna: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  ooty: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  puducherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  pondicherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  kochi: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
  alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
  munnar: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  thiruvananthapuram: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Sree_Padmanabhaswamy_Temple_Thiruvananthapuram.jpg/960px-Sree_Padmanabhaswamy_Temple_Thiruvananthapuram.jpg',
  wayanad: 'https://images.unsplash.com/photo-1616489953149-8d48f7601b31?auto=format&fit=crop&w=800&q=80',
  chikmagalur: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80',
  coorg: 'https://images.unsplash.com/photo-1598894101832-61a7a02c3809?auto=format&fit=crop&w=800&q=80',
  visakhapatnam: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Dolphin%27s_nose_and_harbour_in_Visakhapatnam.jpg/960px-Dolphin%27s_nose_and_harbour_in_Visakhapatnam.jpg',
  kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80',
  darjeeling: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/DarjeelingTrainFruitshop_%282%29.jpg/960px-DarjeelingTrainFruitshop_%282%29.jpg',
  puri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Shri_Jagannath_temple.jpg/960px-Shri_Jagannath_temple.jpg',
  bhubaneswar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Lingaraj_Temple_%2C_Bhubaneswar.jpg/960px-Lingaraj_Temple_%2C_Bhubaneswar.jpg',
  guwahati: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Kamakhya_Temple_Guwahati.jpg/960px-Kamakhya_Temple_Guwahati.jpg',
  shillong: 'https://images.unsplash.com/photo-1626014303757-646654714152?auto=format&fit=crop&w=800&q=80',
  gangtok: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Rumtek_Monastery_alias_Dharma_Chakra_Centre_near_Gangtok%2C_East_Sikkim_09.jpg/960px-Rumtek_Monastery_alias_Dharma_Chakra_Centre_near_Gangtok%2C_East_Sikkim_09.jpg',
  raipur: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Arieal_View_from_Maa_Bamleshwari_Devi_Temple_on_a_hilltop.JPG/960px-Arieal_View_from_Maa_Bamleshwari_Devi_Temple_on_a_hilltop.JPG',
};

const HERO_TOURISM_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1920&q=85',
    tag: 'Coastal & Tropical Islands',
  },
  {
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1920&q=85',
    tag: 'Royal Heritage & Palaces',
  },
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
    tag: 'Himalayan Mountain Treks',
  },
  {
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=85',
    tag: 'Munnar & Tea Valleys',
  },
  {
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1920&q=85',
    tag: 'Spiritual Heritage & Ghats',
  },
  {
    url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1920&q=85',
    tag: 'Luxury Island Escapes',
  },
];

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
  const [heroImageIdx, setHeroImageIdx] = useState(0);

  // Rotate hero image every 10 seconds automatically
  React.useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIdx((prev) => (prev + 1) % HERO_TOURISM_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const filteredPackages = activeTheme === 'all'
    ? packages
    : packages.filter(p => p.theme === activeTheme || p.theme?.includes(activeTheme));

  const curatedPackages = filteredPackages.slice(0, 8);
  const handleExplore = onExploreCatalog || onStartBuild;

  return (
    <div className="space-y-10 animate-in">

      {/* ── 1. Top Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 shadow-xl border border-[#84D175]/35 min-h-[380px] sm:min-h-[440px] flex items-center">

        {/* 100% visible cross-fading hero images */}
        {HERO_TOURISM_IMAGES.map((img, idx) => (
          <div
            key={img.url}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
              idx === heroImageIdx
                ? 'opacity-100 scale-100 z-0'
                : 'opacity-0 scale-105 pointer-events-none -z-10'
            }`}
            style={{ backgroundImage: `url('${img.url}')` }}
          />
        ))}

        {/* Translucent Frosted Glass Card for Hero Content */}
        <div className="relative z-10 max-w-2xl bg-white/70 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-widest text-[#2D6A24]">
            Bespoke Holiday Architect
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#1a2e1a] tracking-tight leading-tight">
            {t('hero_headline', language)}
          </h1>

          <p className="text-sm sm:text-base text-[#1a2e1a] leading-relaxed font-medium">
            {t('hero_subheadline', language)}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExplore}
              className="px-6 py-3.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-sm sm:text-base transition-all shadow-md shadow-[#84D175]/25 active:scale-95 cursor-pointer"
            >
              {t('explore_packages', language)}
            </button>

            {onOpenAiBuild && (
              <button
                onClick={onOpenAiBuild}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/80 hover:bg-white text-[#1a2e1a] font-bold text-sm sm:text-base border border-[#84D175]/45 backdrop-blur-sm transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <Bot className="w-5 h-5 text-[#2D6A24]" />
                <span>{t('ai_trip_builder', language)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Slideshow Pill & Indicator Dots */}
        <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/25 text-white text-xs font-semibold shadow-lg">
          <span className="text-xs font-bold text-emerald-300">
            {HERO_TOURISM_IMAGES[heroImageIdx].tag}
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            {HERO_TOURISM_IMAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroImageIdx(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === heroImageIdx ? 'w-5 bg-[#84D175]' : 'w-2 bg-white/50 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Theme Filter Tabs ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a2e1a] tracking-tight">
              {t('curated_packages', language)}
            </h2>
            <p className="text-sm text-[#1a2e1a] font-medium">
              {t('curated_packages_sub', language)}
            </p>
          </div>

          {handleExplore && (
            <button
              onClick={handleExplore}
              className="text-xs sm:text-sm font-bold text-[#2D6A24] hover:text-[#1a2e1a] transition-all cursor-pointer"
            >
              {t('view_all_packages', language)} →
            </button>
          )}
        </div>

        {/* Theme pill buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {THEMES_CONFIG.map(({ id, key }) => {
            const isActive = activeTheme === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTheme(id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#84D175] text-[#1a2e1a] shadow-md shadow-[#84D175]/25 border border-[#67C456]'
                    : 'bg-white/60 backdrop-blur-sm text-[#1a2e1a] border border-[#84D175]/35 hover:bg-[#84D175]/20'
                }`}
              >
                {t(key, language)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Curated Package Grid (Translucent Frosted Cards) ── */}
      <div className="space-y-4">
        {curatedPackages.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-white/60 backdrop-blur-md rounded-3xl border border-[#84D175]/30 p-6">
            <p className="text-sm font-bold text-[#1a2e1a]">No packages found for this theme filter.</p>
            <button
              onClick={() => setActiveTheme('all')}
              className="text-xs sm:text-sm text-[#2D6A24] font-bold underline cursor-pointer"
            >
              Click "All Themes" to view all
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {curatedPackages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.package_id;
              const badge = THEME_BADGES[pkg.theme] || { labelKey: 'theme_all', bg: 'bg-[#84D175]/35 text-[#1a2e1a] font-bold border border-[#84D175]/50' };
              const price = parseFloat(pkg.base_price || 32000) || 32000;
              const pkgCurrency = pkg.currency || 'INR';
              const CURRENCY_SYMBOLS = { INR: '₹', JPY: '¥', USD: '$', EUR: '€', GBP: '£', CHF: 'CHF ', AED: 'AED ', SGD: 'S$', THB: '฿' };
              const currencySymbol = CURRENCY_SYMBOLS[pkgCurrency] || `${pkgCurrency} `;
              const cityKey = (pkg.city_name || '').toLowerCase().trim();
              const nameKey = (pkg.name || '').toLowerCase();
              const cityImg = CITY_LANDMARK_IMAGES[cityKey] || Object.entries(CITY_LANDMARK_IMAGES).find(([k]) => cityKey.includes(k) || nameKey.includes(k))?.[1];

              const heroImg = cityImg || (pkg.hero_image && !pkg.hero_image.includes('photo-1507525428034-b723cf961d3e') ? pkg.hero_image : null) || THEME_FALLBACK_IMAGES[pkg.theme] || THEME_FALLBACK_IMAGES.adventure;
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
                      ? 'border-[#84D175] bg-white/85 backdrop-blur-md ring-2 ring-[#84D175]/50 shadow-lg'
                      : 'border-[#84D175]/35 bg-white/60 backdrop-blur-md hover:bg-white/80 hover:border-[#84D175]'
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
                      <span className={`text-xs uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs ${badge.bg}`}>
                        {t(badge.labelKey, language)}
                      </span>
                    </div>

                    {/* City Location Tag */}
                    <div className="absolute bottom-2.5 left-2.5 text-white text-xs font-bold drop-shadow">
                      <span>{pkg.city_name || 'India'}</span>
                    </div>
                  </div>

                  {/* Card Body (Translucent Frosted Surface) */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-serif font-bold text-[#1a2e1a] text-lg leading-snug group-hover:text-[#2D6A24] transition-colors line-clamp-2">
                        {displayTitle}
                      </h3>
                      <div className="text-xs sm:text-sm text-[#1a2e1a] font-semibold">
                        {pkg.duration_days || 5} {t('days', language)} · {Math.max(1, (pkg.duration_days || 5) - 1)} {t('nights', language)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tagsList.map((tagItem, idx) => (
                          <span key={idx} className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFF8D2] text-[#2D6A24] border border-[#84D175]/40">
                            {tagItem}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#84D175]/25 space-y-2 mt-auto">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs uppercase tracking-wider text-[#1a2e1a] font-bold">
                          {t('starting_from', language)}
                        </span>
                        <span className="text-lg font-serif font-bold text-[#1a2e1a]">
                          {currencySymbol}{price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectPackage(pkg.package_id); }}
                        className="w-full py-2 px-3 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] text-xs sm:text-sm font-bold transition-all shadow-xs text-center cursor-pointer active:scale-[0.98]"
                      >
                        {t('customize_package', language)}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Explore All Packages Banner (Translucent Frosted Box) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white/60 backdrop-blur-md border border-[#84D175]/40 shadow-xs mt-4">
          <div className="space-y-0.5">
            <h4 className="text-base sm:text-lg font-serif font-bold text-[#1a2e1a]">{t('all_packages_title', language)}</h4>
            <p className="text-xs sm:text-sm text-[#1a2e1a] font-medium">{t('all_packages_subtitle', language)}</p>
          </div>
          <button
            onClick={handleExplore}
            className="px-5 py-2.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer shrink-0"
          >
            {t('browse_catalog_btn', language)}
          </button>
        </div>
      </div>
    </div>
  );
}
