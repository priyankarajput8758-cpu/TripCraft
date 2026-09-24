import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Zap,
  Building2,
  Star,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Check
} from 'lucide-react';

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
      const hotelList = res?.hotels || res?.data || [];
      setHotels(hotelList);
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
    <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Real-World Hotel Market Rates</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                SerpAPI Google Hotels Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live Google Hotels inventory for {cityName} cached for quota safety
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
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer"
          >
            {loading ? 'Searching...' : 'Check Rates'}
          </button>
        </form>
      </div>

      {/* Live Hotel Rate Cards */}
      {loading ? (
        <div className="py-8 text-center space-y-2">
          <Clock className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Fetching live Google Hotels market rates via SerpAPI...</p>
        </div>
      ) : hotels.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400 bg-slate-950/40 rounded-xl">
          No live hotel properties found for "{searchQuery}". Try searching for another city name.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {hotels.map((hotel, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5 hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{hotel.name}</h4>
                  {hotel.rating && (
                    <span className="flex items-center text-amber-400 font-semibold text-[11px] shrink-0">
                      <Star className="w-3 h-3 fill-current mr-0.5" />
                      {hotel.rating}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {hotel.hotel_class ? `${hotel.hotel_class} Star • ` : ''}{hotel.reviews ? `${hotel.reviews} reviews` : 'Verified Property'}
                </div>
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {hotel.amenities.slice(0, 3).map((am, i) => (
                      <span key={i} className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                        {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Live Market Rate</span>
                  <span className="text-sm font-extrabold text-amber-400 font-mono">
                    {hotel.price_formatted || (hotel.rate_per_night ? `₹${parseFloat(hotel.rate_per_night).toLocaleString('en-IN')}` : 'Check Link')}
                    <span className="text-[10px] font-normal text-slate-400"> /night</span>
                  </span>
                </div>

                {hotel.link && (
                  <a
                    href={hotel.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
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
