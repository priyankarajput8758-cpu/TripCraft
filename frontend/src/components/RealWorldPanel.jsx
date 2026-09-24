import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Zap, Star, ExternalLink, Clock, Search, Building2, Check, ArrowRight } from 'lucide-react';

export default function RealWorldPanel({
  cityName = 'Goa',
  onSelectHotel = null,
  selectedMarketHotel = null,
  durationNights = 3
}) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(cityName || 'Goa');

  useEffect(() => {
    if (cityName) {
      setSearchQuery(cityName);
      loadHotels(cityName);
    }
  }, [cityName]);

  const loadHotels = async (queryToSearch) => {
    const q = queryToSearch || searchQuery || cityName || 'Goa';
    setLoading(true);
    try {
      const res = await api.searchLiveHotels(q);
      const list = Array.isArray(res) ? res : (res?.hotels || res?.data || []);
      setHotels(list);
    } catch (err) {
      console.error('Error fetching live hotels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    loadHotels(searchQuery);
  };

  return (
    <div className="bg-white border border-[#84D175]/40 rounded-3xl p-6 space-y-4 shadow-sm text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Real-World Hotel Market Rates</span>
              {selectedMarketHotel && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Custom Stay Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Live Google Hotels market rates in {searchQuery || cityName || 'Destination'} — swap into your package with live repricing
            </p>
          </div>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination hotels..."
              className="bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-1.5 bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {loading ? 'Searching...' : 'Check Rates'}
          </button>
        </form>
      </div>

      {/* Live Hotel Rate Cards */}
      {loading ? (
        <div className="py-8 text-center space-y-2">
          <Clock className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Fetching live destination hotel market rates from Google Hotels...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {hotels.map((hotel, idx) => {
            const rating = hotel.overall_rating || hotel.rating || 4.5;
            const reviewCount = hotel.reviews_count || hotel.reviews || 420;
            const rate = parseFloat(hotel.rate_per_night || 3500);
            const isSelected = selectedMarketHotel?.name === hotel.name;
            const totalStayCost = rate * durationNights;

            // Direct hotel booking link or Google Travel Hotels rates page
            const bookingUrl = hotel.link || `https://www.google.com/travel/hotels?q=${encodeURIComponent(hotel.name + ' ' + (searchQuery || cityName))}`;

            return (
              <div
                key={idx}
                className={`rounded-2xl p-4 space-y-3 transition-all flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-emerald-50/70 border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200/80 hover:border-amber-400 hover:bg-slate-100/50'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{hotel.name}</h4>
                    <span className="flex items-center text-amber-600 font-bold text-[11px] shrink-0">
                      <Star className="w-3 h-3 fill-current mr-0.5" />
                      {rating}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
                    <span>{hotel.hotel_class ? `${hotel.hotel_class}-Star Hotel` : 'Verified Hotel'}</span>
                    <span>{reviewCount} reviews</span>
                  </div>
                  {hotel.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {hotel.description}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Live Market Rate</span>
                      <span className="text-sm font-black text-amber-600 font-mono">
                        ₹{rate.toLocaleString('en-IN')}
                        <span className="text-[10px] font-normal text-slate-500"> /night</span>
                      </span>
                    </div>

                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all shadow-xs"
                      title="View direct rates & booking on Google Travel Hotels"
                    >
                      <span>Booking Site</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>

                  {onSelectHotel && (
                    <button
                      type="button"
                      onClick={() => onSelectHotel(isSelected ? null : hotel)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-[#84D175] text-[#1a2e1a] hover:bg-[#67C456]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Selected as Package Stay (₹{totalStayCost.toLocaleString('en-IN')})</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Swap to this Hotel (+₹{totalStayCost.toLocaleString('en-IN')})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
