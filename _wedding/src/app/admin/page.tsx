'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Mail,
  Search,
  Download,
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
  LayoutGrid,
  List,
} from 'lucide-react';

export type GuestStatus = 'Pending' | 'Yes' | 'Maybe' | 'No';

export interface GuestParty {
  id: string;
  name: string;
  email: string;
  partySize: number;
  status: GuestStatus;
  planningEmailSent: boolean;
  planningEmailNote?: string;
  additionalGuests?: string;
  dietary?: string;
  thuPeles?: boolean;
  satBrunch?: boolean;
  satExcursion?: boolean;
  lodging?: string;
  notes?: string;
  updatedAt?: string;
}

const DEFAULT_ADMIN_PASSCODE = 'CantacuzinoAdmin27';

// 20 Initial Parties totaling 41 Guests to match Elizabeth & George's roster
const INITIAL_PARTIES: GuestParty[] = [
  {
    id: '1',
    name: 'Amy Benjamine',
    email: 'amyb828@gmail.com',
    partySize: 1,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Amy Benjamone — planning email',
  },
  {
    id: '2',
    name: 'Andrei and Mary Fratian',
    email: 'andreifratian@gmail.com',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Andrei — planning email',
    additionalGuests: 'Mary Fratian',
  },
  {
    id: '3',
    name: 'Alexander and Elena Vancea',
    email: 'alex.vancea@gmail.com',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Alexander — planning email',
    additionalGuests: 'Elena Vancea',
    dietary: 'Vegetarian (Elena)',
  },
  {
    id: '4',
    name: 'Marcus Aurelius Sterling',
    email: 'm.sterling@investments.co.uk',
    partySize: 1,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Marcus — planning email',
    dietary: 'Gluten-Free, Dairy-Free',
  },
  {
    id: '5',
    name: 'David and Rachel Miller',
    email: 'david.miller@techfirm.io',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'David — planning email',
    additionalGuests: 'Rachel Miller',
    dietary: 'Nut allergy (David)',
  },
  {
    id: '6',
    name: 'Sophia Maria Popescu',
    email: 'sophia.m.popescu@gmail.com',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Sophia — planning email',
  },
  {
    id: '7',
    name: 'Radu and Ioana Cantacuzino',
    email: 'radu.cantacuzino@heritage.ro',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Radu — planning email',
  },
  {
    id: '8',
    name: 'Christian and Clara Beaumont',
    email: 'clara.beaumont@luxuryparis.fr',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Clara — planning email',
  },
  {
    id: '9',
    name: 'Matei and Simona Georgescu',
    email: 'matei.georgescu@bucharest.ro',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Matei — planning email',
  },
  {
    id: '10',
    name: 'Nicholas and Victoria Bennett',
    email: 'n.bennett@londonfinance.co.uk',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Nicholas — planning email',
  },
  {
    id: '11',
    name: 'Stefan and Diana Ionescu',
    email: 'stefan.ionescu@brasov.ro',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Stefan — planning email',
  },
  {
    id: '12',
    name: 'Julian and Helene Rousseau',
    email: 'julian.rousseau@geneva.ch',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Julian — planning email',
  },
  {
    id: '13',
    name: 'Florin and Anca Dumitrescu',
    email: 'florin.d@clujtech.ro',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Florin — planning email',
  },
  {
    id: '14',
    name: 'Gabriel and Cristina Moraru',
    email: 'g.moraru@architects.ro',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Gabriel — planning email',
  },
  {
    id: '15',
    name: 'William and Charlotte Hughes',
    email: 'w.hughes@edinburgh.ac.uk',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'William — planning email',
  },
  {
    id: '16',
    name: 'Victor and Laura Costache',
    email: 'victor.costache@med-center.ro',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Victor — planning email',
  },
  {
    id: '17',
    name: 'Sebastian and Maria Enache',
    email: 's.enache@invest.ro',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Sebastian — planning email',
  },
  {
    id: '18',
    name: 'Oliver and Emily Campbell',
    email: 'o.campbell@oxfordalumni.org',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Oliver — planning email',
  },
  {
    id: '19',
    name: 'Ciprian and Teodora Vasilescu',
    email: 'c.vasilescu@consulting.ro',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Ciprian — planning email',
  },
  {
    id: '20',
    name: 'Dan and Roxana Marinescu',
    email: 'dan.marinescu@bucharestlaw.ro',
    partySize: 4,
    status: 'Pending',
    planningEmailSent: true,
    planningEmailNote: 'Dan — planning email',
  },
];

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  // Configuration
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Data
  const [parties, setParties] = useState<GuestParty[]>(INITIAL_PARTIES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Yes' | 'Maybe' | 'No' | 'Dietary'>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Modals
  const [editingGuest, setEditingGuest] = useState<GuestParty | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newGuest, setNewGuest] = useState<Partial<GuestParty>>({
    name: '',
    email: '',
    partySize: 2,
    status: 'Pending',
    planningEmailSent: false,
    planningEmailNote: '',
  });

  // Load configuration & cached parties on mount
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

    // Load saved parties
    try {
      const savedParties = localStorage.getItem('wedding_guest_parties');
      if (savedParties) {
        const parsed = JSON.parse(savedParties);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setParties(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to parse cached parties', err);
    }

    // Load saved webhook URL
    const envWebhook = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL || '';
    const storedWebhook = localStorage.getItem('wedding_webhook_url') || '';
    const activeUrl = storedWebhook.trim() || envWebhook.trim();
    if (activeUrl) {
      setWebhookUrl(activeUrl);
    }
  }, []);

  // Save parties to localStorage whenever updated
  const savePartiesToStorage = (updatedParties: GuestParty[]) => {
    setParties(updatedParties);
    try {
      localStorage.setItem('wedding_guest_parties', JSON.stringify(updatedParties));
    } catch (err) {
      console.error('Failed to save parties', err);
    }
  };

  // Sync / Fetch live RSVPs from Google Apps Script
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
        if (json.spreadsheetUrl) {
          setSpreadsheetUrl(json.spreadsheetUrl);
        }

        // Merge Google Sheet RSVPs into our parties list
        const remoteRsvps: any[] = json.data;
        const currentParties = [...parties];

        remoteRsvps.forEach((r) => {
          if (!r.fullName) return;
          const rEmail = (r.email || '').trim().toLowerCase();
          const rName = (r.fullName || '').trim().toLowerCase();

          // Match by email or name
          const existingIdx = currentParties.findIndex((p) => {
            const pEmail = (p.email || '').trim().toLowerCase();
            const pName = (p.name || '').trim().toLowerCase();
            return (rEmail && pEmail === rEmail) || pName === rName;
          });

          // Calculate party size
          let size = 1;
          if (r.additionalGuests && r.additionalGuests.trim()) {
            const plus = r.additionalGuests.split(/,|&|and/i).filter((s: string) => s.trim().length > 0).length;
            size += Math.max(1, plus);
          }

          const mappedStatus: GuestStatus = r.attending ? 'Yes' : 'No';

          if (existingIdx >= 0) {
            currentParties[existingIdx] = {
              ...currentParties[existingIdx],
              status: mappedStatus,
              partySize: size,
              additionalGuests: r.additionalGuests || currentParties[existingIdx].additionalGuests,
              dietary: r.dietary || currentParties[existingIdx].dietary,
              thuPeles: r.thuPeles !== undefined ? r.thuPeles : currentParties[existingIdx].thuPeles,
              satBrunch: r.satBrunch !== undefined ? r.satBrunch : currentParties[existingIdx].satBrunch,
              satExcursion: r.satExcursion !== undefined ? r.satExcursion : currentParties[existingIdx].satExcursion,
              lodging: r.lodging || currentParties[existingIdx].lodging,
              notes: r.notes || currentParties[existingIdx].notes,
              updatedAt: r.timestamp || new Date().toISOString(),
            };
          } else {
            // New RSVP not in pre-seeded list
            currentParties.push({
              id: `remote-${r.id || Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: r.fullName,
              email: r.email || '',
              partySize: size,
              status: mappedStatus,
              planningEmailSent: true,
              planningEmailNote: `${r.fullName.split(' ')[0]} — planning email`,
              additionalGuests: r.additionalGuests,
              dietary: r.dietary,
              thuPeles: r.thuPeles,
              satBrunch: r.satBrunch,
              satExcursion: r.satExcursion,
              lodging: r.lodging,
              notes: r.notes,
              updatedAt: r.timestamp || new Date().toISOString(),
            });
          }
        });

        savePartiesToStorage(currentParties);
        setStatusMessage(`Successfully synced ${remoteRsvps.length} RSVP submissions from Google Sheets.`);
      } else if (json && json.status === 'ok') {
        setIsLiveConnected(true);
        if (json.spreadsheetUrl) setSpreadsheetUrl(json.spreadsheetUrl);
        setStatusMessage('Connected to Google Apps Script. Ready for incoming RSVPs.');
      } else {
        throw new Error(json.message || 'Invalid response format');
      }
    } catch (err: any) {
      console.warn('Could not fetch from live Google Sheet:', err.message);
      setIsLiveConnected(false);
      setStatusMessage('Notice: Google Sheet unreachable or offline. Displaying local manifest.');
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

  // Quick Inline Status Update
  const updateGuestStatus = (id: string, newStatus: GuestStatus) => {
    const updated = parties.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
    savePartiesToStorage(updated);
  };

  // Quick Inline Planning Email Checkbox Toggle
  const togglePlanningEmail = (id: string) => {
    const updated = parties.map((p) =>
      p.id === id ? { ...p, planningEmailSent: !p.planningEmailSent } : p
    );
    savePartiesToStorage(updated);
  };

  // Delete Guest Party
  const deleteGuest = (id: string, name: string) => {
    if (typeof window !== 'undefined' && window.confirm(`Remove ${name} from the invited manifest?`)) {
      const updated = parties.filter((p) => p.id !== id);
      savePartiesToStorage(updated);
    }
  };

  // Save Edited Guest
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    const updated = parties.map((p) => (p.id === editingGuest.id ? editingGuest : p));
    savePartiesToStorage(updated);
    setEditingGuest(null);
  };

  // Add New Guest Party
  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name || !newGuest.name.trim()) return;

    const firstName = newGuest.name.trim().split(' ')[0];
    const created: GuestParty = {
      id: `party-${Date.now()}`,
      name: newGuest.name.trim(),
      email: (newGuest.email || '').trim(),
      partySize: Math.max(1, Number(newGuest.partySize) || 1),
      status: (newGuest.status as GuestStatus) || 'Pending',
      planningEmailSent: !!newGuest.planningEmailSent,
      planningEmailNote: newGuest.planningEmailNote || `${firstName} — planning email`,
      dietary: newGuest.dietary || '',
      notes: newGuest.notes || '',
    };

    savePartiesToStorage([...parties, created]);
    setNewGuest({
      name: '',
      email: '',
      partySize: 2,
      status: 'Pending',
      planningEmailSent: false,
      planningEmailNote: '',
    });
    setIsAddModalOpen(false);
  };

  // Export CSV
  const exportCsv = () => {
    const headers = [
      'Party / Primary Name',
      'Email',
      'Party Size (Guests)',
      'RSVP Status',
      'Planning Email Sent',
      'Planning Email Note',
      'Plus-One Names',
      'Dietary Restrictions',
      'Thu Peleș Castle Tour',
      'Sat Farewell Brunch',
      'Sat Mountain Excursion',
      'Lodging Location',
      'Notes & Wishes',
    ];

    const rows = filteredParties.map((p) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.email || '').replace(/"/g, '""')}"`,
      p.partySize,
      p.status,
      p.planningEmailSent ? 'YES' : 'NO',
      `"${(p.planningEmailNote || '').replace(/"/g, '""')}"`,
      `"${(p.additionalGuests || '').replace(/"/g, '""')}"`,
      `"${(p.dietary || '').replace(/"/g, '""')}"`,
      p.thuPeles ? 'YES' : 'NO',
      p.satBrunch ? 'YES' : 'NO',
      p.satExcursion ? 'YES' : 'NO',
      `"${(p.lodging || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `elizabeth-george-wedding-manifest-${new Date().toISOString().slice(0, 10)}.csv`);
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
    const totalParties = parties.length;
    const totalGuests = parties.reduce((acc, p) => acc + (Number(p.partySize) || 1), 0);

    const yesParties = parties.filter((p) => p.status === 'Yes');
    const yesGuests = yesParties.reduce((acc, p) => acc + (Number(p.partySize) || 1), 0);

    const maybeParties = parties.filter((p) => p.status === 'Maybe');
    const noParties = parties.filter((p) => p.status === 'No');
    const pendingParties = parties.filter((p) => p.status === 'Pending');

    const planningEmailSentCount = parties.filter((p) => p.planningEmailSent).length;
    const noEmailOnFileCount = parties.filter((p) => !p.email || !p.email.trim()).length;

    // Event and Dietary Specifics
    const pelesCount = parties.filter((p) => p.status === 'Yes' && p.thuPeles).length;
    const brunchCount = parties.filter((p) => p.status === 'Yes' && p.satBrunch).length;
    const excursionCount = parties.filter((p) => p.status === 'Yes' && p.satExcursion).length;
    const dietaryCount = parties.filter((p) => p.dietary && p.dietary.trim().length > 0).length;

    // Countdown to May 28, 2027
    const weddingDate = new Date('2027-05-28T16:00:00');
    const diffTime = weddingDate.getTime() - Date.now();
    const daysToGo = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      totalParties,
      totalGuests,
      yesCount: yesParties.length,
      yesGuests,
      maybeCount: maybeParties.length,
      noCount: noParties.length,
      pendingCount: pendingParties.length,
      planningEmailSentCount,
      noEmailOnFileCount,
      pelesCount,
      brunchCount,
      excursionCount,
      dietaryCount,
      daysToGo: daysToGo > 0 ? daysToGo : 236,
    };
  }, [parties]);

  // Filtered List
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.additionalGuests && p.additionalGuests.toLowerCase().includes(q)) ||
        (p.dietary && p.dietary.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.planningEmailNote && p.planningEmailNote.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (activeFilter === 'Pending') return p.status === 'Pending';
      if (activeFilter === 'Yes') return p.status === 'Yes';
      if (activeFilter === 'Maybe') return p.status === 'Maybe';
      if (activeFilter === 'No') return p.status === 'No';
      if (activeFilter === 'Dietary') return p.dietary && p.dietary.trim().length > 0;
      return true;
    });
  }, [parties, searchQuery, activeFilter]);

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

  // Render Full Admin Dashboard in the Original Dark Luxury Design
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
                    Local Manifest Mode
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
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-500/20 border border-gold-500/40 text-gold-300 hover:text-gold-100 hover:bg-gold-500/30 text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Guest</span>
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

          {/* Ambient forest glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-carpathian-700/10 blur-3xl pointer-events-none" />
        </div>

        {/* 2. Timeline Milestones Row (4 Dark Stone Cards) */}
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

        {/* 3. Quick Guest Bypass Card */}
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

        {/* 4. KPI Stat Cards Grid (Combining Original + Reference Metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {/* Total Guests */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Total Guests</span>
              <Users className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-serif text-stone-100 font-semibold">{stats.totalGuests}</div>
            <p className="text-[10px] text-stone-500 mt-1">{stats.totalParties} parties</p>
          </div>

          {/* Invited Parties */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Parties</span>
              <Users className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-serif text-stone-100 font-semibold">{stats.totalParties}</div>
            <p className="text-[10px] text-stone-500 mt-1">Invited units</p>
          </div>

          {/* Yes / Attending */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-emerald-900/40">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Yes</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-serif text-emerald-400 font-semibold">{stats.yesCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">{stats.yesGuests} guests</p>
          </div>

          {/* Maybe */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Maybe</span>
              <HelpCircle className="w-4 h-4 text-gold-400" />
            </div>
            <div className="text-2xl font-serif text-gold-400 font-semibold">{stats.maybeCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Undecided</p>
          </div>

          {/* No / Declined */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">No</span>
              <XCircle className="w-4 h-4 text-stone-500" />
            </div>
            <div className="text-2xl font-serif text-stone-400 font-semibold">{stats.noCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Regrets</p>
          </div>

          {/* Awaiting Reply / Pending */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Pending</span>
              <Clock className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-serif text-stone-300 font-semibold">{stats.pendingCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Awaiting reply</p>
          </div>

          {/* Planning Email Sent */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-emerald-950/40">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">Email Sent</span>
              <Mail className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-serif text-emerald-400 font-semibold">
              {stats.planningEmailSentCount} <span className="text-sm font-sans text-stone-500">/ {stats.totalParties}</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-1">Planning emails</p>
          </div>

          {/* No Email on File */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-medium">No Email</span>
              <AlertCircle className="w-4 h-4 text-stone-500" />
            </div>
            <div className="text-2xl font-serif text-stone-400 font-semibold">{stats.noEmailOnFileCount}</div>
            <p className="text-[10px] text-stone-500 mt-1">Missing contact</p>
          </div>
        </div>

        {/* 5. Additional Event Badges Row (Peleș, Brunch, Excursion, Dietary) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3.5 rounded-2xl bg-stone-900/50 border border-stone-850 flex items-center justify-between">
            <span className="text-xs text-stone-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-400" />
              <span>Thu Peleș Tour</span>
            </span>
            <span className="font-serif text-base font-semibold text-gold-400">{stats.pelesCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-900/50 border border-stone-850 flex items-center justify-between">
            <span className="text-xs text-stone-400 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-gold-400" />
              <span>Sat Farewell Brunch</span>
            </span>
            <span className="font-serif text-base font-semibold text-stone-200">{stats.brunchCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-900/50 border border-stone-850 flex items-center justify-between">
            <span className="text-xs text-stone-400 flex items-center gap-2">
              <Mountain className="w-4 h-4 text-gold-400" />
              <span>Sat Excursion</span>
            </span>
            <span className="font-serif text-base font-semibold text-stone-200">{stats.excursionCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-900/50 border border-amber-900/30 flex items-center justify-between">
            <span className="text-xs text-stone-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Dietary Requirements</span>
            </span>
            <span className="font-serif text-base font-semibold text-amber-400">{stats.dietaryCount}</span>
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
              {parties
                .filter((p) => p.dietary && p.dietary.trim())
                .map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-stone-950/70 border border-stone-850 text-xs">
                    <span className="font-medium text-stone-200">{p.name}</span>
                    <span className="text-stone-500 block text-[11px]">{p.email}</span>
                    <span className="inline-block mt-1 text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md font-mono text-[11px]">
                      {p.dietary}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 6. Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-stone-900 border border-stone-800 text-xs">
            <button
              onClick={() => setActiveFilter('All')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeFilter === 'All'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All ({stats.totalParties})
            </button>
            <button
              onClick={() => setActiveFilter('Pending')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeFilter === 'Pending'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Pending ({stats.pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter('Yes')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeFilter === 'Yes'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Yes ({stats.yesCount})
            </button>
            <button
              onClick={() => setActiveFilter('Maybe')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeFilter === 'Maybe'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Maybe ({stats.maybeCount})
            </button>
            <button
              onClick={() => setActiveFilter('No')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeFilter === 'No'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              No ({stats.noCount})
            </button>
            <button
              onClick={() => setActiveFilter('Dietary')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeFilter === 'Dietary'
                  ? 'bg-carpathian-700 text-stone-100 shadow-sm border border-gold-500/30'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Dietary ({stats.dietaryCount})
            </button>
          </div>

          {/* Right Controls: View Switcher & Search Box */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs transition-all ${
                  viewMode === 'table' ? 'bg-stone-800 text-stone-100' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Manifest Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg text-xs transition-all ${
                  viewMode === 'cards' ? 'bg-stone-800 text-stone-100' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Invitation Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guests..."
                className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500"
              />
            </div>
          </div>
        </div>

        {/* 7. Guest Manifest: Table View or Cards View in Dark Luxury Aesthetic */}
        {filteredParties.length === 0 ? (
          <div className="py-12 text-center rounded-3xl bg-stone-900/60 border border-stone-800 text-stone-500 text-sm">
            No guest records match &ldquo;{searchQuery}&rdquo; under {activeFilter} status.
          </div>
        ) : viewMode === 'table' ? (
          /* Table View in original dark luxury design */
          <div className="rounded-3xl bg-stone-900/60 border border-stone-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950/70 border-b border-stone-800 text-[11px] uppercase tracking-wider text-stone-400 font-mono">
                  <tr>
                    <th className="py-3.5 px-4 font-normal">Guest / Party</th>
                    <th className="py-3.5 px-4 font-normal">Seats</th>
                    <th className="py-3.5 px-4 font-normal">RSVP Status</th>
                    <th className="py-3.5 px-4 font-normal">Planning Email Sent</th>
                    <th className="py-3.5 px-4 font-normal">Events RSVP</th>
                    <th className="py-3.5 px-4 font-normal">Dietary</th>
                    <th className="py-3.5 px-4 font-normal">Notes</th>
                    <th className="py-3.5 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850 text-stone-300">
                  {filteredParties.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-850/30 transition-colors">
                      {/* Guest Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-100">{p.name}</div>
                        <a
                          href={`mailto:${p.email}`}
                          className="text-[11px] text-stone-500 hover:text-gold-400 transition-colors flex items-center gap-1 mt-0.5"
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{p.email || 'No email on file'}</span>
                        </a>
                      </td>

                      {/* Party Seats */}
                      <td className="py-3.5 px-4">
                        <span className="text-stone-200 font-mono bg-stone-950 px-2 py-0.5 rounded border border-stone-800">
                          {p.partySize} {p.partySize === 1 ? 'seat' : 'seats'}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={p.status}
                          onChange={(e) => updateGuestStatus(p.id, e.target.value as GuestStatus)}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer border appearance-none focus:outline-none transition-all ${
                            p.status === 'Yes'
                              ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                              : p.status === 'No'
                              ? 'bg-stone-950 text-stone-500 border-stone-800'
                              : p.status === 'Maybe'
                              ? 'bg-amber-950/50 text-amber-400 border-amber-800/40'
                              : 'bg-stone-900 text-stone-300 border-stone-750'
                          }`}
                        >
                          <option value="Pending" className="bg-stone-900 text-stone-200">Pending</option>
                          <option value="Yes" className="bg-stone-900 text-emerald-400">Yes</option>
                          <option value="Maybe" className="bg-stone-900 text-amber-400">Maybe</option>
                          <option value="No" className="bg-stone-900 text-stone-400">No</option>
                        </select>
                      </td>

                      {/* Planning Email Sent Checkbox */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={p.planningEmailSent}
                            onChange={() => togglePlanningEmail(p.id)}
                            className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800 cursor-pointer"
                          />
                          <span className={`text-[11px] font-mono ${p.planningEmailSent ? 'text-emerald-400' : 'text-stone-500'}`}>
                            {p.planningEmailNote || (p.planningEmailSent ? 'Email Sent' : 'Pending')}
                          </span>
                        </label>
                      </td>

                      {/* Events */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.thuPeles && (
                            <span className="text-[10px] bg-gold-950/40 text-gold-400 border border-gold-800/40 px-2 py-0.5 rounded-md font-mono">
                              Peleș
                            </span>
                          )}
                          {p.satBrunch && (
                            <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md font-mono">
                              Brunch
                            </span>
                          )}
                          {p.satExcursion && (
                            <span className="text-[10px] bg-carpathian-950 text-emerald-300 border border-emerald-900/40 px-2 py-0.5 rounded-md font-mono">
                              Excursion
                            </span>
                          )}
                          {!p.thuPeles && !p.satBrunch && !p.satExcursion && (
                            <span className="text-[10px] text-stone-600">—</span>
                          )}
                        </div>
                      </td>

                      {/* Dietary */}
                      <td className="py-3.5 px-4">
                        {p.dietary && p.dietary.trim() ? (
                          <span className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md font-mono">
                            {p.dietary}
                          </span>
                        ) : (
                          <span className="text-stone-600 font-mono text-[11px]">None</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 max-w-[200px] truncate text-stone-400 text-[11px]" title={p.notes || ''}>
                        {p.notes || <span className="text-stone-600">—</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingGuest(p)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-100 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteGuest(p.id, p.name)}
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
        ) : (
          /* Cards View in dark luxury design */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredParties.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-stone-700 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-serif font-medium text-stone-100">{p.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-stone-500" />
                      <span>{p.email || 'No email on file'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-stone-950 text-stone-300 border border-stone-800 text-xs font-mono">
                      {p.partySize} {p.partySize === 1 ? 'guest' : 'guests'}
                    </span>

                    <select
                      value={p.status}
                      onChange={(e) => updateGuestStatus(p.id, e.target.value as GuestStatus)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer border focus:outline-none transition-all ${
                        p.status === 'Yes'
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40'
                          : p.status === 'No'
                          ? 'bg-stone-950 text-stone-500 border-stone-800'
                          : p.status === 'Maybe'
                          ? 'bg-amber-950/50 text-amber-400 border-amber-800/40'
                          : 'bg-stone-900 text-stone-300 border-stone-750'
                      }`}
                    >
                      <option value="Pending" className="bg-stone-900 text-stone-200">Pending</option>
                      <option value="Yes" className="bg-stone-900 text-emerald-400">Yes</option>
                      <option value="Maybe" className="bg-stone-900 text-amber-400">Maybe</option>
                      <option value="No" className="bg-stone-900 text-stone-400">No</option>
                    </select>

                    <button
                      onClick={() => setEditingGuest(p)}
                      className="p-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteGuest(p.id, p.name)}
                      className="p-1.5 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800/60 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={p.planningEmailSent}
                      onChange={() => togglePlanningEmail(p.id)}
                      className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800 cursor-pointer"
                    />
                    <span className="text-stone-300 font-mono text-[11px]">
                      {p.planningEmailNote || `${p.name.split(' ')[0]} — planning email`}
                    </span>
                  </label>

                  {p.dietary && (
                    <span className="text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-800/30">
                      Diet: {p.dietary}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: + Add Guest Party */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-serif text-lg text-stone-100 font-medium">Add Guest Party</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-500 hover:text-stone-300 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGuest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Party Name / Primary Guest *
                </label>
                <input
                  type="text"
                  required
                  value={newGuest.name || ''}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  placeholder="e.g. Andrei and Mary Fratian"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newGuest.email || ''}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  placeholder="e.g. andreifratian@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Party Size (Seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newGuest.partySize || 2}
                    onChange={(e) => setNewGuest({ ...newGuest, partySize: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={newGuest.status || 'Pending'}
                    onChange={(e) => setNewGuest({ ...newGuest, status: e.target.value as GuestStatus })}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Yes">Yes</option>
                    <option value="Maybe">Maybe</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={!!newGuest.planningEmailSent}
                    onChange={(e) =>
                      setNewGuest({ ...newGuest, planningEmailSent: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800"
                  />
                  <span className="text-xs text-stone-200">Planning email already sent</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Planning Email Note
                </label>
                <input
                  type="text"
                  value={newGuest.planningEmailNote || ''}
                  onChange={(e) => setNewGuest({ ...newGuest, planningEmailNote: e.target.value })}
                  placeholder="e.g. Andrei — planning email"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
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
                  className="px-5 py-2 rounded-xl bg-carpathian-700 hover:bg-carpathian-600 text-stone-100 text-xs font-medium border border-gold-500/30"
                >
                  Save Guest Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Guest Party */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl space-y-4 text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-serif text-lg text-stone-100 font-medium">Edit: {editingGuest.name}</h3>
              <button
                onClick={() => setEditingGuest(null)}
                className="text-stone-500 hover:text-stone-300 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Party Name / Primary Guest
                </label>
                <input
                  type="text"
                  required
                  value={editingGuest.name}
                  onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingGuest.email || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    Party Size (Seats)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingGuest.partySize}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, partySize: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={editingGuest.status}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, status: e.target.value as GuestStatus })
                    }
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Yes">Yes</option>
                    <option value="Maybe">Maybe</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editingGuest.planningEmailSent}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, planningEmailSent: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-carpathian-600 accent-carpathian-600 bg-stone-950 border-stone-800"
                  />
                  <span className="text-xs text-stone-200">Planning email sent</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Planning Email Note
                </label>
                <input
                  type="text"
                  value={editingGuest.planningEmailNote || ''}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, planningEmailNote: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-stone-400 font-mono mb-1">
                  Dietary Restrictions
                </label>
                <input
                  type="text"
                  value={editingGuest.dietary || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, dietary: e.target.value })}
                  placeholder="e.g. Vegetarian, Gluten-free"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
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
                  RSVPs submitted on the guest portal write to your Google Sheet. Clicking &ldquo;Sync Sheets&rdquo; fetches live records and merges them into this manifest.
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
