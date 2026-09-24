import React, { useState, useEffect } from 'react';
import {
  Compass, Sparkles, ArrowRight, MapPin, Shield,
  Zap, Globe, Users, Check, Waves, Castle,
  Trees, Flame, Building2, Heart, ShieldCheck, CheckCircle2,
  Lock, ArrowUpRight, Layers, Sliders, Calendar, FileText
} from 'lucide-react';
import { AnimatedTopDock } from '../shaders/animated-top-dock/AnimatedTopDock';
import '../shaders/threeui.css';

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
    title: 'Language Preference',  desc: 'Set your preferred guide language — Tamil, Hindi, Telugu, Kannada and more. Packages and guides are filtered automatically.' },
  { icon: MapPin,     color: 'text-rose-500',   bg: 'bg-rose-50 border-rose-100',
    title: 'Interactive Map',      desc: 'Explore your itinerary on a live Leaflet map with OpenTripMap landmarks up to 90km radius.' },
  { icon: Users,      color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100',
    title: 'Expert Local Guides',  desc: 'Choose certified local experts by language, specialisation and rating with instant availability verification.' },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Choose or Build with AI',
    desc: 'Select from 60+ curated packages by theme, or state your budget and interests for Gemini AI to rank real catalog packages.',
    icon: Sparkles,
  },
  {
    step: '02',
    title: 'Customize Components & Reprice',
    desc: 'Swap hotel tiers, activities, and private transfers. Total price recalculates live from scratch using zero-float Decimal arithmetic.',
    icon: Sliders,
  },
  {
    step: '03',
    title: 'Certified Guide Clash Verification',
    desc: 'Select your preferred language guide. If calendar dates clash, the engine refuses the selection with the clashing date named and recommends a same-language substitute.',
    icon: ShieldCheck,
  },
  {
    step: '04',
    title: 'Instant Confirmation & Map',
    desc: 'Review your complete itinerary, verify live SerpAPI market rates, and book with immediate confirmation and interactive Leaflet map guidance.',
    icon: CheckCircle2,
  }
];

const STATS = [
  { value: '60+',  label: 'Curated Packages' },
  { value: '21',   label: 'Destinations'     },
  { value: '100%', label: 'Decimal Precision'},
  { value: 'Live', label: 'Guide Availability'},
];

export default function LandingPage({ onGetStarted, onSignIn }) {
  return (
    <div className="relative min-h-screen bg-[#FFF8D2] text-[#1a2e1a] overflow-x-hidden selection:bg-[#84D175] selection:text-[#1a2e1a]">

      {/* ── Animated Background Blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-[#84D175]/25 rounded-full blur-3xl animate-blob" />
        <div className="absolute -top-20 -right-40 w-96 h-96 bg-[#FFF3B0]/60 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-[#84D175]/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 w-full bg-[#FFF8D2]/95 border-b border-[#84D175]/30 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Brand Logo */}
          <div
            onClick={onGetStarted}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <img
              src="/logo.png"
              alt="TripCraft Logo"
              className="h-9 w-auto object-contain rounded-xl shadow-xs bg-white/90 p-0.5"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-[#1a2e1a]">TripCraft</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/75 p-1 rounded-2xl border border-[#84D175]/30 shadow-xs">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#3C8B30]" />
              <span>Curated Packages</span>
            </button>

            <button
              onClick={onGetStarted}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Custom Architect</span>
            </button>

            <a
              href="#destinations"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-white/90 transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Destinations</span>
            </a>

            <a
              href="#how"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-white/90 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-sky-500" />
              <span>How It Works</span>
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onSignIn}
              className="px-4 py-2 rounded-xl bg-white/90 border border-[#84D175]/40 text-[#1a2e1a] font-bold text-xs hover:bg-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#3C8B30]" />
              <span>Sign In</span>
            </button>

            <button
              onClick={onGetStarted}
              className="px-4 py-2 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs transition-all shadow-md shadow-[#84D175]/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Start Building</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative z-10 pt-14 sm:pt-20 pb-20 px-5 text-center max-w-5xl mx-auto space-y-8">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#84D175]/40 text-[#3C8B30] text-xs font-black tracking-wider uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#84D175]" />
          <span>Intelligent Travel Engine · Real-Time Dynamic Packages</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl font-black text-[#1a2e1a] tracking-tight leading-[1.06]">
          Your Dream Trip,{' '}
          <span className="bg-gradient-to-r from-[#3C8B30] via-[#84D175] to-[#4FAF3F] bg-clip-text text-transparent">
            Crafted Live.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-[#4a5e4a] max-w-2xl mx-auto font-medium leading-relaxed">
          Browse curated packages or let AI build one. Swap hotels, guides, and activities — watch your price update in real time with exact decimal precision and verified guide availability.
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

      {/* ── HOW IT WORKS (ANCHOR: #how) ── */}
      <section id="how" className="relative z-10 py-16 px-5 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-[#84D175]/30 text-[#3C8B30] text-[11px] font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-[#84D175]" />
            <span>Step-by-Step Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1a2e1a] tracking-tight">How TripCraft Works</h2>
          <p className="text-xs sm:text-sm text-[#4a5e4a] font-medium max-w-lg mx-auto">
            From initial discovery to live decimal repricing and verified guide booking in 4 intuitive steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS_STEPS.map((step) => {
            const IconComp = step.icon;
            return (
              <div
                key={step.step}
                className="bg-white/90 border border-[#84D175]/30 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-[#84D175]">
                      {step.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#84D175]/20 flex items-center justify-center text-[#3C8B30]">
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold text-[#1a2e1a]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#4a5e4a] leading-relaxed font-medium">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── DESTINATIONS (ANCHOR: #destinations) ── */}
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

      {/* ── FEATURES (ANCHOR: #features) ── */}
      <section id="features" className="relative z-10 py-16 px-5 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-[#84D175]/30 text-[#3C8B30] text-[11px] font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#84D175]" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1a2e1a] tracking-tight">Why TripCraft</h2>
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
          <span>TripCraft © 2026 · Dynamic Tour Package Architect</span>
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
