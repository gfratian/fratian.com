'use client';

import React from 'react';
import { useLocale } from '@/context/LocaleContext';
import { Hotel, Sparkles, MapPin, Calendar, Clock } from 'lucide-react';

export default function LodgingSection() {
  const { dict } = useLocale();

  return (
    <section id="lodging" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-carpathian-900/60 border border-carpathian-700/50 text-gold-400 text-xs uppercase tracking-widest font-medium">
          <Hotel className="w-3.5 h-3.5" />
          <span>{dict.lodging.title}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-stone-100 font-normal">
          {dict.lodging.subtitle}
        </h2>
      </div>

      {/* Room Block Notice Banner */}
      <div className="mb-12 backdrop-blur-md bg-stone-900/80 border border-gold-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gold-500/20 text-gold-300 border border-gold-500/40 uppercase tracking-wider">
              {dict.lodging.roomBlock.badge}
            </span>
            <h3 className="text-xl font-serif text-stone-100 font-medium">
              {dict.lodging.roomBlock.title}
            </h3>
            <p className="text-sm text-stone-300 max-w-2xl leading-relaxed font-light">
              {dict.lodging.roomBlock.desc}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-xs font-mono text-gold-400 bg-stone-950/70 px-4 py-2.5 rounded-xl border border-stone-800">
            <Clock className="w-4 h-4" />
            <span>Target Booking: By Feb 2027</span>
          </div>
        </div>
      </div>

      {/* Accommodation Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dict.lodging.hubs.map((hub, idx) => (
          <div
            key={idx}
            className="backdrop-blur-md bg-stone-900/60 border border-stone-800/80 hover:border-stone-700 rounded-2xl p-6 flex flex-col justify-between transition-all shadow-md group"
          >
            <div>
              <div className="flex items-center gap-1.5 text-gold-400 text-xs font-mono mb-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{hub.distance}</span>
              </div>

              <h4 className="text-xl font-serif text-stone-100 font-medium mb-1 group-hover:text-gold-300 transition-colors">
                {hub.name}
              </h4>

              <p className="text-xs text-stone-400 font-medium italic mb-4">
                "{hub.vibe}"
              </p>

              <p className="text-sm text-stone-300 font-light leading-relaxed mb-6">
                {hub.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-stone-800/80 text-xs text-stone-300">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block mb-1">
                Recommended Properties:
              </span>
              <p className="text-stone-300 leading-relaxed font-light">{hub.picks}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
