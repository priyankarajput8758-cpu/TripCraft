import React, { useState } from 'react';

export default function AuthModal({ mode: initialMode = 'signin', onSuccess, onClose }) {
  const [mode, setMode]         = useState(initialMode);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
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

  const inputClass = "w-full bg-white/60 backdrop-blur-sm border border-[#84D175]/40 rounded-xl px-4 py-3 text-xs font-semibold text-[#1a2e1a] placeholder:text-[#4a5e4a]/50 focus:outline-none focus:border-[#84D175] focus:ring-2 focus:ring-[#84D175]/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C2D45]/60 backdrop-blur-md">

      <div className="relative w-full max-w-md bg-[#FFF8D2]/90 border border-[#84D175]/35 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-2xl">

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold text-[#4a5e4a] hover:text-[#1a2e1a] hover:bg-[#84D175]/20 transition-all cursor-pointer"
          >
            ✕
          </button>
        )}

        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white/80 p-1.5 flex items-center justify-center mx-auto shadow-xs border border-[#84D175]/40">
            <img src="/logo.png" alt="TripCraft" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1a2e1a] tracking-tight">
            {isSignUp ? 'Create Your Account' : 'Welcome Back to TripCraft'}
          </h2>
          <p className="text-[#4a5e4a] text-xs mt-1 font-normal">
            {isSignUp ? 'Start customizing your TripCraft journey live' : 'Sign in to access your saved packages & custom trips'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-[#4a5e4a] mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#4a5e4a] mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4a5e4a] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputClass}
            />
          </div>

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50/80 border border-rose-200 rounded-xl px-3.5 py-2.5 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#84D175] hover:bg-[#67C456] text-[#1a2e1a] font-bold text-xs shadow-md shadow-[#84D175]/25 transition-all flex items-center justify-center cursor-pointer disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#4a5e4a] font-normal">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setMode(isSignUp ? 'signin' : 'signup'); setError(''); }}
            className="text-[#2D6A24] hover:text-[#1a2e1a] font-bold ml-1 cursor-pointer"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <button
          onClick={handleGuest}
          className="w-full py-3 rounded-xl bg-[#84D175]/20 hover:bg-[#84D175]/35 text-[#2D6A24] border border-[#84D175]/35 text-xs font-bold transition-all cursor-pointer text-center"
        >
          Continue as Guest
        </button>

      </div>
    </div>
  );
}
