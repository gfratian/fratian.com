'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
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
  Layers,
} from 'lucide-react';

export type InviteeStatus = 'No response' | 'Accepted' | 'Declined' | 'Maybe';

export interface Invitee {
  id: string;
  name: string;
  email: string;
  phone: string;
  partySize: number;
  status: InviteeStatus;
  planningEmailSent: boolean;
  planningEmailNote?: string;
  group?: string;
  notes?: string;
  // Merged live RSVP details if matched from Google Sheet
  hasRsvpMatch?: boolean;
  rsvpTimestamp?: string;
  additionalGuests?: string;
  dietary?: string;
  thuPeles?: boolean;
  satBrunch?: boolean;
  satExcursion?: boolean;
  lodging?: string;
}

export interface SheetRsvp {
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

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  // Active Main Tab: 'invitees' (Guest Loading / Master List) vs 'rsvps' (Google Sheets Live Feed)
  const [activeTab, setActiveTab] = useState<'invitees' | 'rsvps'>('invitees');

  // Configuration
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Data
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [sheetRsvps, setSheetRsvps] = useState<SheetRsvp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'No response' | 'Accepted' | 'Declined' | 'Maybe'>('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [editingInvitee, setEditingInvitee] = useState<Invitee | null>(null);

  // Single Add Form
  const [newInvitee, setNewInvitee] = useState<Partial<Invitee>>({
    name: '',
    email: '',
    phone: '',
    partySize: 2,
    status: 'No response',
    planningEmailSent: false,
    group: 'General',
    notes: '',
  });

  // Bulk Load Text Area
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkError, setBulkError] = useState<string>('');

  // Load configuration & saved invitees on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check query bypass
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('admin_key') || urlParams.get('key');
    const storedAuth = localStorage.getItem('wedding_admin_auth');

    if (
      (keyParam && (keyParam.trim() === DEFAULT_ADMIN_PASSCODE || keyParam.trim() === 'Cantacuzino27')) ||
      storedAuth === 'valid'
    ) {
      setIsUnlocked(true);
    }

    // Load saved invitees roster
    try {
      const saved = localStorage.getItem('wedding_master_invitees_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInvitees(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to parse saved invitees', err);
    }

