'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { BookOpen, X, Castle, Compass, Sparkles, ChevronRight } from 'lucide-react';

export default function LoreDrawer() {
  const { dict } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<'cantacuzino' | 'peles' | 'transylvania' | 'delta'>('cantacuzino');

  // Lock body scroll when drawer is open and support ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const articles = [
    {
      id: 'cantacuzino' as const,
      icon: <Castle className="w-4 h-4 text-gold-400" />,
      title: dict.lore.cantacuzinoTitle,
      excerpt: dict.lore.cantacuzinoExcerpt,
      content: dict.lore.cantacuzinoFull,
    },
    {
      id: 'peles' as const,
      icon: <Castle className="w-4 h-4 text-gold-400" />,
      title: dict.lore.pelesTitle,
      excerpt: dict.lore.pelesExcerpt,
      content: dict.lore.pelesFull,
    },
    {
      id: 'transylvania' as const,
      icon: <Compass className="w-4 h-4 text-gold-400" />,
      title: dict.lore.transylvaniaTitle,
      excerpt: dict.lore.transylvaniaExcerpt,
      content: dict.lore.transylvaniaFull,
    },
    {
      id: 'delta' as const,
      icon: <Compass className="w-4 h-4 text-gold-400" />,
      title: dict.lore.deltaTitle,
      excerpt: dict.lore.deltaExcerpt,
      content: dict.lore.deltaFull,
    },
  ];

  const current = articles.find((a) => a.id === activeArticle) || articles[0];

  return (
    <section id="lore" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-stone-850">
      <div className="backdrop-blur-xl bg-gradient-to-r from-stone-900/90 via-carpathian-950/80 to-stone-900/90 border border-stone-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-carpathian-900/70 border border-gold-500/30 text-gold-400 text-xs uppercase tracking-widest font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{dict.lore.title}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif text-stone-100 font-normal">
            {dict.lore.subtitle}
          </h3>
          <p className="text-sm text-stone-300 font-light leading-relaxed">
            Discover the rich historical legacy of Prince Cantacuzino's estate, King Carol's royal sanctuary at Peleș, and curated multi-day routes across Transylvania and the Danube Delta.
          </p>
          <div className="pt-4">
            <button
              onClick={() => setIsOpen(true)}
              type="button"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-carpathian-700 to-carpathian-600 hover:from-carpathian-600 hover:to-carpathian-500 text-stone-100 font-medium text-sm tracking-wide border border-gold-500/30 shadow-lg shadow-carpathian-950/50 transition-all group"
            >
              <span>{dict.lore.buttonOpen}</span>
              <ChevronRight className="w-4 h-4 text-gold-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-2xl bg-stone-950 border-l border-stone-800 shadow-2xl flex flex-col h-full z-10 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
              <div className="flex items-center gap-2 text-gold-400">
                <BookOpen className="w-5 h-5 text-gold-500" />
                <h3 className="font-serif text-lg text-stone-100 font-medium">
                  {dict.lore.title}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                aria-label={dict.lore.buttonClose}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-navigation tabs inside drawer */}
            <div className="p-4 bg-stone-900/40 border-b border-stone-850 flex gap-2 overflow-x-auto no-scrollbar">
              {articles.map((art) => (
                <button
                  key={art.id}
                  onClick={() => setActiveArticle(art.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeArticle === art.id
                      ? 'bg-carpathian-800 text-stone-100 border border-gold-500/30'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  {art.icon}
                  <span>{art.id === 'cantacuzino' ? 'Cantacuzino' : art.id === 'peles' ? 'Peleș' : art.id === 'transylvania' ? 'Transylvania' : 'Danube Delta'}</span>
                </button>
              ))}
            </div>

            {/* Scrollable Article Content */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-stone-200">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-gold-500 font-mono">
                  Carpathian Heritage Series
                </span>
                <h4 className="text-2xl font-serif text-stone-100 mt-1 font-normal leading-snug">
                  {current.title}
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 text-sm text-stone-300 italic leading-relaxed">
                "{current.excerpt}"
              </div>

              <div className="prose prose-invert prose-stone text-sm sm:text-base leading-relaxed space-y-4 font-light text-stone-300">
                {current.content.split('\n').map((paragraph, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-900/60 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium uppercase tracking-wider transition-colors"
              >
                {dict.lore.buttonClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
