import React, { useState, useEffect } from 'react';
import { api } from './api';
import LandingPage   from './components/LandingPage';
import AuthModal     from './components/AuthModal';
import Navbar        from './components/Navbar';
import DiscoverView  from './components/DiscoverView';
import BuildView     from './components/BuildView';
import CustomizerStudio from './components/CustomizerStudio';
import OptimizeView  from './components/OptimizeView';
import ConfirmView   from './components/ConfirmView';
import TripMap       from './components/TripMap';
import RealWorldPanel from './components/RealWorldPanel';
import AIAssistantModal from './components/AIAssistantModal';
import BookingModal  from './components/BookingModal';
import DestinationExplorer from './components/DestinationExplorer';
import { Globe, Zap, Compass } from 'lucide-react';

function getFallbackPackageDetail(packageId) {
  const details = {
    pkg_goa_trek_01: {
      name: 'Goa Coastal Trek',
      title: 'Goa Coastal Trek',
      theme: 'adventure',
      base_price: '32000.00',
      duration_days: 5,
      city_name: 'Goa, India',
    },
    pkg_beach_resort_02: {
      name: 'Romantic Beach Resort',
      title: 'Romantic Beach Resort',
      theme: 'honeymoon',
      base_price: '45000.00',
      duration_days: 5,
      city_name: 'Goa, India',
    },
    pkg_temples_trail_03: {
      name: 'Ancient Temples Trail',
      title: 'Ancient Temples Trail',
      theme: 'pilgrimage',
      base_price: '28000.00',
      duration_days: 5,
      city_name: 'Goa, India',
    },
    pkg_family_wildlife_04: {
      name: 'Family Beach & Wildlife',
      title: 'Family Beach & Wildlife',
      theme: 'family',
      base_price: '38000.00',
      duration_days: 5,
      city_name: 'Goa, India',
    },
  };

  const selected = details[packageId] || {
    name: 'Goa Heritage & Coastal Experience',
    title: 'Goa Heritage & Coastal Experience',
    theme: 'heritage',
    base_price: '35000.00',
    duration_days: 5,
    city_name: 'Goa, India',
  };

  return {
    package: {
      package_id: packageId || 'pkg_default',
      name: selected.name,
      title: selected.title,
      theme: selected.theme,
      city_name: selected.city_name,
      city_lat: 15.2993,
      city_lng: 74.1240,
      base_price: selected.base_price,
      duration_days: selected.duration_days,
      languages_offered: 'en,ta,hi',
    },
    components: [
      {
        component_id: 'cmp_hotel_4star',
        swap_group: 'hotel_tier',
        component_type: 'hotel',
        name: '4-Star Beachfront Resort',
        title: '4-Star Beachfront Resort',
        price_delta: '0.00',
        is_default: true,
      },
      {
        component_id: 'cmp_hotel_5star',
        swap_group: 'hotel_tier',
        component_type: 'hotel',
        name: '5-Star Heritage Villa',
        title: '5-Star Heritage Villa',
        price_delta: '8500.00',
        is_default: false,
      },
      {
        component_id: 'cmp_act_scuba',
        swap_group: 'activity_scuba',
        component_type: 'activity',
        name: 'Grande Island Scuba Diving',
        title: 'Grande Island Scuba Diving',
        price_delta: '2500.00',
        is_default: true,
      },
      {
        component_id: 'cmp_transfer_pv',
        swap_group: 'transfers',
        component_type: 'transfer',
        name: 'Private AC SUV Transfer',
        title: 'Private AC SUV Transfer',
        price_delta: '3000.00',
        is_default: true,
      }
    ],
    pricing: {
      base_price: selected.base_price,
      total_price: selected.base_price,
      currency: 'INR'
    }
  };
}

