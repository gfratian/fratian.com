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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Accepted' | 'Declined' | 'No response' | 'Dietary'>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [editingGuest, setEditingGuest] = useState<SheetGuest | null>(null);

  // Single Add Form
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
    partySize: 2,
    invited: true,
    responseStatus: 'No response' as ResponseStatus,
  });

  // Bulk Load Text Area
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkError, setBulkError] = useState<string>('');

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

          return {
            id: r.id,
            timestamp: r.timestamp || '',
            fullName: r.fullName || 'Guest',
            email: r.email || '',
            phone: phone,
            partySize: parseInt(r.partySize, 10) || 1,
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

  // Add Single Invitee
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name || !newGuest.name.trim()) return;

    const inviteeItem = {
      name: newGuest.name.trim(),
      email: (newGuest.email || '').trim(),
      phone: (newGuest.phone || '').trim(),
      partySize: Math.max(1, Number(newGuest.partySize) || 1),
      invited: newGuest.invited,
      responseStatus: newGuest.responseStatus,
    };

    // Optimistically update UI
    const tempGuest: SheetGuest = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      fullName: inviteeItem.name,
      email: inviteeItem.email,
      phone: inviteeItem.phone,
      partySize: inviteeItem.partySize,
      invited: inviteeItem.invited,
      responseStatus: inviteeItem.responseStatus,
      attending: inviteeItem.responseStatus === 'Accepted',
    };
    setGuests((prev) => [...prev, tempGuest]);

    setIsAddModalOpen(false);
    setNewGuest({
      name: '',
      email: '',
      phone: '',
      partySize: 2,
      invited: true,
      responseStatus: 'No response',
    });

    // Write to Google Sheet
    await postInviteesToSheet([inviteeItem]);
  };

  // Bulk Load / Paste Invitees
  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setBulkError('');

    try {
      const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const parsedList: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/,|\t|\|/).map((p) => p.trim());
        if (parts.length === 0 || !parts[0]) continue;

        // Skip header lines
        if (i === 0 && (parts[0].toLowerCase() === 'name' || parts[0].toLowerCase() === 'full name')) {
          continue;
        }

        const name = parts[0];
        const email = parts[1] || '';
        const phone = parts[2] || '';
        const count = Math.max(1, parseInt(parts[3], 10) || 2);

        parsedList.push({
          name,
          email,
          phone,
          partySize: count,
          invited: true,
          responseStatus: 'No response',
        });
      }

      if (parsedList.length === 0) {
        setBulkError('No valid rows found. Format: Name, Email, Cell, People Count');
        return;
      }

      setIsBulkModalOpen(false);
      setBulkText('');

      // Send to Google Sheet
      await postInviteesToSheet(parsedList);
      setStatusMessage(`Sending ${parsedList.length} invitees to Google Sheets...`);
    } catch (err: any) {
      setBulkError(`Import error: ${err.message}`);
    }
  };

  const insertSampleBulk = () => {
    setBulkText(
      `Andrei and Mary Fratian, andreifratian@gmail.com, +1 (408) 555-0199, 2\n` +
      `Alexander and Elena Vancea, alex.vancea@gmail.com, +40 722 123 456, 2\n` +
      `Marcus Aurelius Sterling, m.sterling@investments.co.uk, +44 20 7946 0912, 1\n` +
      `David and Rachel Miller, david.miller@techfirm.io, +1 (650) 555-0144, 2\n` +
      `Sophia Maria Popescu, sophia.m.popescu@gmail.com, +40 744 987 654, 2`
    );
  };

  // Toggle Invited Checkbox directly in row
  const toggleInvited = async (guest: SheetGuest) => {
    const updated = guests.map((g) => (g.id === guest.id ? { ...g, invited: !g.invited } : g));
    setGuests(updated);

    // Sync update to sheet
    await postInviteesToSheet([
      {
        name: guest.fullName,
        email: guest.email,
        phone: guest.phone,
        partySize: guest.partySize,
        invited: !guest.invited,
        responseStatus: guest.responseStatus,
      },
    ]);
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
      'Invited Indicator',
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
      g.invited ? 'YES' : 'NO',
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

  // Computed Comparison Metrics: Invitees vs Accepted vs Declined vs No Response
  const stats = useMemo(() => {
    const totalParties = guests.length;
    const totalGuests = guests.reduce((acc, g) => acc + (Number(g.partySize) || 1), 0);

    const acceptedList = guests.filter((g) => g.responseStatus === 'Accepted');
    const acceptedParties = acceptedList.length;
    const acceptedSeats = acceptedList.reduce((acc, g) => acc + (Number(g.partySize) || 1), 0);

    const declinedList = guests.filter((g) => g.responseStatus === 'Declined');
    const declinedParties = declinedList.length;

    const noResponseList = guests.filter((g) => g.responseStatus === 'No response');
    const noResponseParties = noResponseList.length;
    const noResponseSeats = noResponseList.reduce((acc, g) => acc + (Number(g.partySize) || 1), 0);

    const invitedCount = guests.filter((g) => g.invited).length;
    const noEmailCount = guests.filter((g) => !g.email || !g.email.trim()).length;
    const noPhoneCount = guests.filter((g) => !g.phone || !g.phone.trim()).length;

    const pelesCount = guests.filter((g) => g.responseStatus === 'Accepted' && g.thuPeles).length;
    const brunchCount = guests.filter((g) => g.responseStatus === 'Accepted' && g.satBrunch).length;
    const excursionCount = guests.filter((g) => g.responseStatus === 'Accepted' && g.satExcursion).length;
    const dietaryCount = guests.filter((g) => g.dietary && g.dietary.trim().length > 0).length;

    const responseRate = totalParties > 0 ? Math.round(((totalParties - noResponseParties) / totalParties) * 100) : 0;

    // Countdown to May 28, 2027
    const weddingDate = new Date('2027-05-28T16:00:00');
    const diffTime = weddingDate.getTime() - Date.now();
    const daysToGo = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      totalParties,
      totalGuests,
      acceptedParties,
      acceptedSeats,
      declinedParties,
      noResponseParties,
      noResponseSeats,
      invitedCount,
      noEmailCount,
      noPhoneCount,
      pelesCount,
      brunchCount,
      excursionCount,
      dietaryCount,
      responseRate,
      daysToGo: daysToGo > 0 ? daysToGo : 236,
    };
  }, [guests]);

  // Filtered Guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
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
      if (statusFilter === 'No response') return g.responseStatus === 'No response';
      if (statusFilter === 'Dietary') return g.dietary && g.dietary.trim().length > 0;
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

        {/* 3. Comparison Metrics: Invitees vs Accepted vs Declined vs No Response */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Invitees */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Total Invitees</span>
              <Users className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-serif text-stone-100 font-semibold">{stats.totalGuests}</div>
            <p className="text-[10px] text-stone-500 mt-1">{stats.totalParties} parties in sheet</p>
          </div>

          {/* Accepted (Yes) */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-emerald-900/40">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Accepted (Yes)</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-serif text-emerald-400 font-semibold">{stats.acceptedSeats}</div>
            <p className="text-[10px] text-stone-500 mt-1">{stats.acceptedParties} parties accepted</p>
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

          {/* No Response */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-amber-900/30">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">No Response</span>
              <UserMinus className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-serif text-amber-400 font-semibold">{stats.noResponseSeats}</div>
            <p className="text-[10px] text-stone-500 mt-1">{stats.noResponseParties} parties pending</p>
          </div>

          {/* Planning Email Sent (Invited) */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Invited Sent</span>
              <Mail className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-serif text-stone-200 font-semibold">
              {stats.invitedCount} <span className="text-sm font-sans text-stone-500">/ {stats.totalParties}</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Invited = YES</p>
          </div>

          {/* Response Rate */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Response Rate</span>
              <Clock className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-serif text-gold-400 font-semibold">{stats.responseRate}%</div>
            <p className="text-[10px] text-stone-500 mt-1">Responded so far</p>
          </div>
        </div>

        {/* 4. Action Bar: Search, Filters, Load Guests */}
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
              All ({guests.length})
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
              onClick={() => setStatusFilter('No response')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'No response'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              No Response ({stats.noResponseParties})
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

          {/* Right: Search + Load Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, cell, notes..."
                className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500"
              />
            </div>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 hover:text-stone-100 text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
              title="Bulk load guests from CSV or text paste"
            >
              <Upload className="w-3.5 h-3.5 text-gold-400" />
              <span>Bulk Load</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 hover:text-gold-100 text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Invitee</span>
            </button>
          </div>
        </div>

        {/* 5. Unified Google Sheets Manifest Table */}
        {filteredGuests.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-stone-900/60 border border-stone-800 text-stone-400 space-y-3">
            <Users className="w-8 h-8 text-stone-600 mx-auto" />
            <div className="space-y-1">
              <p className="font-medium text-stone-300">No Guests Found</p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                {searchQuery
                  ? `No guests match "${searchQuery}".`
                  : 'Load your invitees or wait for guests to submit RSVPs. All entries sync directly to your Google Sheet.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 text-stone-100 text-xs font-medium border border-gold-500/30"
              >
                ⚡ Bulk Load Guest List
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700"
              >
                + Add Single Invitee
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-stone-900/60 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] uppercase tracking-wider text-stone-400 font-mono">
                  <tr>
                    <th className="py-3.5 px-4 font-normal">Primary Guest(s)</th>
                    <th className="py-3.5 px-4 font-normal">Contact (Email & Cell)</th>
                    <th className="py-3.5 px-4 font-normal">Seats</th>
                    <th className="py-3.5 px-4 font-normal">Invited</th>
                    <th className="py-3.5 px-4 font-normal">Response Status</th>
                    <th className="py-3.5 px-4 font-normal">Events RSVP</th>
                    <th className="py-3.5 px-4 font-normal">Dietary</th>
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
                      <td className="py-3.5 px-4">
                        <span className="text-stone-200 font-mono bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                          {g.partySize} {g.partySize === 1 ? 'seat' : 'seats'}
                        </span>
                      </td>

                      {/* Invited Indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={g.invited}
                            onChange={() => toggleInvited(g)}
                            className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800 cursor-pointer"
                          />
                          <span className={`text-[11px] font-mono ${g.invited ? 'text-emerald-400' : 'text-stone-600'}`}>
                            {g.invited ? 'YES' : 'NO'}
                          </span>
                        </label>
                      </td>

                      {/* Response Status Indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={g.responseStatus}
                          onChange={(e) => updateStatus(g, e.target.value as ResponseStatus)}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer border appearance-none focus:outline-none transition-all ${
                            g.responseStatus === 'Accepted'
                              ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                              : g.responseStatus === 'Declined'
                              ? 'bg-stone-950 text-stone-500 border-stone-800'
                              : 'bg-amber-950/30 text-amber-300 border-amber-800/30'
                          }`}
                        >
                          <option value="Accepted" className="bg-stone-900 text-emerald-400">Accepted</option>
                          <option value="Declined" className="bg-stone-900 text-stone-400">Declined</option>
                          <option value="No response" className="bg-stone-900 text-amber-300">No response</option>
                        </select>
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

      {/* MODAL: Bulk Load Guests */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-gold-400" />
                <h3 className="font-serif text-lg text-stone-100 font-medium">Bulk Load Guests into Google Sheet</h3>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-stone-500 hover:text-stone-300 text-sm font-mono">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-stone-400 leading-relaxed">
                Paste your guest list lines below. Each entry will be saved directly into your Google Sheet with <code className="text-emerald-400 font-mono">Invited: YES</code> and <code className="text-amber-400 font-mono">Response: No response</code>.
              </p>

              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-[11px]">Format: Full Name, Email, Cell Phone, Number of People</span>
                <button
                  type="button"
                  onClick={insertSampleBulk}
                  className="text-gold-400 hover:text-gold-300 text-[11px] underline font-mono"
                >
                  Insert Sample Data
                </button>
              </div>

              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Andrei and Mary Fratian, andreifratian@gmail.com, +1 (408) 555-0199, 2"
                className="w-full p-3.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />

              {bulkError && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs">
                  {bulkError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                disabled={!bulkText.trim() || isSaving}
                className="px-5 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 disabled:opacity-50 text-stone-100 text-xs font-medium border border-gold-500/30 flex items-center gap-1.5"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Import to Google Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Single Invitee */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-serif text-lg text-stone-100 font-medium">Add Invitee to Google Sheet</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-500 hover:text-stone-300 text-sm font-mono">✕</button>
            </div>

            <form onSubmit={handleAddSingle} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Primary Name(s) *
                </label>
                <input
                  type="text"
                  required
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  placeholder="e.g. Andrei and Mary Fratian"
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
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    placeholder="andreifratian@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Cell Phone
                  </label>
                  <input
                    type="tel"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    placeholder="+1 (408) 555-0199"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Number of People
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newGuest.partySize}
                    onChange={(e) => setNewGuest({ ...newGuest, partySize: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Response Status
                  </label>
                  <select
                    value={newGuest.responseStatus}
                    onChange={(e) => setNewGuest({ ...newGuest, responseStatus: e.target.value as ResponseStatus })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  >
                    <option value="No response">No response</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newGuest.invited}
                    onChange={(e) => setNewGuest({ ...newGuest, invited: e.target.checked })}
                    className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800"
                  />
                  <span className="text-xs text-stone-200">Invited indicator (Planning Email / Save-the-Date sent)</span>
                </label>
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
                  <span>Save to Google Sheet</span>
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
                <span className="font-semibold text-gold-400 block font-mono">Unified Manifest:</span>
                <p>
                  Both your invited roster and RSVP responses live in the same Google Sheet. It tracks both the <strong className="text-stone-200">Invited</strong> indicator and the <strong className="text-stone-200">Response Status</strong> (Accepted, Declined, No response).
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
