'use client';

import React from 'react';
import { useLocale } from '@/context/LocaleContext';
import { Car, Train, Navigation, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function GroundTransit() {
  const { dict } = useLocale();

  const getModeIcon = (id: string) => {
    switch (id) {
      case 'private':
        return <Navigation className="w-5 h-5 text-gold-400" />;
      case 'train':
        return <Train className="w-5 h-5 text-gold-400" />;
      default:
        return <Car className="w-5 h-5 text-gold-400" />;
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-stone-850">
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <h3 className="text-2xl sm:text-3xl font-serif text-stone-100 font-normal">
          {dict.ground.title}
        </h3>
        <p className="text-sm text-stone-300 leading-relaxed font-light">
          {dict.ground.subtitle}
        </p>
        <p className="text-xs text-gold-400/90 font-mono">
          {dict.ground.driveTime}
        </p>
      </div>

      {/* Transit Modes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dict.ground.modes.map((mode, idx) => (
          <div
            key={mode.id}
            className={`backdrop-blur-md rounded-2xl p-6 border flex flex-col justify-between transition-all ${
              mode.id === 'private'
                ? 'bg-gradient-to-b from-carpathian-950/90 to-stone-900/90 border-gold-500/40 shadow-xl'
                : 'bg-stone-900/60 border-stone-800/80 shadow-md'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center">
                  {getModeIcon(mode.id)}
                </div>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                    mode.id === 'private'
                      ? 'bg-gold-500/15 text-gold-300 border-gold-500/30'
                      : 'bg-stone-800 text-stone-300 border-stone-700'
                  }`}
                >
                  {mode.badge}
                </span>
              </div>

              <h4 className="text-lg font-serif text-stone-100 font-medium mb-1">
                {mode.title}
              </h4>

              <div className="flex items-center gap-4 text-xs font-mono text-stone-400 mb-4 pb-3 border-b border-stone-800/80">
                <span>⏱️ {mode.duration}</span>
                <span>💶 {mode.cost}</span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed mb-6">
                <div className="flex items-start gap-2 text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{mode.pros}</span>
                </div>
                <div className="flex items-start gap-2 text-stone-400">
                  <XCircle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                  <span>{mode.cons}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800/80 text-[11px] text-stone-400">
              <span className="font-medium text-stone-300 block mb-1">Recommendations:</span>
              <p className="leading-relaxed">{mode.services}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
