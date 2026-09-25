import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { t } from '../i18n';
import {
  Compass,
  MapPin,
  Bot,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Building2,
  Zap,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Star,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Languages,
  ArrowRight,
  Check,
  Award,
  X,
  Eye,
  Info,
  Plus
} from 'lucide-react';

// Fix Leaflet marker icons in React/Vite bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

export default function DestinationExplorer({
  externalSupplyMode = true,
  onBookingComplete,
  initialState = null,
  preferredLanguage = 'en',
  onLanguageChange
}) {
  const [destinationQuery, setDestinationQuery] = useState(initialState?.destination || 'Chikmagalur');
  const [radiusMeters, setRadiusMeters] = useState(15000);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [categoriesSummary, setCategoriesSummary] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Selected spot modal state
  const [activeSpotModal, setActiveSpotModal] = useState(null);

  // Real-world hotels from SerpAPI
  const [liveHotels, setLiveHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Configuration for Day Matrix
  const [durationDays, setDurationDays] = useState(initialState?.duration || 3);
  const [pacePreference, setPacePreference] = useState('balanced');
  const [numTravelers, setNumTravelers] = useState(2);
  const [userCustomRequests, setUserCustomRequests] = useState(initialState?.customRequests || '');

  // Stay Selection Mode: 'same' (Single Stay Throughout) vs 'different' (Different Stays Per Day)
  const [stayMode, setStayMode] = useState('same');
  const [masterHotel, setMasterHotel] = useState({
    name: 'Cozy Hill Cottage (Standard)',
    price_per_night: 3500,
    type: 'standard'
  });
  const userSelectedHotelRef = useRef(false);
  const [heroImageIdx, setHeroImageIdx] = useState(0);

  // Rotate hero image every 10 seconds automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIdx((prev) => (prev + 1) % HERO_TOURISM_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);
  const [spotSearchTerms, setSpotSearchTerms] = useState({});

  // Day-wise matrix state: array of { day_number, selected_activities: [], selected_hotel: {} }
  const [dayMatrix, setDayMatrix] = useState([]);

  // Synthesized AI Result & Interactive Suggestions State
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizedTrip, setSynthesizedTrip] = useState(initialState?.customPackage || null);
  const [appliedSuggestions, setAppliedSuggestions] = useState({});

  // Translation state
  const [selectedLang, setSelectedLang] = useState(initialState?.language || preferredLanguage || 'en');
  const [translatedTripTitle, setTranslatedTripTitle] = useState(null);
  const [originalEnglishTrip, setOriginalEnglishTrip] = useState(initialState?.customPackage || null);
  const [translating, setTranslating] = useState(false);

  // Leaflet map refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Sync language with external parent prop
  useEffect(() => {
    if (preferredLanguage && preferredLanguage !== selectedLang) {
      setSelectedLang(preferredLanguage);
      if (synthesizedTrip) {
        handleTranslate(preferredLanguage);
      }
    }
  }, [preferredLanguage]);

  // Fetch authentic real-world place image for active modal spot (e.g. Bamleshwari Temple)
  useEffect(() => {
    if (activeSpotModal && !activeSpotModal.hasLoadedRealImage) {
      api.getSpotImage(activeSpotModal.name, activeSpotModal.category).then(res => {
        if (res && res.image_url) {
          setActiveSpotModal(prev => prev && prev.name === activeSpotModal.name ? {
            ...prev,
            image_url: res.image_url,
            hasLoadedRealImage: true
          } : prev);
        }
      }).catch(console.error);
    }
  }, [activeSpotModal?.name]);

  // Sync when initialState changes
  useEffect(() => {
    if (initialState) {
      const dest = initialState.destination || 'Chikmagalur';
      const dur = initialState.duration || 3;
      setDestinationQuery(dest);
      setDurationDays(dur);
      if (initialState.customRequests) {
        setUserCustomRequests(initialState.customRequests);
      }
      if (initialState.language) {
        setSelectedLang(initialState.language);
      }
      if (initialState.customPackage) {
        setSynthesizedTrip(initialState.customPackage);
        setOriginalEnglishTrip(initialState.customPackage);
        if (initialState.customPackage.itinerary && initialState.customPackage.itinerary.length > 0) {
          const preSelectedMatrix = initialState.customPackage.itinerary.map(dayItem => ({
            day_number: dayItem.day,
            selected_activities: (dayItem.slots || []).filter(s => s.type !== 'hotel' && s.type !== 'dining').map(s => s.title),
            selected_hotel: masterHotel
          }));
          setDayMatrix(preSelectedMatrix);
        }
      }
      handleExploreDestination(dest);
    }
  }, [initialState]);

  // Initialize Day Matrix whenever durationDays changes
  useEffect(() => {
    setDayMatrix(prev => {
      const updated = [];
      for (let i = 1; i <= durationDays; i++) {
        const existing = prev.find(d => d.day_number === i);
        if (existing) {
          updated.push({
            ...existing,
            selected_hotel: stayMode === 'same' ? masterHotel : existing.selected_hotel
          });
        } else {
          updated.push({
            day_number: i,
            selected_activities: [],
            selected_hotel: stayMode === 'same' ? masterHotel : {
              name: 'Cozy Hill Cottage (Standard)',
              price_per_night: 3500,
              type: 'standard'
            }
          });
        }
      }
      return updated;
    });
  }, [durationDays, stayMode, masterHotel]);

  // Initial explore on mount with initialState support
  useEffect(() => {
    const targetDest = initialState?.destination || destinationQuery || 'Chikmagalur';
    handleExploreDestination(targetDest);
  }, []);

  // Explore Destination API Call
  const handleExploreDestination = async (queryToSearch) => {
    const query = queryToSearch || destinationQuery;
    if (!query.trim()) return;

    setLoadingExplore(true);
    setSynthesizedTrip(null);
    userSelectedHotelRef.current = false;
    try {
      const res = await api.exploreDestination(query, radiusMeters);
      if (res && res.status === 'success') {
        setGeoData(res.destination);
        setAttractions(res.attractions || []);
        setCategoriesSummary(res.categories_summary || {});

        // Fetch Live Hotels via SerpAPI for this destination
        fetchLiveHotels(query);

        // Pre-populate Day matrix with attractions matching user theme/requests
        if (res.attractions && res.attractions.length > 0) {
          let candidateSpots = [...res.attractions];
          const reqKeywords = ((initialState?.customRequests || userCustomRequests || '') + ' ' + (initialState?.interests || '')).toLowerCase().split(/\s+/);
          const matchingKeywords = reqKeywords.filter(w => w.length > 3 && !['trip', 'tour', 'with', 'under', 'guide', 'days', 'package'].includes(w));

          if (matchingKeywords.length > 0) {
            candidateSpots.sort((a, b) => {
              const textA = ((a.name || '') + ' ' + (a.category || '') + ' ' + (a.kinds || '')).toLowerCase();
              const textB = ((b.name || '') + ' ' + (b.category || '') + ' ' + (b.kinds || '')).toLowerCase();
              const matchA = matchingKeywords.some(kw => textA.includes(kw));
              const matchB = matchingKeywords.some(kw => textB.includes(kw));
              if (matchA && !matchB) return -1;
              if (!matchA && matchB) return 1;
              return 0;
            });
          }

          const topSpots = candidateSpots.slice(0, 20).map(a => a.name);
          setDayMatrix(prev => {
            return prev.map((day, idx) => {
              const sliceStart = idx * 2;
              return {
                ...day,
                selected_activities: topSpots.slice(sliceStart, sliceStart + 2)
              };
            });
          });
        }
      }
    } catch (err) {
      console.error('Explore destination failed:', err);
    } finally {
      setLoadingExplore(false);
    }
  };

  // Fetch Live Google Hotels
  const fetchLiveHotels = async (cityName) => {
    setLoadingHotels(true);
    try {
      const res = await api.searchLiveHotels(cityName);
      const list = Array.isArray(res) ? res : (res?.hotels || res?.data || []);
      setLiveHotels(list);
      if (externalSupplyMode && list.length > 0 && !userSelectedHotelRef.current) {
        const topH = list[0];
        const rateNum = topH.rate_per_night || 3500;
        setMasterHotel({
          name: topH.name,
          price_per_night: rateNum,
          type: 'external_serpapi',
          link: topH.link
        });
      }
    } catch (err) {
      console.error('Error fetching live hotels:', err);
    } finally {
      setLoadingHotels(false);
    }
  };

  // When externalSupplyMode toggles, auto-select live Google hotel only if user has not picked a specific stay
  useEffect(() => {
    if (externalSupplyMode && liveHotels.length > 0 && !userSelectedHotelRef.current) {
      const topH = liveHotels[0];
      const rateNum = topH.rate_per_night || 3500;
      setMasterHotel({
        name: topH.name,
        price_per_night: rateNum,
        type: 'external_serpapi',
        link: topH.link
      });
      setDayMatrix(prev => prev.map(d => ({
        ...d,
        selected_hotel: {
          name: topH.name,
          price_per_night: rateNum,
          type: 'external_serpapi',
          link: topH.link
        }
      })));
    }
  }, [externalSupplyMode, liveHotels]);

  // Setup Leaflet Map whenever geoData or attractions update
  useEffect(() => {
    if (!mapRef.current || !geoData) return;

    const lat = geoData.lat || 13.3161;
    const lng = geoData.lng || 75.7720;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([lat, lng], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([lat, lng], 11);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Main Destination Hub Pin
    const hubIcon = L.divIcon({
      className: 'custom-hub-pin',
      html: `<div style="background-color: #0d9488; color: white; font-weight: bold; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); font-size: 15px;">📍</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    const hubMarker = L.marker([lat, lng], { icon: hubIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${geoData.name}</b><br/><span style="color:#64748b; font-size:11px;">Central Gathering Hub</span>`)
      .openPopup();
    markersRef.current.push(hubMarker);

    // Add attraction pins
    attractions.forEach(att => {
      if (att.lat && att.lng) {
        let color = '#f59e0b'; // default amber
        if (att.category === 'Temple & Spiritual') color = '#ec4899';
        else if (att.category === 'Heritage & Architecture') color = '#8b5cf6';
        else if (att.category === 'Nature & Scenic') color = '#10b981';
        else if (att.category === 'Museum & Culture') color = '#3b82f6';

        const marker = L.circleMarker([att.lat, att.lng], {
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="font-size: 12px; line-height: 1.3;">
              <b style="color: #047857; font-size: 13px;">${att.name}</b><br/>
              <span style="color: #6366f1; font-weight:600; font-size: 10px;">${att.category}</span><br/>
              <span style="color: #d97706; font-size: 11px;">📍 ${att.dist_formatted || att.dist_meters + 'm'} from center</span>
            </div>
          `);

        marker.on('click', () => {
          setActiveSpotModal(att);
        });

        markersRef.current.push(marker);
      }
    });
  }, [geoData, attractions]);

  // Toggle activity checkbox for a given day
  const handleToggleActivity = (dayNum, activityName) => {
    setDayMatrix(prev => {
      return prev.map(d => {
        if (d.day_number === dayNum) {
          const current = d.selected_activities || [];
          const exists = current.includes(activityName);
          const updated = exists
            ? current.filter(item => item !== activityName)
            : [...current, activityName];
          return { ...d, selected_activities: updated };
        }
        return d;
      });
    });
  };

  // Add activity to a specific day from Spot Card Modal
  const handleAddActivityFromModal = (dayNum, activityName) => {
    handleToggleActivity(dayNum, activityName);
  };

  // Select master hotel (applies to all days in 'same' stay mode)
  const handleSelectMasterHotel = (hotelObj) => {
    userSelectedHotelRef.current = true;
    setMasterHotel(hotelObj);
    setDayMatrix(prev => prev.map(d => ({ ...d, selected_hotel: hotelObj })));
  };

  // Select hotel radio button for a given day (in 'different' stay mode)
  const handleSelectHotel = (dayNum, hotelObj) => {
    setDayMatrix(prev => {
      return prev.map(d => {
        if (d.day_number === dayNum) {
          return { ...d, selected_hotel: hotelObj };
        }
        return d;
      });
    });
  };

  // Interactive AI Suggestion Handlers
  const handleApplyConflictResolution = (conflictIndex, text) => {
    setAppliedSuggestions(prev => ({ ...prev, [`conflict_${conflictIndex}`]: true }));
    // Update itinerary timeline slots live to shift evening slot to 6:00 PM
    if (synthesizedTrip?.itinerary) {
      const updatedItinerary = synthesizedTrip.itinerary.map(dayObj => ({
        ...dayObj,
        slots: dayObj.slots?.map(slot => {
          if (slot.time?.includes('04:30 PM') || slot.time?.includes('03:30 PM')) {
            return { ...slot, time: '06:00 PM', title: `${slot.title} (Optimized Timing)` };
          }
          return slot;
        })
      }));
      setSynthesizedTrip(prev => ({
        ...prev,
        itinerary: updatedItinerary
      }));
    }
  };

  const handleApplyVoidFill = (voidIndex, text) => {
    setAppliedSuggestions(prev => ({ ...prev, [`void_${voidIndex}`]: true }));
  };

  const handleApplyCostOptimization = () => {
    setAppliedSuggestions(prev => ({ ...prev, 'cost_optimization': true }));
    // Actively apply hotel rate / date shift optimization (e.g. 20% savings on hotel total and recalculate grand total)
    if (synthesizedTrip?.estimated_pricing) {
      const baseHotel = parseFloat(synthesizedTrip.estimated_pricing.unoptimized_hotel || synthesizedTrip.estimated_pricing.hotel_total || '14000.00');
      const optimizedHotel = Math.max(0, baseHotel * 0.80);
      const actTotal = parseFloat(synthesizedTrip.estimated_pricing.activities_total || '9000.00');
      const transferTotal = parseFloat(synthesizedTrip.estimated_pricing.transfers_total || '4200.00');
      const guideTotal = parseFloat(synthesizedTrip.estimated_pricing.guide_total || '0.00');
      const subtotal = optimizedHotel + actTotal + transferTotal + guideTotal;
      const gst = subtotal * 0.05;
      const newGrand = subtotal + gst;

      setSynthesizedTrip(prev => ({
        ...prev,
        estimated_pricing: {
          ...prev.estimated_pricing,
          unoptimized_hotel: baseHotel.toFixed(2),
          hotel_total: optimizedHotel.toFixed(2),
          gst_tax: gst.toFixed(2),
          grand_total: newGrand.toFixed(2),
          discount_applied: (baseHotel - optimizedHotel).toFixed(2)
        }
      }));
    }
  };

  // Trigger Gemini Custom Itinerary Synthesizer
  const handleSynthesizeCustomTrip = async () => {
    setSynthesizing(true);
    setTranslatedTripTitle(null);
    setAppliedSuggestions({});
    try {
      const payload = {
        destination_name: geoData?.name || destinationQuery,
        duration_days: durationDays,
        pace_preference: pacePreference,
        day_selections: dayMatrix,
        external_supply_mode: externalSupplyMode,
        lat: geoData?.lat,
        lng: geoData?.lng,
        user_custom_requests: userCustomRequests.trim() || undefined,
        num_travelers: numTravelers
      };

      const res = await api.synthesizeCustomTrip(payload);
      if (res && res.status === 'success') {
        setSynthesizedTrip(res.custom_package);
        setOriginalEnglishTrip(res.custom_package);
        setTranslatedTripTitle(null);
        // Scroll smoothly to generated itinerary
        setTimeout(() => {
          const el = document.getElementById('custom-itinerary-output');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      }
    } catch (err) {
      console.error('Synthesis error:', err);
    } finally {
      setSynthesizing(false);
    }
  };

  // Translate complete synthesized itinerary (trip title, day titles, slot descriptions, notes, and tips)
  const handleTranslate = async (langCode) => {
    setSelectedLang(langCode);
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
    if (!synthesizedTrip) return;
    if (langCode === 'en') {
      if (originalEnglishTrip) {
        setSynthesizedTrip(originalEnglishTrip);
      }
      setTranslatedTripTitle(null);
      return;
    }
    setTranslating(true);
    try {
      if (!originalEnglishTrip) {
        setOriginalEnglishTrip(synthesizedTrip);
      }
      const baseTrip = originalEnglishTrip || synthesizedTrip;
      const res = await api.translateItinerary(baseTrip, langCode);
      if (res && res.status === 'success' && res.custom_package) {
        setSynthesizedTrip(res.custom_package);
        setTranslatedTripTitle(res.custom_package.trip_title);
      }
    } catch (err) {
      console.error('Translation failed:', err);
    } finally {
      setTranslating(false);
    }
  };

  // Filtered attractions list
  const filteredAttractions = attractions.filter(item => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'temple' && item.category === 'Temple & Spiritual') return true;
    if (selectedCategory === 'heritage' && item.category === 'Heritage & Architecture') return true;
    if (selectedCategory === 'nature' && item.category === 'Nature & Scenic') return true;
    if (selectedCategory === 'culture' && item.category === 'Museum & Culture') return true;
    return false;
  });

  return (
    <div className="space-y-8 animate-fadeIn w-full max-w-7xl mx-auto">
      {/* Hero Search & Geocoding Bar with 10s Rotating Background Images */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 shadow-xl border border-[#84D175]/40 text-[#1a2e1a] min-h-[320px] flex items-center">
        
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

        {/* Translucent Frosted Glass Card */}
        <div className="relative z-10 w-full bg-white/80 backdrop-blur-md border border-[#84D175]/45 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-3.5 py-1 rounded-full bg-[#84D175]/30 text-[#2D6A24] border border-[#84D175]/45 text-xs sm:text-sm font-bold flex items-center gap-1.5 backdrop-blur-sm">
                  <Bot className="w-4 h-4 text-[#2D6A24]" />
                  Autonomous Custom Package Engine
                </span>
                <span className="text-xs font-bold text-[#2D6A24] bg-white/80 px-3 py-1 rounded-full border border-[#84D175]/35 hidden sm:inline-block">
                  {HERO_TOURISM_IMAGES[heroImageIdx].tag}
                </span>
                {externalSupplyMode && (
                  <span className="px-3 py-1 rounded-full bg-amber-400/30 text-amber-900 border border-amber-400/50 text-xs sm:text-sm font-bold flex items-center">
                    Live Google Hotels Active
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1a2e1a] tracking-tight break-words">
                {t('custom_architect_title', selectedLang)}
              </h2>
              <p className="text-sm sm:text-base text-[#1a2e1a] max-w-2xl leading-relaxed font-medium break-words">
                {t('custom_architect_desc', selectedLang)}
              </p>
            </div>
          </div>

          {/* Input & Radius Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExploreDestination();
            }}
            className="flex flex-col sm:flex-row gap-3 pt-1"
          >
            <div className="relative flex-1">
              <MapPin className="w-5 h-5 text-[#2D6A24] absolute left-4 top-3.5" />
              <input
                type="text"
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                placeholder="Enter destination (e.g. Chikmagalur, Ooty, Coorg, Wayanad)..."
                className="w-full bg-white border border-[#84D175]/45 text-[#1a2e1a] rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20 placeholder:text-[#1a2e1a]/40 font-bold shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                className="bg-white border border-[#84D175]/45 text-[#1a2e1a] text-xs sm:text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:border-[#84D175] cursor-pointer shadow-xs"
              >
                <option value={15000} className="text-[#1a2e1a] font-bold">15 km (City & Core Hub)</option>
                <option value={30000} className="text-[#1a2e1a] font-bold">30 km (Suburbs & Hilltops)</option>
                <option value={50000} className="text-[#1a2e1a] font-bold">50 km (Regional Excursion)</option>
                <option value={90000} className="text-[#1a2e1a] font-bold">90 km (Full 90km Exploration)</option>
              </select>

              <button
                type="submit"
                disabled={loadingExplore}
                className="px-6 py-3.5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-sm sm:text-base rounded-2xl transition-all shadow-md shadow-[#84D175]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
              >
                {loadingExplore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#1a2e1a]" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-5 h-5 text-[#1a2e1a]" />
                    <span>Discover Spots</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Destination Discovery Status Pill */}
          {geoData && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#84D175]/30 text-sm font-bold text-[#1a2e1a]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A24] animate-ping" />
                <span className="font-bold text-[#1a2e1a]">Geocoded Location:</span>
                <span className="text-[#2D6A24] font-bold">{geoData.display_name || geoData.name}</span>
                <span className="text-[#1a2e1a]/70 font-mono">({geoData.lat?.toFixed(4)}, {geoData.lng?.toFixed(4)})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-[#84D175]/30 text-[#2D6A24] border border-[#84D175]/40 font-mono font-bold">
                  {attractions.length} Tourist Landmarks Discovered (within {radiusMeters / 1000}km)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map & Tourist Spots Discovery Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leaflet Map Column */}
        <div className="lg:col-span-7 bg-white/95 border border-[#84D175]/35 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between text-[#1a2e1a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#84D175]/30 pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-5 h-5 text-[#2D6A24]" />
              <h3 className="text-sm font-black text-[#1a2e1a]">
                {t('interactive_map_title', selectedLang)}
              </h3>
            </div>
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1 text-[11px]">
              {[
                { id: 'all', label: 'All' },
                { id: 'temple', label: 'Spiritual' },
                { id: 'heritage', label: 'Heritage' },
                { id: 'nature', label: 'Nature' },
                { id: 'culture', label: 'Culture' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs'
                      : 'bg-slate-100 text-[#4a5e4a] hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div
            ref={mapRef}
            className="w-full h-80 rounded-2xl overflow-hidden border border-[#84D175]/30 shadow-inner z-0"
            style={{ minHeight: '360px' }}
          />

          <div className="text-[11px] text-[#4a5e4a] flex items-center justify-between pt-1 font-medium">
            <span>Powered by OpenStreetMap + OpenTripMap Live POIs (Click spot pin for details)</span>
            <span className="text-[#2D6A24] font-bold font-mono">Showing {filteredAttractions.length} spots</span>
          </div>
        </div>

        {/* Tourist Spots Directory Column */}
        <div className="lg:col-span-5 bg-white/95 border border-[#84D175]/35 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col text-[#1a2e1a]">
          <div className="flex items-center justify-between border-b border-[#84D175]/30 pb-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-[#2D6A24]" />
              <h3 className="text-sm font-black text-[#1a2e1a]">
                {t('discovered_attractions_heading', selectedLang)}
              </h3>
            </div>
            <span className="text-[11px] text-[#4a5e4a] font-medium">
              {t('click_spot_inspect_add', selectedLang)}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1">
            {filteredAttractions.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#4a5e4a]">
                No spots found in this category. Expand radius or select "All".
              </div>
            ) : (
              filteredAttractions.map((spot, idx) => {
                const distText = spot.dist_formatted || (spot.dist_meters ? (spot.dist_meters >= 1000 ? (spot.dist_meters / 1000).toFixed(1) + ' km' : spot.dist_meters + ' m') : 'Nearby');
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setActiveSpotModal(spot);
                      if (mapInstanceRef.current && spot.lat && spot.lng) {
                        mapInstanceRef.current.flyTo([spot.lat, spot.lng], 14, { duration: 1.0 });
                      }
                    }}
                    className="p-3 bg-slate-50/80 hover:bg-[#FFF8D2]/40 border border-slate-200 hover:border-[#84D175] rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 group shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#1a2e1a] group-hover:text-[#2D6A24] truncate">
                        {spot.name}
                      </div>
                      <div className="text-[10px] text-[#4a5e4a] flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#84D175]/15 text-[#2D6A24] font-bold">
                          {spot.category}
                        </span>
                        <span>📍 {distText}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-1">
                      <Eye className="w-3.5 h-3.5 text-[#4a5e4a] group-hover:text-[#2D6A24]" />
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2D6A24] transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Spot Detail Modal Card */}
      {activeSpotModal && (
        <div className="fixed inset-0 z-50 bg-[#0C2D45]/70 backdrop-blur-md flex items-center justify-center p-4 animate-in">
          <div className="bg-white border border-[#84D175]/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 text-[#1a2e1a]">
            {/* Modal Image Hero */}
            <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
              <img
                src={activeSpotModal.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'}
                alt={activeSpotModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              <button
                onClick={() => setActiveSpotModal(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="px-2.5 py-0.5 rounded-full bg-[#84D175] text-[#1a2e1a] text-[10px] font-extrabold uppercase tracking-wider">
                  {activeSpotModal.category}
                </span>
                <h3 className="text-lg font-black text-white truncate mt-1">
                  {activeSpotModal.name}
                </h3>
              </div>
            </div>

            {/* Modal Content & Distance */}
            <div className="p-5 space-y-4 pt-0">
              <div className="flex items-center justify-between text-xs text-[#1a2e1a] bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5 text-[#2D6A24] font-semibold">
                  <MapPin className="w-4 h-4 text-[#2D6A24] shrink-0" />
                  <span>Distance: {activeSpotModal.dist_formatted || (activeSpotModal.dist_meters ? (activeSpotModal.dist_meters >= 1000 ? (activeSpotModal.dist_meters / 1000).toFixed(1) + ' km' : activeSpotModal.dist_meters + ' m') : 'Central Hub')}</span>
                </div>
                {activeSpotModal.lat && activeSpotModal.lng && (
                  <span className="font-mono text-[11px] text-slate-500">
                    ({activeSpotModal.lat.toFixed(4)}, {activeSpotModal.lng.toFixed(4)})
                  </span>
                )}
              </div>

              <p className="text-xs text-[#4a5e4a] leading-relaxed">
                {activeSpotModal.short_desc || `Explore ${activeSpotModal.name}, a distinguished ${activeSpotModal.category?.toLowerCase() || 'attraction'} in the region.`}
              </p>

              {/* Quick Add to Day Matrix Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#84D175]/20">
                <span className="text-[11px] font-bold text-[#4a5e4a] uppercase tracking-wider block">
                  Quick Add to Itinerary Matrix:
                </span>
                <div className="flex flex-wrap gap-2">
                  {dayMatrix.map((day) => {
                    const isAdded = day.selected_activities.includes(activeSpotModal.name);
                    return (
                      <button
                        key={day.day_number}
                        onClick={() => handleAddActivityFromModal(day.day_number, activeSpotModal.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isAdded
                            ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs font-black'
                            : 'bg-white text-[#4a5e4a] hover:bg-[#FFF8D2] hover:text-[#1a2e1a] border border-[#84D175]/30'
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Day {day.day_number}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setActiveSpotModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#1a2e1a] hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer mt-2"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day-Wise Multi-Select Experience Matrix Studio */}
      <div className="bg-white/95 border border-[#84D175]/35 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm text-[#1a2e1a]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#84D175]/30 pb-5">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-[#1a2e1a] flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#2D6A24]" />
              {t('day_wise_matrix_title', selectedLang)}
            </h3>
            <p className="text-sm text-[#4a5e4a] font-medium">
              {t('day_wise_matrix_sub', selectedLang)}
            </p>
          </div>

          {/* Duration, Party Size & Pace Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Party Size Selector */}
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-[#84D175]/40 shadow-2xs">
              <span className="text-xs font-bold text-[#4a5e4a]">Travelers:</span>
              <select
                value={numTravelers}
                onChange={(e) => setNumTravelers(Number(e.target.value))}
                className="bg-white border border-[#84D175]/30 text-xs font-bold text-[#1a2e1a] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value={1} className="text-[#1a2e1a] font-bold">1 Person (Solo)</option>
                <option value={2} className="text-[#1a2e1a] font-bold">2 Persons (Couple/Twin)</option>
                <option value={3} className="text-[#1a2e1a] font-bold">3 Persons (Triple)</option>
                <option value={4} className="text-[#1a2e1a] font-bold">4 Persons (Family/Group)</option>
                <option value={6} className="text-[#1a2e1a] font-bold">6 Persons (Large Group)</option>
              </select>
            </div>

            {/* Duration Selector */}
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-[#84D175]/40 shadow-2xs">
              <span className="text-xs font-bold text-[#4a5e4a]">Duration:</span>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="bg-white border border-[#84D175]/30 text-xs font-bold text-[#1a2e1a] rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value={1} className="text-[#1a2e1a] font-bold">1 Day (Express)</option>
                <option value={2} className="text-[#1a2e1a] font-bold">2 Days (Weekend)</option>
                <option value={3} className="text-[#1a2e1a] font-bold">3 Days (Standard)</option>
                <option value={4} className="text-[#1a2e1a] font-bold">4 Days (Extended)</option>
                <option value={5} className="text-[#1a2e1a] font-bold">5 Days (Complete)</option>
                <option value={6} className="text-[#1a2e1a] font-bold">6 Days</option>
                <option value={7} className="text-[#1a2e1a] font-bold">7 Days (Grand)</option>
              </select>
            </div>

            {/* Pace Selector */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              {[
                { id: 'relaxed', label: t('relaxed_pace', selectedLang) },
                { id: 'balanced', label: t('balanced_pace', selectedLang) },
                { id: 'packed', label: t('fast_pace', selectedLang) }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPacePreference(p.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer truncate max-w-[130px] text-center ${
                    pacePreference === p.id
                      ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs font-black'
                      : 'text-[#4a5e4a] hover:text-[#1a2e1a]'
                  }`}
                  title={p.label}
                >
                  <span className="truncate block">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MASTER STAY SELECTOR & RADIO TOGGLE ── */}
        <div className="bg-[#FFF8D2]/40 border border-[#84D175]/35 rounded-2xl p-5 space-y-4 shadow-2xs text-[#1a2e1a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#2D6A24]" />
              <h4 className="text-sm font-black text-[#1a2e1a]">
                Accommodation Preference Across All Days
              </h4>
            </div>

            {/* Radio Toggle: Same Stay Throughout vs Different Stays */}
            <div className="flex items-center space-x-4 bg-white p-2 rounded-xl border border-[#84D175]/30 text-xs font-bold text-[#1a2e1a] shadow-2xs">
              <label className="flex items-center space-x-2 cursor-pointer text-[#1a2e1a] hover:text-[#2D6A24]">
                <input
                  type="radio"
                  name="stay_mode"
                  value="same"
                  checked={stayMode === 'same'}
                  onChange={() => setStayMode('same')}
                  className="accent-[#2D6A24] w-4 h-4 cursor-pointer"
                />
                <span>Same Stay Throughout Trip</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer text-[#1a2e1a] hover:text-[#2D6A24]">
                <input
                  type="radio"
                  name="stay_mode"
                  value="different"
                  checked={stayMode === 'different'}
                  onChange={() => setStayMode('different')}
                  className="accent-[#2D6A24] w-4 h-4 cursor-pointer"
                />
                <span>Different Stays Per Day</span>
              </label>
            </div>
          </div>

          {/* Master Hotel Selector (Rendered when stayMode === 'same') */}
          {stayMode === 'same' ? (
            <div className="space-y-2 pt-2 border-t border-[#84D175]/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D6A24] uppercase tracking-wider">
                  {t('select_master_stay', selectedLang).replace('{days}', durationDays)}
                </span>
                <span className="text-[11px] bg-[#84D175]/20 text-[#2D6A24] px-2 py-0.5 rounded border border-[#84D175]/40 font-bold">
                  🔒 Individual day stays locked
                </span>
              </div>

              {/* Master Hotel Options */}
              {externalSupplyMode && liveHotels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {liveHotels.slice(0, 4).map((h, idx) => {
                    const isSelected = masterHotel.name === h.name;
                    const rateNum = h.rate_per_night || 4500;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectMasterHotel({
                          name: h.name,
                          price_per_night: rateNum,
                          type: 'external_serpapi',
                          link: h.link
                        })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50/80 border-2 border-amber-500 text-[#1a2e1a] font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-[#1a2e1a] hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="text-xs font-bold text-[#1a2e1a] line-clamp-1">{h.name}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                        </div>
                        <div className="flex items-baseline justify-between text-[11px]">
                          <span className="text-[#4a5e4a] font-medium">Live Google Rate:</span>
                          <span className="text-amber-800 font-mono font-black">₹{parseFloat(rateNum).toLocaleString('en-IN')}/night</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Cozy Hill Cottage (Standard)', price_per_night: 3500, type: 'standard' },
                    { name: 'Luxury Coffee Estate Resort', price_per_night: 7500, type: 'luxury' },
                    { name: 'Eco Nature Homestay (Budget)', price_per_night: 2200, type: 'budget' }
                  ].map((tier, idx) => {
                    const isSelected = masterHotel.name === tier.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectMasterHotel(tier)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#84D175]/20 border-2 border-[#2D6A24] text-[#1a2e1a] font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-[#1a2e1a] hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-[#1a2e1a]">{tier.name}</div>
                          <div className="text-[11px] text-[#4a5e4a] mt-0.5">Applies to all nights</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[#2D6A24] font-mono font-black text-xs">
                            ₹{tier.price_per_night.toLocaleString('en-IN')}/night
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2D6A24] shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#4a5e4a] italic pt-1 font-medium">
              ✓ Different stays mode active: Select custom hotels per day in the matrix cards below.
            </div>
          )}
        </div>

        {/* ── CUSTOM USER PREFERENCE & TIMING PROMPT INPUT ── */}
        <div className="bg-slate-50 border border-[#84D175]/30 rounded-2xl p-4 space-y-2 text-[#1a2e1a]">
          <label className="flex items-center space-x-2 text-xs font-bold text-[#1a2e1a] uppercase tracking-wider">
            <Clock className="w-4 h-4 text-[#2D6A24]" />
            <span>{t('custom_scheduling_label', selectedLang)}</span>
          </label>
          <div className="relative">
            <textarea
              value={userCustomRequests}
              onChange={(e) => setUserCustomRequests(e.target.value)}
              rows={2}
              placeholder="e.g., 'I want to visit Mullayanagiri Peak specifically for sunset on Day 2', or 'Keep mornings relaxed with coffee tastings before 11 AM'..."
              className="w-full bg-white border border-[#84D175]/40 rounded-xl p-3 text-xs text-[#1a2e1a] placeholder:text-slate-400 focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20 font-medium"
            />
          </div>
        </div>

        {/* Matrix Grid: Render cards for Day 1..N */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dayMatrix.map((day) => {
            const dayNum = day.day_number;
            const currentActs = day.selected_activities || [];
            const selectedHotel = day.selected_hotel;

            return (
              <div
                key={dayNum}
                className="bg-white border border-[#84D175]/35 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-[#84D175] transition-all shadow-xs text-[#1a2e1a]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#84D175]/25 pb-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#84D175]/20 text-[#2D6A24] font-extrabold text-xs font-mono">
                      DAY {dayNum}
                    </span>
                    <span className="text-[11px] text-[#4a5e4a] font-mono font-bold">
                      {currentActs.length} Selected
                    </span>
                  </div>

                  {/* Multi-Select Checkboxes for Experiences */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#4a5e4a] uppercase tracking-wider block">
                        Experiences & Spots ({attractions.length} Available):
                      </span>
                    </div>

                    {attractions.length > 8 && (
                      <input
                        type="text"
                        placeholder={`Search ${attractions.length} spots for Day ${dayNum}...`}
                        value={spotSearchTerms[dayNum] || ''}
                        onChange={(e) => setSpotSearchTerms(prev => ({ ...prev, [dayNum]: e.target.value }))}
                        className="w-full text-[11px] px-2.5 py-1 rounded-lg border border-[#84D175]/30 bg-slate-50 text-[#1a2e1a] placeholder:text-slate-400 focus:outline-none focus:border-[#84D175]"
                      />
                    )}

                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {attractions.length === 0 ? (
                        <div className="text-[11px] text-[#4a5e4a] italic py-2">
                          Discovering local attractions...
                        </div>
                      ) : (
                        attractions
                          .filter(spot => {
                            const term = (spotSearchTerms[dayNum] || '').toLowerCase().trim();
                            if (!term) return true;
                            return (spot.name || '').toLowerCase().includes(term) || (spot.category && spot.category.toLowerCase().includes(term));
                          })
                          .map((spot, i) => {
                            const isChecked = currentActs.includes(spot.name);
                            return (
                              <div
                                key={i}
                                onClick={() => handleToggleActivity(dayNum, spot.name)}
                                className={`p-2 rounded-xl text-xs flex items-center space-x-2.5 cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-[#84D175]/25 border border-[#84D175] text-[#1a2e1a] font-bold'
                                    : 'bg-slate-50/80 border border-slate-200 text-[#1a2e1a] hover:bg-[#FFF8D2]/40'
                                }`}
                              >
                                <div className="shrink-0 text-[#2D6A24]">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 fill-[#84D175] text-[#1a2e1a]" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                                <span className="truncate flex-1 font-medium">{spot.name}</span>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Radio Buttons for Stay / Hotel (Locked if stayMode === 'same') */}
                  <div className="space-y-2 pt-2 border-t border-[#84D175]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#4a5e4a] uppercase tracking-wider">
                        Night {dayNum} Stay:
                      </span>
                      {stayMode === 'same' && (
                        <span className="text-[10px] bg-[#84D175]/20 text-[#2D6A24] px-1.5 py-0.5 rounded font-mono font-bold">
                          Locked (Same Stay)
                        </span>
                      )}
                    </div>

                    {stayMode === 'same' ? (
                      <div className="p-2.5 bg-[#FFF8D2]/40 border border-[#84D175]/30 rounded-xl text-xs flex items-center justify-between text-[#1a2e1a]">
                        <span className="truncate font-semibold">{masterHotel?.name || 'Selected Master Stay'}</span>
                        <span className="text-[#2D6A24] font-mono font-bold shrink-0 ml-2">
                          ₹{masterHotel?.price_per_night?.toLocaleString('en-IN')}/nt
                        </span>
                      </div>
                    ) : (
                      /* If External Supply Mode is enabled and live hotels exist */
                      externalSupplyMode && liveHotels.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {liveHotels.slice(0, 4).map((h, hIdx) => {
                            const isSelected = selectedHotel?.name === h.name;
                            const rateNum = h.rate_per_night || 4500;
                            return (
                              <div
                                key={hIdx}
                                onClick={() => handleSelectHotel(dayNum, {
                                  name: h.name,
                                  price_per_night: rateNum,
                                  type: 'external_serpapi',
                                  link: h.link
                                })}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
                                  isSelected
                                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                                    : 'bg-white border-slate-200 text-[#1a2e1a] hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className="truncate font-semibold text-[#1a2e1a]">{h.name}</span>
                                </div>
                                <span className="font-mono text-amber-800 text-[11px] shrink-0 font-bold">
                                  ₹{parseFloat(rateNum).toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Default Standard Tiers
                        <div className="space-y-1.5">
                          {[
                            { name: 'Cozy Hill Cottage (Standard)', price_per_night: 3500, type: 'standard' },
                            { name: 'Luxury Coffee Estate Resort', price_per_night: 7500, type: 'luxury' },
                            { name: 'Eco Nature Homestay (Budget)', price_per_night: 2200, type: 'budget' }
                          ].map((tier, tIdx) => {
                            const isSelected = selectedHotel?.name === tier.name;
                            return (
                              <div
                                key={tIdx}
                                onClick={() => handleSelectHotel(dayNum, tier)}
                                className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
                                  isSelected
                                    ? 'bg-[#84D175]/25 border-[#84D175] text-[#1a2e1a] font-bold'
                                    : 'bg-white border-slate-200 text-[#1a2e1a] hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? 'border-[#2D6A24] bg-[#2D6A24]' : 'border-slate-300'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                  <span className="truncate font-medium text-[#1a2e1a]">{tier.name}</span>
                                </div>
                                <span className="font-mono text-[#2D6A24] text-[11px] shrink-0 font-bold">
                                  ₹{tier.price_per_night.toLocaleString('en-IN')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Synthesize Action Banner */}
        <div className="bg-[#0C2D45] border border-[#84D175]/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl text-[#FFF8D2]">
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#84D175] shrink-0" />
              <span className="break-words">{t('ready_synthesize_heading', selectedLang)}</span>
            </h4>
            <p className="text-xs text-[#D3E8D0] break-words">
              {t('gemini_resolve_clashes', selectedLang).replace('{travelers}', numTravelers)}
            </p>
          </div>

          <button
            onClick={handleSynthesizeCustomTrip}
            disabled={synthesizing}
            className="px-6 py-3.5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs sm:text-sm rounded-xl transition-all shadow-xl shadow-[#84D175]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0 self-stretch sm:self-center"
          >
            {synthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#1a2e1a]" />
                <span>{t('synthesizing_itinerary', selectedLang)}</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-[#1a2e1a]" />
                <span>{t('synthesize_itinerary', selectedLang)}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated Custom Package Output Section */}
      {synthesizedTrip && (
        <div
          id="custom-itinerary-output"
          className="bg-white/95 border border-[#84D175]/35 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-fadeIn text-[#1a2e1a]"
        >
          {/* Header & Translation Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#84D175]/30 pb-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Gemini Optimized & Verified
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[#4a5e4a] text-xs font-mono font-bold">
                  {synthesizedTrip.duration_days} Days / {synthesizedTrip.duration_days - 1} Nights
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#84D175]/20 text-[#2D6A24] border border-[#84D175]/40 text-xs font-bold">
                  {numTravelers} Traveler{numTravelers > 1 ? 's' : ''} ({Math.ceil(numTravelers / 2)} Room{Math.ceil(numTravelers / 2) > 1 ? 's' : ''})
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#FFF8D2] text-[#2D6A24] border border-[#84D175]/30 text-xs font-bold uppercase">
                  {synthesizedTrip.pace} Pace
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#1a2e1a] tracking-tight">
                {translatedTripTitle || synthesizedTrip.trip_title}
              </h3>
            </div>

            {/* Translation Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center text-[#4a5e4a] px-1 font-bold gap-1 text-[11px]">
                <Languages className="w-3.5 h-3.5" />
                <span>{translating ? t('translating_plan', selectedLang) : t('translate_plan', selectedLang)}:</span>
              </div>
              {[
                { code: 'en', label: 'EN' },
                { code: 'hi', label: 'हिंदी' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'te', label: 'తెలుగు' },
                { code: 'kn', label: 'ಕನ್ನಡ' },
                { code: 'mr', label: 'मराठी' },
                { code: 'bn', label: 'বাংলা' },
                { code: 'gu', label: 'ગુજરાતી' }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleTranslate(lang.code)}
                  disabled={translating}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedLang === lang.code
                      ? 'bg-[#84D175] text-[#1a2e1a] shadow-xs font-black'
                      : 'text-[#4a5e4a] hover:bg-slate-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Optimization Intelligence Cards with Interactive Action Buttons */}
          {synthesizedTrip.ai_optimizations && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#1a2e1a] uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#2D6A24]" />
                <span>Actionable AI Recommendations & Optimizations (Click to Apply):</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Conflicts Resolved Card */}
                <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-amber-900 font-black text-xs">
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>Schedule Conflicts</span>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                        {synthesizedTrip.ai_optimizations.conflicts_resolved?.length || 0} Resolved
                      </span>
                    </div>
                    <ul className="text-xs text-amber-950 space-y-1.5">
                      {synthesizedTrip.ai_optimizations.conflicts_resolved?.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleApplyConflictResolution(0, 'All conflicts resolved')}
                    disabled={appliedSuggestions['conflict_0']}
                    className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      appliedSuggestions['conflict_0']
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs active:scale-95'
                    }`}
                  >
                    {appliedSuggestions['conflict_0'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Rescheduled Timing Applied ✓</span>
                      </>
                    ) : (
                      <>
                        <span>Apply Schedule Optimization</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Voids Filled Card */}
                <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-emerald-900 font-black text-xs">
                      <div className="flex items-center space-x-1.5">
                        <Bot className="w-4 h-4 text-emerald-700" />
                        <span>Activity Voids Filled</span>
                      </div>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                        {synthesizedTrip.ai_optimizations.voids_filled?.length || 0} Filled
                      </span>
                    </div>
                    <ul className="text-xs text-emerald-950 space-y-1.5">
                      {synthesizedTrip.ai_optimizations.voids_filled?.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 mt-0.5">•</span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleApplyVoidFill(0, 'Added experiences to schedule')}
                    disabled={appliedSuggestions['void_0']}
                    className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      appliedSuggestions['void_0']
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] shadow-xs active:scale-95'
                    }`}
                  >
                    {appliedSuggestions['void_0'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Void Highlights Added ✓</span>
                      </>
                    ) : (
                      <>
                        <span>Apply Added Experiences</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Cost Optimization Card */}
                <div className="bg-[#FFF8D2]/60 border border-[#84D175]/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[#2D6A24] font-black text-xs">
                      <div className="flex items-center space-x-1.5">
                        <TrendingDown className="w-4 h-4 text-[#2D6A24]" />
                        <span>Cost & Date Optimization</span>
                      </div>
                      <span className="text-[10px] bg-[#84D175]/20 text-[#2D6A24] px-2 py-0.5 rounded font-mono font-bold border border-[#84D175]/30">
                        Surge Analyzed
                      </span>
                    </div>
                    <p className="text-xs text-[#4a5e4a] leading-relaxed font-medium">
                      {synthesizedTrip.ai_optimizations.cost_optimization_tip || 'Trip date selected avoids peak weekend surcharges. Stays and transfers locked with best available rates.'}
                    </p>
                  </div>

                  <button
                    onClick={handleApplyCostOptimization}
                    disabled={appliedSuggestions['cost_optimization']}
                    className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      appliedSuggestions['cost_optimization']
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-[#2D6A24] hover:bg-[#1a4a15] text-white shadow-xs active:scale-95'
                    }`}
                  >
                    {appliedSuggestions['cost_optimization'] ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Best Rate Applied ✓</span>
                      </>
                    ) : (
                      <>
                        <span>Lock Optimized Rates</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Day-by-Day Timeline Schedule */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-black text-[#1a2e1a] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2D6A24]" />
              Day-by-Day Synthesized Itinerary
            </h4>

            <div className="space-y-4">
              {synthesizedTrip.itinerary?.map((dayObj, dIdx) => (
                <div
                  key={dIdx}
                  className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[#84D175] text-[#1a2e1a] font-black text-xs font-mono">
                        DAY {dayObj.day}
                      </span>
                      <span className="text-sm font-black text-[#1a2e1a]">
                        {dayObj.title}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {dayObj.slots?.map((slot, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-white border border-slate-200 hover:border-[#84D175] rounded-xl p-3 space-y-1 shadow-2xs transition-all"
                      >
                        <div className="text-[10px] font-mono text-[#2D6A24] font-black">
                          {slot.time}
                        </div>
                        <div className="text-xs font-bold text-[#1a2e1a] line-clamp-1">
                          {slot.title}
                        </div>
                        <div className="text-[11px] text-[#4a5e4a] line-clamp-2">
                          {slot.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  {dayObj.notes && (
                    <div className="text-[11px] text-[#4a5e4a] italic pt-1 font-medium">
                      💡 Note: {dayObj.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Decimal Financial Breakdown & Booking Action */}
          <div className="bg-[#0C2D45] border border-[#84D175]/35 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[#FFF8D2] shadow-xl">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#D3E8D0] uppercase tracking-wider block">
                Total Synthesized Package Price (Decimal Precision for {numTravelers} Traveler{numTravelers > 1 ? 's' : ''}):
              </span>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black text-white font-mono">
                  ₹{parseFloat(synthesizedTrip.estimated_pricing?.grand_total || '32000.00').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-white font-bold bg-[#84D175]/30 px-2.5 py-1 rounded-lg border border-[#84D175]/40">
                  Includes {Math.ceil(numTravelers / 2)} Hotel Room(s) + Transfers + 5% GST
                </span>
              </div>
              <div className="text-[11px] text-[#D3E8D0] flex flex-wrap gap-4 font-mono pt-1">
                <span>Stays: ₹{synthesizedTrip.estimated_pricing?.hotel_total || '14000.00'}</span>
                <span>•</span>
                <span>Activities ({numTravelers}p): ₹{synthesizedTrip.estimated_pricing?.activities_total || '9000.00'}</span>
                <span>•</span>
                <span>Transfers: ₹{synthesizedTrip.estimated_pricing?.transfers_total || '4200.00'}</span>
                <span>•</span>
                <span>GST Tax: ₹{synthesizedTrip.estimated_pricing?.gst_tax || '1360.00'}</span>
              </div>
            </div>

            <button
              onClick={() => onBookingComplete?.({
                ...synthesizedTrip,
                destination_name: geoData?.name || destinationQuery,
                cityName: geoData?.name || destinationQuery,
                num_travelers: numTravelers,
                partySize: numTravelers,
                hotelName: stayMode === 'same' ? masterHotel.name : 'Custom Multi-Stay Plan',
                selectedHotel: stayMode === 'same' ? masterHotel : undefined
              })}
              className="px-8 py-3.5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-sm rounded-xl shadow-lg shadow-[#84D175]/30 transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
            >
              <span>Book Custom Package</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
