import React, { useState, useEffect } from 'react';
import { api } from './api';
import LandingPage   from './components/LandingPage';
import AuthModal     from './components/AuthModal';
import Navbar        from './components/Navbar';
import DiscoverView  from './components/DiscoverView';
import PackageCatalog from './components/PackageCatalog';
import BuildView     from './components/BuildView';
import CustomizerStudio from './components/CustomizerStudio';
import OptimizeView  from './components/OptimizeView';
import ConfirmView   from './components/ConfirmView';
import AIAssistantModal from './components/AIAssistantModal';
import BookingModal  from './components/BookingModal';
import DestinationExplorer from './components/DestinationExplorer';
import ErrorBoundary from './components/ErrorBoundary';
import { Globe, Zap, Compass } from 'lucide-react';

function getFallbackPackageDetail(packageId, packagesList = []) {
  const found = (packagesList || []).find(p => p.package_id === packageId);
  const pkgName = found?.name || found?.title || 'Custom Tour Package';
  const cityName = found?.city_name || 'Destination';
  const basePrice = found?.base_price || '32000.00';
  const durationDays = found?.duration_days || 4;
  const theme = found?.theme || 'heritage';

  return {
    package: {
      package_id: packageId || 'pkg_default',
      name: pkgName,
      title: pkgName,
      theme: theme,
      city_name: cityName,
      city_lat: found?.city_lat || 12.9716,
      city_lng: found?.city_lng || 77.5946,
      base_price: basePrice,
      duration_days: durationDays,
      languages_offered: found?.languages_offered || 'en,hi,ta',
    },
    components: [
      {
        component_id: 'cmp_hotel_std',
        swap_group: 'hotel_tier',
        component_type: 'hotel',
        name: `${cityName} Premium Hotel & Resort`,
        title: `${cityName} Premium Hotel & Resort`,
        price_delta: '0.00',
        is_default: true,
        is_optional: 0,
        day_index: 1,
        slot: 'overnight'
      },
      {
        component_id: 'cmp_hotel_lux',
        swap_group: 'hotel_tier',
        component_type: 'hotel',
        name: `${cityName} 5-Star Luxury Heritage Villa`,
        title: `${cityName} 5-Star Luxury Heritage Villa`,
        price_delta: '6500.00',
        is_default: false,
        is_optional: 0,
        day_index: 1,
        slot: 'overnight'
      },
      {
        component_id: 'cmp_act_main',
        swap_group: 'activity_highlight',
        component_type: 'activity',
        name: `${cityName} Guided City Landmark Experience`,
        title: `${cityName} Guided City Landmark Experience`,
        price_delta: '0.00',
        is_default: true,
        is_optional: 0,
        day_index: 1,
        slot: 'morning'
      },
      {
        component_id: 'cmp_act_evening',
        swap_group: 'activity_evening',
        component_type: 'activity',
        name: `${cityName} Sunset Viewpoint & Cultural Tour`,
        title: `${cityName} Sunset Viewpoint & Cultural Tour`,
        price_delta: '1200.00',
        is_default: true,
        is_optional: 0,
        day_index: 2,
        slot: 'evening'
      },
      {
        component_id: 'cmp_transfer_pv',
        swap_group: 'transfers',
        component_type: 'transfer',
        name: 'Private AC Chauffeured Airport & Sightseeing Transfers',
        title: 'Private AC Chauffeured Airport & Sightseeing Transfers',
        price_delta: '2500.00',
        is_default: true,
        is_optional: 0,
        day_index: 1,
        slot: 'morning'
      }
    ],
    pricing: {
      base_price: basePrice,
      total_price: basePrice,
      currency: 'INR'
    }
  };
}

