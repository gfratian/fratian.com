'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { useAuth } from '@/context/AuthContext';
import { Globe, Lock, Menu, X } from 'lucide-react';

export default function Header() {
  const { locale, toggleLocale, dict } = useLocale();
  const { lock } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#schedule', label: dict.nav.schedule },
    { href: '#travel', label: dict.nav.travel },
    { href: '#lodging', label: dict.nav.lodging },
    { href: '#lore', label: dict.nav.guides },
    { href: '#tips', label: dict.nav.tips },
    { href: '#rsvp', label: dict.nav.rsvp, highlight: true },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md bg-stone-950/85 border-b border-stone-800/80 py-3 shadow-lg'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Couple Monogram */}
          <a
            href="#hero"
            className="flex items-center gap-2 text-stone-100 hover:text-gold-400 transition-colors group"
          >
            <span className="font-serif text-lg tracking-widest font-semibold border-b border-gold-500/50 pb-0.5 group-hover:border-gold-400">
              {dict.nav.monogram}
            </span>
            <span className="hidden sm:inline text-[11px] uppercase tracking-widest text-stone-400">
              • Bușteni 2027
            </span>
          </a>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-xs uppercase tracking-wider font-medium transition-colors ${
                  link.highlight
                    ? 'px-3 py-1.5 rounded-full bg-carpathian-700/80 hover:bg-carpathian-600 text-stone-100 border border-gold-500/40 shadow-sm'
                    : 'text-stone-300 hover:text-gold-400'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Controls: Language Switcher & Lock Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* EN | RO Language Toggle Pill */}
            <button
              onClick={toggleLocale}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium tracking-wider bg-stone-900/80 hover:bg-stone-800 text-stone-200 hover:text-gold-400 border border-stone-700/80 transition-all shadow-sm"
              aria-label="Toggle language"
            >
              <Globe className="w-3.5 h-3.5 text-gold-500" />
              <span className={locale === 'en' ? 'font-bold text-gold-400' : 'text-stone-400'}>
                EN
              </span>
              <span className="text-stone-600">|</span>
              <span className={locale === 'ro' ? 'font-bold text-gold-400' : 'text-stone-400'}>
                RO
              </span>
            </button>

            {/* Quick Lock Button */}
            <button
              onClick={lock}
              type="button"
              title="Lock website"
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
              aria-label="Lock website"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="md:hidden p-1.5 text-stone-300 hover:text-white"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-gold-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden backdrop-blur-xl bg-stone-950/95 border-b border-stone-800 px-6 py-5 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm tracking-wide font-medium py-1 ${
                  link.highlight ? 'text-gold-400 font-semibold' : 'text-stone-200'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
