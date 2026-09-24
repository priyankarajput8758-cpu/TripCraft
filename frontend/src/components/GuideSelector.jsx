import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  UserCheck, AlertTriangle, CheckCircle2, Star, Languages, BadgeCheck,
  ArrowRight, ShieldAlert, Sparkles, Clock
} from 'lucide-react';

export default function GuideSelector({
  packageId,
  cityId,
  startDate,
  durationDays,
  selectedGuide,
  onSelectGuide,
  preferredLanguage,
  availableGuides = []
}) {
  const [guides, setGuides] = useState(availableGuides);
  const [loading, setLoading] = useState(false);
  const [availabilityCheck, setAvailabilityCheck] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [specialisationFilter, setSpecialisationFilter] = useState('');

  // Fetch or update available guides when city, language or specialisation changes
  useEffect(() => {
    async function loadGuides() {
      if (!cityId) return;
      setLoading(true);
      try {
        const res = await api.getGuides({
          city_id: cityId,
          language: preferredLanguage,
          specialisation: specialisationFilter || undefined
        });
        const list = res?.guides || (Array.isArray(res) ? res : []);
        setGuides(list.length > 0 ? list : availableGuides);
      } catch (err) {
        console.error('Error fetching guides:', err);
        setGuides(availableGuides);
      } finally {
        setLoading(false);
      }
    }
    loadGuides();
  }, [cityId, preferredLanguage, specialisationFilter]);

  // Check availability whenever selectedGuide or startDate changes
  useEffect(() => {
    async function verifyGuide() {
      if (!selectedGuide || !startDate) {
        setAvailabilityCheck(null);
        return;
      }
      setCheckingAvailability(true);
      try {
        const res = await api.checkGuideAvailability(
          selectedGuide.guide_id,
          startDate,
          durationDays,
          packageId,
          cityId,
          preferredLanguage
        );
        setAvailabilityCheck(res);
      } catch (err) {
        console.error('Error checking guide availability:', err);
      } finally {
        setCheckingAvailability(false);
      }
    }
    verifyGuide();
  }, [selectedGuide?.guide_id, startDate, durationDays, packageId, cityId, preferredLanguage]);

  const handleGuideChange = (guideId) => {
    if (!guideId) {
      onSelectGuide(null);
      setAvailabilityCheck(null);
      return;
    }
    const guide = guides.find(g => g.guide_id === guideId);
    if (guide) {
      onSelectGuide(guide);
    }
  };

  const handleAcceptSubstitute = (substitute) => {
    if (!substitute) return;
    onSelectGuide({
      guide_id: substitute.guide_id,
      display_name: substitute.display_name || substitute.name,
      rating: substitute.rating,
      languages: substitute.languages,
      specialisation: substitute.specialisation,
      day_rate: substitute.day_rate,
      currency: substitute.currency
    });
  };

  const guideDisplayName = selectedGuide?.display_name || selectedGuide?.name || 'Local Guide';

  return (
    <div className="bg-[#fffbeb] border-2 border-[#fcd34d] rounded-3xl p-6 space-y-4 shadow-sm text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-900 font-bold flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-amber-900" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Optional Local Tour Guide
            </h3>
            <p className="text-xs text-slate-600">
              Add a certified local expert matching your preferred language
            </p>
          </div>
        </div>

        {/* Filter by Specialisation */}
        <select
          value={specialisationFilter}
          onChange={(e) => setSpecialisationFilter(e.target.value)}
          className="bg-white border border-amber-300 text-xs font-semibold text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
        >
          <option value="">All Specialisations</option>
          <option value="heritage">Heritage & History</option>
          <option value="food">Food & Culinary</option>
          <option value="trekking">Trekking & Hiking</option>
          <option value="wildlife">Wildlife & Nature</option>
          <option value="photography">Photography</option>
          <option value="religious">Religious & Spiritual</option>
        </select>
      </div>

      {/* Guide Dropdown / Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Local Guide (Optional Component)
          </label>
          <select
            value={selectedGuide?.guide_id || ''}
            onChange={(e) => handleGuideChange(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
          >
            <option value="">No Guide (Self-Guided Tour)</option>
            {guides.map((g) => {
              const name = g.display_name || g.name;
              return (
                <option key={g.guide_id} value={g.guide_id}>
                  {name} — {g.specialisation?.toUpperCase()} (★ {g.rating}) • {g.languages} • ₹{parseFloat(g.day_rate || 0).toLocaleString('en-IN')}/day
                </option>
              );
            })}
          </select>
        </div>

        {/* Selected Guide Card inside Amber Container (Matching Screenshot 3) */}
        <div className="bg-white border border-amber-300/80 rounded-xl p-3 flex flex-col justify-center shadow-sm">
          {selectedGuide ? (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{guideDisplayName}</span>
                <span className="flex items-center text-amber-600 font-bold text-[11px]">
                  <Star className="w-3 h-3 fill-current mr-0.5" />
                  {selectedGuide.rating}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Lang: <span className="font-bold text-slate-900">{selectedGuide.languages}</span> • Spec: <span className="font-bold text-slate-900">{selectedGuide.specialisation}</span>
              </div>
              <div className="text-[11px] text-emerald-700 font-bold pt-0.5 font-mono flex items-center justify-between">
                <span>Rate: ₹{parseFloat(selectedGuide.day_rate || 0).toLocaleString('en-IN')}/day</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ Available</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic text-center">
              No guide selected. Select a guide to verify real-time calendar availability.
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Availability Check Status Banner (§2.2) */}
      {checkingAvailability && (
        <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white p-3 rounded-xl border border-amber-200">
          <Clock className="w-4 h-4 text-amber-600 animate-spin" />
          <span>Verifying real-time calendar availability against package dates...</span>
        </div>
      )}

      {availabilityCheck && !checkingAvailability && (
        <>
          {availabilityCheck.is_available ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-emerald-800">
                  Guide Confirmed Available
                </div>
                <p className="text-slate-700">
                  {guideDisplayName} is 100% available for all {durationDays} days starting {startDate}.
                  {availabilityCheck.price_multiplier && parseFloat(availabilityCheck.price_multiplier) > 1 && (
                    <span className="text-amber-800 font-bold ml-1">
                      (Peak date rate multiplier: {availabilityCheck.price_multiplier}x applied)
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            /* Mandatory Refusal Flow with Exact Clashing Date & Substitute (§2.2) */
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-black text-rose-800 flex items-center gap-2">
                    <span>Selection Refused — Calendar Clash Detected</span>
                    <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] px-2 py-0.5 rounded-md">
                      Clash Date: {availabilityCheck.clashing_date}
                    </span>
                  </div>
                  <p className="text-xs text-rose-900 leading-relaxed font-medium">
                    {availabilityCheck.message}
                  </p>
                </div>
              </div>

              {/* Substitute Recommendation Card */}
              {availabilityCheck.substitute_guide ? (
                <div className="bg-white border border-teal-300 rounded-xl p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      Nearest Available Matching Substitute
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200">
                      Same Language & Specialisation
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {availabilityCheck.substitute_guide.display_name || availabilityCheck.substitute_guide.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ★ {availabilityCheck.substitute_guide.rating} • {availabilityCheck.substitute_guide.specialisation} • {availabilityCheck.substitute_guide.languages}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        ₹{parseFloat(availabilityCheck.substitute_guide.day_rate).toLocaleString('en-IN')}/day
                      </div>
                      <div className={`text-[11px] font-bold font-mono ${
                        parseFloat(availabilityCheck.substitute_guide.price_delta) >= 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        Delta: {parseFloat(availabilityCheck.substitute_guide.price_delta) >= 0 ? '+' : ''}₹{parseFloat(availabilityCheck.substitute_guide.price_delta).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptSubstitute(availabilityCheck.substitute_guide)}
                    className="w-full mt-2 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>Accept Substitute ({availabilityCheck.substitute_guide.display_name || availabilityCheck.substitute_guide.name}) & Reprice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded border border-amber-200">
                  No alternative guides with matching specialisation are available for this entire date range. Consider adjusting your travel dates or opting for a self-guided experience.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