export default function App() {
  /* Auth state — Opens with landing page first */
  const [user, setUser]               = useState(null);
  const [authMode, setAuthMode]       = useState(null); // null | 'signin' | 'signup'
  const [showLanding, setShowLanding] = useState(true);

  /* Step navigation stack: 'discover' | 'build' | 'customize' | 'optimize' | 'confirm' */
  const [activeStep, setActiveStep] = useState('discover');
  const [stepHistory, setStepHistory] = useState(['discover']);

  const navigateToStep = (nextStep) => {
    setStepHistory(prev => [...prev, nextStep]);
    setActiveStep(nextStep);
    setShowLanding(false);
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
        copy.pop();
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
      } else if (window.location.hash) {
        const step = window.location.hash.replace(/^#/, '');
        if (['discover', 'catalog', 'build', 'architect', 'customize', 'optimize', 'confirm'].includes(step)) {
          setActiveStep(step);
        }
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
  // Persistent language preference: persists across page refreshes and route shifts,
  // but resets to 'en' if tab is closed / inactive for more than 7 seconds or browser restarted.
  const getSavedLanguage = () => {
    try {
      const saved = localStorage.getItem('tripcraft_pref_lang');
      const lastActive = parseInt(localStorage.getItem('tripcraft_last_active') || '0', 10);
      const now = Date.now();
      if (saved && (now - lastActive <= 7000)) {
        return saved;
      }
    } catch (e) {}
    return 'en';
  };

  const [currentLanguage, setCurrentLanguage] = useState(getSavedLanguage);

  useEffect(() => {
    const updateHeartbeat = () => {
      try {
        localStorage.setItem('tripcraft_last_active', Date.now().toString());
      } catch (e) {}
    };
    updateHeartbeat();
    const interval = setInterval(updateHeartbeat, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('tripcraft_pref_lang', currentLanguage);
      localStorage.setItem('tripcraft_last_active', Date.now().toString());
    } catch (e) {}
  }, [currentLanguage]);

  const [loadingPackages, setLoadingPackages] = useState(false);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [languageNotice, setLanguageNotice]   = useState(null);

  /* Modals & Panels */
  const [isAiModalOpen, setIsAiModalOpen]         = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingData, setBookingData]             = useState(null);
  const [bookingResult, setBookingResult]         = useState(null);
  const [realWorldEnabled, setRealWorldEnabled]   = useState(true);
  const [architectInitialState, setArchitectInitialState] = useState(null);

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
    api.getPackageDetail(selectedPackageId, currentLanguage)
      .then(res => {
        if (res && (res.package || res.package_id)) {
          setPackageDetailData(res);
        } else {
          setPackageDetailData(getFallbackPackageDetail(selectedPackageId, packages));
        }
      })
      .catch(() => {
        setPackageDetailData(getFallbackPackageDetail(selectedPackageId, packages));
      })
      .finally(() => setLoadingDetail(false));
  }, [selectedPackageId, packages, currentLanguage]);

  /* ── Handlers ── */
  const handleAuth = (userData) => {
    setUser(userData);
    setAuthMode(null);
    setShowLanding(false);
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    setActiveStep('discover');
  };

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

  const handleOpenCustomArchitect = (architectParams) => {
    setArchitectInitialState(architectParams);
    navigateToStep('architect');
  };

  const activePackage = packageDetailData?.package;

  /* ── Prelogin / Landing Page (If explicit landing view is triggered) ── */
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
    <div className="min-h-screen w-full bg-[#FFF8D2] text-[#1a2e1a] flex flex-col items-center justify-between font-display selection:bg-[#84D175] selection:text-[#1a2e1a]">

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 flex flex-col">

        {/* Language Fallback Notice */}
        {languageNotice && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl px-4 py-3 text-xs text-amber-300 flex items-center gap-2 shadow-md w-full">
            <Globe className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{languageNotice}</span>
          </div>
        )}

        <ErrorBoundary onReset={() => navigateToStep('discover')} onGoHome={() => navigateToStep('discover')}>
          {/* ── STEP 1: DISCOVER ── */}
          {activeStep === 'discover' && (
            <DiscoverView
              packages={packages}
              selectedPackageId={selectedPackageId}
              onSelectPackage={handleSelectPackage}
              onOpenAiBuild={() => setIsAiModalOpen(true)}
              onStartBuild={() => navigateToStep('catalog')}
              onExploreCatalog={() => navigateToStep('catalog')}
              language={currentLanguage}
            />
          )}

          {/* ── STEP 1B: ALL PACKAGES CATALOG (FULL 60+ PACKAGES) ── */}
          {activeStep === 'catalog' && (
            <PackageCatalog
              packages={packages}
              selectedPackageId={selectedPackageId}
              onSelectPackage={handleSelectPackage}
              onBack={() => navigateToStep('discover')}
              onOpenAiBuild={() => setIsAiModalOpen(true)}
              preferredLanguage={currentLanguage}
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
                initialState={architectInitialState}
                preferredLanguage={currentLanguage}
                onLanguageChange={setCurrentLanguage}
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
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-bold">Loading customized package studio & components...</p>
              </div>
            ) : packageDetailData ? (
              <CustomizerStudio
                packageDetailData={packageDetailData}
                preferredLanguage={currentLanguage}
                realWorldEnabled={realWorldEnabled}
                onToggleRealWorld={setRealWorldEnabled}
                onOpenBooking={(d) => {
                  setBookingData(d);
                  setIsBookingModalOpen(true);
                }}
                tripPrefs={tripPrefs}
                onProceedToOptimize={(customizedData) => {
                  setBookingData(customizedData);
                  navigateToStep('optimize');
                }}
                onNextToOptimize={(customizedData) => {
                  setBookingData(customizedData);
                  navigateToStep('optimize');
                }}
                onBack={handleGoBack}
              />
            ) : (
              <div className="py-16 text-center text-slate-500 text-sm">
                Please select a package from the Discover page first.
              </div>
            )
          )}

          {/* ── STEP 4: OPTIMIZE ── */}
          {activeStep === 'optimize' && (
            <OptimizeView
              activePackage={activePackage}
              packageDetailData={packageDetailData}
              bookingDetails={bookingData}
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
        </ErrorBoundary>
      </main>

      {/* Grounded AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectAiPackage={handleSelectAiPackage}
        onOpenCustomArchitect={handleOpenCustomArchitect}
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
      <footer className="w-full border-t border-[#84D175]/30 bg-white/70 backdrop-blur-sm py-8 text-xs text-[#4a5e4a] flex justify-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 font-medium">
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
