import React, { useState, useEffect } from 'react';
import {
  Compass, Sparkles, ArrowRight, MapPin, Shield,
  Zap, Globe, Users, Check, Waves, Castle,
  Trees, Flame, Building2, Heart, ShieldCheck, CheckCircle2,
  Lock, ArrowUpRight, Layers
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────── */
const DESTINATIONS = [
  { name: 'Goa',        tag: 'Beach',     grad: 'from-[#84D175] to-[#3C8B30]', icon: Waves,     desc: 'Sun · Sand · Serenity' },
  { name: 'Jaipur',     tag: 'Heritage',  grad: 'from-amber-500 to-rose-500',   icon: Castle,    desc: 'Pink City · Rajasthan' },
  { name: 'Munnar',     tag: 'Nature',    grad: 'from-emerald-500 to-teal-600', icon: Trees,     desc: 'Tea Gardens · Kerala' },
  { name: 'Varanasi',   tag: 'Spiritual', grad: 'from-orange-500 to-amber-500', icon: Flame,     desc: 'Sacred Ghats · UP' },
  { name: 'Bengaluru',  tag: 'Culture',   grad: 'from-indigo-500 to-purple-500',icon: Building2, desc: 'Garden City · Karnataka' },
  { name: 'Udaipur',    tag: 'Romantic',  grad: 'from-pink-500 to-rose-500',    icon: Heart,     desc: 'City of Lakes · Rajasthan' },
];

const FEATURES = [
  { icon: Sparkles,   color: 'text-[#3C8B30]', bg: 'bg-[#84D175]/15 border-[#84D175]/30',
    title: 'AI Package Builder',   desc: 'Describe your dream trip in plain language. Our Gemini AI engine finds real matching packages from the catalog in seconds.' },
  { icon: Zap,        color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100',
    title: 'Live Repricing',        desc: 'Swap hotel tiers, activities, or guides — your total recalculates instantly in precise Decimal math.' },
  { icon: ShieldCheck,color: 'text-[#3C8B30]', bg: 'bg-[#84D175]/15 border-[#84D175]/30',
    title: 'Guide Availability',   desc: 'Every guide selection is checked against real calendar dates. If unavailable, we offer the nearest matching substitute.' },
  { icon: Globe,      color: 'text-sky-600',    bg: 'bg-sky-50 border-sky-100',
    title: 'Language Preference',  desc: 'Set your preferred guide language — Tamil, Hindi, Telugu and more. Packages and guides are filtered automatically.' },
  { icon: MapPin,     color: 'text-rose-500',   bg: 'bg-rose-50 border-rose-100',
    title: 'Interactive Map',      desc: 'Explore your itinerary on a live Leaflet map with OpenTripMap landmarks.' },
  { icon: Users,      color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',
    title: 'Expert Local Guides',  desc: 'Choose certified local experts by language, specialisation and rating.' },
];

const STATS = [
  { value: '60+',  label: 'Curated Packages' },
  { value: '21',   label: 'Destinations'     },
  { value: '100%', label: 'Decimal Precision'},
  { value: 'Live', label: 'Guide Availability'},
];

export default function LandingPage({ onGetStarted, onSignIn }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FFF8D2] text-[#1a2e1a] overflow-x-hidden selection:bg-[#84D175] selection:text-[#1a2e1a]">

      {/* ── Animated Background Blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Moss green blob top-left */}
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-[#84D175]/25 rounded-full blur-3xl animate-blob" />
        {/* Soft yellow blob top-right */}
        <div className="absolute -top-20 -right-40 w-96 h-96 bg-[#FFF3B0]/60 rounded-full blur-3xl animate-blob animation-delay-2000" />
        {/* Deep green blob bottom-center */}
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#84D175]/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* ── Header Nav ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#FFF8D2]/90 backdrop-blur-md border-b border-[#84D175]/30 shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={onGetStarted}>
            <div className="w-9 h-9 rounded-xl bg-[#84D175] flex items-center justify-center text-[#1a2e1a] font-black text-xl shadow-md shadow-[#84D175]/30">
              P
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-[#1a2e1a]">PackagePro</span>

            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-[#4a5e4a]">
            <a href="#features"     className="hover:text-[#3C8B30] transition-colors">Features</a>
            <a href="#destinations" className="hover:text-[#3C8B30] transition-colors">Destinations</a>
            <a href="#how"          className="hover:text-[#3C8B30] transition-colors">How It Works</a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="hidden sm:block text-xs font-bold text-[#4a5e4a] hover:text-[#3C8B30] transition-colors px-3 py-2 rounded-xl"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs shadow-lg shadow-[#84D175]/30 transition-all active:scale-95 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-36 pb-24 px-5 text-center max-w-5xl mx-auto space-y-8">
        
        {/* Eyebrow */}


        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl font-black text-[#1a2e1a] tracking-tight leading-[1.06]">
          Your Dream Trip,{' '}
          <span className="bg-gradient-to-r from-[#3C8B30] via-[#84D175] to-[#4FAF3F] bg-clip-text text-transparent">
            Crafted Live.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-[#4a5e4a] max-w-2xl mx-auto font-medium leading-relaxed">
          Browse curated packages or let AI build one. Swap hotels, guides, and activities — watch your price update in real time with exact decimal precision.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onGetStarted}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-base shadow-xl shadow-[#84D175]/30 transition-all cursor-pointer active:scale-95"
          >
            
            <span>Start Building My Trip</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/80 border border-[#84D175]/40 text-[#1a2e1a] font-bold text-sm hover:bg-white transition-all shadow-sm cursor-pointer backdrop-blur-sm"
          >
            <Lock className="w-4 h-4 text-[#84D175]" />
            <span>Sign In to Account</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-10">
          {STATS.map(s => (
            <div key={s.label} className="bg-white/80 border border-[#84D175]/25 rounded-2xl p-5 shadow-sm text-center hover:shadow-md hover:border-[#84D175]/60 transition-all backdrop-blur-sm">
              <div className="text-2xl sm:text-3xl font-black text-[#3C8B30] font-mono tracking-tight">{s.value}</div>
              <div className="text-xs text-[#4a5e4a] font-bold uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section id="destinations" className="relative z-10 py-16 px-5 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-[#84D175]/30 text-[#3C8B30] text-[11px] font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-[#84D175]" />
            <span>Handpicked Destinations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1a2e1a] tracking-tight">Popular Destinations</h2>
          <p className="text-xs sm:text-sm text-[#4a5e4a] font-medium max-w-lg mx-auto">Explore top customizable holiday packages tailored across India</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DESTINATIONS.map(d => {
            const IconComp = d.icon;
            return (
              <div
                key={d.name}
                onClick={onGetStarted}
                className="group bg-white/85 border border-[#84D175]/20 hover:border-[#84D175]/70 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between cursor-pointer backdrop-blur-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${d.grad} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1a2e1a] text-base group-hover:text-[#3C8B30] transition-colors">{d.name}</div>
                    <div className="text-xs text-[#4a5e4a] font-medium">{d.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FFF8D2] text-[#3C8B30] border border-[#84D175]/30 group-hover:bg-[#84D175]/20 transition-colors">
                    {d.tag}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#84D175] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 py-16 px-5 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-[#84D175]/30 text-[#3C8B30] text-[11px] font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#84D175]" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1a2e1a] tracking-tight">Why PackagePro</h2>
          <p className="text-xs sm:text-sm text-[#4a5e4a] font-medium max-w-lg mx-auto">Engineered for modern customizable travel with strict backend algorithms</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-white/85 border border-[#84D175]/20 hover:border-[#84D175]/60 rounded-3xl p-7 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 hover:-translate-y-1 backdrop-blur-sm">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${f.bg}`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-extrabold text-[#1a2e1a]">{f.title}</h3>
                <p className="text-xs text-[#4a5e4a] leading-relaxed font-medium">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[#84D175]/30 bg-white/60 backdrop-blur-sm py-8 px-5 text-xs text-[#4a5e4a] font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>PackagePro (TripCraft) · KogniVera Hackathon 2026 (PS-04) · Team CodeBlooded</span>
          <div className="flex items-center gap-4 text-[#3C8B30] font-bold">
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
