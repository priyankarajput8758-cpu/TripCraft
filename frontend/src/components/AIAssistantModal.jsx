import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { api } from '../api';

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
        language: currentLanguage || 'en',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C2D45]/60 backdrop-blur-md animate-in">

      <div className="relative w-full max-w-2xl bg-[#FFF8D2]/90 border border-[#84D175]/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1a2e1a] backdrop-blur-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#84D175]/30 bg-white/50">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#1a2e1a] flex items-center gap-2.5">
              <Bot className="w-6 h-6 text-[#2D6A24]" />
              <span>Grounded AI Trip Builder</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#84D175]/35 text-[#2D6A24] border border-[#84D175]/45 font-bold uppercase">
                Gemini Grounded
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#1a2e1a] font-medium mt-0.5">
              Matches exact catalog packages or dynamically prepares the Custom Architect
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold text-[#1a2e1a] hover:bg-[#84D175]/30 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Query Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-[#1a2e1a] uppercase tracking-wider mb-2">
                What kind of trip are you envisioning?
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={3}
                placeholder="E.g., Create a 5-day Bhuvaneshwar and food tour package with a Marathi speaking guide under ₹40,000"
                className="w-full bg-white/80 border border-[#84D175]/45 rounded-2xl p-4 text-sm sm:text-base text-[#1a2e1a] font-semibold focus:outline-none focus:border-[#84D175] transition-all placeholder:text-[#1a2e1a]/40"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#1a2e1a] mb-1.5 uppercase tracking-wider">
                  Target Budget Max (₹ INR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="40000"
                  className="w-full bg-white/80 border border-[#84D175]/45 rounded-xl px-4 py-3 text-sm sm:text-base font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#1a2e1a] mb-1.5 uppercase tracking-wider">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="5"
                  className="w-full bg-white/80 border border-[#84D175]/45 rounded-xl px-4 py-3 text-sm sm:text-base font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-sm sm:text-base rounded-xl shadow-md shadow-[#84D175]/25 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99] text-center"
            >
              {loading ? (
                <span>Evaluating Verified Database Catalog & Requirements...</span>
              ) : (
                <span>Find or Synthesize Itinerary →</span>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50/90 border border-rose-300 text-xs sm:text-sm text-rose-800 font-bold">
              {error}
            </div>
          )}

          {/* CASE 1: Curated Package Found */}
          {aiResult && matchedPkg && !isCustomArchitect && (
            <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#84D175]/45 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#84D175]/25 pb-3">
                <div className="space-y-1">
                  <span className="text-xs px-3 py-1 rounded-full bg-[#84D175]/30 text-[#2D6A24] font-bold uppercase border border-[#84D175]/40">
                    Exact Curated Match Found
                  </span>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1a2e1a] pt-1">
                    {pkgTitle}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-serif font-bold text-[#2D6A24]">
                    {reprice?.currency_symbol || (matchedPkg?.currency === 'INR' || !matchedPkg?.currency ? '₹' : `${matchedPkg.currency} `)}
                    {parseFloat(reprice?.total_price || matchedPkg.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-[#1a2e1a] block font-bold">Verified Decimal Total</span>
                </div>
              </div>

              {/* Rationale Explanation */}
              <div className="text-xs sm:text-sm text-[#1a2e1a] bg-white/85 p-4 rounded-xl border border-[#84D175]/35 space-y-1.5">
                <div className="font-bold text-[#2D6A24] text-xs sm:text-sm flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-[#2D6A24]" />
                  <span>Grounded AI Rationale:</span>
                </div>
                <p className="leading-relaxed text-[#1a2e1a] font-medium">
                  {aiResult.ai_explanation}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={handleApplyToStudio}
                className="w-full py-3.5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-sm sm:text-base rounded-xl transition-all shadow-md shadow-[#84D175]/25 cursor-pointer active:scale-95 text-center"
              >
                Load Package into Customization Studio →
              </button>
            </div>
          )}

          {/* CASE 2: Direct to Custom Destination Architect */}
          {aiResult && isCustomArchitect && (
            <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#84D175]/45 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#84D175]/25 pb-3">
                <div className="space-y-1">
                  <div className="inline-block text-xs px-3 py-1 rounded-full bg-[#84D175]/30 text-[#2D6A24] font-bold uppercase tracking-wider border border-[#84D175]/40">
                    Redirecting to Custom Destination Architect
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1a2e1a] pt-1">
                    {customPkg?.trip_title || `Custom ${aiResult.duration_days}-Day ${aiResult.destination_name} Explorer`}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-serif font-bold text-[#2D6A24]">
                    ₹{parseFloat(customPkg?.estimated_pricing?.grand_total || aiResult.target_budget || 36000).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-[#1a2e1a] block font-bold">Estimated Pricing</span>
                </div>
              </div>

              {/* Pre-Selected Parameters Summary */}
              <div className="grid grid-cols-3 gap-2.5 text-xs sm:text-sm">
                <div className="bg-white/80 border border-[#84D175]/35 p-2.5 rounded-xl text-center">
                  <span className="text-xs text-[#1a2e1a] block uppercase font-bold">Destination</span>
                  <span className="font-bold text-[#2D6A24] text-sm">{aiResult.destination_name}</span>
                </div>
                <div className="bg-white/80 border border-[#84D175]/35 p-2.5 rounded-xl text-center">
                  <span className="text-xs text-[#1a2e1a] block uppercase font-bold">Duration</span>
                  <span className="font-bold text-[#2D6A24] text-sm">{aiResult.duration_days} Days</span>
                </div>
                <div className="bg-white/80 border border-[#84D175]/35 p-2.5 rounded-xl text-center">
                  <span className="text-xs text-[#1a2e1a] block uppercase font-bold">Language</span>
                  <span className="font-bold text-[#2D6A24] text-sm uppercase">{aiResult.preferred_language || 'en'}</span>
                </div>
              </div>

              {/* Rationale Explanation */}
              <div className="text-xs sm:text-sm text-[#1a2e1a] bg-white/85 p-4 rounded-xl border border-[#84D175]/35 space-y-1.5">
                <div className="font-bold text-[#2D6A24] text-xs sm:text-sm flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-[#2D6A24]" />
                  <span>Pre-Configured Architecture:</span>
                </div>
                <p className="leading-relaxed text-[#1a2e1a] font-medium">
                  {aiResult.ai_explanation}
                </p>
                <div className="text-xs sm:text-sm text-[#2D6A24] font-bold pt-1">
                  Options are pre-selected — you can review, add, or swap any item in the Customizer.
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleApplyToCustomArchitect}
                className="w-full py-4 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-sm sm:text-base rounded-xl transition-all shadow-md shadow-[#84D175]/25 cursor-pointer active:scale-95 text-center"
              >
                Open in Custom Architect (Pre-Selected Options) →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
