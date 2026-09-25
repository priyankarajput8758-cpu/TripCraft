import React, { useState, useEffect } from 'react';
import { api } from '../api';

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

  useEffect(() => {
    if (availableGuides) {
      const gList = Array.isArray(availableGuides) ? availableGuides : (availableGuides?.guides || []);
      if (gList.length > 0) setGuides(gList);
    }
  }, [availableGuides]);

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
    <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/40 rounded-3xl p-6 space-y-4 shadow-xs text-[#1a2e1a]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#84D175]/25 pb-3">
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1a2e1a]">
            Optional Local Tour Guide
          </h3>
          <p className="text-sm sm:text-base text-[#1a2e1a] font-medium">
            Add a certified local guide speaking your preferred language
          </p>
        </div>

        {/* Filter by Specialisation */}
        <select
          value={specialisationFilter}
          onChange={(e) => setSpecialisationFilter(e.target.value)}
          className="bg-white/90 backdrop-blur-sm border border-[#84D175]/45 text-sm font-bold text-[#1a2e1a] rounded-xl px-4 py-2.5 focus:outline-none cursor-pointer shadow-xs"
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
            className="w-full bg-white/90 backdrop-blur-sm border border-[#84D175]/45 rounded-2xl p-4 text-sm sm:text-base font-bold text-[#1a2e1a] focus:outline-none focus:border-[#84D175] cursor-pointer shadow-xs"
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
                  {name} (Rating: {rating}) · {langs} · {spec} · {currencySymbol}{rate.toLocaleString('en-IN')}/day
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Selected Guide Details Card */}
      {selectedGuide && (
        <div className="bg-white/75 backdrop-blur-md border border-[#84D175]/40 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2.5">
                <span className="font-serif font-bold text-[#1a2e1a] text-xl">{guideDisplayName}</span>
                <span className="text-xs sm:text-sm text-[#2D6A24] font-bold bg-[#84D175]/30 px-3 py-0.5 rounded-full border border-[#84D175]/40">
                  Rating: {selectedGuide.rating || '4.9'}
                </span>
                <span className="text-xs sm:text-sm bg-[#84D175]/25 text-[#2D6A24] font-bold px-3 py-0.5 rounded-full">
                  Certified
                </span>
              </div>
              <div className="text-sm sm:text-base text-[#1a2e1a] flex items-center space-x-2 font-bold">
                <span>{selectedGuide.languages || 'English, Hindi'}</span>
                <span>·</span>
                <span className="capitalize">{selectedGuide.specialisation || 'Heritage'} Guide</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl font-serif font-bold text-[#1a2e1a]">
                {currencySymbol}{parseFloat(selectedGuide.day_rate || 3500).toLocaleString('en-IN')}
                <span className="text-xs sm:text-sm font-bold text-[#1a2e1a]"> /day</span>
              </div>
              <div className="text-xs sm:text-sm text-[#1a2e1a] font-semibold">
                {currencySymbol}{(parseFloat(selectedGuide.day_rate || 3500) * durationDays).toLocaleString('en-IN')} total ({durationDays} days)
              </div>
            </div>
          </div>

          {/* §2.2 Availability Verification Status */}
          {checkingAvailability && (
            <div className="text-sm text-[#2D6A24] bg-[#84D175]/25 p-3 rounded-xl font-bold animate-pulse">
              Verifying guide calendar across trip dates ({startDate} to Day {durationDays})...
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
                  <div className="text-sm text-[#2D6A24] bg-[#84D175]/25 border border-[#84D175]/45 p-3 rounded-xl font-bold">
                    Confirmed Available for all {durationDays} day(s) of your itinerary.
                  </div>
                ) : (
                  /* Clashing Date Refusal & Matching Substitute */
                  <div className="space-y-3.5 bg-rose-50/90 backdrop-blur-sm border border-rose-300 p-4 rounded-2xl text-sm">
                    <div className="space-y-1 text-rose-800">
                      <span className="font-serif font-bold block text-base sm:text-lg">Selection Refused — Date Clash</span>
                      <span className="text-rose-900 font-semibold leading-relaxed">
                        <strong>{selectedGuide.display_name || selectedGuide.name}</strong> is unavailable {clashDate ? <>on <span className="font-bold underline decoration-rose-500 bg-rose-100/90 px-2 py-0.5 rounded text-rose-950">{clashDate}</span></> : 'during the requested itinerary dates'}.
                      </span>
                    </div>

                    {/* Matching Substitute Guide Offer */}
                    {substitute && (
                      <div className="bg-white/90 backdrop-blur-sm border border-[#84D175]/45 rounded-xl p-4 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#2D6A24]">
                            Recommended Matching Substitute
                          </span>
                          <span className="text-xs sm:text-sm text-[#1a2e1a] font-bold">
                            Same Language ({substitute.languages}) & Specialisation ({substitute.specialisation})
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-serif font-bold text-[#1a2e1a] text-lg">
                              {substitute.display_name}
                            </div>
                            <div className="text-xs sm:text-sm text-[#1a2e1a] font-bold">
                              Rating: {substitute.rating || '4.9'} · {guideCurrencySymbol}{parseFloat(substitute.day_rate || 3500).toLocaleString('en-IN')}/day
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAcceptSubstitute(substitute)}
                            className="px-5 py-2.5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                          >
                            Accept Substitute
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