export default function App() {
  /* Auth state */
  const [user, setUser]               = useState(null);
  const [authMode, setAuthMode]       = useState(null); // null | 'signin' | 'signup'
  const [showLanding, setShowLanding] = useState(true);

  /* Step navigation stack: 'discover' | 'build' | 'customize' | 'optimize' | 'confirm' */
  const [activeStep, setActiveStep] = useState('discover');
  const [stepHistory, setStepHistory] = useState(['discover']);

  const navigateToStep = (nextStep) => {
    setStepHistory(prev => [...prev, nextStep]);
    setActiveStep(nextStep);
    try {
      window.history.pushState({ step: nextStep }, '', `#${nextStep}`);
    } catch (e) {
      // safe fallback
    }
  };

  const handleGoBack = () => {
    if (stepHistory.length > 1) {
      setStepHistory(prev => {
        const copy = [...prev];
        copy.pop(); // remove current step
        const previous = copy[copy.length - 1] || 'discover';
        setActiveStep(previous);
        return copy;
      });
    } else {
      setActiveStep('discover');
    }
  };

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.step) {
        setActiveStep(e.state.step);
      } else {
        handleGoBack();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /* Catalog & Data state */
  const [packages, setPackages]               = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [packageDetailData, setPackageDetailData] = useState(null);
  const [cities, setCities]                   = useState([]);
  const [selectedCityId, setSelectedCityId]   = useState('');
  const [selectedTheme, setSelectedTheme]     = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [languageNotice, setLanguageNotice]   = useState(null);

  /* Modals & Panels */
  const [isAiModalOpen, setIsAiModalOpen]         = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData]             = useState(null);
  const [bookingResult, setBookingResult]         = useState(null);
  const [realWorldEnabled, setRealWorldEnabled]   = useState(false);

  /* User Preference Inputs */
  const [tripPrefs, setTripPrefs] = useState({});

  /* ── Load Cities & Packages ── */
  useEffect(() => {
    api.getCities().then(res => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCities(list);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoadingPackages(true);
    api.getPackages({
      city_id:        selectedCityId  || undefined,
      theme:          selectedTheme   || undefined,
      language_bcp47: currentLanguage,
    }).then(res => {
      const pkgs = res?.packages || (Array.isArray(res) ? res : []);
      setPackages(pkgs);
      setLanguageNotice(res?.language_notice || null);

      if (pkgs.length > 0 && (!selectedPackageId || !pkgs.some(p => p.package_id === selectedPackageId))) {
        setSelectedPackageId(pkgs[0].package_id);
      }
    }).catch(console.error).finally(() => setLoadingPackages(false));
  }, [selectedCityId, selectedTheme, currentLanguage]);

  useEffect(() => {
    if (!selectedPackageId) {
      setPackageDetailData(null);
      return;
    }
    setLoadingDetail(true);
    api.getPackageDetail(selectedPackageId)
      .then(res => {
        if (res && (res.package || res.package_id)) {
          setPackageDetailData(res);
        } else {
          setPackageDetailData(getFallbackPackageDetail(selectedPackageId));
        }
      })
      .catch(() => {
        setPackageDetailData(getFallbackPackageDetail(selectedPackageId));
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedPackageId]);

  /* ── Handlers ── */
  const handleAuth = (userData) => {
    setUser(userData);
    setAuthMode(null);
    setShowLanding(false);
  };

  const handleGetStarted = () => setAuthMode('signup');
  const handleSignIn     = () => setAuthMode('signin');
  const handleSignOut    = () => { setUser(null); setShowLanding(true); };

  const handleSelectPackage = (packageId) => {
    setSelectedPackageId(packageId);
    navigateToStep('customize');
  };

  const handleBuildSubmit = (prefs) => {
    setTripPrefs(prefs);
    navigateToStep('customize');
  };

  const handleSelectAiPackage = (pkg) => {
    if (pkg?.package_id) {
      setSelectedPackageId(pkg.package_id);
      navigateToStep('customize');
    }
  };

  const activePackage = packageDetailData?.package;

  /* ── Prelogin / Landing Page ── */
  if (showLanding && !user) {
    return (
      <>
        <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
        {authMode && (
          <AuthModal
            mode={authMode}
            onSuccess={handleAuth}
            onClose={() => setAuthMode(null)}
          />
        )}
      </>
    );
  }

  /* ── Main App Shell ── */
  return (
    <div className="min-h-screen bg-[#FFF8D2] text-[#1a2e1a] flex flex-col font-display selection:bg-[#84D175] selection:text-[#1a2e1a]">

      {/* Top Stepper Navigation */}
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        onOpenAiPlanner={() => setIsAiModalOpen(true)}
        realWorldEnabled={realWorldEnabled}
        onToggleRealWorld={setRealWorldEnabled}
        user={user}
        onSignOut={handleSignOut}
        activeStep={activeStep}
        onStepChange={navigateToStep}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Language Fallback Notice */}
        {languageNotice && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl px-4 py-3 text-xs text-amber-300 flex items-center gap-2 shadow-md">
            <Globe className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{languageNotice}</span>
          </div>
        )}

        {/* ── STEP 1: DISCOVER ── */}
        {activeStep === 'discover' && (
          <DiscoverView
            packages={packages}
            selectedPackageId={selectedPackageId}
            onSelectPackage={handleSelectPackage}
            onOpenAiBuild={() => setIsAiModalOpen(true)}
            onStartBuild={() => navigateToStep('build')}
            language={currentLanguage}
          />
        )}

        {/* ── STEP 2: BUILD (PREFERENCES) ── */}
        {activeStep === 'build' && (
          <BuildView
            onBuildSubmit={handleBuildSubmit}
            currentLanguage={currentLanguage}
            onBack={handleGoBack}
          />
        )}

        {/* ── STEP 2B: CUSTOM DESTINATION ARCHITECT (MODE B) ── */}
        {activeStep === 'architect' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 border border-[#84D175]/30 text-xs font-bold text-[#1a2e1a] hover:bg-[#FFF8D2] transition-all cursor-pointer shadow-xs"
              >
                <span>← Back</span>
              </button>
            </div>
            <DestinationExplorer
              externalSupplyMode={realWorldEnabled}
              onBookingComplete={(trip) => {
                setBookingData({
                  packageName: trip?.trip_title || 'Custom Architect Trip',
                  total: trip?.estimated_pricing?.grand_total || '32000.00',
                  durationDays: trip?.duration_days || 3,
                  itinerary: trip?.itinerary || []
                });
                setIsBookingModalOpen(true);
              }}
            />
          </div>
        )}

        {/* ── STEP 3: CUSTOMIZE ── */}
        {activeStep === 'customize' && (
          loadingDetail ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading customizer studio & package components...</p>
            </div>
          ) : packageDetailData ? (
            <CustomizerStudio
              packageDetailData={packageDetailData}
              preferredLanguage={currentLanguage}
              onOpenBooking={(d) => {
                setBookingData(d);
                setIsBookingModalOpen(true);
              }}
              tripPrefs={tripPrefs}
              onNextToOptimize={(customizedData) => {
                setBookingData(customizedData);
                navigateToStep('optimize');
              }}
              onBack={handleGoBack}
            />
          ) : (
            <div className="py-16 text-center text-slate-400 text-sm">
              Please select a package from the Discover page first.
            </div>
          )
        )}

        {/* ── STEP 4: OPTIMIZE ── */}
        {activeStep === 'optimize' && (
          <OptimizeView
            activePackage={activePackage}
            pricing={packageDetailData?.pricing}
            guide={bookingData?.selectedGuide}
            onProceedToBook={() => {
              if (bookingData) {
                setIsBookingModalOpen(true);
              } else {
                navigateToStep('customize');
              }
            }}
            onBack={handleGoBack}
          />
        )}

        {/* ── STEP 5: CONFIRM ── */}
        {activeStep === 'confirm' && (
          <ConfirmView
            bookingResult={bookingResult}
            bookingDetails={bookingData}
            onReset={() => navigateToStep('discover')}
            onBack={handleGoBack}
          />
        )}

        {/* ── Live Market Data (SerpAPI Google Hotels) ── */}
        {realWorldEnabled && activePackage && activeStep !== 'confirm' && (
          <section className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>Live Market Comparison (SerpAPI & OpenTripMap)</span>
            </div>
            <RealWorldPanel cityName={activePackage.city_name || 'Bengaluru'} />
          </section>
        )}

        {/* ── Interactive Trip Map ── */}
        {activePackage && (activeStep === 'customize' || activeStep === 'optimize') && (
          <section className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Interactive Trip Map</span>
            </div>
            <TripMap
              cityName={activePackage.city_name}
              lat={parseFloat(activePackage.city_lat || 12.9716)}
              lng={parseFloat(activePackage.city_lng || 77.5946)}
            />
          </section>
        )}
      </main>

      {/* Grounded AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectAiPackage={handleSelectAiPackage}
        currentLanguage={currentLanguage}
      />

      {/* Booking Confirmation Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        bookingDetails={bookingData}
        onBookingConfirmed={(res) => {
          setBookingResult(res);
          setIsBookingModalOpen(false);
          setActiveStep('confirm');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-[#84D175]/30 bg-white/70 backdrop-blur-sm py-8 text-xs text-[#4a5e4a]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
          <span>TripCraft · KogniVera Hackathon 2026 · Team CodeBlooded · BMSCE</span>
          <div className="flex items-center gap-4 text-[#3C8B30] font-bold">
            <span>Decimal Pricing Engine</span>
            <span className="text-[#84D175]">·</span>
            <span>Mandatory Guide Availability Check</span>
            <span className="text-[#84D175]">·</span>
            <span>Grounded Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
