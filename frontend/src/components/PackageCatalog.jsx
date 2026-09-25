import React, { useState, useMemo } from 'react';
import {
  Clock, MapPin, Mountain, Heart, Landmark, Users, Castle,
  Compass, ArrowRight, Search, Filter, ArrowUpDown, ChevronRight, Check,
  Bot, ShieldCheck, Star, Globe, Plane
} from 'lucide-react';
import { t } from '../i18n';

const THEMES_CONFIG = [
  { id: 'all',        key: 'theme_all',        icon: Compass },
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
  wellness:   { labelKey: 'theme_all',        bg: 'bg-[#84D175] text-[#1a2e1a] font-bold' },
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
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80', // Taj Mahal
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80', // Red Fort / India Gate
  'new delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80', // Gateway of India
  gwalior: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=800&q=80', // Jai Vilas Palace & Fort
  jodhpur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80', // Mehrangarh Fort / Blue City
  hyderabad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/960px-Charminar_Hyderabad_1.jpg', // Charminar
  jaisalmer: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Jaisalmer_forteresse.jpg/960px-Jaisalmer_forteresse.jpg', // Jaisalmer Golden Fort
  leh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80', // Pangong Lake & Ladakh
  ladakh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80',
  jaipur: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/960px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg', // Hawa Mahal
  udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=800&q=80', // City Palace & Lake Pichola
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80', // Varanasi Ghats
  tirupati: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Tirumala_Venkateswara_Temple.jpg/960px-Tirumala_Venkateswara_Temple.jpg', // Tirupati Balaji Temple
  madurai: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Madurai_Meenakshi_Amman_temple_Gopuram.jpg/960px-Madurai_Meenakshi_Amman_temple_Gopuram.jpg', // Meenakshi Temple
  thanjavur: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Brihadisvara_Temple_Thanjavur.jpg/960px-Brihadisvara_Temple_Thanjavur.jpg', // Brihadeeswarar Temple
  lucknow: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Rumi_Darwaza_-_DSC2797-01.jpg/960px-Rumi_Darwaza_-_DSC2797-01.jpg', // Rumi Darwaza
  amritsar: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80', // Golden Temple
  shimla: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=800&q=80', // Shimla Hills & Ridge
  manali: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=800&q=80', // Solang Valley & Pines
  rishikesh: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80', // Ganga & Lakshman Jhula
  nainital: 'https://images.unsplash.com/photo-1626014303757-646654714152?auto=format&fit=crop&w=800&q=80', // Naini Lake
  srinagar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Dal_Lake_Hazratbal_Srinagar.jpg/960px-Dal_Lake_Hazratbal_Srinagar.jpg', // Dal Lake Shikara
  pune: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4d/Front_view_of_Shaniwar_Wada_illuminated.jpg/960px-Front_view_of_Shaniwar_Wada_illuminated.jpg', // Shaniwar Wada
  aurangabad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Ajanta_%2863%29.jpg/960px-Ajanta_%2863%29.jpg', // Ajanta & Ellora Caves
  ahmedabad: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Adalaj_stepwell_01.jpg/960px-Adalaj_stepwell_01.jpg', // Adalaj Stepwell
  bhuj: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/White_Rann_of_Kutch_Gujarat.jpg/960px-White_Rann_of_Kutch_Gujarat.jpg', // White Rann
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80', // Goa Beaches
  panaji: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', // Bangalore Palace
  mysuru: 'https://images.unsplash.com/photo-1600100397608-f010f4439066?auto=format&fit=crop&w=800&q=80', // Mysore Palace
  hampi: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg/960px-Wide_angle_of_Galigopuram_of_Virupaksha_Temple%2C_Hampi_%2804%29_%28cropped%29.jpg', // Virupaksha Temple & Stone Chariot
  gokarna: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', // Om Beach
  chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', // Marina Beach
  ooty: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', // Nilgiri Hills
  puducherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80', // Promenade & French Quarter
  pondicherry: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  kochi: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80', // Chinese Fishing Nets
  alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80', // Backwaters Houseboat
  munnar: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80', // Munnar Tea Gardens
  thiruvananthapuram: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/77/Sree_Padmanabhaswamy_Temple_Thiruvananthapuram.jpg/960px-Sree_Padmanabhaswamy_Temple_Thiruvananthapuram.jpg', // Padmanabhaswamy Temple
  wayanad: 'https://images.unsplash.com/photo-1616489953149-8d48f7601b31?auto=format&fit=crop&w=800&q=80', // Chembra Peak & Banasura
  chikmagalur: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=800&q=80', // Mullayanagiri
  coorg: 'https://images.unsplash.com/photo-1598894101832-61a7a02c3809?auto=format&fit=crop&w=800&q=80', // Abbey Falls
  visakhapatnam: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Dolphin%27s_nose_and_harbour_in_Visakhapatnam.jpg/960px-Dolphin%27s_nose_and_harbour_in_Visakhapatnam.jpg', // RK Beach & Dolphin Nose
  kolkata: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=800&q=80', // Victoria Memorial / Howrah Bridge
  darjeeling: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/DarjeelingTrainFruitshop_%282%29.jpg/960px-DarjeelingTrainFruitshop_%282%29.jpg', // Himalayan Toy Train
  puri: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Shri_Jagannath_temple.jpg/960px-Shri_Jagannath_temple.jpg', // Jagannath Temple
  bhubaneswar: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5d/Lingaraj_Temple_%2C_Bhubaneswar.jpg/960px-Lingaraj_Temple_%2C_Bhubaneswar.jpg', // Lingaraj Temple
  guwahati: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Kamakhya_Temple_Guwahati.jpg/960px-Kamakhya_Temple_Guwahati.jpg', // Kamakhya Temple
  shillong: 'https://images.unsplash.com/photo-1626014303757-646654714152?auto=format&fit=crop&w=800&q=80', // Umiam Lake & Hills
  gangtok: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Rumtek_Monastery_alias_Dharma_Chakra_Centre_near_Gangtok%2C_East_Sikkim_09.jpg/960px-Rumtek_Monastery_alias_Dharma_Chakra_Centre_near_Gangtok%2C_East_Sikkim_09.jpg', // Rumtek Monastery
  raipur: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Arieal_View_from_Maa_Bamleshwari_Devi_Temple_on_a_hilltop.JPG/960px-Arieal_View_from_Maa_Bamleshwari_Devi_Temple_on_a_hilltop.JPG', // Marine Drive & Chhattisgarh
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80', // Fushimi Inari Torii Gates
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', // Burj Khalifa
  'abu dhabi': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80', // Grand Mosque
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80', // Marina Bay Sands
  zurich: 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80', // Lake Zurich
  bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=800&q=80', // Wat Arun
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', // Ulun Danu
  kathmandu: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80', // Pashupatinath
  kandy: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4e/Temple_of_the_Tooth_%28Sri_Dalada_Maligawa%29.jpg/960px-Temple_of_the_Tooth_%28Sri_Dalada_Maligawa%29.jpg', // Temple of Tooth
  colombo: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d3/Colombo_Lotus_Tower_2022.jpg/960px-Colombo_Lotus_Tower_2022.jpg', // Colombo Lotus Tower
  doha: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80', // Museum of Islamic Art
  'kuala lumpur': 'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=800&q=80', // Petronas Towers
  thimphu: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80', // Buddha Dordenma
  male: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=80' // Maldives Overwater
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
                      {tagsList.map((tagItem, idx) => (
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
