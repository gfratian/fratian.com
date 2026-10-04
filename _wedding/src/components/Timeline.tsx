'use client';

import React, { useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { Clock, MapPin, Sparkles, HeartHandshake, Compass } from 'lucide-react';

export default function Timeline() {
  const { dict } = useLocale();
  const [activeTab, setActiveTab] = useState<'thursday' | 'friday' | 'saturday'>('friday');

  const days = [
    { id: 'thursday' as const, label: dict.schedule.thursday.tab, badge: dict.schedule.thursday.badge },
    { id: 'friday' as const, label: dict.schedule.friday.tab, badge: dict.schedule.friday.badge },
    { id: 'saturday' as const, label: dict.schedule.saturday.tab, badge: dict.schedule.saturday.badge },
  ];

  const currentSchedule = dict.schedule[activeTab];

  return (
    <section id="schedule" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-carpathian-900/60 border border-carpathian-700/50 text-gold-400 text-xs uppercase tracking-widest font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dict.schedule.subtitle}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif text-stone-100 font-normal">
          {dict.schedule.title}
        </h2>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex p-1.5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-lg">
          {days.map((day) => {
            const isActive = activeTab === day.id;
            return (
              <button
                key={day.id}
                onClick={() => setActiveTab(day.id)}
                type="button"
                className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium tracking-wide transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-carpathian-800 to-carpathian-700 text-stone-100 border border-gold-500/30 shadow-md'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                }`}
              >
                <span>{day.label}</span>
                {isActive && (
                  <span className="block text-[10px] text-gold-400 font-normal mt-0.5 sm:hidden">
                    {day.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Day Content */}
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between border-b border-stone-800/80 pb-4">
          <div>
            <h3 className="text-xl font-serif text-gold-300 font-medium">
              {currentSchedule.date}
            </h3>
            <p className="text-xs text-stone-400 uppercase tracking-widest mt-0.5">
              {currentSchedule.badge}
            </p>
          </div>
          {activeTab === 'friday' ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5" />
              Ceremony & Banquet
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-stone-850 text-stone-300 border border-stone-750 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-gold-400" />
              Celebration Gathering
            </span>
          )}
        </div>

        {/* Timeline Event Cards */}
        <div className="relative border-l-2 border-stone-800 ml-4 sm:ml-6 space-y-8 pl-6 sm:pl-8 py-2">
          {currentSchedule.events.map((event, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline Bullet Node */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-stone-900 border-2 border-gold-500 group-hover:bg-gold-500 transition-colors shadow-sm" />

              <div className="backdrop-blur-md bg-stone-900/60 hover:bg-stone-900/80 border border-stone-800/80 rounded-2xl p-5 sm:p-6 transition-all shadow-md group-hover:border-stone-700">
                <div className="flex flex-wrap items-center gap-3 text-xs text-gold-400 font-medium mb-2">
                  <div className="flex items-center gap-1 bg-stone-950/60 px-2.5 py-1 rounded-md border border-stone-800">
                    <Clock className="w-3.5 h-3.5 text-gold-500" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-400">
                    <MapPin className="w-3.5 h-3.5 text-stone-500" />
                    <span>{event.location}</span>
                  </div>
                </div>

                <h4 className="text-lg font-serif text-stone-100 font-medium mb-2">
                  {event.title}
                </h4>

                <p className="text-sm text-stone-300 leading-relaxed font-light">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
