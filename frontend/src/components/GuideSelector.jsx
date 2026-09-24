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
  availableGuides = [],
  currencySymbol = '₹',
  packageCurrency = 'INR'
}) {
  const [guides, setGuides] = useState(availableGuides || []);
  const [loading, setLoading] = useState(false);
  const [availabilityCheck, setAvailabilityCheck] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [specialisationFilter, setSpecialisationFilter] = useState('');

  const guideList = Array.isArray(guides) ? guides : (guides?.guides || []);

  // Sync guides whenever availableGuides prop updates
  useEffect(() => {
    if (availableGuides) {
      const gList = Array.isArray(availableGuides) ? availableGuides : (availableGuides?.guides || []);
      if (gList.length > 0) setGuides(gList);
    }
  }, [availableGuides]);

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
        const list = Array.isArray(res) ? res : (res?.guides || []);
        if (list.length > 0) {
          setGuides(list);
        }
      } catch (err) {
        console.error('Error fetching guides:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGuides();
  }, [cityId, preferredLanguage, specialisationFilter]);

  // Check availability whenever selectedGuide or startDate changes (§2.2 Mandatory Enhancement)
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
          packageId
        );
        setAvailabilityCheck(res);
      } catch (err) {
        console.error('Error checking guide availability:', err);
      } finally {
        setCheckingAvailability(false);
      }
    }
    verifyGuide();
  }, [selectedGuide?.guide_id, startDate, durationDays, packageId]);

  const handleGuideChange = (guideId) => {
    if (!guideId) {
      onSelectGuide(null);
      setAvailabilityCheck(null);
      return;
    }
    const guide = guideList.find(g => g.guide_id === guideId);
    if (guide) {
      onSelectGuide(guide);
    }
  };

  const handleAcceptSubstitute = (substitute) => {
    if (!substitute) return;
    const newGuideObj = {
      guide_id: substitute.guide_id,
      display_name: substitute.display_name || substitute.name,
      name: substitute.display_name || substitute.name,
      rating: substitute.rating,
      languages: substitute.languages,
      specialisation: substitute.specialisation,
      day_rate: substitute.day_rate,
      currency: substitute.currency
    };
    // Ensure substitute is incorporated into the local guides dropdown list
    setGuides(prev => {
      const list = Array.isArray(prev) ? prev : (prev?.guides || []);
      if (!list.some(g => g.guide_id === substitute.guide_id)) {
        return [newGuideObj, ...list];
      }
      return list;
    });
    onSelectGuide(newGuideObj);
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
          <option value="heritage">Heritage</option>
          <option value="food">Food & Cuisine</option>
          <option value="trekking">Trekking</option>
          <option value="wildlife">Wildlife</option>
          <option value="photography">Photography</option>
          <option value="religious">Religious & Spiritual</option>
        </select>
      </div>

      {/* Guide Selection Dropdown */}
      <div className="space-y-2">
        <div className="relative">
          <select
            value={selectedGuide?.guide_id || ''}
            onChange={(e) => handleGuideChange(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-2xl p-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer shadow-xs"
          >
            <option value="">-- No Guide Selected (Self-Guided / {currencySymbol}0) --</option>
            {guideList.map((g) => {
              const name = g.display_name || g.name || 'Guide';
              const rate = parseFloat(g.day_rate || 2500);
              const rating = g.rating || '4.8';
              const langs = g.languages || 'English, Hindi';
              const spec = g.specialisation || 'General';

              return (
                <option key={g.guide_id} value={g.guide_id}>
                  {name} ★ {rating} ({langs}) • {spec} • {currencySymbol}{rate.toLocaleString('en-IN')}/day
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Selected Guide Details Card */}
      {selectedGuide && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">{guideDisplayName}</span>
                <span className="flex items-center text-xs text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-current mr-1 text-amber-500" />
                  {selectedGuide.rating || '4.9'}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  Certified
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center space-x-3">
                <span className="flex items-center">
                  <Languages className="w-3 h-3 mr-1 text-slate-400" />
                  {selectedGuide.languages || 'English, Hindi'}
                </span>
                <span>•</span>
                <span className="capitalize font-medium">{selectedGuide.specialisation || 'Heritage'} Guide</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-slate-900 font-mono">
                {currencySymbol}{parseFloat(selectedGuide.day_rate || 3500).toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-500"> /day</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {currencySymbol}{(parseFloat(selectedGuide.day_rate || 3500) * durationDays).toLocaleString('en-IN')} total ({durationDays} days)
              </div>
            </div>
          </div>

          {/* §2.2 Availability Verification Status Box */}
          {checkingAvailability && (
            <div className="flex items-center space-x-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl animate-pulse">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Verifying guide calendar across trip dates ({startDate} to Day {durationDays})...</span>
            </div>
          )}

          {availabilityCheck && (() => {
            const isAvailable = availabilityCheck.is_available === true || availabilityCheck.available === true;
            const clashDate = availabilityCheck.clashing_date || availabilityCheck.first_clash_date || availabilityCheck.first_clashing_date;
            const substitute = availabilityCheck.substitute_guide || availabilityCheck.substitute;
            const guideCurrencySymbol = selectedGuide.currency === 'JPY' ? '¥' : selectedGuide.currency === 'USD' ? '$' : '₹';

            return (
              <div>
                {isAvailable ? (
                  <div className="flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      ✓ Confirmed Available for all {durationDays} day(s) of your itinerary!
                    </span>
                  </div>
                ) : (
                  /* Clashing Date Refusal & Matching Substitute (§2.2 Mandatory Enhancement) */
                  <div className="space-y-3 bg-rose-50/80 border border-rose-200 p-3.5 rounded-2xl text-xs">
                    <div className="flex items-start space-x-2 text-rose-800">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-sm">Selection Refused — Date Clash</span>
                        <span className="text-rose-700">
                          <strong>{selectedGuide.display_name || selectedGuide.name}</strong> is unavailable {clashDate ? <>on <span className="font-black underline decoration-rose-500 bg-rose-100/80 px-1.5 py-0.5 rounded text-rose-900">{clashDate}</span></> : 'during the requested itinerary dates'}.
                        </span>
                      </div>
                    </div>

                    {/* Matching Substitute Guide Offer (§2.2) */}
                    {substitute && (
                      <div className="bg-white border border-amber-300 rounded-xl p-3 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Recommended Matching Substitute
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            Same Language ({substitute.languages}) & Specialisation ({substitute.specialisation})
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {substitute.display_name}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ★ {substitute.rating || '4.9'} • {guideCurrencySymbol}{parseFloat(substitute.day_rate || 3500).toLocaleString('en-IN')}/day
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAcceptSubstitute(substitute)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all flex items-center space-x-1 cursor-pointer shadow-xs shrink-0"
                          >
                            <span>Accept Substitute</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
