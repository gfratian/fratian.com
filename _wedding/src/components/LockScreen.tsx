'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { Lock, ArrowRight, ShieldCheck, KeyRound, Globe } from 'lucide-react';

export default function LockScreen() {
  const { unlock } = useAuth();
  const { locale, toggleLocale, dict } = useLocale();
  const [passcode, setPasscode] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsSubmitting(true);
    const success = unlock(passcode);

    if (!success) {
      setHasError(true);
      setIsSubmitting(false);
      // Reset error shake trigger after 600ms
      setTimeout(() => setHasError(false), 600);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-stone-950 via-carpathian-950 to-stone-900 text-stone-100 overflow-hidden">
      {/* Decorative background mountain silhouettes / subtle glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,#24664d,transparent_70%)]" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleLocale}
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium tracking-wider bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-gold-400 border border-stone-800 transition-all shadow-sm"
          aria-label="Toggle language"
        >
          <Globe className="w-3.5 h-3.5 text-gold-500" />
          <span>{locale === 'en' ? 'RO' : 'EN'}</span>
          <span className="text-stone-500">|</span>
          <span className="text-stone-400">{locale === 'en' ? 'Română' : 'English'}</span>
        </button>
      </div>

      {/* Discrete Card */}
      <div className="w-full max-w-md relative z-10">
        <div
          className={`backdrop-blur-xl bg-stone-900/75 border border-stone-800/80 rounded-2xl p-8 shadow-2xl transition-transform duration-200 ${
            hasError ? 'animate-shake border-red-500/50' : ''
          }`}
        >
          {/* Subtle Crest / Emblem Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-carpathian-900 to-stone-950 border border-gold-500/30 flex items-center justify-center shadow-inner">
              <Lock className="w-6 h-6 text-gold-400" />
            </div>
          </div>

          {/* Discreet Title (strictly no names or dates until unlocked) */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-2xl font-serif tracking-wide text-stone-100 font-semibold">
              {dict.lock.title}
            </h1>
            <p className="text-xs uppercase tracking-widest text-gold-500 font-medium">
              {dict.lock.subtitle}
            </p>
            <p className="text-xs text-stone-400 pt-2 leading-relaxed">
              {dict.lock.passcodePrompt}
            </p>
          </div>

          {/* Passcode Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (hasError) setHasError(false);
                }}
                placeholder={dict.lock.passcodePlaceholder}
                autoFocus
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 bg-stone-950/70 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
              />
            </div>

            {hasError && (
              <p className="text-xs text-red-400 text-center font-medium bg-red-950/30 py-1.5 px-3 rounded-lg border border-red-800/40">
                {dict.lock.errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !passcode.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-carpathian-700 via-carpathian-600 to-carpathian-700 hover:from-carpathian-600 hover:to-carpathian-500 text-stone-100 rounded-xl text-sm font-medium tracking-wide shadow-lg shadow-carpathian-950/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group border border-emerald-500/20"
            >
              <span>{dict.lock.unlockButton}</span>
              <ArrowRight className="w-4 h-4 text-gold-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Privacy Footnote */}
          <div className="mt-8 pt-6 border-t border-stone-800/60 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
              <span>Private Guest Portal • Strict Zero-Index Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
