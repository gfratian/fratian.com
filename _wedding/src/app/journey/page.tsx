'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import LockScreen from '@/components/LockScreen';
import SpaceJourney from '@/components/SpaceJourney';
import { Loader2 } from 'lucide-react';

export default function JourneyPage() {
  const { isUnlocked, isLoading } = useAuth();
  const { dict } = useLocale();

  useEffect(() => {
    document.title = `${dict.journey.title} • E & G • May 2027`;
  }, [dict]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
          <span className="text-xs uppercase tracking-widest text-stone-500 font-mono">
            Plotting course...
          </span>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return <LockScreen />;
  }

  return <SpaceJourney />;
}
