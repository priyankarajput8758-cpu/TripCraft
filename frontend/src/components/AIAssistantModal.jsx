import React, { useState } from 'react';
import { api } from '../api';
import { Sparkles, X, AlertCircle, Clock, ArrowRight, ShieldCheck, Bot } from 'lucide-react';

export default function AIAssistantModal({
  isOpen,
  onClose,
  onSelectAiPackage,
  currentLanguage = 'en'
}) {
  const [promptText, setPromptText] = useState('Create a 3-day heritage and food tour package with a Tamil speaking guide under ₹30,000');
  const [budget, setBudget] = useState('35000');
  const [duration, setDuration] = useState('3');
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

      if (res && res.package) {
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

  const matchedPkg = aiResult?.package;
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
                Synthesizes natural language wishes into real, verified database packages
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
                placeholder="E.g., 4-day adventure trip in Mumbai with trekking guide staying at deluxe hotel under 40000"
                className="w-full bg-white/90 border border-[#84D175]/40 rounded-2xl p-3.5 text-xs sm:text-sm text-[#1a2e1a] font-semibold focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20 transition-all placeholder:text-[#4a5e4a]/50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4a5e4a] mb-1 uppercase tracking-wider">
                  Budget Maximum (₹ INR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="35000"
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
                  placeholder="3"
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
                  <span>Synthesizing Grounded Database Itinerary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#1a2e1a]" />
                  <span>Generate Grounded AI Package</span>
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

          {/* AI Result Card */}
          {aiResult && matchedPkg && (
            <div className="p-5 rounded-2xl bg-[#84D175]/15 border border-[#84D175]/35 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#84D175]/30 pb-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#84D175] text-[#1a2e1a] font-black uppercase">
                    AI Matched Package
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
        </div>
      </div>
    </div>
  );
}
