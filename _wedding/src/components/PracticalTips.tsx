'use client';

import React from 'react';
import { useLocale } from '@/context/LocaleContext';
import { CreditCard, Car, Coins, ShieldAlert, Wifi, Zap, Info } from 'lucide-react';

export default function PracticalTips() {
  const { dict } = useLocale();

  const getTipIcon = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-gold-400" />;
      case 'Car':
        return <Car className="w-5 h-5 text-gold-400" />;
      case 'Coins':
        return <Coins className="w-5 h-5 text-gold-400" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      case 'Wifi':
        return <Wifi className="w-5 h-5 text-gold-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-gold-400" />;
      default:
        return <Info className="w-5 h-5 text-gold-400" />;
    }
  };

  return (
    <section id="tips" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-carpathian-900/60 border border-carpathian-700/50 text-gold-400 text-xs uppercase tracking-widest font-medium">
          <Info className="w-3.5 h-3.5" />
          <span>{dict.tips.title}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-stone-100 font-normal">
          {dict.tips.subtitle}
        </h2>
      </div>

      {/* Grid of Practical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dict.tips.items.map((item, idx) => (
          <div
            key={idx}
            className="backdrop-blur-md bg-stone-900/60 border border-stone-800/80 hover:border-stone-700 rounded-2xl p-6 transition-all shadow-md group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center mb-4 group-hover:border-gold-500/40 transition-colors">
                {getTipIcon(item.icon)}
              </div>

              <h4 className="text-lg font-serif text-stone-100 font-medium mb-2 group-hover:text-gold-300 transition-colors">
                {item.title}
              </h4>

              <p className="text-sm text-stone-300 leading-relaxed font-light">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
