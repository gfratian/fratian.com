'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Search,
  Download,
  Upload,
  Plus,
  Edit2,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Settings,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Utensils,
  Calendar,
  Mountain,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  UserCheck,
  UserX,
  UserMinus,
} from 'lucide-react';

export type ResponseStatus = 'Accepted' | 'Declined' | 'No response' | 'Maybe';

export interface SheetGuest {
  id: number;
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  partySize: number;
  invited: boolean;
  responseStatus: ResponseStatus;
  attending: boolean;
  additionalGuests?: string;
  dietary?: string;
  thuPeles?: boolean;
  satBrunch?: boolean;
  satExcursion?: boolean;
  lodging?: string;
  notes?: string;
  language?: string;
}

const DEFAULT_ADMIN_PASSCODE = 'CantacuzinoAdmin27';

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  // Configuration
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Google Sheet Data
  const [guests, setGuests] = useState<SheetGuest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Accepted' | 'Declined' | 'Dietary'>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingGuest, setEditingGuest] = useState<SheetGuest | null>(null);

  // Manual RSVP Entry Form
  const [newRsvp, setNewRsvp] = useState({
    fullName: '',
    email: '',
    phone: '',
    partySize: 1,
    responseStatus: 'Accepted' as ResponseStatus,
    additionalGuests: '',
    dietary: '',
    thuPeles: false,
    satBrunch: false,
    satExcursion: false,
    lodging: '',
    notes: '',
  });

  // Load configuration on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check query bypass ?admin_key=CantacuzinoAdmin27 or ?key=...
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('admin_key') || urlParams.get('key');
    const storedAuth = localStorage.getItem('wedding_admin_auth');

    if (
      (keyParam && (keyParam.trim() === DEFAULT_ADMIN_PASSCODE || keyParam.trim() === 'Cantacuzino27')) ||
      storedAuth === 'valid'
    ) {
      setIsUnlocked(true);
    }

    // Load webhook URL
    const envWebhook =
      process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL ||
      'https://script.google.com/macros/s/AKfycbzVbqtZEU5MoD2yZSnR8GS7SiWmN-29T-bP60Uug2TSm4w67SqQ0mNZq76MKgLJRyq_/exec';
    let storedWebhook = localStorage.getItem('wedding_webhook_url') || '';
    if (storedWebhook && storedWebhook.includes('AKfycbxK9b0KzufVehgZJiCkyTl5S3zMg08c4l7oHC4c1sKczjAoOVEr0C0TyiLVDvmwqcpn')) {
      localStorage.removeItem('wedding_webhook_url');
      storedWebhook = '';
    }
    const activeUrl = envWebhook.trim() || storedWebhook.trim();
    if (activeUrl) {
      setWebhookUrl(activeUrl);
    }
  }, []);

  // Fetch live rows from Google Apps Script Webhook
  const fetchSheetData = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : webhookUrl).trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setIsLiveConnected(false);
      return;
    }

    setIsLoading(true);
    setStatusMessage('');

    try {
      const endpoint = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=list&t=${Date.now()}`;
      const res = await fetch(endpoint, { method: 'GET' });
      const json = await res.json();

      if (json && json.status === 'success' && Array.isArray(json.data)) {
        setIsLiveConnected(true);
        if (json.spreadsheetUrl) setSpreadsheetUrl(json.spreadsheetUrl);

        const mapped: SheetGuest[] = json.data.map((r: any) => {
          let phone = (r.phone || '').toString().trim();
          let responseStatus = (r.responseStatus || '').toString().trim();
          let additionalGuests = (r.additionalGuests || '').toString().trim();
          let dietary = (r.dietary || '').toString().trim();

          // Normalize legacy 12-column test rows
          if (phone === 'YES' || phone === 'NO') {
            responseStatus = phone === 'YES' ? 'Accepted' : 'Declined';
            phone = '';
          }
          if (phone === '#ERROR!' || phone.startsWith('#')) {
            phone = '';
          }
          if (additionalGuests === 'YES' || additionalGuests === 'NO') {
            additionalGuests = '';
          }
          if (dietary === 'YES' || dietary === 'NO') {
            dietary = '';
          }
          if (responseStatus === 'YES') {
            responseStatus = 'Accepted';
          } else if (responseStatus === 'NO') {
            responseStatus = 'Declined';
          } else if (
            !responseStatus ||
            (responseStatus !== 'Accepted' && responseStatus !== 'Declined' && responseStatus !== 'No response')
          ) {
            responseStatus = r.attending ? 'Accepted' : 'No response';
          }

          // Party Size calculation:
          // If a plus-one / additional guest is listed, party size must be at least 2
          const hasPartner = !!(additionalGuests && additionalGuests.trim() && additionalGuests.trim() !== 'None' && additionalGuests.trim() !== 'NO' && additionalGuests.trim() !== 'YES');
          const rawParty = parseInt(r.partySize, 10);
          const partySize = hasPartner ? (rawParty > 1 ? rawParty : 2) : (rawParty > 0 ? rawParty : 1);

          return {
            id: r.id,
            timestamp: r.timestamp || '',
            fullName: r.fullName || 'Guest',
            email: r.email || '',
            phone: phone,
            partySize: partySize,
            invited: r.invited !== false,
            responseStatus: responseStatus as ResponseStatus,
            attending: responseStatus === 'Accepted',
            additionalGuests: additionalGuests,
            dietary: dietary,
            thuPeles: !!r.thuPeles,
            satBrunch: !!r.satBrunch,
            satExcursion: !!r.satExcursion,
            lodging: r.lodging || '',
            notes: r.notes || '',
            language: r.language || 'EN',
          };
        });

        setGuests(mapped);
        setStatusMessage(`Successfully synced ${mapped.length} records directly from Google Sheets.`);
      } else if (json && json.status === 'ok') {
        setIsLiveConnected(true);
        if (json.spreadsheetUrl) setSpreadsheetUrl(json.spreadsheetUrl);
        setGuests([]);
        setStatusMessage('Connected to Google Sheet. Ready for invitees and RSVPs.');
      } else {
        throw new Error(json.message || 'Invalid response format');
      }
    } catch (err: any) {
      console.warn('Could not fetch from Google Sheet:', err.message);
      setIsLiveConnected(false);
      setStatusMessage('Notice: Google Sheet offline or unreachable. Check webhook configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked && webhookUrl) {
      fetchSheetData();
    }
  }, [isUnlocked, webhookUrl]);

  // Handle Admin Passcode Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      passcodeInput.trim() === DEFAULT_ADMIN_PASSCODE ||
      passcodeInput.trim() === 'Cantacuzino27' ||
      passcodeInput.trim() === 'admin'
    ) {
      try {
        localStorage.setItem('wedding_admin_auth', 'valid');
      } catch (err) {}
      setIsUnlocked(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('wedding_admin_auth');
    } catch (err) {}
    setIsUnlocked(false);
    setPasscodeInput('');
  };

  const saveSettings = () => {
    try {
      if (webhookUrl.trim()) {
        localStorage.setItem('wedding_webhook_url', webhookUrl.trim());
      } else {
        localStorage.removeItem('wedding_webhook_url');
      }
    } catch (err) {}
    setSettingsOpen(false);
    fetchSheetData(webhookUrl.trim());
  };

  // Post new invitees directly into the Google Sheet via webhook
  const postInviteesToSheet = async (inviteesList: any[]) => {
    if (!webhookUrl || !webhookUrl.startsWith('http')) return;
    setIsSaving(true);
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'bulk_invitees',
          invitees: inviteesList,
        }),
      });
      // Short delay then refresh from sheet
      setTimeout(() => {
        fetchSheetData();
      }, 1500);
    } catch (err) {
      console.error('Failed to post invitees to sheet', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Record Manual RSVP
  const handleRecordManualRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRsvp.fullName || !newRsvp.fullName.trim()) return;

    const hasPartner = !!(newRsvp.additionalGuests && newRsvp.additionalGuests.trim());
    const seats = hasPartner ? Math.max(2, Number(newRsvp.partySize) || 2) : Math.max(1, Number(newRsvp.partySize) || 1);

    const rsvpItem: SheetGuest = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      fullName: newRsvp.fullName.trim(),
      email: newRsvp.email.trim(),
      phone: newRsvp.phone.trim(),
      partySize: seats,
      invited: true,
      responseStatus: newRsvp.responseStatus,
      attending: newRsvp.responseStatus === 'Accepted',
      additionalGuests: newRsvp.additionalGuests.trim(),
      dietary: newRsvp.dietary.trim(),
      thuPeles: newRsvp.thuPeles,
      satBrunch: newRsvp.satBrunch,
      satExcursion: newRsvp.satExcursion,
      lodging: newRsvp.lodging.trim(),
      notes: newRsvp.notes.trim(),
      language: 'EN',
    };

    setGuests((prev) => [...prev, rsvpItem]);
    setIsAddModalOpen(false);
    setNewRsvp({
      fullName: '',
      email: '',
      phone: '',
      partySize: 1,
      responseStatus: 'Accepted',
      additionalGuests: '',
      dietary: '',
      thuPeles: false,
      satBrunch: false,
      satExcursion: false,
      lodging: '',
      notes: '',
    });

    if (webhookUrl && webhookUrl.startsWith('http')) {
      setIsSaving(true);
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            fullName: rsvpItem.fullName,
            email: rsvpItem.email,
            phone: rsvpItem.phone,
            partySize: rsvpItem.partySize,
            attending: rsvpItem.attending,
            additionalGuests: rsvpItem.additionalGuests,
            dietary: rsvpItem.dietary,
            thuPeles: rsvpItem.thuPeles,
            satBrunch: rsvpItem.satBrunch,
            satExcursion: rsvpItem.satExcursion,
            lodging: rsvpItem.lodging,
            notes: rsvpItem.notes,
          }),
        });
        setTimeout(() => {
          fetchSheetData();
        }, 1500);
      } catch (err) {
        console.error('Failed to post manual RSVP to sheet', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Update Response Status directly in row dropdown
  const updateStatus = async (guest: SheetGuest, newStatus: ResponseStatus) => {
    const updated = guests.map((g) =>
      g.id === guest.id ? { ...g, responseStatus: newStatus, attending: newStatus === 'Accepted' } : g
    );
    setGuests(updated);

    // Sync update to sheet
    await postInviteesToSheet([
      {
        name: guest.fullName,
        email: guest.email,
        phone: guest.phone,
        partySize: guest.partySize,
        invited: guest.invited,
        responseStatus: newStatus,
      },
    ]);
  };

  // Export CSV
  const exportCsv = () => {
    const headers = [
      'Primary Guest Name',
      'Email Address',
      'Cell Phone',
      'Number of People (Seats)',
      'Response Status',
      'Plus-One / Additional',
      'Dietary Restrictions',
      'Thu Peleș Tour',
      'Sat Farewell Brunch',
      'Sat Excursion',
      'Lodging Location',
      'Notes & Wishes',
    ];

    const rows = filteredGuests.map((g) => [
      `"${(g.fullName || '').replace(/"/g, '""')}"`,
      `"${(g.email || '').replace(/"/g, '""')}"`,
      `"${(g.phone || '').replace(/"/g, '""')}"`,
      g.partySize,
      g.responseStatus,
      `"${(g.additionalGuests || '').replace(/"/g, '""')}"`,
      `"${(g.dietary || '').replace(/"/g, '""')}"`,
      g.thuPeles ? 'YES' : 'NO',
      g.satBrunch ? 'YES' : 'NO',
      g.satExcursion ? 'YES' : 'NO',
      `"${(g.lodging || '').replace(/"/g, '""')}"`,
      `"${(g.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wedding-guest-manifest-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Bypass Link
  const copyBypassLink = () => {
    if (typeof window === 'undefined') return;
    const bypassUrl = `${window.location.origin}/may2027/?key=Cantacuzino27`;
    navigator.clipboard.writeText(bypassUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Computed RSVP Metrics
  const stats = useMemo(() => {
    // Only count actual RSVP submissions (Accepted or Declined)
    const rsvpList = guests.filter((g) => g.responseStatus === 'Accepted' || g.responseStatus === 'Declined');
    const totalRsvps = rsvpList.length;
    const totalSeats = rsvpList.reduce((acc, g) => acc + (Number(g.partySize) || 1), 0);

    const acceptedList = rsvpList.filter((g) => g.responseStatus === 'Accepted');
    const acceptedParties = acceptedList.length;
    const acceptedSeats = acceptedList.reduce((acc, g) => acc + (Number(g.partySize) || 1), 0);

    const declinedList = rsvpList.filter((g) => g.responseStatus === 'Declined');
    const declinedParties = declinedList.length;

    const pelesCount = acceptedList.filter((g) => g.thuPeles).length;
    const brunchCount = acceptedList.filter((g) => g.satBrunch).length;
    const excursionCount = acceptedList.filter((g) => g.satExcursion).length;
    const dietaryCount = rsvpList.filter((g) => g.dietary && g.dietary.trim().length > 0 && g.dietary.trim() !== 'None').length;

    // Countdown to May 28, 2027
    const weddingDate = new Date('2027-05-28T16:00:00');
    const diffTime = weddingDate.getTime() - Date.now();
    const daysToGo = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      totalRsvps,
      totalSeats,
      acceptedParties,
      acceptedSeats,
      declinedParties,
      pelesCount,
      brunchCount,
      excursionCount,
      dietaryCount,
      daysToGo: daysToGo > 0 ? daysToGo : 236,
    };
  }, [guests]);

  // Filtered Guests (RSVP Submissions)
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      // Exclude un-responded invitee entries so manifest displays confirmed RSVPs
      if (g.responseStatus === 'No response') {
        return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        g.fullName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        (g.additionalGuests && g.additionalGuests.toLowerCase().includes(q)) ||
        (g.dietary && g.dietary.toLowerCase().includes(q)) ||
        (g.notes && g.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'Accepted') return g.responseStatus === 'Accepted';
      if (statusFilter === 'Declined') return g.responseStatus === 'Declined';
      if (statusFilter === 'Dietary') return g.dietary && g.dietary.trim().length > 0 && g.dietary.trim() !== 'None';
      return true;
    });
  }, [guests, searchQuery, statusFilter]);

  // Render Admin Lock Screen (Dark Luxury Design)
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 text-stone-100 selection:bg-carpathian-700 selection:text-gold-200">
        <div className="w-full max-w-md p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl backdrop-blur-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 mx-auto shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-serif text-stone-100 font-medium">Carpathian Celebration</h1>
            <p className="text-xs uppercase tracking-widest text-gold-500 font-mono">Host Admin Manifest</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="relative">
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setPasscodeError(false);
                }}
                placeholder="Enter admin passcode..."
                className="w-full px-4 py-3 bg-stone-950/80 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 text-center font-mono tracking-wider"
              />
            </div>

            {passcodeError && (
              <p className="text-xs text-red-400 bg-red-950/40 py-1.5 px-3 rounded-lg border border-red-800/40">
                Invalid passcode. Please enter the host key.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-carpathian-700 via-carpathian-600 to-carpathian-700 hover:from-carpathian-600 hover:to-carpathian-500 text-stone-100 font-medium text-sm tracking-wide shadow-lg border border-gold-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-gold-400" />
              <span>Unlock Host Portal</span>
            </button>
          </form>

          <div className="pt-2 border-t border-stone-850">
            <a
              href="/may2027/"
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to main wedding portal</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-carpathian-700 selection:text-gold-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-stone-950/90 border-b border-stone-850 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="/may2027/"
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-gold-500/50 text-stone-400 hover:text-stone-100 transition-all"
              title="Return to main portal"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base text-stone-100 tracking-wider">E & G</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                  Admin Portal
                </span>
                {isLiveConnected ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Google Sheets ({guests.length})
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                    Connecting to Sheets...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Castelul Cantacuzino • May 28, 2027 • Unified GSheets Manifest
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs font-medium hover:border-stone-700 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                <span>Open Google Sheet</span>
              </a>
            )}

            <button
              onClick={() => fetchSheetData()}
              disabled={isLoading || isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs font-medium hover:border-stone-700 transition-all"
              title="Refresh records from Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gold-400 ${isLoading || isSaving ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Sheets</span>
            </button>

            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-carpathian-800/60 border border-gold-500/30 text-gold-300 hover:text-gold-200 text-xs font-medium hover:bg-carpathian-800 transition-all"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-gold-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 transition-all"
              title="Settings & Webhook Config"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 transition-all"
              title="Lock Admin"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Alert if Status Message */}
        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 text-xs text-stone-300 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
              {statusMessage}
            </span>
            <button
              onClick={() => setStatusMessage('')}
              className="text-stone-500 hover:text-stone-300 text-xs uppercase tracking-wider font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Header Banner (Dark Carpathian Luxury with Countdown) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-carpathian-950/80 border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-stone-100 font-medium tracking-wide">
              Elizabeth & George
            </h1>
            <p className="text-xs sm:text-sm font-serif italic text-stone-400 flex items-center gap-2">
              <span>Castelul Cantacuzino, Bușteni</span>
              <span className="not-italic text-[10px] uppercase tracking-widest text-gold-400 font-mono bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
                CONFIRMED
              </span>
            </p>
          </div>

          <div className="text-left md:text-right space-y-0.5 relative z-10">
            <div className="text-sm sm:text-base font-semibold tracking-wider uppercase font-mono text-gold-400">
              28 MAY 2027
            </div>
            <div className="text-xs text-stone-400 font-mono">
              {stats.daysToGo} days to go
            </div>
          </div>

          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-carpathian-700/10 blur-3xl pointer-events-none" />
        </div>

        {/* 2. Timeline Milestones Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="text-[10px] uppercase tracking-wider font-mono text-stone-400 font-medium">
              Save-the-Dates Sent
            </div>
            <div className="text-base font-serif font-semibold text-stone-100 mt-1">
              By late Sept 2026
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900/90 border border-gold-500/50 shadow-sm relative">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider font-mono text-gold-400 font-medium">
                Respond By
              </div>
              <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" title="Active milestone" />
            </div>
            <div className="text-base font-serif font-semibold text-gold-300 mt-1">
              1 Dec 2026
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="text-[10px] uppercase tracking-wider font-mono text-stone-400 font-medium">
              Formal Invitations
            </div>
            <div className="text-base font-serif font-semibold text-stone-100 mt-1">
              Feb 2027
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="text-[10px] uppercase tracking-wider font-mono text-stone-400 font-medium">
              Wedding Day
            </div>
            <div className="text-base font-serif font-semibold text-stone-100 mt-1">
              28 May 2027
            </div>
          </div>
        </div>

        {/* 3. Live RSVP Headcounts & Event Attendance */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total RSVPs */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Total RSVPs</span>
              <Users className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-serif text-stone-100 font-semibold">{stats.totalSeats}</div>
            <p className="text-[10px] text-stone-500 mt-1">{stats.totalRsvps} {stats.totalRsvps === 1 ? 'party' : 'parties'} recorded</p>
          </div>

          {/* Attending (Yes) */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-emerald-900/40">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Attending (Yes)</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-serif text-emerald-400 font-semibold">{stats.acceptedSeats}</div>
            <p className="text-[10px] text-stone-500 mt-1">{stats.acceptedParties} {stats.acceptedParties === 1 ? 'party' : 'parties'} confirmed</p>
          </div>

          {/* Declined (No) */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Declined (No)</span>
              <UserX className="w-4 h-4 text-stone-500" />
            </div>
            <div className="text-2xl font-serif text-stone-400 font-semibold">{stats.declinedParties}</div>
            <p className="text-[10px] text-stone-500 mt-1">With regrets</p>
          </div>

          {/* Peleș Castle Tour */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Peleș Tour</span>
              <Calendar className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-serif text-gold-400 font-semibold">{stats.pelesCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Thursday 27 May</p>
          </div>

          {/* Recovery Brunch */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Recovery Brunch</span>
              <Utensils className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-serif text-amber-400 font-semibold">{stats.brunchCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Saturday 29 May</p>
          </div>

          {/* Cable Car / Bran Excursion */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Cable Car / Bran</span>
              <Mountain className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-serif text-sky-400 font-semibold">{stats.excursionCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Saturday excursion</p>
          </div>
        </div>

        {/* 4. Action Bar: Search, Filters, Record RSVP */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-stone-900 border border-stone-800 text-xs">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'All'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All RSVPs ({stats.totalRsvps})
            </button>
            <button
              onClick={() => setStatusFilter('Accepted')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'Accepted'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Accepted ({stats.acceptedParties})
            </button>
            <button
              onClick={() => setStatusFilter('Declined')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'Declined'
                  ? 'bg-stone-800 text-stone-300 border border-stone-700 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Declined ({stats.declinedParties})
            </button>
            <button
              onClick={() => setStatusFilter('Dietary')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'Dietary'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Dietary ({stats.dietaryCount})
            </button>
          </div>

          {/* Right: Search + Record RSVP Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest, email, partner, notes..."
                className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 hover:text-gold-100 text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record RSVP</span>
            </button>
          </div>
        </div>

        {/* 5. Unified Google Sheets Manifest Table */}
        {filteredGuests.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-stone-900/60 border border-stone-800 text-stone-400 space-y-3">
            <Users className="w-8 h-8 text-stone-600 mx-auto" />
            <div className="space-y-1">
              <p className="font-medium text-stone-300">No RSVPs Found</p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {searchQuery
                  ? `No guests match "${searchQuery}".`
                  : 'Guests who submit their RSVP will appear here in real time. You can also record RSVPs manually.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 text-stone-100 text-xs font-medium border border-gold-500/30"
              >
                + Record RSVP
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-stone-900/60 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] uppercase tracking-wider text-stone-400 font-mono">
                  <tr>
                    <th className="py-3.5 px-4 font-normal">Primary Guest</th>
                    <th className="py-3.5 px-4 font-normal">Contact</th>
                    <th className="py-3.5 px-4 font-normal text-center">Seats</th>
                    <th className="py-3.5 px-4 font-normal text-center">Response</th>
                    <th className="py-3.5 px-4 font-normal">Partner / Plus-One</th>
                    <th className="py-3.5 px-4 font-normal text-center">Events RSVP</th>
                    <th className="py-3.5 px-4 font-normal">Dietary & Allergies</th>
                    <th className="py-3.5 px-4 font-normal">Lodging</th>
                    <th className="py-3.5 px-4 font-normal">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850 text-stone-300">
                  {filteredGuests.map((g) => (
                    <tr key={g.id} className="hover:bg-stone-850/30 transition-colors">
                      {/* Name & Plus-one */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-100">{g.fullName}</div>
                        {g.additionalGuests && (
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Plus-one: {g.additionalGuests}
                          </div>
                        )}
                      </td>

                      {/* Email & Cell */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-stone-300">
                          <Mail className="w-3 h-3 text-stone-500 shrink-0" />
                          <span className="font-mono text-[11px]">{g.email || <span className="text-stone-600">No email</span>}</span>
                        </div>
                        {g.phone && (
                          <div className="flex items-center gap-1.5 text-stone-400">
                            <Phone className="w-3 h-3 text-stone-500 shrink-0" />
                            <span className="font-mono text-[11px]">{g.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Number of People */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-mono text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          g.partySize > 1
                            ? 'bg-carpathian-950 text-emerald-300 border-emerald-800/50'
                            : 'bg-stone-950 text-stone-300 border-stone-800'
                        }`}>
                          {g.partySize} {g.partySize === 1 ? 'seat' : 'seats'}
                        </span>
                      </td>

                      {/* Response Status Indicator */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[11px] font-medium px-3 py-1 rounded-full border ${
                            g.responseStatus === 'Accepted'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                              : g.responseStatus === 'Declined'
                              ? 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                              : 'bg-stone-950 text-stone-400 border-stone-800'
                          }`}
                        >
                          {g.responseStatus === 'Accepted' ? 'Accepted' : g.responseStatus === 'Declined' ? 'Declined' : 'Pending'}
                        </span>
                      </td>

                      {/* Partner / Plus-One */}
                      <td className="py-3.5 px-4">
                        {g.additionalGuests && g.additionalGuests.trim() && g.additionalGuests !== 'None' && g.additionalGuests !== 'NO' && g.additionalGuests !== 'YES' ? (
                          <div className="flex items-center gap-1.5 text-stone-200 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>{g.additionalGuests}</span>
                          </div>
                        ) : (
                          <span className="text-stone-600 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Events */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {g.thuPeles && <span className="text-[10px] bg-gold-950/40 text-gold-400 border border-gold-800/40 px-1.5 py-0.5 rounded">Peleș</span>}
                          {g.satBrunch && <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded">Brunch</span>}
                          {g.satExcursion && <span className="text-[10px] bg-carpathian-950 text-emerald-300 border border-emerald-900/40 px-1.5 py-0.5 rounded">Excursion</span>}
                          {!g.thuPeles && !g.satBrunch && !g.satExcursion && <span className="text-stone-600">—</span>}
                        </div>
                      </td>

                      {/* Dietary */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        {g.dietary && g.dietary.trim() ? (
                          g.dietary.includes("|") ? (
                            <div className="space-y-1">
                              {g.dietary.split("|").map((part, pIdx) => {
                                const colonIdx = part.indexOf(":");
                                const person = colonIdx > -1 ? part.slice(0, colonIdx).trim() : "";
                                const diet = colonIdx > -1 ? part.slice(colonIdx + 1).trim() : part.trim();
                                return (
                                  <div key={pIdx} className="text-[10px] font-mono flex items-center gap-1.5 flex-wrap">
                                    <span className="text-stone-400 font-semibold">{person || (pIdx === 0 ? "Primary" : "Plus-One")}:</span>
                                    <span
                                      className={
                                        pIdx === 0
                                          ? "text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/30"
                                          : "text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30"
                                      }
                                    >
                                      {diet}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-800/30">
                              {g.dietary}
                            </span>
                          )
                        ) : (
                          <span className="text-stone-600 font-mono text-[11px]">None</span>
                        )}
                      </td>

                      {/* Lodging */}
                      <td className="py-3.5 px-4 text-stone-400 max-w-[130px] truncate" title={g.lodging || ''}>
                        {g.lodging || <span className="text-stone-600">—</span>}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 text-stone-400 max-w-[180px] truncate" title={g.notes || ''}>
                        {g.notes || <span className="text-stone-600">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Record RSVP */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 text-stone-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-gold-400" />
                <h3 className="font-serif text-lg text-stone-100 font-medium">Record Guest RSVP</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-500 hover:text-stone-300 text-sm font-mono">✕</button>
            </div>

            <form onSubmit={handleRecordManualRsvp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Primary Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRsvp.fullName}
                  onChange={(e) => setNewRsvp({ ...newRsvp, fullName: e.target.value })}
                  placeholder="e.g. Andrei Fratian"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newRsvp.email}
                    onChange={(e) => setNewRsvp({ ...newRsvp, email: e.target.value })}
                    placeholder="guest@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Cell Phone
                  </label>
                  <input
                    type="tel"
                    value={newRsvp.phone}
                    onChange={(e) => setNewRsvp({ ...newRsvp, phone: e.target.value })}
                    placeholder="+1 (408) 555-0199"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Response Status
                  </label>
                  <select
                    value={newRsvp.responseStatus}
                    onChange={(e) => setNewRsvp({ ...newRsvp, responseStatus: e.target.value as ResponseStatus })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  >
                    <option value="Accepted">Accepted (Attending)</option>
                    <option value="Declined">Declined (Regrets)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Number of Seats
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newRsvp.additionalGuests.trim() ? Math.max(2, newRsvp.partySize) : newRsvp.partySize}
                    onChange={(e) => setNewRsvp({ ...newRsvp, partySize: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Partner / Plus-One Full Name
                </label>
                <input
                  type="text"
                  value={newRsvp.additionalGuests}
                  onChange={(e) => setNewRsvp({ ...newRsvp, additionalGuests: e.target.value })}
                  placeholder="e.g. Mary Fratian (optional)"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Events Attending
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRsvp.thuPeles}
                      onChange={(e) => setNewRsvp({ ...newRsvp, thuPeles: e.target.checked })}
                      className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-900 border-stone-700"
                    />
                    <span className="text-[11px] text-stone-300">Peleș Tour</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRsvp.satBrunch}
                      onChange={(e) => setNewRsvp({ ...newRsvp, satBrunch: e.target.checked })}
                      className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-900 border-stone-700"
                    />
                    <span className="text-[11px] text-stone-300">Brunch</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRsvp.satExcursion}
                      onChange={(e) => setNewRsvp({ ...newRsvp, satExcursion: e.target.checked })}
                      className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-900 border-stone-700"
                    />
                    <span className="text-[11px] text-stone-300">Excursion</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Dietary Requirements
                  </label>
                  <input
                    type="text"
                    value={newRsvp.dietary}
                    onChange={(e) => setNewRsvp({ ...newRsvp, dietary: e.target.value })}
                    placeholder="e.g. Vegetarian, Gluten-free"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Lodging / Hotel
                  </label>
                  <input
                    type="text"
                    value={newRsvp.lodging}
                    onChange={(e) => setNewRsvp({ ...newRsvp, lodging: e.target.value })}
                    placeholder="e.g. Sinaia Palace Hotel"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Notes / Special Wishes
                </label>
                <textarea
                  rows={2}
                  value={newRsvp.notes}
                  onChange={(e) => setNewRsvp({ ...newRsvp, notes: e.target.value })}
                  placeholder="Notes from guest or host..."
                  className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 text-stone-100 text-xs font-medium border border-gold-500/30 flex items-center gap-1.5"
                >
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Record RSVP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Settings & Google Sheets Webhook */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-5 text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold-400" />
                <h3 className="font-serif text-lg text-stone-100">Google Sheets Integration</h3>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="text-stone-500 hover:text-stone-300 text-sm font-mono">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-stone-400 leading-relaxed">
                Connect your Google Apps Script Webhook URL so the admin dashboard can sync directly with your Google
                Drive Spreadsheet:
              </p>

              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase tracking-wider text-stone-300 font-mono">
                  Google Apps Script Web App URL:
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1 text-stone-400 text-[11px]">
                <span className="font-semibold text-gold-400 block font-mono">Live RSVP Manifest:</span>
                <p>
                  Guest responses submitted through the wedding RSVP portal are logged directly to your Google Sheet in real time with party sizes, dietary requirements, and event attendance.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-5 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 text-stone-100 text-xs font-medium border border-gold-500/30"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
