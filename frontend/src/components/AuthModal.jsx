import React, { useState } from 'react';
import { X, Eye, EyeOff, ArrowRight, Sparkles, User, Mail, Lock, ShieldCheck } from 'lucide-react';

export default function AuthModal({ mode: initialMode = 'signin', onSuccess, onClose }) {
  const [mode, setMode]         = useState(initialMode);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isSignUp && !name.trim()) { setError('Please enter your full name.'); return; }
    if (!email.includes('@'))     { setError('Please enter a valid email address.'); return; }
    if (password.length < 4)      { setError('Password must be at least 4 characters.'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    onSuccess({ name: name || email.split('@')[0], email });
  };

  const handleGuest = () => {
    onSuccess({ name: 'Guest Explorer', email: 'guest@tripcraft.dev' });
  };

  const inputClass = "w-full bg-[#FFF8D2]/60 border border-[#84D175]/40 rounded-xl px-4 py-3 pl-10 text-xs font-semibold text-[#1a2e1a] placeholder:text-[#4a5e4a]/50 focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C2D45]/70 backdrop-blur-md">

      {/* Moss glow aura */}
      <div className="absolute w-72 h-72 bg-[#84D175]/15 rounded-full blur-3xl pointer-events-none animate-blob" />

      <div className="relative w-full max-w-md bg-[#FFF8D2]/95 border border-[#84D175]/30 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-xl">

        {/* Close */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-[#84D175]/15 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white/90 p-1.5 flex items-center justify-center mx-auto shadow-lg shadow-[#84D175]/30 border border-[#84D175]/40">
            <img src="/logo.png" alt="TripCraft" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-black text-[#1a2e1a] tracking-tight">
            {isSignUp ? 'Create Your Account' : 'Welcome Back to TripCraft'}
          </h2>
          <p className="text-[#4a5e4a] text-xs mt-1 font-medium">
            {isSignUp ? 'Start customizing your TripCraft journey live' : 'Sign in to access your saved packages & custom trips'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#4a5e4a] mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Divyansh Duggad"
                  className={inputClass}
                />
                <User className="w-4 h-4 text-[#84D175] absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#4a5e4a] mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className={inputClass}
              />
              <Mail className="w-4 h-4 text-[#84D175] absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4a5e4a] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputClass + ' pr-10'}
              />
              <Lock className="w-4 h-4 text-[#84D175] absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-3.5 text-[#4a5e4a] hover:text-[#3C8B30]"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-black text-xs shadow-lg shadow-[#84D175]/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#1a2e1a] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? <Sparkles className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#4a5e4a] font-medium">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(''); }}
            className="text-[#3C8B30] hover:text-[#2D6A24] font-bold"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <button
          onClick={handleGuest}
          className="w-full py-3 rounded-xl bg-[#84D175]/15 hover:bg-[#84D175]/30 text-[#3C8B30] border border-[#84D175]/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Continue as Guest</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
}
