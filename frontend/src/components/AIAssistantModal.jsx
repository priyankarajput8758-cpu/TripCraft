import React, { useState } from 'react';
import { api } from '../api';
import {
  Sparkles,
  X,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  MapPin,
  Compass,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function AIAssistantModal({
  isOpen,
  onClose,
  onSelectAiPackage,
  currentLanguage = 'en'
}) {
  const [prompt, setPrompt] = useState('Create a 3-day heritage and food tour package with a Tamil speaking guide under ₹30,000');
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
        prompt,
        budget_max: budget ? parseFloat(budget) : null,
        duration_days: duration ? parseInt(duration) : null,
        preferred_language: currentLanguage
      });

      if (res.status === 'success') {
        setAiResult(res.data);
      } else {
        setError(res.detail || 'Could not assemble AI package with given parameters.');
      }
    } catch (err) {
      setError('Connection error with AI Engine. Please try again.');
      console.error(err);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-md shadow-teal-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Grounded AI Trip Builder</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium">
                  Gemini Grounded
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transforms your natural language desires into verified database packages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Query Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                What kind of trip are you envisioning?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="E.g., 4-day adventure trip in North India with heritage guide, staying at premium hotels under 40000"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Budget Maximum (₹ INR)
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="35000"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Duration (Days)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="3"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Verified DB Itinerary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Tailored Package</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Result Card */}
          {aiResult && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-teal-500/40 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 font-semibold uppercase">
                    AI Matched Package
                  </span>
                  <h3 className="text-sm font-bold text-white pt-1">
                    {aiResult.package.title}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-teal-400">
                    ₹{parseFloat(aiResult.estimated_total || aiResult.package.base_price).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Est. Total</span>
                </div>
              </div>

              {/* Rationale Explanation */}
              <div className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="font-semibold text-teal-400 text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Grounded Selection Rationale:
                </div>
                <p className="leading-relaxed text-slate-300">
                  {aiResult.rationale}
                </p>
              </div>

              {/* Suggested Swaps */}
              {aiResult.suggested_swaps && aiResult.suggested_swaps.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Optimized Component Inclusions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.suggested_swaps.map((id, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2.5 py-1 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <button
                onClick={handleApplyToStudio}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-teal-500/10"
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
