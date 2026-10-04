'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { Calendar, MapPin, ChevronDown, Sparkles } from 'lucide-react';

const WEDDING_TARGET_DATE = new Date('2027-05-28T16:30:00+03:00').getTime();

export default function Hero() {
  const { dict } = useLocale();

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = WEDDING_TARGET_DATE - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-stone-950 via-carpathian-950 to-stone-900"
    >
      {/* Carpathian Vista Glow & Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-carpathian-800/25 via-stone-950/60 to-stone-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        {/* Subtle Welcome Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/80 border border-gold-500/30 text-gold-400 text-xs uppercase tracking-widest font-medium shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dict.hero.welcome}</span>
        </div>

        {/* Couple Names */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-tight text-stone-100 font-normal leading-tight">
          <span className="block text-gold-300 drop-shadow-sm font-serif">
            {dict.hero.couple}
          </span>
        </h1>

        {/* Date & Venue Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-stone-300 text-sm sm:text-base font-light tracking-wide pt-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold-400" />
            <span className="font-medium text-stone-200">{dict.hero.date}</span>
          </div>
          <span className="hidden sm:inline text-gold-600">•</span>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gold-400" />
            <span className="text-stone-300">
              {dict.hero.venue}, <span className="text-stone-400">{dict.hero.location}</span>
            </span>
          </div>
        </div>

        {/* Live Countdown Ticker */}
        <div className="pt-6 pb-2">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-4 font-medium">
            {dict.hero.countdown.until}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
            {[
              { label: dict.hero.countdown.days, value: isHydrated ? timeLeft.days : 0 },
              { label: dict.hero.countdown.hours, value: isHydrated ? timeLeft.hours : 0 },
              { label: dict.hero.countdown.minutes, value: isHydrated ? timeLeft.minutes : 0 },
              { label: dict.hero.countdown.seconds, value: isHydrated ? timeLeft.seconds : 0 },
            ].map((unit, idx) => (
              <div
                key={idx}
                className="backdrop-blur-md bg-stone-900/70 border border-stone-800 rounded-2xl p-3 sm:p-4 shadow-xl"
              >
                <div className="text-2xl sm:text-4xl font-serif font-bold text-gold-400 tracking-tight">
                  {isHydrated ? String(unit.value).padStart(2, '0') : '--'}
                </div>
                <div className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-400 mt-1 font-medium">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href="#rsvp"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-carpathian-700 via-carpathian-600 to-carpathian-700 hover:from-carpathian-600 hover:to-carpathian-500 text-stone-100 font-medium text-sm tracking-wide shadow-lg shadow-carpathian-950/60 border border-emerald-500/25 transition-all text-center"
          >
            {dict.hero.rsvpCta}
          </a>
          <a
            href="#schedule"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-stone-900/80 hover:bg-stone-850 text-stone-200 hover:text-gold-300 font-medium text-sm tracking-wide border border-stone-800 transition-all text-center"
          >
            {dict.hero.scheduleCta}
          </a>
        </div>

        {/* Scroll Indicator */}
        <div className="pt-10 flex justify-center">
          <a
            href="#schedule"
            className="text-stone-500 hover:text-gold-400 transition-colors animate-bounce p-2"
            aria-label="Scroll to schedule"
          >
            <ChevronDown className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
