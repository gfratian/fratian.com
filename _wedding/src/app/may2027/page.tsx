'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import LockScreen from '@/components/LockScreen';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Timeline from '@/components/Timeline';
import TravelSection from '@/components/TravelSection';
import GroundTransit from '@/components/GroundTransit';
import LodgingSection from '@/components/LodgingSection';
import LoreDrawer from '@/components/LoreDrawer';
import PracticalTips from '@/components/PracticalTips';
import RsvpForm from '@/components/RsvpForm';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';

export default function May2027Page() {
  const { isUnlocked, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
          <span className="text-xs uppercase tracking-widest text-stone-500 font-mono">
            Loading Portal...
          </span>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return <LockScreen />;
  }

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-100 selection:bg-carpathian-700 selection:text-gold-200">
      {/* Sticky Header with Navigation and EN|RO toggle */}
      <Header />

      {/* Hero with live countdown to May 28, 2027 */}
      <Hero />

      {/* Visual interactive 3-day weekend timeline */}
      <Timeline />

      {/* Flight guide, Memorial Day advisory, Schengen entry requirements */}
      <TravelSection />

      {/* Ground Transit comparison: Private vs. Train vs. Rental car */}
      <GroundTransit />

      {/* Accommodations across Bușteni, Sinaia, and Brașov */}
      <LodgingSection />

      {/* Deep reading slide-over drawer: Cantacuzino, Peleș, Transylvania, Danube Delta */}
      <LoreDrawer />

      {/* Practical tips: Currency, 0.0‰ driving, bear safety, tipping */}
      <PracticalTips />

      {/* Interactive RSVP Form with Google Sheets integration */}
      <RsvpForm />

      {/* Discreet footer with lock option */}
      <Footer />
    </div>
  );
}
