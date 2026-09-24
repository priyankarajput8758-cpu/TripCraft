import React, { useState } from 'react';
import { api } from '../api';
import { Sparkles, X, AlertCircle, Clock, ArrowRight, ShieldCheck, Bot, Compass, CheckCircle2, Sliders } from 'lucide-react';

export default function AIAssistantModal({
  isOpen,
  onClose,
  onSelectAiPackage,
  onOpenCustomArchitect,
  currentLanguage = 'en'
}) {
  const [promptText, setPromptText] = useState('Create a 5-day Bhuvaneshwar and food tour package with a Marathi speaking guide under ₹40,000');
  const [budget, setBudget] = useState('40000');
  const [duration, setDuration] = useState('5');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAiResult(null);

    try {
      const res = await api.buildAiTrip({
        user_prompt: promptText,
        max_budget: budget ? parseFloat(budget) : null,
        duration_days: duration ? parseInt(duration) : null,
        preferred_language: currentLanguage
      });

      if (res && (res.package || res.redirect_to_custom_architect || res.action === 'custom_architect')) {
        setAiResult(res);
      } else if (res && res.detail) {
        setError(res.detail);
      } else {
        setError('Could not synthesize AI package with given parameters. Try broader search criteria.');
      }
    } catch (err) {
      console.error('AI trip builder error:', err);
      setError('Connection error with AI Engine. Please check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToStudio = () => {
    if (aiResult?.package) {
      onSelectAiPackage(aiResult.package);
      onClose();
    }
  };

  const handleApplyToCustomArchitect = () => {
    if (onOpenCustomArchitect && aiResult) {
      onOpenCustomArchitect({
        destination: aiResult.destination_name || 'Destination',
        duration: aiResult.duration_days || parseInt(duration) || 3,
        budget: aiResult.target_budget || (budget ? parseFloat(budget) : null),
        language: aiResult.preferred_language || currentLanguage,
        customRequests: aiResult.user_custom_requests || promptText,
        customPackage: aiResult.custom_package
      });
      onClose();
    }
  };

  const matchedPkg = aiResult?.package;
  const isCustomArchitect = aiResult?.redirect_to_custom_architect || aiResult?.action === 'custom_architect';
  const customPkg = aiResult?.custom_package;
  const reprice = aiResult?.reprice_summary;
  const pkgTitle = matchedPkg?.name || matchedPkg?.title || 'Matched Tour';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C2D45]/75 backdrop-blur-md animate-in">

      {/* Moss glow background orb */}
      <div className="absolute w-80 h-80 bg-[#84D175]/15 rounded-full blur-3xl pointer-events-none animate-blob" />

      <div className="relative w-full max-w-2xl bg-[#FFF8D2] border border-[#84D175]/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1a2e1a]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#84D175]/30 bg-white/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#84D175] text-[#1a2e1a] shadow-md shadow-[#84D175]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1a2e1a] flex items-center gap-2">
                <span>Grounded AI Trip Builder</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#84D175]/20 text-[#3C8B30] border border-[#84D175]/40 font-extrabold uppercase">
                  Gemini Grounded
                </span>
              </h2>
              <p className="text-xs text-[#4a5e4a] font-medium">
                Matches exact catalog packages or dynamically prepares the Custom Architect
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-[#84D175]/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Query Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4a5e4a] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#1a2e1a]" />
                <span>What kind of trip are you envisioning?</span>
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={3}
                placeholder="E.g., Create a 5-day Bhuvaneshwar and food tour package with a Marathi speaking guide under ₹40,000"
                className="w-full bg-white/90 border border-[#84D175]/40 rounded-2xl p-3.5 text-xs sm:text-sm text-[#1a2e1a] font-semibold focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20 transition-all placeholder:text-[#4a5e4a]/50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4a5e4a] mb-1 uppercase tracking-wider">
                  Target Budget Max (₹ INR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="40000"
                  className="w-full bg-white/90 border border-[#84D175]/40 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4a5e4a] mb-1 uppercase tracking-wider">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="5"
                  className="w-full bg-white/90 border border-[#84D175]/40 rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs rounded-xl shadow-lg shadow-[#84D175]/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-[#1a2e1a]" />
                  <span>Evaluating Verified Database Catalog & Requirements...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#1a2e1a]" />
                  <span>Find or Synthesize Itinerary</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* CASE 1: Curated Package Found (Exact Duration & Budget Match) */}
          {aiResult && matchedPkg && !isCustomArchitect && (
            <div className="p-5 rounded-2xl bg-[#84D175]/15 border border-[#84D175]/35 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#84D175]/30 pb-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#84D175] text-[#1a2e1a] font-black uppercase">
                    Exact Curated Match Found
                  </span>
                  <h3 className="text-sm font-bold text-[#1a2e1a] pt-1">
                    {pkgTitle}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-[#3C8B30]">
                    {reprice?.currency_symbol || (matchedPkg?.currency === 'INR' || !matchedPkg?.currency ? '₹' : `${matchedPkg.currency} `)}
                    {parseFloat(reprice?.total_price || matchedPkg.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-[#4a5e4a] block font-medium">Verified Decimal Total</span>
                </div>
              </div>

              {/* Rationale Explanation */}
              <div className="text-xs text-[#1a2e1a] bg-white/90 p-3.5 rounded-xl border border-[#84D175]/30 space-y-1">
                <div className="font-bold text-[#3C8B30] text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Grounded AI Rationale:</span>
                </div>
                <p className="leading-relaxed text-[#4a5e4a] font-medium">
                  {aiResult.ai_explanation}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={handleApplyToStudio}
                className="w-full py-3 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-[#84D175]/20 cursor-pointer active:scale-95"
              >
                <span>Load Package into Customization Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* CASE 2: No Exact Curated Match -> Direct to Custom Destination Architect with Pre-Selected Options */}
          {aiResult && isCustomArchitect && (
            <div className="p-5 rounded-2xl bg-teal-50 border-2 border-teal-500/50 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-teal-200/80 pb-3">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-black uppercase tracking-wider">
                    <Compass className="w-3 h-3" />
                    <span>Redirecting to Custom Destination Architect</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 pt-1.5">
                    {customPkg?.trip_title || `Custom ${aiResult.duration_days}-Day ${aiResult.destination_name} Explorer`}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-teal-800">
                    ₹{parseFloat(customPkg?.estimated_pricing?.grand_total || aiResult.target_budget || 36000).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-medium">Estimated Pricing</span>
                </div>
              </div>

              {/* Pre-Selected Parameters Summary */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/80 border border-teal-200 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Destination</span>
                  <span className="font-black text-slate-900">{aiResult.destination_name}</span>
                </div>
                <div className="bg-white/80 border border-teal-200 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Duration</span>
                  <span className="font-black text-slate-900">{aiResult.duration_days} Days</span>
                </div>
                <div className="bg-white/80 border border-teal-200 p-2 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Guide / Language</span>
                  <span className="font-black text-slate-900 uppercase">{aiResult.preferred_language || 'en'}</span>
                </div>
              </div>

              {/* Rationale Explanation */}
              <div className="text-xs text-slate-800 bg-white/90 p-3.5 rounded-xl border border-teal-200 space-y-1">
                <div className="font-bold text-teal-700 text-[11px] flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Pre-Configured Architecture:</span>
                </div>
                <p className="leading-relaxed text-slate-600 font-medium">
                  {aiResult.ai_explanation}
                </p>
                <div className="text-[11px] text-teal-800 font-bold pt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Options are pre-selected (not locked) — you can review, add, or swap any item.</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleApplyToCustomArchitect}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/25 cursor-pointer active:scale-95"
              >
                <span>Open in Custom Architect (Pre-Selected Options)</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
