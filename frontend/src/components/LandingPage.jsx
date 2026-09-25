import React, { useState, useEffect } from 'react';

/* ─── Destination Cards with Real Landmark Pictures ─────────────────── */
const DESTINATIONS = [
  {
    name: 'Goa',
    tag: 'Beach & Coastal',
    desc: 'Sun · Sand · Serenity',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Jaipur',
    tag: 'Royal Heritage',
    desc: 'Pink City · Rajasthan',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Munnar',
    tag: 'Nature & Hills',
    desc: 'Tea Gardens · Kerala',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Varanasi',
    tag: 'Spiritual Trail',
    desc: 'Sacred Ghats · UP',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Bengaluru',
    tag: 'Culture & Tech',
    desc: 'Garden City · Karnataka',
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Udaipur',
    tag: 'Romantic Lakes',
    desc: 'City of Lakes · Rajasthan',
    image: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=600&q=80',
  },
];

/* ─── Why TripCraft Features (Pure Editorial Typography, No Symbols) ─ */
const FEATURES = [
  {
    num: '01',
    title: 'AI Package Builder',
    desc: 'Describe your dream holiday in natural language. Our grounded Gemini AI selects and ranks authentic packages directly from the verified catalog in seconds.',
  },
  {
    num: '02',
    title: 'Live Repricing Engine',
    desc: 'Swap hotel tiers, activities, or certified guides. Your total recomputes instantly from scratch using exact Decimal arithmetic with zero float discrepancy.',
  },
  {
    num: '03',
    title: 'Guide Availability Verification',
    desc: 'Every guide selection is verified against real calendar availability. Clashing dates are explicitly refused by date, and a matching substitute is automatically recommended.',
  },
  {
    num: '04',
    title: 'Language Preference Filtering',
    desc: 'Choose your preferred language for guide delivery — Tamil, Hindi, Telugu, Kannada, Bengali, or English. Itineraries and guide pools filter server-side.',
  },
  {
    num: '05',
    title: 'Interactive Itinerary Map',
    desc: 'Explore your customized travel plan on an interactive Leaflet map complete with OpenTripMap cultural sights, landmarks, and regional coordinates.',
  },
  {
    num: '06',
    title: 'Certified Local Guides',
    desc: 'Select certified local experts filtered by language, specialisation, and guest rating with transparent daily pricing and verified itinerary coverage.',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Choose or Build with AI',
    desc: 'Select from 60+ curated packages by theme, or state your budget and interests for Gemini AI to assemble a personalized itinerary from catalog inventory.',
  },
  {
    step: '02',
    title: 'Customize Components & Reprice',
    desc: 'Swap hotel tiers, excursion activities, and private transfers. Total price recomputes live from zero using exact Decimal arithmetic.',
  },
  {
    step: '03',
    title: 'Certified Guide Calendar Check',
    desc: 'Select your preferred language guide. If calendar dates clash, the selection is refused with the clashing date named and a same-language substitute is offered.',
  },
  {
    step: '04',
    title: 'Instant Confirmation & Map',
    desc: 'Review your complete day-by-day itinerary, verify live SerpAPI market rates, and book with immediate receipt generation and Leaflet map guidance.',
  }
];

const STATS = [
  { value: '60+',  label: 'Curated Packages' },
  { value: '50+',   label: 'Destinations'     },
  { value: '100%', label: 'Decimal Precision'},
  { value: 'Live', label: 'Guide Verification'},
];

/* ─── High-Definition Tourism Slideshow for Hero ─────────────────────── */
const LANDING_HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
    title: 'Pristine Coastal Lagoons & Island Vistas',
    tag: 'Coastal & Islands',
  },
  {
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1920&q=85',
    title: 'Grand Rajasthani Forts & Royal Palaces',
    tag: 'Royal Heritage',
  },
  {
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
    title: 'Himalayan Mountain Treks & Vistas',
    tag: 'Mountain Adventures',
  },
  {
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=85',
    title: 'Lush Green Tea Plantations & Waterfalls',
    tag: 'Nature & Serenity',
  },
  {
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1920&q=85',
    title: 'Sacred Evening Aarti & Ancient Ghats',
    tag: 'Spiritual Trail',
  }
];

