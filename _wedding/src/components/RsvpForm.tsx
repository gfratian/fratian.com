'use client';

import React, { useState } from 'react';
import { useLocale } from '@/context/LocaleContext';
import { Heart, Send, CheckCircle2, AlertCircle, Sparkles, Music } from 'lucide-react';

function getWebhookUrl(): string {
  try {
    const envUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL;
    if (typeof envUrl === 'string' && envUrl.trim().startsWith('http')) {
      return envUrl.trim();
    }
  } catch (err) {
    // Ignore environment lookup error
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let stored = localStorage.getItem('wedding_webhook_url');
      if (stored && stored.includes('AKfycbxK9b0KzufVehgZJiCkyTl5S3zMg08c4l7oHC4c1sKczjAoOVEr0C0TyiLVDvmwqcpn')) {
        localStorage.removeItem('wedding_webhook_url');
        stored = null;
      }
      if (stored && stored.trim().startsWith('http')) {
        return stored.trim();
      }
    }
  } catch (err) {
    // Ignore local storage restriction
  }

  return 'https://script.google.com/macros/s/AKfycbzVbqtZEU5MoD2yZSnR8GS7SiWmN-29T-bP60Uug2TSm4w67SqQ0mNZq76MKgLJRyq_/exec';
}

export default function RsvpForm() {
  const { dict, locale } = useLocale();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    attending: 'yes', // 'yes' or 'no'
    additionalGuests: '',
    dietary: [] as string[],
    dietaryOther: '',
    thuPeles: false,
    satBrunch: false,
    satExcursion: false,
    lodging: '',
    notes: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckboxChange = (eventKey: 'thuPeles' | 'satBrunch' | 'satExcursion') => {
    setFormData((prev) => ({
      ...prev,
      [eventKey]: !prev[eventKey],
    }));
  };

  const handleDietaryToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.dietary.includes(item);
      if (exists) {
        return { ...prev, dietary: prev.dietary.filter((d) => d !== item) };
      } else {
        return { ...prev, dietary: [...prev.dietary, item] };
      }
    });
  };

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const payload = {
        ...formData,
        language: locale,
        submittedAt: new Date().toISOString(),
      };

      const webhookUrl = getWebhookUrl();

      if (webhookUrl) {
        // Direct submission to Google Apps Script Webhook (works seamlessly in static export)
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload),
        });
        setStatus('success');
      } else {
        // In local/mock mode when webhook is not yet configured
        console.log('[RSVP Submitted - Local/Mock Mode]:', payload);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setStatus('success');
      }
    } catch (err: any) {
      console.error('RSVP submission error:', err);
      setStatus('error');
      setErrorMessage(dict.rsvp.errorMessage);
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setFormData({
      fullName: '',
      email: '',
      attending: 'yes',
      additionalGuests: '',
      dietary: [],
      dietaryOther: '',
      thuPeles: false,
      satBrunch: false,
      satExcursion: false,
      lodging: '',
      notes: '',
    });
  };

  return (
    <section id="rsvp" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="backdrop-blur-xl bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-12 shadow-2xl relative overflow-hidden">
        {/* Decorative subtle glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-carpathian-900/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-carpathian-900/60 border border-carpathian-700/50 text-gold-400 text-xs uppercase tracking-widest font-medium">
            <Heart className="w-3.5 h-3.5 text-gold-500 fill-gold-500/20" />
            <span>{dict.rsvp.badge}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-100 font-normal">
            {dict.rsvp.title}
          </h2>
          <p className="text-sm text-stone-300 font-light leading-relaxed">
            {dict.rsvp.subtitle}
          </p>
        </div>

        {status === 'success' ? (
          /* Success Screen */
          <div className="relative z-10 py-10 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-stone-100 font-medium">
                {dict.rsvp.successTitle}
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed font-light">
                {formData.attending === 'yes'
                  ? dict.rsvp.successMessage
                  : dict.rsvp.declineMessage}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 text-xs text-stone-400 space-y-1">
              <p className="font-medium text-stone-200">
                Registered for: <span className="text-gold-400">{formData.fullName}</span>
              </p>
              <p>Confirmation email copy sent to {formData.email}</p>
            </div>

            <div className="pt-4">
              <button
                onClick={resetForm}
                type="button"
                className="px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white text-xs font-medium tracking-wide border border-stone-700 transition-colors"
              >
                {dict.rsvp.submitAnother}
              </button>
            </div>
          </div>
        ) : (
          /* Interactive RSVP Form */
          <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
            {/* Attendance Choice */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-stone-200 font-serif">
                {dict.rsvp.attendingLabel}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, attending: 'yes' }))}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all ${
                    formData.attending === 'yes'
                      ? 'bg-carpathian-900/80 border-gold-500/60 text-stone-100 shadow-lg'
                      : 'bg-stone-950/50 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      formData.attending === 'yes'
                        ? 'border-gold-400 bg-gold-500'
                        : 'border-stone-600'
                    }`}
                  >
                    {formData.attending === 'yes' && (
                      <div className="w-2 h-2 rounded-full bg-stone-950" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium block text-stone-100">
                      {dict.rsvp.attendingYes}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Joining for the celebrations at Castelul Cantacuzino
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, attending: 'no' }))}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all ${
                    formData.attending === 'no'
                      ? 'bg-stone-850 border-stone-600 text-stone-200 shadow-lg'
                      : 'bg-stone-950/50 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      formData.attending === 'no'
                        ? 'border-stone-400 bg-stone-400'
                        : 'border-stone-600'
                    }`}
                  >
                    {formData.attending === 'no' && (
                      <div className="w-2 h-2 rounded-full bg-stone-950" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium block text-stone-200">
                      {dict.rsvp.attendingNo}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Unable to attend in person, celebrating from afar
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Name & Email Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-stone-300 font-medium">
                  {dict.rsvp.fullNameLabel} <span className="text-gold-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder={dict.rsvp.fullNamePlaceholder}
                  className="w-full px-4 py-3 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-stone-300 font-medium">
                  {dict.rsvp.emailLabel} <span className="text-gold-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder={dict.rsvp.emailPlaceholder}
                  className="w-full px-4 py-3 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-all"
                />
              </div>
            </div>

            {/* Additional Guest / Partner */}
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-stone-300 font-medium">
                {dict.rsvp.plusOneLabel}
              </label>
              <input
                type="text"
                value={formData.additionalGuests}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, additionalGuests: e.target.value }))
                }
                placeholder={dict.rsvp.plusOnePlaceholder}
                className="w-full px-4 py-3 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-all"
              />
            </div>

            {/* Optional Events Checkboxes (only shown if attending) */}
            {formData.attending === 'yes' && (
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-medium text-stone-200 font-serif">
                  {dict.rsvp.eventsLabel}
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 hover:border-stone-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.thuPeles}
                      onChange={() => handleCheckboxChange('thuPeles')}
                      className="mt-1 w-4 h-4 rounded border-stone-700 text-gold-600 focus:ring-gold-500/40 bg-stone-900"
                    />
                    <span className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      {dict.rsvp.events.thuPeles}
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 hover:border-stone-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.satBrunch}
                      onChange={() => handleCheckboxChange('satBrunch')}
                      className="mt-1 w-4 h-4 rounded border-stone-700 text-gold-600 focus:ring-gold-500/40 bg-stone-900"
                    />
                    <span className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      {dict.rsvp.events.satBrunch}
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80 hover:border-stone-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.satExcursion}
                      onChange={() => handleCheckboxChange('satExcursion')}
                      className="mt-1 w-4 h-4 rounded border-stone-700 text-gold-600 focus:ring-gold-500/40 bg-stone-900"
                    />
                    <span className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      {dict.rsvp.events.satExcursion}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Dietary Restrictions (only shown if attending) */}
            {formData.attending === 'yes' && (
              <div className="space-y-2.5 pt-2">
                <label className="block text-sm font-medium text-stone-200 font-serif">
                  {dict.rsvp.dietaryLabel}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    dict.rsvp.dietaryOptions.vegetarian,
                    dict.rsvp.dietaryOptions.vegan,
                    dict.rsvp.dietaryOptions.glutenFree,
                    dict.rsvp.dietaryOptions.dairyFree,
                    dict.rsvp.dietaryOptions.nutAllergy,
                    dict.rsvp.dietaryOptions.other,
                  ].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleDietaryToggle(option)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        formData.dietary.includes(option)
                          ? 'bg-carpathian-800/80 border-gold-500/50 text-gold-300 font-medium'
                          : 'bg-stone-950/50 border-stone-800 text-stone-400 hover:text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lodging Plan */}
            {formData.attending === 'yes' && (
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-stone-300 font-medium">
                  {dict.rsvp.lodgingLabel}
                </label>
                <input
                  type="text"
                  value={formData.lodging}
                  onChange={(e) => setFormData((p) => ({ ...p, lodging: e.target.value }))}
                  placeholder={dict.rsvp.lodgingPlaceholder}
                  className="w-full px-4 py-3 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-all"
                />
              </div>
            )}

            {/* Notes / Song Requests */}
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-stone-300 font-medium">
                {dict.rsvp.notesLabel}
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                placeholder={dict.rsvp.notesPlaceholder}
                className="w-full px-4 py-3 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-all"
              />
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={status === 'submitting' || !formData.fullName.trim() || !formData.email.trim()}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-carpathian-700 via-carpathian-600 to-carpathian-700 hover:from-carpathian-600 hover:to-carpathian-500 text-stone-100 font-medium text-sm tracking-wide shadow-xl shadow-carpathian-950/60 border border-gold-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {status === 'submitting'
                    ? dict.rsvp.submittingButton
                    : dict.rsvp.submitButton}
                </span>
                <Send className="w-4 h-4 text-gold-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
