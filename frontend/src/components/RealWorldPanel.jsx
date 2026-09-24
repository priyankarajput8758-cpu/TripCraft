import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Zap, Star, ExternalLink, Clock, Search } from 'lucide-react';

export default function RealWorldPanel({ cityName = 'Bengaluru' }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(cityName);

  useEffect(() => {
    setSearchQuery(cityName);
  }, [cityName]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery) return;
    setLoading(true);
    try {
      const res = await api.searchLiveHotels(searchQuery);
      const list = res?.hotels || res?.data || [];
      setHotels(list);
    } catch (err) {
      console.error('Error fetching live hotels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [cityName]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Real-World Hotel Market Comparison</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                SerpAPI Google Hotels Live
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Live external market rates cached for instant comparison
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
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
          >
            {loading ? 'Searching...' : 'Check Rates'}
          </button>
        </form>
      </div>

      {/* Live Hotel Rate Cards */}
      {loading ? (
        <div className="py-8 text-center space-y-2">
          <Clock className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Fetching live Google Hotels market rates via SerpAPI...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {hotels.map((hotel, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 hover:border-amber-400 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{hotel.name}</h4>
                  {hotel.overall_rating && (
                    <span className="flex items-center text-amber-600 font-bold text-[11px] shrink-0">
                      <Star className="w-3 h-3 fill-current mr-0.5" />
                      {hotel.overall_rating}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {hotel.hotel_class || 'Comfort Hotel'} • {hotel.reviews_count ? `${hotel.reviews_count} reviews` : 'Verified Property'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Live Market Rate</span>
                  <span className="text-sm font-black text-amber-600 font-mono">
                    ₹{parseFloat(hotel.rate_per_night || 0).toLocaleString('en-IN')}
                    <span className="text-[10px] font-normal text-slate-500"> /night</span>
                  </span>
                </div>

                {hotel.link && (
                  <a
                    href={hotel.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all shadow-sm"
                    title="View on Google Hotels"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
