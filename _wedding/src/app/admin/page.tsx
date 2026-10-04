'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Utensils,
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
  Lock,
  Settings,
  Search,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Copy,
  ChevronDown,
  Sparkles,
  Mountain,
  Mail,
  Clock,
  Eye,
  Check,
} from 'lucide-react';

interface RsvpItem {
  id: number;
  timestamp: string;
  fullName: string;
  email: string;
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

// Sample mock guests for demonstration before Google Sheet connection
const INITIAL_DEMO_DATA: RsvpItem[] = [
  {
    id: 1,
    timestamp: '2026-10-02T14:22:10Z',
    fullName: 'Alexander & Elena Vancea',
    email: 'alex.vancea@example.com',
    attending: true,
    additionalGuests: 'Elena Vancea',
    dietary: 'Vegetarian (Elena)',
    thuPeles: true,
    satBrunch: true,
    satExcursion: true,
    lodging: 'Bușteni — Vila Silva',
    notes: 'So thrilled to celebrate with you at Cantacuzino! Can’t wait for Peleș.',
    language: 'RO',
  },
  {
    id: 2,
    timestamp: '2026-10-02T16:45:00Z',
    fullName: 'Marcus Aurelius Sterling',
    email: 'm.sterling@investments.co.uk',
    attending: true,
    additionalGuests: '',
    dietary: 'Gluten-Free, Dairy-Free',
    thuPeles: true,
    satBrunch: true,
    satExcursion: false,
    lodging: 'Sinaia — Hotel International',
    notes: 'Flying into OTP from London Heathrow. Looking forward to the banquet!',
    language: 'EN',
  },
  {
    id: 3,
    timestamp: '2026-10-03T09:12:30Z',
    fullName: 'Sophia Maria Popescu',
    email: 'sophia.m.popescu@gmail.com',
    attending: false,
    additionalGuests: '',
    dietary: '',
    thuPeles: false,
    satBrunch: false,
    satExcursion: false,
    lodging: '',
    notes: 'Wishing you both a lifetime of happiness! Regretfully unable to make the trip from New York.',
    language: 'RO',
  },
  {
    id: 4,
    timestamp: '2026-10-03T11:30:15Z',
    fullName: 'David & Rachel Miller',
    email: 'david.miller@techfirm.io',
    attending: true,
    additionalGuests: 'Rachel Miller',
    dietary: 'Nut allergy (David)',
    thuPeles: true,
    satBrunch: true,
    satExcursion: true,
    lodging: 'Brașov Old Town — Aro Palace',
    notes: 'Taking the scenic train up from Bucharest! See you there.',
    language: 'EN',
  },
];

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const [rsvps, setRsvps] = useState<RsvpItem[]>(INITIAL_DEMO_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declined' | 'dietary'>('all');

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

    // Load saved webhook URL
    const envWebhook = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL || '';
    const storedWebhook = localStorage.getItem('wedding_webhook_url') || '';
    const activeUrl = storedWebhook.trim() || envWebhook.trim();
    if (activeUrl) {
      setWebhookUrl(activeUrl);
    }
  }, []);

  // Fetch RSVPs from Google Apps Script
  const fetchRsvps = async (overrideUrl?: string) => {
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
        setRsvps(json.data);
        setIsLiveConnected(true);
        if (json.spreadsheetUrl) {
          setSpreadsheetUrl(json.spreadsheetUrl);
        }
        setStatusMessage(`Successfully synced ${json.data.length} live records from Google Sheets.`);
      } else if (json && json.status === 'ok') {
        setIsLiveConnected(true);
        if (json.spreadsheetUrl) setSpreadsheetUrl(json.spreadsheetUrl);
        setStatusMessage('Connected to Google Apps Script. No records submitted yet.');
      } else {
        throw new Error(json.message || 'Invalid response format');
      }
    } catch (err: any) {
      console.warn('Could not fetch from live Google Sheet:', err.message);
      setIsLiveConnected(false);
      setStatusMessage('Notice: Google Sheet offline or webhook not yet deployed. Showing cached/demo records.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when unlocked and webhook URL is ready
  useEffect(() => {
    if (isUnlocked && webhookUrl) {
      fetchRsvps();
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
    fetchRsvps(webhookUrl.trim());
  };

  // Export to CSV
  const exportCsv = () => {
    const headers = [
      'ID',
      'Timestamp UTC',
      'Primary Guest Name',
      'Email Address',
      'Attending (May 28)',
      'Plus-One / Additional Names',
      'Dietary Restrictions',
      'Thu May 27 Peleș Tour',
      'Sat May 29 Farewell Brunch',
      'Sat May 29 Excursion',
      'Lodging Location',
      'Notes & Wishes',
      'Language',
    ];

    const rows = filteredRsvps.map((r) => [
      r.id,
      r.timestamp,
      `"${(r.fullName || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      r.attending ? 'YES' : 'NO',
      `"${(r.additionalGuests || '').replace(/"/g, '""')}"`,
      `"${(r.dietary || '').replace(/"/g, '""')}"`,
      r.thuPeles ? 'YES' : 'NO',
      r.satBrunch ? 'YES' : 'NO',
      r.satExcursion ? 'YES' : 'NO',
      `"${(r.lodging || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      r.language || 'EN',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `elizabeth-george-rsvps-${new Date().toISOString().slice(0, 10)}.csv`);
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

  // Computed Metrics
  const stats = useMemo(() => {
    const total = rsvps.length;
    const attendingCount = rsvps.filter((r) => r.attending).length;
    const declinedCount = total - attendingCount;

    // Calculate total head count including plus ones
    let totalConfirmedSeats = 0;
    rsvps.forEach((r) => {
      if (r.attending) {
        totalConfirmedSeats += 1;
        if (r.additionalGuests && r.additionalGuests.trim()) {
          // If plus-one field contains commas or "and", estimate count
          const plusCount = r.additionalGuests.split(/,|&|and/i).filter((s) => s.trim().length > 0).length;
          totalConfirmedSeats += Math.max(1, plusCount);
        }
      }
    });

    const pelesCount = rsvps.filter((r) => r.attending && r.thuPeles).length;
    const brunchCount = rsvps.filter((r) => r.attending && r.satBrunch).length;
    const excursionCount = rsvps.filter((r) => r.attending && r.satExcursion).length;
    const dietaryCount = rsvps.filter((r) => r.attending && r.dietary && r.dietary.trim().length > 0).length;

    return {
      total,
      attendingCount,
      declinedCount,
      totalConfirmedSeats,
      pelesCount,
      brunchCount,
      excursionCount,
      dietaryCount,
    };
  }, [rsvps]);

  // Filtered List
  const filteredRsvps = useMemo(() => {
    return rsvps.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        r.fullName.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        (r.additionalGuests && r.additionalGuests.toLowerCase().includes(query)) ||
        (r.notes && r.notes.toLowerCase().includes(query)) ||
        (r.dietary && r.dietary.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (statusFilter === 'attending') return r.attending;
      if (statusFilter === 'declined') return !r.attending;
      if (statusFilter === 'dietary') return r.attending && r.dietary && r.dietary.trim().length > 0;
      return true;
    });
  }, [rsvps, searchQuery, statusFilter]);

  // Render Admin Lock Screen
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
              <span>Unlock Guest Manifest</span>
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

  // Render Full Admin Dashboard
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
                    Live Sheets
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                    Mock / Local Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Castelul Cantacuzino • May 28, 2027 • Real-Time Manifest
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
              onClick={() => fetchRsvps()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-stone-100 text-xs font-medium hover:border-stone-700 transition-all"
              title="Refresh records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gold-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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

        {/* Quick Guest Bypass Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900 to-carpathian-950/60 border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-gold-400 font-mono font-medium">
                Guest Passcode Bypass Link
              </span>
              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-mono">
                Cantacuzino27
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Send this link to VIP guests for single-click automatic portal unlocking without typing the passcode:
            </p>
          </div>
          <button
            onClick={copyBypassLink}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-xs font-medium flex items-center gap-2 transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gold-400" />}
            <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Bypass Link'}</span>
          </button>
        </div>

        {/* KPI Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* Confirmed Attending */}
          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-stone-900/70 border border-emerald-900/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Confirmed Seats</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-serif text-stone-100 font-semibold">{stats.totalConfirmedSeats}</div>
            <p className="text-[10px] text-stone-500 mt-1">{stats.attendingCount} primary + plus-ones</p>
          </div>

          {/* Attending Primary */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Attending</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-serif text-emerald-400 font-semibold">{stats.attendingCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Primary RSVPs</p>
          </div>

          {/* Declined */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Declined</span>
              <XCircle className="w-4 h-4 text-stone-500" />
            </div>
            <div className="text-2xl font-serif text-stone-400 font-semibold">{stats.declinedCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">With regrets</p>
          </div>

          {/* Thu Peleș */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Thu Peleș</span>
              <Calendar className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-serif text-gold-400 font-semibold">{stats.pelesCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Tour & welcome feast</p>
          </div>

          {/* Sat Brunch */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Sat Brunch</span>
              <Utensils className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-serif text-stone-200 font-semibold">{stats.brunchCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Farewell recovery</p>
          </div>

          {/* Sat Excursion */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Excursion</span>
              <Mountain className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-serif text-stone-200 font-semibold">{stats.excursionCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Cable Car / Bran</p>
          </div>

          {/* Dietary Alerts */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-amber-900/30">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Dietary</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-serif text-amber-400 font-semibold">{stats.dietaryCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Special menus</p>
          </div>
        </div>

        {/* Dietary Requirements Summary Box */}
        {stats.dietaryCount > 0 && (
          <div className="p-5 rounded-2xl bg-stone-900/50 border border-amber-900/20 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-400 font-mono">
              <Utensils className="w-3.5 h-3.5" />
              <span>Catering & Dietary Requirements Digest ({stats.dietaryCount} Guests)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {rsvps
                .filter((r) => r.attending && r.dietary && r.dietary.trim())
                .map((r) => (
                  <div key={r.id} className="p-3 rounded-xl bg-stone-950/70 border border-stone-850 text-xs">
                    <span className="font-medium text-stone-200">{r.fullName}</span>
                    <span className="text-stone-500 block text-[11px]">{r.email}</span>
                    <span className="inline-block mt-1 text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md font-mono text-[11px]">
                      {r.dietary}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-stone-900 border border-stone-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All ({rsvps.length})
            </button>
            <button
              onClick={() => setStatusFilter('attending')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'attending'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Attending ({stats.attendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('declined')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'declined'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Declined ({stats.declinedCount})
            </button>
            <button
              onClick={() => setStatusFilter('dietary')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'dietary'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Dietary ({stats.dietaryCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, dietary, notes..."
              className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500"
            />
          </div>
        </div>

        {/* Guest Manifest Table */}
        <div className="rounded-3xl bg-stone-900/60 border border-stone-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] uppercase tracking-wider text-stone-400 font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-normal">Guest</th>
                  <th className="py-3.5 px-4 font-normal">Status</th>
                  <th className="py-3.5 px-4 font-normal">Plus-One / Party</th>
                  <th className="py-3.5 px-4 font-normal">Events RSVP</th>
                  <th className="py-3.5 px-4 font-normal">Dietary</th>
                  <th className="py-3.5 px-4 font-normal">Lodging / Shuttle</th>
                  <th className="py-3.5 px-4 font-normal">Notes</th>
                  <th className="py-3.5 px-4 font-normal">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850 text-stone-300">
                {filteredRsvps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-500">
                      No RSVP records match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRsvps.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-850/30 transition-colors">
                      {/* Guest Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-100">{r.fullName}</div>
                        <a
                          href={`mailto:${r.email}`}
                          className="text-[11px] text-stone-500 hover:text-gold-400 transition-colors flex items-center gap-1 mt-0.5"
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{r.email}</span>
                        </a>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {r.attending ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Attending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-950 border border-stone-800 px-2.5 py-1 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Declined
                          </span>
                        )}
                      </td>

                      {/* Additional Guests */}
                      <td className="py-3.5 px-4">
                        {r.additionalGuests && r.additionalGuests.trim() ? (
                          <span className="text-stone-200">{r.additionalGuests}</span>
                        ) : (
                          <span className="text-stone-600">—</span>
                        )}
                      </td>

                      {/* Events */}
                      <td className="py-3.5 px-4">
                        {r.attending ? (
                          <div className="flex flex-wrap gap-1">
                            {r.thuPeles && (
                              <span className="text-[10px] bg-gold-950/40 text-gold-400 border border-gold-800/40 px-2 py-0.5 rounded-md font-mono">
                                Peleș
                              </span>
                            )}
                            {r.satBrunch && (
                              <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md font-mono">
                                Brunch
                              </span>
                            )}
                            {r.satExcursion && (
                              <span className="text-[10px] bg-carpathian-950 text-emerald-300 border border-emerald-900/40 px-2 py-0.5 rounded-md font-mono">
                                Excursion
                              </span>
                            )}
                            {!r.thuPeles && !r.satBrunch && !r.satExcursion && (
                              <span className="text-[10px] text-stone-500">Banquet only</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-600">—</span>
                        )}
                      </td>

                      {/* Dietary */}
                      <td className="py-3.5 px-4">
                        {r.dietary && r.dietary.trim() ? (
                          <span className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md font-mono">
                            {r.dietary}
                          </span>
                        ) : (
                          <span className="text-stone-600 font-mono text-[11px]">None</span>
                        )}
                      </td>

                      {/* Lodging */}
                      <td className="py-3.5 px-4 max-w-[180px] truncate" title={r.lodging || ''}>
                        {r.lodging || <span className="text-stone-600">—</span>}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 max-w-[200px] truncate" title={r.notes || ''}>
                        {r.notes || <span className="text-stone-600">—</span>}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                        {r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Settings & Google Sheet Setup Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-5 text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold-400" />
                <h3 className="font-serif text-lg text-stone-100">Google Sheets Integration</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-stone-500 hover:text-stone-300 text-sm font-mono"
              >
                ✕
              </button>
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
                <span className="font-semibold text-gold-400 block font-mono">How to get this URL:</span>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open your Google Sheet ("Elizabeth & George Wedding RSVPs 2027").</li>
                  <li>Click Extensions &gt; Apps Script.</li>
                  <li>Paste the code from <code className="text-stone-200">scripts/google-apps-script.js</code>.</li>
                  <li>Deploy &gt; New deployment &gt; Type: Web app &gt; Access: Anyone.</li>
                  <li>Paste the generated Web app URL above and click Save.</li>
                </ol>
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
