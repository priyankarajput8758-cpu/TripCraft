import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Twitter,
  Mail,
  Link,
  X,
  Download,
  BookmarkCheck
} from 'lucide-react';

function ShareModal({ isOpen, onClose, packageName, total, destination }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}?pkg=${encodeURIComponent(packageName)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Share Your Trip</h2>
              <p className="text-xs text-slate-400">Share your customized package</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Package preview card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1">
            <div className="font-bold text-white text-sm">{packageName}</div>
            <div className="text-slate-400">{destination} · {total}</div>
            <div className="text-teal-400 text-[11px] mt-1">TripCraft Custom Itinerary</div>
          </div>

          {/* Share link */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Share Link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono truncate">
                {shareUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-xl border transition-all ${
                  copied
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {copied && (
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> Copied to clipboard!
              </div>
            )}
          </div>

          {/* Share options */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.open(`mailto:?subject=Check out my TripCraft package&body=${shareUrl}`)}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-300 hover:text-white transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              Share via Email
            </button>
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out my custom trip: ${shareUrl}`)}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-slate-300 hover:text-white transition-all"
            >
              <Twitter className="w-3.5 h-3.5" />
              Share on X (Twitter)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SaveShareActions({
  packageName,
  totalPrice,
  destination,
  onBook,
  bookingPrice,
  savedState = false
}) {
  const [saved, setSaved] = useState(savedState);
  const [shareOpen, setShareOpen] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        {/* Save button */}
        <button
          onClick={handleSave}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            saved
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
          }`}
        >
          {saved ? (
            <><BookmarkCheck className="w-4 h-4" /> Saved to My Trips ✓</>
          ) : (
            <><Download className="w-4 h-4" /> Save Package</>
          )}
        </button>

        {/* Share button */}
        <button
          onClick={() => setShareOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:text-white text-sm font-semibold transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>

        {/* Book CTA */}
        <button
          onClick={onBook}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.99] transition-all"
        >
          Book Now — {bookingPrice}
        </button>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        packageName={packageName}
        total={bookingPrice}
        destination={destination}
      />
    </>
  );
}
