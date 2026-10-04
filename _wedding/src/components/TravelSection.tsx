'use client';

import React from 'react';
import { useLocale } from '@/context/LocaleContext';
import { Plane, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export default function TravelSection() {
  const { dict } = useLocale();

  const flightOptions = [
    { ...dict.travel.sanOpt, airlineName: 'Lufthansa', route: 'SAN -> MUC -> OTP / GHV' },
    { ...dict.travel.baOpt, airlineName: 'British Airways', route: 'SAN -> LHR -> OTP' },
    { ...dict.travel.klmOpt, airlineName: 'KLM / Air France', route: 'SAN -> AMS / CDG -> OTP' },
    { ...dict.travel.laxOpt, airlineName: 'Turkish Airlines (LAX)', route: 'LAX -> IST -> OTP' },
  ];

  return (
    <section id="travel" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-carpathian-900/60 border border-carpathian-700/50 text-gold-400 text-xs uppercase tracking-widest font-medium">
          <Plane className="w-3.5 h-3.5" />
          <span>{dict.travel.title}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-stone-100 font-normal">
          {dict.travel.subtitle}
        </h2>
        <p className="text-sm text-stone-400 max-w-2xl mx-auto leading-relaxed pt-1">
          {dict.travel.flightsLead}
        </p>
      </div>

      {/* Flight Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {flightOptions.map((opt, idx) => (
          <div
            key={idx}
            className={`backdrop-blur-md rounded-2xl p-6 border transition-all ${
              idx === 0
                ? 'bg-gradient-to-br from-carpathian-950/80 via-stone-900/90 to-stone-900/90 border-gold-500/40 shadow-xl'
                : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 shadow-md'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-mono text-stone-400 tracking-wider">
                  {opt.route}
                </span>
                <h3 className="text-lg font-serif text-stone-100 font-medium mt-0.5">
                  {opt.airline}
                </h3>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  idx === 0
                    ? 'bg-gold-500/10 text-gold-400 border-gold-500/30'
                    : 'bg-stone-800 text-stone-300 border-stone-700'
                }`}
              >
                {opt.badge}
              </span>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed font-light">
              {opt.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Memorial Day Weekend Advisory Banner */}
      <div className="mb-12 backdrop-blur-md bg-amber-950/20 border border-amber-600/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg">
        <div className="p-3 rounded-xl bg-amber-900/40 border border-amber-700/50 text-amber-400 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-serif font-medium text-amber-200">
            {dict.travel.memorialDayWarning.title}
          </h4>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mt-1">
            {dict.travel.memorialDayWarning.text}
          </p>
        </div>
      </div>

      {/* Entry & Border Requirements Grid */}
      <div className="backdrop-blur-md bg-stone-900/50 border border-stone-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6 text-gold-400">
          <ShieldCheck className="w-5 h-5 text-gold-500" />
          <h3 className="text-lg font-serif font-medium text-stone-100">
            {dict.travel.borderRequirements.title}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2 border-b md:border-b-0 md:border-r border-stone-800 pb-4 md:pb-0 md:pr-4">
            <h4 className="font-medium text-stone-200">
              {dict.travel.borderRequirements.schengenTitle}
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              {dict.travel.borderRequirements.schengenDesc}
            </p>
          </div>

          <div className="space-y-2 border-b md:border-b-0 md:border-r border-stone-800 pb-4 md:pb-0 md:pr-4">
            <h4 className="font-medium text-stone-200">Passport Validity</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              {dict.travel.borderRequirements.passportValidity}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-stone-200">
              {dict.travel.borderRequirements.eesTitle}
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              {dict.travel.borderRequirements.eesDesc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