    // Load webhook URL
    const envWebhook = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL || '';
    const storedWebhook = localStorage.getItem('wedding_webhook_url') || '';
    const activeUrl = storedWebhook.trim() || envWebhook.trim();
    if (activeUrl) {
      setWebhookUrl(activeUrl);
    }
  }, []);

  // Save invitees to localStorage whenever changed
  const saveInvitees = (list: Invitee[]) => {
    setInvitees(list);
    try {
      localStorage.setItem('wedding_master_invitees_v2', JSON.stringify(list));
    } catch (e) {
      console.error('Error saving invitees', e);
    }
  };

  // Sync / Fetch live RSVPs directly from Google Apps Script
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
        setIsLiveConnected(true);
        if (json.spreadsheetUrl) setSpreadsheetUrl(json.spreadsheetUrl);

        const rsvps: SheetRsvp[] = json.data;
        setSheetRsvps(rsvps);

        // Cross-match with invitees roster:
        // If an invitee matches an RSVP row by email or name, automatically update their acceptance status
        setInvitees((prevInvitees) => {
          const updated = prevInvitees.map((inv) => {
            const invEmail = (inv.email || '').toLowerCase().trim();
            const invName = (inv.name || '').toLowerCase().trim();

            const match = rsvps.find((r) => {
              const rEmail = (r.email || '').toLowerCase().trim();
              const rName = (r.fullName || '').toLowerCase().trim();
              return (invEmail && rEmail === invEmail) || (invName && rName === invName);
            });

            if (match) {
              return {
                ...inv,
                status: (match.attending ? 'Accepted' : 'Declined') as InviteeStatus,
                hasRsvpMatch: true,
                rsvpTimestamp: match.timestamp,
                additionalGuests: match.additionalGuests,
                dietary: match.dietary,
                thuPeles: match.thuPeles,
                satBrunch: match.satBrunch,
                satExcursion: match.satExcursion,
                lodging: match.lodging,
              };
            }
            return inv;
          });

          // Save matched updates
          try {
            localStorage.setItem('wedding_master_invitees_v2', JSON.stringify(updated));
          } catch (e) {}

          return updated;
        });

        setStatusMessage(`Successfully synced ${rsvps.length} live submissions from Google Sheets.`);
      } else if (json && json.status === 'ok') {
        setIsLiveConnected(true);
        if (json.spreadsheetUrl) setSpreadsheetUrl(json.spreadsheetUrl);
        setSheetRsvps([]);
        setStatusMessage('Connected to Google Sheet. No RSVPs submitted yet.');
      } else {
        throw new Error(json.message || 'Invalid response format');
      }
    } catch (err: any) {
      console.warn('Could not fetch from live Google Sheet:', err.message);
      setIsLiveConnected(false);
      setStatusMessage('Notice: Google Sheet offline or unreachable. Displaying cached records.');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Add Single Invitee
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvitee.name || !newInvitee.name.trim()) return;

    const firstName = newInvitee.name.trim().split(' ')[0];
    const created: Invitee = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newInvitee.name.trim(),
      email: (newInvitee.email || '').trim(),
      phone: (newInvitee.phone || '').trim(),
      partySize: Math.max(1, Number(newInvitee.partySize) || 1),
      status: (newInvitee.status as InviteeStatus) || 'No response',
      planningEmailSent: !!newInvitee.planningEmailSent,
      planningEmailNote: newInvitee.planningEmailNote || `${firstName} — planning email`,
      group: newInvitee.group || 'General',
      notes: newInvitee.notes || '',
    };

    saveInvitees([...invitees, created]);
    setNewInvitee({
      name: '',
      email: '',
      phone: '',
      partySize: 2,
      status: 'No response',
      planningEmailSent: false,
      group: 'General',
      notes: '',
    });
    setIsAddModalOpen(false);
  };

  // Bulk Load / Paste Invitees
  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    setBulkError('');

    try {
      const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      const parsedList: Invitee[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Split by comma, tab, or pipe
        const parts = line.split(/,|\t|\|/).map((p) => p.trim());
        if (parts.length === 0 || !parts[0]) continue;

        // Skip header lines like "Name, Email, Cell, Count"
        if (
          i === 0 &&
          (parts[0].toLowerCase() === 'name' || parts[0].toLowerCase() === 'full name')
        ) {
          continue;
        }

        const name = parts[0];
        const email = parts[1] || '';
        const phone = parts[2] || '';
        const count = Math.max(1, parseInt(parts[3], 10) || 2);
        const group = parts[4] || 'General';

        parsedList.push({
          id: `bulk-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          email,
          phone,
          partySize: count,
          status: 'No response',
          planningEmailSent: false,
          planningEmailNote: `${name.split(' ')[0]} — planning email`,
          group,
        });
      }

      if (parsedList.length === 0) {
        setBulkError('No valid rows found. Please format as: Name, Email, Phone, Count');
        return;
      }

      saveInvitees([...invitees, ...parsedList]);
      setBulkText('');
      setIsBulkModalOpen(false);
      setStatusMessage(`Successfully loaded ${parsedList.length} invitees into your master roster.`);
    } catch (err: any) {
      setBulkError(`Import error: ${err.message}`);
    }
  };

  // Pre-fill demo sample in Bulk Modal for convenience
  const insertSampleBulk = () => {
    setBulkText(
      `Andrei and Mary Fratian, andreifratian@gmail.com, +1 (408) 555-0199, 2, Family\n` +
      `Alexander and Elena Vancea, alex.vancea@gmail.com, +40 722 123 456, 2, Friends\n` +
      `Marcus Aurelius Sterling, m.sterling@investments.co.uk, +44 20 7946 0912, 1, VIP\n` +
      `David and Rachel Miller, david.miller@techfirm.io, +1 (650) 555-0144, 2, Tech\n` +
      `Sophia Maria Popescu, sophia.m.popescu@gmail.com, +40 744 987 654, 2, Friends`
    );
  };

  // Toggle Planning Email Sent Checkbox
  const togglePlanningEmail = (id: string) => {
    const updated = invitees.map((inv) =>
      inv.id === id ? { ...inv, planningEmailSent: !inv.planningEmailSent } : inv
    );
    saveInvitees(updated);
  };

  // Update Status directly from row dropdown
  const updateInviteeStatus = (id: string, newStatus: InviteeStatus) => {
    const updated = invitees.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv));
    saveInvitees(updated);
  };

  // Delete Invitee
  const deleteInvitee = (id: string, name: string) => {
    if (typeof window !== 'undefined' && window.confirm(`Remove ${name} from your invited guest roster?`)) {
      saveInvitees(invitees.filter((inv) => inv.id !== id));
    }
  };

  // Save Edited Invitee
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvitee) return;
    const updated = invitees.map((inv) => (inv.id === editingInvitee.id ? editingInvitee : inv));
    saveInvitees(updated);
    setEditingInvitee(null);
  };

  // Export Master Invitees CSV
  const exportInviteesCsv = () => {
    const headers = [
      'Full Name / Party',
      'Email Address',
      'Cell / Phone',
      'Number of People (Seats)',
      'RSVP Status',
      'Planning Email Sent',
      'Group / Category',
      'Notes',
      'Peleș Castle Tour',
      'Brunch',
      'Excursion',
      'Dietary Requirements',
    ];

    const rows = filteredInvitees.map((inv) => [
      `"${(inv.name || '').replace(/"/g, '""')}"`,
      `"${(inv.email || '').replace(/"/g, '""')}"`,
      `"${(inv.phone || '').replace(/"/g, '""')}"`,
      inv.partySize,
      inv.status,
      inv.planningEmailSent ? 'YES' : 'NO',
      `"${(inv.group || '').replace(/"/g, '""')}"`,
      `"${(inv.notes || '').replace(/"/g, '""')}"`,
      inv.thuPeles ? 'YES' : 'NO',
      inv.satBrunch ? 'YES' : 'NO',
      inv.satExcursion ? 'YES' : 'NO',
      `"${(inv.dietary || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `elizabeth-george-invitees-roster-${new Date().toISOString().slice(0, 10)}.csv`);
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

  // Comparison Metrics: Invitees vs Accepted vs Declined vs No Response
  const comparisonStats = useMemo(() => {
    const totalParties = invitees.length;
    const totalGuests = invitees.reduce((acc, inv) => acc + (Number(inv.partySize) || 1), 0);

    const acceptedList = invitees.filter((inv) => inv.status === 'Accepted');
    const acceptedParties = acceptedList.length;
    const acceptedGuests = acceptedList.reduce((acc, inv) => acc + (Number(inv.partySize) || 1), 0);

    const declinedList = invitees.filter((inv) => inv.status === 'Declined');
    const declinedParties = declinedList.length;

    const noResponseList = invitees.filter((inv) => inv.status === 'No response');
    const noResponseParties = noResponseList.length;
    const noResponseGuests = noResponseList.reduce((acc, inv) => acc + (Number(inv.partySize) || 1), 0);

    const maybeList = invitees.filter((inv) => inv.status === 'Maybe');
    const maybeParties = maybeList.length;

    const emailSentCount = invitees.filter((inv) => inv.planningEmailSent).length;
    const noEmailCount = invitees.filter((inv) => !inv.email || !inv.email.trim()).length;
    const noPhoneCount = invitees.filter((inv) => !inv.phone || !inv.phone.trim()).length;

    const responseRate = totalParties > 0 ? Math.round(((totalParties - noResponseParties) / totalParties) * 100) : 0;

    // Countdown to May 28, 2027
    const weddingDate = new Date('2027-05-28T16:00:00');
    const diffTime = weddingDate.getTime() - Date.now();
    const daysToGo = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      totalParties,
      totalGuests,
      acceptedParties,
      acceptedGuests,
      declinedParties,
      noResponseParties,
      noResponseGuests,
      maybeParties,
      emailSentCount,
      noEmailCount,
      noPhoneCount,
      responseRate,
      daysToGo: daysToGo > 0 ? daysToGo : 236,
    };
  }, [invitees]);

  // Filtered Invitees
  const filteredInvitees = useMemo(() => {
    return invitees.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.name.toLowerCase().includes(q) ||
        inv.email.toLowerCase().includes(q) ||
        inv.phone.toLowerCase().includes(q) ||
        (inv.group && inv.group.toLowerCase().includes(q)) ||
        (inv.notes && inv.notes.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'No response') return inv.status === 'No response';
      if (statusFilter === 'Accepted') return inv.status === 'Accepted';
      if (statusFilter === 'Declined') return inv.status === 'Declined';
      if (statusFilter === 'Maybe') return inv.status === 'Maybe';
      return true;
    });
  }, [invitees, searchQuery, statusFilter]);

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
                    Live Google Sheets ({sheetRsvps.length})
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                    Sheets Connecting...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Castelul Cantacuzino • May 28, 2027 • Guest Planning Manifest
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
              title="Refresh Google Sheet records"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gold-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Sheets</span>
            </button>

            <button
              onClick={exportInviteesCsv}
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

      {/* Main Container */}
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

        {/* 1. Header Banner & Countdown */}
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
              {comparisonStats.daysToGo} days to go
            </div>
          </div>

          {/* Ambient forest glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-carpathian-700/10 blur-3xl pointer-events-none" />
        </div>

        {/* 2. Top-Level Navigation Tabs (Invitees Master List vs Live Google Sheet Feed) */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invitees')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                activeTab === 'invitees'
                  ? 'bg-carpathian-700 text-stone-100 border border-gold-500/40 shadow-sm'
                  : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Users className="w-4 h-4 text-gold-400" />
              <span>Invitees Roster ({invitees.length} Parties)</span>
            </button>

            <button
              onClick={() => setActiveTab('rsvps')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                activeTab === 'rsvps'
                  ? 'bg-carpathian-700 text-stone-100 border border-gold-500/40 shadow-sm'
                  : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Live Google Sheet RSVPs ({sheetRsvps.length} Submissions)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={copyBypassLink}
              className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 hover:text-stone-100 flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gold-400" />}
              <span>{copiedLink ? 'Copied' : 'Bypass Link'}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: INVITEES ROSTER & GUEST LOADING */}
        {activeTab === 'invitees' && (
          <div className="space-y-6">
            {/* Comparison Metrics: Invitees vs Accepted vs Declined vs No Response */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Total Invitees */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-medium">Total Invitees</span>
                  <Users className="w-4 h-4 text-stone-400" />
                </div>
                <div className="text-2xl font-serif text-stone-100 font-semibold">{comparisonStats.totalGuests}</div>
                <p className="text-[10px] text-stone-500 mt-1">{comparisonStats.totalParties} parties invited</p>
              </div>

              {/* Accepted / Yes */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-emerald-900/40">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-medium">Accepted</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-serif text-emerald-400 font-semibold">{comparisonStats.acceptedGuests}</div>
                <p className="text-[10px] text-stone-500 mt-1">{comparisonStats.acceptedParties} parties accepted</p>
              </div>

              {/* Declined / Regrets */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-medium">Declined</span>
                  <UserX className="w-4 h-4 text-stone-500" />
                </div>
                <div className="text-2xl font-serif text-stone-400 font-semibold">{comparisonStats.declinedParties}</div>
                <p className="text-[10px] text-stone-500 mt-1">With regrets</p>
              </div>

              {/* No Response / Awaiting */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-amber-900/30">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-medium">No Response</span>
                  <UserMinus className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-serif text-amber-400 font-semibold">{comparisonStats.noResponseGuests}</div>
                <p className="text-[10px] text-stone-500 mt-1">{comparisonStats.noResponseParties} parties pending</p>
              </div>

              {/* Planning Email Sent */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-medium">Planning Email</span>
                  <Mail className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-serif text-stone-200 font-semibold">
                  {comparisonStats.emailSentCount} <span className="text-sm font-sans text-stone-500">/ {comparisonStats.totalParties}</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">Sent to parties</p>
              </div>

              {/* Response Rate % */}
              <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-medium">Response Rate</span>
                  <Clock className="w-4 h-4 text-gold-400" />
                </div>
                <div className="text-2xl font-serif text-gold-400 font-semibold">{comparisonStats.responseRate}%</div>
                <p className="text-[10px] text-stone-500 mt-1">Responded so far</p>
              </div>
            </div>

            {/* Action Bar: Load Guests / Search / Filters */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
              {/* Left: Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-stone-900 border border-stone-800 text-xs">
                <button
                  onClick={() => setStatusFilter('All')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    statusFilter === 'All'
                      ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  All ({invitees.length})
                </button>

                <button
                  onClick={() => setStatusFilter('No response')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    statusFilter === 'No response'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  No Response ({comparisonStats.noResponseParties})
                </button>

                <button
                  onClick={() => setStatusFilter('Accepted')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    statusFilter === 'Accepted'
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Accepted ({comparisonStats.acceptedParties})
                </button>

                <button
                  onClick={() => setStatusFilter('Declined')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    statusFilter === 'Declined'
                      ? 'bg-stone-800 text-stone-300 border border-stone-700 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Declined ({comparisonStats.declinedParties})
                </button>
              </div>

              {/* Right: Search Box + Load Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, cell..."
                    className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500"
                  />
                </div>

                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 hover:text-stone-100 text-xs font-medium flex items-center gap-1.5 transition-all"
                  title="Bulk load guests from CSV or text paste"
                >
                  <Upload className="w-3.5 h-3.5 text-gold-400" />
                  <span>Bulk Load</span>
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 hover:text-gold-100 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Invitee</span>
                </button>
              </div>
            </div>

            {/* Invitees Table */}
            {filteredInvitees.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-stone-900/60 border border-stone-800 text-stone-400 space-y-3">
                <Users className="w-8 h-8 text-stone-600 mx-auto" />
                <div className="space-y-1">
                  <p className="font-medium text-stone-300">Your Master Invitee Roster is Empty</p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
                    Load the people you are inviting with their email, cell phone, and number of people to track who has accepted, declined, or not responded yet.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 text-stone-100 text-xs font-medium border border-gold-500/30"
                  >
                    ⚡ Bulk Load / Paste Guest List
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
                        <th className="py-3.5 px-4 font-normal">Invitee / Party</th>
                        <th className="py-3.5 px-4 font-normal">Contact (Email & Cell)</th>
                        <th className="py-3.5 px-4 font-normal">People</th>
                        <th className="py-3.5 px-4 font-normal">RSVP Status</th>
                        <th className="py-3.5 px-4 font-normal">Planning Email</th>
                        <th className="py-3.5 px-4 font-normal">Group</th>
                        <th className="py-3.5 px-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850 text-stone-300">
                      {filteredInvitees.map((inv) => (
                        <tr key={inv.id} className="hover:bg-stone-850/30 transition-colors">
                          {/* Name & Additional Guests */}
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-stone-100 flex items-center gap-2">
                              <span>{inv.name}</span>
                              {inv.hasRsvpMatch && (
                                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                  Synced GSheet
                                </span>
                              )}
                            </div>
                            {inv.additionalGuests && (
                              <div className="text-[11px] text-stone-500 mt-0.5">
                                Plus-one: {inv.additionalGuests}
                              </div>
                            )}
                          </td>

                          {/* Email & Cell */}
                          <td className="py-3.5 px-4 space-y-1">
                            <div className="flex items-center gap-1.5 text-stone-300">
                              <Mail className="w-3 h-3 text-stone-500 shrink-0" />
                              <span className="font-mono text-[11px]">{inv.email || <span className="text-stone-600">No email</span>}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-stone-400">
                              <Phone className="w-3 h-3 text-stone-500 shrink-0" />
                              <span className="font-mono text-[11px]">{inv.phone || <span className="text-stone-600">No cell</span>}</span>
                            </div>
                          </td>

                          {/* Number of People */}
                          <td className="py-3.5 px-4">
                            <span className="text-stone-200 font-mono bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                              {inv.partySize} {inv.partySize === 1 ? 'person' : 'people'}
                            </span>
                          </td>

                          {/* Status Dropdown */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <select
                              value={inv.status}
                              onChange={(e) => updateInviteeStatus(inv.id, e.target.value as InviteeStatus)}
                              className={`text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer border appearance-none focus:outline-none transition-all ${
                                inv.status === 'Accepted'
                                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                                  : inv.status === 'Declined'
                                  ? 'bg-stone-950 text-stone-500 border-stone-800'
                                  : inv.status === 'Maybe'
                                  ? 'bg-amber-950/50 text-amber-400 border-amber-800/40'
                                  : 'bg-amber-950/30 text-amber-300 border-amber-800/30'
                              }`}
                            >
                              <option value="No response" className="bg-stone-900 text-amber-300">No response</option>
                              <option value="Accepted" className="bg-stone-900 text-emerald-400">Accepted</option>
                              <option value="Declined" className="bg-stone-900 text-stone-400">Declined</option>
                              <option value="Maybe" className="bg-stone-900 text-gold-400">Maybe</option>
                            </select>
                          </td>

                          {/* Planning Email Sent Toggle */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={inv.planningEmailSent}
                                onChange={() => togglePlanningEmail(inv.id)}
                                className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800 cursor-pointer"
                              />
                              <span className={`text-[11px] font-mono ${inv.planningEmailSent ? 'text-emerald-400' : 'text-stone-500'}`}>
                                {inv.planningEmailNote || (inv.planningEmailSent ? 'Sent' : 'Pending')}
                              </span>
                            </label>
                          </td>

                          {/* Group / Category */}
                          <td className="py-3.5 px-4">
                            <span className="text-[11px] text-stone-400 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-850">
                              {inv.group || 'General'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setEditingInvitee(inv)}
                                className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-100 transition-all"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteInvitee(inv.id, inv.name)}
                                className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-950/40 border border-stone-800 text-stone-400 hover:text-red-400 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIVE GOOGLE SHEETS RSVP FEED */}
        {activeTab === 'rsvps' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-stone-200 text-sm">Direct Submissions via Website RSVP Form</h3>
                <p className="text-xs text-stone-400">
                  These rows are written directly by guests to your Google Sheet in real time.
                </p>
              </div>
              <button
                onClick={() => fetchRsvps()}
                className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 border border-stone-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-gold-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Live Sheet</span>
              </button>
            </div>

            {sheetRsvps.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-stone-900/60 border border-stone-800 text-stone-500 text-sm">
                No submissions recorded in your Google Sheet yet.
              </div>
            ) : (
              <div className="rounded-3xl bg-stone-900/60 border border-stone-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] uppercase tracking-wider text-stone-400 font-mono">
                      <tr>
                        <th className="py-3.5 px-4 font-normal">Primary Guest</th>
                        <th className="py-3.5 px-4 font-normal">Status</th>
                        <th className="py-3.5 px-4 font-normal">Plus-One / Additional</th>
                        <th className="py-3.5 px-4 font-normal">Events (Peleș/Brunch/Excursion)</th>
                        <th className="py-3.5 px-4 font-normal">Dietary</th>
                        <th className="py-3.5 px-4 font-normal">Lodging</th>
                        <th className="py-3.5 px-4 font-normal">Notes</th>
                        <th className="py-3.5 px-4 font-normal">Date (UTC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850 text-stone-300">
                      {sheetRsvps.map((r) => (
                        <tr key={r.id} className="hover:bg-stone-850/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-stone-100">{r.fullName}</div>
                            <div className="text-[11px] text-stone-500 font-mono">{r.email}</div>
                          </td>

                          <td className="py-3.5 px-4">
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

                          <td className="py-3.5 px-4">{r.additionalGuests || <span className="text-stone-600">—</span>}</td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {r.thuPeles && <span className="text-[10px] bg-gold-950/40 text-gold-400 border border-gold-800/40 px-1.5 py-0.5 rounded">Peleș</span>}
                              {r.satBrunch && <span className="text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded">Brunch</span>}
                              {r.satExcursion && <span className="text-[10px] bg-carpathian-950 text-emerald-300 border border-emerald-900/40 px-1.5 py-0.5 rounded">Excursion</span>}
                              {!r.thuPeles && !r.satBrunch && !r.satExcursion && <span className="text-stone-600">—</span>}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {r.dietary && r.dietary.trim() ? (
                              <span className="text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-800/30">
                                {r.dietary}
                              </span>
                            ) : (
                              <span className="text-stone-600">None</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-stone-400">{r.lodging || <span className="text-stone-600">—</span>}</td>
                          <td className="py-3.5 px-4 text-stone-400 max-w-[200px] truncate">{r.notes || <span className="text-stone-600">—</span>}</td>
                          <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                            {r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: Bulk Load Guests (Paste Text or CSV) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-gold-400" />
                <h3 className="font-serif text-lg text-stone-100 font-medium">Bulk Load / Paste Guest List</h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-stone-500 hover:text-stone-300 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-stone-400 leading-relaxed">
                Paste your guest list lines below (one invitee per line). Supported format:
                <br />
                <code className="text-gold-400 font-mono bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                  Full Name, Email Address, Cell Phone, Number of People, Group
                </code>
              </p>

              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-[11px]">Format: Name, Email, Cell, Count (comma, tab, or pipe separated)</span>
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
                placeholder="Andrei and Mary Fratian, andreifratian@gmail.com, +1 (408) 555-0199, 2, Family"
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
                disabled={!bulkText.trim()}
                className="px-5 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 disabled:opacity-50 text-stone-100 text-xs font-medium border border-gold-500/30 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import All Invitees</span>
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
              <h3 className="font-serif text-lg text-stone-100 font-medium">Add New Invitee</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-500 hover:text-stone-300 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSingle} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Full Name / Party *
                </label>
                <input
                  type="text"
                  required
                  value={newInvitee.name || ''}
                  onChange={(e) => setNewInvitee({ ...newInvitee, name: e.target.value })}
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
                    value={newInvitee.email || ''}
                    onChange={(e) => setNewInvitee({ ...newInvitee, email: e.target.value })}
                    placeholder="andreifratian@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Cell / Phone
                  </label>
                  <input
                    type="tel"
                    value={newInvitee.phone || ''}
                    onChange={(e) => setNewInvitee({ ...newInvitee, phone: e.target.value })}
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
                    value={newInvitee.partySize || 2}
                    onChange={(e) => setNewInvitee({ ...newInvitee, partySize: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Group / Category
                  </label>
                  <input
                    type="text"
                    value={newInvitee.group || ''}
                    onChange={(e) => setNewInvitee({ ...newInvitee, group: e.target.value })}
                    placeholder="e.g. Family, Friends"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={!!newInvitee.planningEmailSent}
                    onChange={(e) => setNewInvitee({ ...newInvitee, planningEmailSent: e.target.checked })}
                    className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800"
                  />
                  <span className="text-xs text-stone-200">Save-the-date / Planning email sent</span>
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
                  className="px-5 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 text-stone-100 text-xs font-medium border border-gold-500/30"
                >
                  Save Invitee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Invitee */}
      {editingInvitee && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-serif text-lg text-stone-100 font-medium">Edit: {editingInvitee.name}</h3>
              <button
                onClick={() => setEditingInvitee(null)}
                className="text-stone-500 hover:text-stone-300 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Full Name / Party
                </label>
                <input
                  type="text"
                  required
                  value={editingInvitee.name}
                  onChange={(e) => setEditingInvitee({ ...editingInvitee, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingInvitee.email || ''}
                    onChange={(e) => setEditingInvitee({ ...editingInvitee, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Cell / Phone
                  </label>
                  <input
                    type="tel"
                    value={editingInvitee.phone || ''}
                    onChange={(e) => setEditingInvitee({ ...editingInvitee, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs"
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
                    value={editingInvitee.partySize}
                    onChange={(e) =>
                      setEditingInvitee({ ...editingInvitee, partySize: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={editingInvitee.status}
                    onChange={(e) =>
                      setEditingInvitee({ ...editingInvitee, status: e.target.value as InviteeStatus })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs"
                  >
                    <option value="No response">No response</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                    <option value="Maybe">Maybe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editingInvitee.planningEmailSent}
                    onChange={(e) =>
                      setEditingInvitee({ ...editingInvitee, planningEmailSent: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800"
                  />
                  <span className="text-xs text-stone-200">Planning email sent</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingInvitee(null)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 text-stone-100 text-xs font-medium border border-gold-500/30"
                >
                  Save Changes
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
                <span className="font-semibold text-gold-400 block font-mono">How it syncs:</span>
                <p>
                  Clicking &ldquo;Sync Sheets&rdquo; fetches live records from Google Sheets and automatically cross-references your invitees roster (marking matching guests as Accepted or Declined).
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