export default function LandingPage({ onGetStarted, onSignIn }) {
  const [landingHeroIdx, setLandingHeroIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLandingHeroIdx((prev) => (prev + 1) % LANDING_HERO_SLIDES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#FFF8D2] text-[#1a2e1a] overflow-x-hidden selection:bg-[#84D175] selection:text-[#1a2e1a] font-sans flex flex-col items-center">

      {/* ── Translucent Tourism Background Scenic Overlay (Static) ── */}
      <div
        className="fixed inset-0 pointer-events-none bg-cover bg-center opacity-30 mix-blend-multiply z-0 scale-105"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80')` }}
      />

      {/* ── Subtle Background Blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-[#84D175]/15 rounded-full blur-3xl animate-blob" />
        <div className="absolute -top-20 -right-40 w-96 h-96 bg-[#FFF3B0]/40 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#84D175]/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* ── Top Navigation Bar (Seamlessly Blended with Background) ── */}
      <header className="sticky top-0 z-50 w-full bg-[#FFF8D2]/30 backdrop-blur-md border-b border-[#84D175]/20 transition-all flex justify-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Brand Logo */}
          <div
            onClick={onGetStarted}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <img
              src="/logo.png"
              alt="TripCraft Logo"
              className="h-9 w-auto object-contain rounded-xl shadow-xs bg-white/60 p-0.5"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-serif font-bold tracking-tight text-[#1a2e1a]">TripCraft</span>
            </div>
          </div>

          {/* Navigation Links (Translucent Frosted Capsule) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-[#84D175]/30 shadow-xs">
            <button
              onClick={onGetStarted}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 hover:text-[#1a2e1a] transition-all cursor-pointer"
            >
              Curated Packages
            </button>

            <button
              onClick={onGetStarted}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 hover:text-[#1a2e1a] transition-all cursor-pointer"
            >
              Custom Architect
            </button>

            <a
              href="#destinations"
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 hover:text-[#1a2e1a] transition-all"
            >
              Destinations
            </a>

            <a
              href="#how"
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 hover:text-[#1a2e1a] transition-all"
            >
              How It Works
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onSignIn}
              className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-[#84D175]/35 text-[#1a2e1a] font-bold text-sm hover:bg-[#84D175]/30 hover:text-[#1a2e1a] transition-all shadow-xs cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-sm transition-all shadow-md shadow-[#84D175]/20 cursor-pointer active:scale-95"
            >
              Start Building
            </button>
          </div>

        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-20 px-5 text-center max-w-5xl w-full mx-auto space-y-8 flex flex-col items-center justify-center">
        {/* Royal Heritage Hero Title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif font-bold text-[#1a2e1a] tracking-tight leading-[1.04]">
          Your Dream Trip,<br></br>{' '}
          <span className="italic font-normal bg-gradient-to-r from-[#2D6A24] via-[#4FAF3F] to-[#2D6A24] bg-clip-text text-transparent">
            Crafted Live.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-[#3a4e3a] max-w-2xl mx-auto font-normal leading-relaxed">
          Browse curated luxury packages or let AI assemble your personalized itinerary. Swap hotels, certified guides, and cultural excursions — watch your price update in real time with exact decimal precision.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 rounded-2xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-base shadow-xl shadow-[#84D175]/25 transition-all cursor-pointer active:scale-95"
          >
            Start Building My Trip
          </button>
          <button
            onClick={onSignIn}
            className="px-7 py-4 rounded-2xl bg-white/40 backdrop-blur-md border border-[#84D175]/35 text-[#1a2e1a] font-semibold text-sm hover:bg-white/60 transition-all shadow-xs cursor-pointer"
          >
            Sign In to Account
          </button>
        </div>

        {/* Interactive 10-Second Auto-Rotating Tourism Showcase */}
        <div className="relative overflow-hidden rounded-3xl border border-[#84D175]/35 shadow-2xl h-72 sm:h-96 w-full max-w-4xl mx-auto my-8">
          {LANDING_HERO_SLIDES.map((slide, idx) => (
            <div
              key={`showcase-${slide.url}`}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
                idx === landingHeroIdx
                  ? 'opacity-100 scale-100 z-0'
                  : 'opacity-0 scale-105 pointer-events-none -z-10'
              }`}
              style={{ backgroundImage: `url('${slide.url}')` }}
            />
          ))}

          {/* Translucent Frosted Glass Caption Box */}
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-10 bg-white/70 backdrop-blur-md border border-[#84D175]/40 rounded-2xl px-5 py-3 shadow-xl flex items-center justify-between gap-4">
            <div className="text-left">
              <div className="text-sm font-serif font-bold text-[#1a2e1a]">{LANDING_HERO_SLIDES[landingHeroIdx].title}</div>
              <div className="text-xs font-bold tracking-wider uppercase text-[#2D6A24]">{LANDING_HERO_SLIDES[landingHeroIdx].tag}</div>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              {LANDING_HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setLandingHeroIdx(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === landingHeroIdx ? 'w-5 bg-[#84D175]' : 'w-2 bg-[#1a2e1a]/30 hover:bg-[#1a2e1a]/60'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats Strip (Translucent Frosted Boxes) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4">
          {STATS.map(s => (
            <div key={s.label} className="bg-white/50 backdrop-blur-md border border-[#84D175]/30 rounded-2xl p-5 shadow-xs text-center hover:shadow-md hover:border-[#84D175]/60 transition-all">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-[#2D6A24] tracking-tight">{s.value}</div>
              <div className="text-[11px] text-[#4a5e4a] font-semibold uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS (ANCHOR: #how) ── */}
      <section id="how" className="relative z-10 py-16 px-5 max-w-7xl w-full mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#1a2e1a] tracking-tight">How TripCraft Works</h2>
          <p className="text-xs sm:text-sm text-[#4a5e4a] font-normal max-w-lg mx-auto">
            From initial discovery to live decimal repricing and verified guide booking in 4 intuitive steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS_STEPS.map((step) => {
            return (
              <div
                key={step.step}
                className="bg-white/50 backdrop-blur-md border border-[#84D175]/30 rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-3xl font-bold text-[#3C8B30]">
                      {step.step}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#84D175]/20 text-[#2D6A24] border border-[#84D175]/30">
                      Step {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#1a2e1a]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#4a5e4a] leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DESTINATIONS (ANCHOR: #destinations) ── */}
      <section id="destinations" className="relative z-10 py-16 px-5 max-w-7xl w-full mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#1a2e1a] tracking-tight">Popular Destinations</h2>
          <p className="text-xs sm:text-sm text-[#4a5e4a] font-normal max-w-lg mx-auto">Explore top customizable holiday packages tailored across India</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DESTINATIONS.map(d => (
            <div
              key={d.name}
              onClick={onGetStarted}
              className="group bg-white/50 backdrop-blur-md border border-[#84D175]/30 hover:border-[#84D175] rounded-2xl p-4 shadow-xs hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-14 h-14 rounded-2xl object-cover shadow-xs group-hover:scale-105 transition-transform duration-300 border border-[#84D175]/25"
                />
                <div>
                  <div className="font-serif font-bold text-[#1a2e1a] text-lg group-hover:text-[#2D6A24] transition-colors">{d.name}</div>
                  <div className="text-xs text-[#4a5e4a] font-normal">{d.desc}</div>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#FFF8D2]/80 text-[#2D6A24] border border-[#84D175]/30 group-hover:bg-[#84D175]/30 transition-colors">
                  {d.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES: WHY TRIPCRAFT (Pure Editorial Typography & Translucent Cards) ── */}
      <section id="features" className="relative z-10 py-16 px-5 max-w-7xl w-full mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#1a2e1a] tracking-tight">Why TripCraft</h2>
          <p className="text-xs sm:text-sm text-[#4a5e4a] font-normal max-w-lg mx-auto">Engineered for bespoke dynamic tour packages with strict backend algorithms</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => {
            return (
              <div key={f.title} className="bg-white/50 backdrop-blur-md border border-[#84D175]/30 hover:border-[#84D175] rounded-3xl p-7 shadow-xs hover:shadow-xl transition-all duration-300 space-y-3 hover:-translate-y-1">
                <div className="flex items-center justify-between border-b border-[#84D175]/20 pb-2">
                  <span className="font-serif text-2xl font-bold text-[#2D6A24]">{f.num}</span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[#4a5e4a]">Core System</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1a2e1a]">{f.title}</h3>
                <p className="text-xs text-[#4a5e4a] leading-relaxed font-normal">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[#84D175]/25 bg-white/40 backdrop-blur-md py-8 px-5 text-xs text-[#4a5e4a] font-normal w-full flex justify-center">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>TripCraft © 2026 · Dynamic Tour Package Architect (PS-04)</span>
          <div className="flex items-center gap-4 text-[#2D6A24] font-semibold">
            <span>Decimal Pricing Engine</span>
            <span className="text-[#84D175]">·</span>
            <span>Guide Availability Check</span>
            <span className="text-[#84D175]">·</span>
            <span>Grounded Gemini AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
