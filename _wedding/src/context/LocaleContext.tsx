'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import en from '@/locales/en.json';
import ro from '@/locales/ro.json';

type Locale = 'en' | 'ro';
type TranslationDict = typeof en;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, fallback?: string) => any;
  dict: TranslationDict;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage first
    const saved = localStorage.getItem('wedding_locale') as Locale | null;
    if (saved === 'en' || saved === 'ro') {
      setLocaleState(saved);
      return;
    }
    // Check cookie
    const match = document.cookie.match(/wedding_locale=(en|ro)/);
    if (match && (match[1] === 'en' || match[1] === 'ro')) {
      setLocaleState(match[1]);
      return;
    }
    // Check browser languages
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.startsWith('ro')) {
      setLocaleState('ro');
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('wedding_locale', newLocale);
      document.cookie = `wedding_locale=${newLocale}; Path=/; SameSite=Lax; Max-Age=31536000`;
    } catch {
      // Ignore storage errors in private browsing
    }
  };

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'ro' : 'en');
  };

  const dict = useMemo(() => {
    return locale === 'ro' ? (ro as unknown as TranslationDict) : en;
  }, [locale]);

  const t = (path: string, fallback?: string): any => {
    const keys = path.split('.');
    let current: any = dict;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback !== undefined ? fallback : path;
      }
    }
    return current;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale, t, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
