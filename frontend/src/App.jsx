import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import CustomizerStudio from './components/CustomizerStudio';
import DestinationExplorer from './components/DestinationExplorer';
import TripMap from './components/TripMap';
import RealWorldPanel from './components/RealWorldPanel';
import AIAssistantModal from './components/AIAssistantModal';
import BookingModal from './components/BookingModal';
import {
  Compass,
  Filter,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  CheckCircle,
  Zap,
  Globe,
  Star,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState('curated'); // 'curated' | 'custom_destination'
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [packageDetailData, setPackageDetailData] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [languageNotice, setLanguageNotice] = useState(null);

  // Modals & Panels
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [realWorldEnabled, setRealWorldEnabled] = useState(false);

  // Load cities on mount
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await api.getCities();
        if (Array.isArray(res)) {
          setCities(res);
        } else if (res && Array.isArray(res.data)) {
          setCities(res.data);
        }
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    }
    loadCities();
  }, []);

  // Fetch package catalog whenever filters or language change
  useEffect(() => {
    async function loadPackages() {
      setLoadingPackages(true);
      try {
        const res = await api.getPackages({
          city_id: selectedCityId || undefined,
          theme: selectedTheme || undefined,
          language_bcp47: currentLanguage
        });

        const pkgs = res?.packages || (Array.isArray(res) ? res : []);
        setPackages(pkgs);

        if (res?.language_notice) {
          setLanguageNotice(res.language_notice);
        } else {
          setLanguageNotice(null);
        }

        // Auto-select first package if none selected or not in active filtered list
        if (pkgs.length > 0) {
          if (!selectedPackageId || !pkgs.some(p => p.package_id === selectedPackageId)) {
            setSelectedPackageId(pkgs[0].package_id);
          }
        } else {
          setSelectedPackageId(null);
          setPackageDetailData(null);
        }
      } catch (err) {
        console.error('Error loading packages:', err);
      } finally {
        setLoadingPackages(false);
      }
    }
    loadPackages();
  }, [selectedCityId, selectedTheme, currentLanguage]);

  // Load full package detail when selectedPackageId changes
  useEffect(() => {
    async function loadDetail() {
      if (!selectedPackageId) {
        setPackageDetailData(null);
        return;
      }
      setLoadingDetail(true);
      try {
        const res = await api.getPackageDetail(selectedPackageId);
        if (res) {
          setPackageDetailData(res);
        }
      } catch (err) {
        console.error('Error loading package detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
    loadDetail();
  }, [selectedPackageId]);

  const handleOpenBooking = (details) => {
    setBookingData(details);
    setIsBookingModalOpen(true);
  };

  const handleSelectAiPackage = (pkg) => {
    if (pkg && pkg.package_id) {
      setSelectedPackageId(pkg.package_id);
      setActiveMode('curated');
    }
  };

  const activePackage = packageDetailData?.package;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        onOpenAiPlanner={() => setIsAiModalOpen(true)}
        realWorldEnabled={realWorldEnabled}
        onToggleRealWorld={setRealWorldEnabled}
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

      {/* Mode Navigation Bar for Mobile */}
      <div className="sm:hidden bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-center space-x-2">
        <button
          onClick={() => setActiveMode('curated')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
            activeMode === 'curated' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 bg-slate-800'
          }`}
        >
          Curated Packages
        </button>
        <button
          onClick={() => setActiveMode('custom_destination')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
            activeMode === 'custom_destination' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 bg-slate-800'
          }`}
        >
          Custom Architect (Any City)
        </button>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Language Fallback Notice if applicable */}
        {languageNotice && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{languageNotice}</span>
            </div>
          </div>
        )}

        {/* Mode 1: Curated Packages Studio */}
        {activeMode === 'curated' ? (
          <div className="space-y-8 animate-fadeIn">
            {/* Catalog Selector Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-teal-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Curated Packages Catalog (Click to Customize Live)
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {packages.length} Available
                  </span>
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="">All Destinations</option>
                    {cities.map((city) => (
                      <option key={city.city_id} value={city.city_id}>
                        {city.name} ({city.package_count || 0} tours)
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="">All Themes</option>
                    <option value="heritage">Heritage & Culture</option>
                    <option value="adventure">Adventure & Nature</option>
                    <option value="food_trail">Food & Culinary</option>
                    <option value="wildlife">Wildlife Safari</option>
                    <option value="pilgrimage">Pilgrimage & Spiritual</option>
                    <option value="honeymoon">Honeymoon & Romantic</option>
                  </select>
                </div>
              </div>

              {/* Package Cards Grid */}
              {loadingPackages ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <span>Fetching packages...</span>
                </div>
              ) : packages.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800 p-4">
                  No tour packages found matching the selected filters. Try choosing "All Destinations" or "All Themes".
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.package_id;
                    const pkgTitle = pkg.name || pkg.title || 'Tour Package';
                    return (
                      <div
                        key={pkg.package_id}
                        onClick={() => setSelectedPackageId(pkg.package_id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/50 shadow-md shadow-teal-500/10'
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-semibold uppercase tracking-wider">
                              {pkg.theme}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {pkg.duration_days}D
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-white line-clamp-1">
                            {pkgTitle}
                          </h3>
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {pkg.description}
                          </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block">From</span>
                            <span className="text-xs font-bold text-white font-mono">
                              ₹{parseFloat(pkg.base_price || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${isSelected ? 'text-teal-400 font-bold' : 'text-slate-400'}`}>
                            {isSelected ? 'Active Customizer' : 'Customize'} <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dynamic Customization Studio for Selected Package */}
            {loadingDetail ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading package customizer studio & components...</p>
              </div>
            ) : packageDetailData ? (
              <CustomizerStudio
                packageDetailData={packageDetailData}
                preferredLanguage={currentLanguage}
                onOpenBooking={handleOpenBooking}
              />
            ) : null}

            {/* Real-World External Supply Comparison (SerpAPI Google Hotels) */}
            {realWorldEnabled && activePackage && (
              <RealWorldPanel cityName={activePackage.city_name || 'Bengaluru'} />
            )}

            {/* Leaflet & OpenTripMap Visual Exploration Map */}
            {activePackage && (
              <TripMap
                cityName={activePackage.city_name}
                lat={parseFloat(activePackage.city_lat || 12.9716)}
                lng={parseFloat(activePackage.city_lng || 77.5946)}
              />
            )}
          </div>
        ) : (
          /* Mode 2: Brand New Custom Destination Architect */
          <DestinationExplorer
            externalSupplyMode={realWorldEnabled}
            onBookingComplete={handleOpenBooking}
          />
        )}
      </main>

      {/* Grounded AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectAiPackage={handleSelectAiPackage}
        currentLanguage={currentLanguage}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        bookingDetails={bookingData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            TripCraft (PackagePro) — KogniVera Hackathon 2026 (PS-04) • Team CodeBlooded (BMSCE)
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Decimal Pricing Engine</span>
            <span>•</span>
            <span>Mandatory Guide Availability Check</span>
            <span>•</span>
            <span>Grounded Gemini AI</span>
            <span>•</span>
            <span>OpenTripMap & SerpAPI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
