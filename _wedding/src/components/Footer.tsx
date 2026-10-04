'use client';

import React from 'react';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import { Lock, Heart } from 'lucide-react';

export default function Footer() {
  const { dict } = useLocale();
  const { lock } = useAuth();

  return (
    <footer className="border-t border-stone-850 bg-stone-950/80 py-16 px-4 sm:px-6 lg:px-8 text-stone-400 text-xs text-center relative">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full border border-gold-500/30 flex items-center justify-center text-gold-400 bg-stone-900/60">
            <Heart className="w-4 h-4 fill-gold-500/20" />
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-xl font-serif text-stone-200 tracking-wide font-normal">
            {dict.footer.couple}
          </h4>
          <p className="text-xs text-gold-500 font-mono tracking-wider">
            {dict.footer.date}
          </p>
          <p className="text-xs text-stone-500 italic pt-1">
            {dict.footer.tagline}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-stone-850/80 text-[11px] text-stone-400">
          <span>{dict.footer.confidential}</span>
          <span className="hidden sm:inline text-stone-700">•</span>
          <button
            onClick={lock}
            type="button"
            className="flex items-center gap-1.5 text-stone-400 hover:text-gold-400 transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>{dict.footer.lockAgain}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
