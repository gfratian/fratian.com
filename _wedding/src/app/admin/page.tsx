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
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Yes' | 'Maybe' | 'No'>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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
      return true;
    });
  }, [parties, searchQuery, activeFilter]);

  // Render Admin Lock Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 text-[#1C1917] selection:bg-[#945D33] selection:text-white">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white border border-[#E7DFD5] shadow-xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] border border-[#E2D8C9] flex items-center justify-center text-[#945D33] mx-auto shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-serif text-[#1C1917] font-semibold">Elizabeth & George</h1>
            <p className="text-xs uppercase tracking-widest text-[#945D33] font-mono font-medium">
              Host Manifest & Invitations Admin
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setPasscodeError(false);
                }}
                placeholder="Enter host passcode..."
                className="w-full px-4 py-3 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-[#1C1917] placeholder-[#A89F91] text-sm focus:outline-none focus:ring-2 focus:ring-[#945D33]/40 focus:border-[#945D33] text-center font-mono tracking-wider"
              />
            </div>

            {passcodeError && (
              <p className="text-xs text-red-600 bg-red-50 py-1.5 px-3 rounded-lg border border-red-200">
                Invalid passcode. Please enter the host key.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#945D33] hover:bg-[#7D4C25] text-white font-medium text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Guest Manifest</span>
            </button>
          </form>

          <div className="pt-2 border-t border-[#EFE8DD]">
            <a
              href="/may2027/"
              className="text-xs text-[#8C8275] hover:text-[#1C1917] transition-colors inline-flex items-center gap-1.5"
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1917] selection:bg-[#945D33] selection:text-white font-sans">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 border-b border-[#E7DFD5] backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="/may2027/"
              className="p-2 rounded-xl bg-white border border-[#DFD7CB] hover:border-[#945D33] text-[#786F66] hover:text-[#1C1917] transition-all shadow-xs"
              title="Return to guest portal"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm text-[#1C1917] tracking-wide">E & G</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#F3EDE4] text-[#786F66] border border-[#E0D6C8]">
                  Invitations & Manifest
                </span>
                {isLiveConnected ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Google Sheets
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Local Manifest Mode
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DFD7CB] text-[#574F47] hover:text-[#1C1917] text-xs font-medium hover:border-[#945D33] transition-all shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#945D33]" />
                <span>Google Sheet</span>
              </a>
            )}

            <button
              onClick={() => fetchRsvps()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DFD7CB] text-[#574F47] hover:text-[#1C1917] text-xs font-medium hover:border-[#945D33] transition-all shadow-xs"
              title="Sync with Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#945D33] ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Sheets</span>
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl bg-white border border-[#DFD7CB] text-[#786F66] hover:text-[#1C1917] transition-all shadow-xs"
              title="Settings & Webhook"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white border border-[#DFD7CB] text-[#786F66] hover:text-[#1C1917] transition-all shadow-xs"
              title="Lock Admin"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Alert if Status Message */}
        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-white border border-[#E7DFD5] text-xs text-[#574F47] flex items-center justify-between gap-3 shadow-xs">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#945D33] shrink-0" />
              {statusMessage}
            </span>
            <button
              onClick={() => setStatusMessage('')}
              className="text-[#9E9488] hover:text-[#1C1917] text-xs uppercase font-mono tracking-wider"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Header Banner (Dark Forest Green Container) */}
        <section className="rounded-3xl bg-[#192D21] text-white p-6 sm:p-8 md:p-10 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-normal text-white">
                Elizabeth & George
              </h1>
              <p className="text-sm sm:text-base font-serif italic text-stone-200 flex items-center gap-2">
                <span>Castelul Cantacuzino, Bușteni</span>
                <span className="not-italic text-[11px] sm:text-xs uppercase tracking-widest text-stone-300 font-sans font-medium px-2 py-0.5 rounded bg-white/10">
                  CONFIRMED
                </span>
              </p>
            </div>

            <div className="text-left md:text-right space-y-1">
              <div className="text-base sm:text-lg font-semibold tracking-wider uppercase font-sans text-stone-100">
                28 MAY 2027
              </div>
              <div className="text-xs sm:text-sm text-stone-300 font-sans">
                {stats.daysToGo} days to go
              </div>
            </div>
          </div>

          {/* Subtle background ambient glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        </section>

        {/* 2. Timeline Milestones Row (4 Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Milestone 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7C7267] font-medium font-sans">
              SAVE-THE-DATES SENT
            </div>
            <div className="text-base sm:text-lg font-serif font-bold text-[#1C1917] mt-1.5">
              By late Sept 2026
            </div>
          </div>

          {/* Milestone 2 (Active highlighted with dot & border) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#945D33] shadow-xs relative">
            <div className="flex items-center justify-between">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7C7267] font-medium font-sans">
                RESPOND BY
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#945D33]" title="Current Milestone Active" />
            </div>
            <div className="text-base sm:text-lg font-serif font-bold text-[#1C1917] mt-1.5">
              1 Dec 2026
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7C7267] font-medium font-sans">
              FORMAL INVITATIONS
            </div>
            <div className="text-base sm:text-lg font-serif font-bold text-[#1C1917] mt-1.5">
              Feb 2027
            </div>
          </div>

          {/* Milestone 4 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7C7267] font-medium font-sans">
              WEDDING DAY
            </div>
            <div className="text-base sm:text-lg font-serif font-bold text-[#1C1917] mt-1.5">
              28 May 2027
            </div>
          </div>
        </section>

        {/* 3. KPI / Statistics - Row 1 (6 Cards) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total guests */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-2xl sm:text-3xl font-serif text-[#1C1917] font-medium">
              {stats.totalGuests}
            </div>
            <div className="text-xs text-[#7C7267] mt-1">Total guests</div>
          </div>

          {/* Invited (parties) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-2xl sm:text-3xl font-serif text-[#1C1917] font-medium">
              {stats.totalParties}
            </div>
            <div className="text-xs text-[#7C7267] mt-1">Invited (parties)</div>
          </div>

          {/* Yes */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-2xl sm:text-3xl font-serif text-[#2D6A4F] font-medium">
              {stats.yesCount}
            </div>
            <div className="text-xs text-[#7C7267] mt-1">
              Yes · {stats.yesGuests} guests
            </div>
          </div>

          {/* Maybe */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-2xl sm:text-3xl font-serif text-[#945D33] font-medium">
              {stats.maybeCount}
            </div>
            <div className="text-xs text-[#7C7267] mt-1">Maybe</div>
          </div>

          {/* No */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-2xl sm:text-3xl font-serif text-[#7C7267] font-medium">
              {stats.noCount}
            </div>
            <div className="text-xs text-[#7C7267] mt-1">No</div>
          </div>

          {/* Awaiting reply */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-2xl sm:text-3xl font-serif text-[#7C7267] font-medium">
              {stats.pendingCount}
            </div>
            <div className="text-xs text-[#7C7267] mt-1">Awaiting reply</div>
          </div>
        </section>

        {/* 4. KPI / Statistics - Row 2 (2 Cards: Planning Email & Missing Email) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Planning email sent */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-2xl sm:text-3xl font-serif text-[#2D6A4F] font-medium">
              {stats.planningEmailSentCount} / {stats.totalParties}
            </div>
            <div className="text-xs text-[#7C7267] mt-1">Planning email sent</div>
          </div>

          {/* No email on file */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs">
            <div className="text-2xl sm:text-3xl font-serif text-[#7C7267] font-medium">
              {stats.noEmailOnFileCount}
            </div>
            <div className="text-xs text-[#7C7267] mt-1">No email on file</div>
          </div>

          {/* Guest Passcode Shortcut Card */}
          <div className="sm:col-span-2 p-4 sm:p-5 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
                <span>VIP Passcode Link</span>
                <span className="text-[10px] font-mono bg-[#F3EDE4] text-[#7C7267] px-2 py-0.5 rounded-full">
                  Cantacuzino27
                </span>
              </div>
              <div className="text-xs text-[#7C7267] mt-0.5">
                Send direct link to bypass guest passcode screen
              </div>
            </div>
            <button
              onClick={copyBypassLink}
              className="px-3 py-1.5 rounded-xl bg-[#F3EDE4] hover:bg-[#EAE2D7] text-[#1C1917] text-xs font-medium flex items-center gap-1.5 transition-all shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#945D33]" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </section>

        {/* 5. Action / Filter Bar */}
        <section className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2">
          {/* Left: Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guests..."
              className="w-full px-4 py-2.5 bg-white border border-[#E7DFD5] rounded-xl text-sm text-[#1C1917] placeholder-[#A89F91] focus:outline-none focus:ring-2 focus:ring-[#945D33]/40 focus:border-[#945D33] shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A89F91] hover:text-[#1C1917]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Middle: Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilter('All')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'All'
                  ? 'bg-[#945D33] text-white shadow-xs'
                  : 'bg-white border border-[#E7DFD5] text-[#574F47] hover:bg-[#F3EDE4]'
              }`}
            >
              All ({stats.totalParties})
            </button>

            <button
              onClick={() => setActiveFilter('Pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'Pending'
                  ? 'bg-[#945D33] text-white shadow-xs'
                  : 'bg-white border border-[#E7DFD5] text-[#574F47] hover:bg-[#F3EDE4]'
              }`}
            >
              Pending ({stats.pendingCount})
            </button>

            <button
              onClick={() => setActiveFilter('Yes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'Yes'
                  ? 'bg-[#945D33] text-white shadow-xs'
                  : 'bg-white border border-[#E7DFD5] text-[#574F47] hover:bg-[#F3EDE4]'
              }`}
            >
              Yes ({stats.yesCount})
            </button>

            <button
              onClick={() => setActiveFilter('Maybe')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'Maybe'
                  ? 'bg-[#945D33] text-white shadow-xs'
                  : 'bg-white border border-[#E7DFD5] text-[#574F47] hover:bg-[#F3EDE4]'
              }`}
            >
              Maybe ({stats.maybeCount})
            </button>

            <button
              onClick={() => setActiveFilter('No')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeFilter === 'No'
                  ? 'bg-[#945D33] text-white shadow-xs'
                  : 'bg-white border border-[#E7DFD5] text-[#574F47] hover:bg-[#F3EDE4]'
              }`}
            >
              No ({stats.noCount})
            </button>
          </div>

          {/* Right: Actions (View Toggle, Export, Add Guest) */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-[#E7DFD5] rounded-xl p-0.5 shadow-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg text-xs transition-all ${
                  viewMode === 'cards' ? 'bg-[#F3EDE4] text-[#1C1917]' : 'text-[#7C7267] hover:text-[#1C1917]'
                }`}
                title="Cards view (from design)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs transition-all ${
                  viewMode === 'table' ? 'bg-[#F3EDE4] text-[#1C1917]' : 'text-[#7C7267] hover:text-[#1C1917]'
                }`}
                title="Detailed logistics table"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={exportCsv}
              className="px-4 py-2 rounded-xl bg-white border border-[#E7DFD5] hover:bg-[#F3EDE4] text-[#1C1917] text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#945D33]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#945D33] hover:bg-[#7D4C25] text-white text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add guest</span>
            </button>
          </div>
        </section>

        {/* 6. Guest List - Rendered in Cards View or Detailed Table View */}
        {filteredParties.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#E7DFD5] text-[#7C7267] text-sm">
            No guests found matching &ldquo;{searchQuery}&rdquo; under {activeFilter} status.
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View (Direct reproduction of the provided design) */
          <section className="space-y-3.5">
            {filteredParties.map((p) => (
              <div
                key={p.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E7DFD5] shadow-xs hover:border-[#D6CAB8] transition-all space-y-4"
              >
                {/* Upper line: Guest Name, Email, Guest count badge, Status Dropdown, Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-[#1C1917]">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-[#7C7267] mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-[#9E9488]" />
                      <span>{p.email || 'No email on file'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {/* Guest count pill */}
                    <span className="px-3 py-1 rounded-full bg-[#F3EDE4] text-[#574F47] text-xs font-medium">
                      {p.partySize} {p.partySize === 1 ? 'guest' : 'guests'}
                    </span>

                    {/* Status Select Pill */}
                    <div className="relative">
                      <select
                        value={p.status}
                        onChange={(e) => updateGuestStatus(p.id, e.target.value as GuestStatus)}
                        className={`text-xs font-medium px-3 py-1 rounded-full cursor-pointer border appearance-none pr-6 focus:outline-none transition-all ${
                          p.status === 'Yes'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : p.status === 'No'
                            ? 'bg-stone-100 text-stone-500 border-stone-200'
                            : p.status === 'Maybe'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-[#F3EDE4] text-[#574F47] border-[#E0D6C8]'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Yes">Yes</option>
                        <option value="Maybe">Maybe</option>
                        <option value="No">No</option>
                      </select>
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#7C7267]">
                        ▼
                      </span>
                    </div>

                    {/* Edit Pencil Icon */}
                    <button
                      onClick={() => setEditingGuest(p)}
                      className="p-1.5 rounded-lg text-[#9E9488] hover:text-[#1C1917] hover:bg-[#F3EDE4] transition-all"
                      title="Edit party details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Icon */}
                    <button
                      onClick={() => deleteGuest(p.id, p.name)}
                      className="p-1.5 rounded-lg text-[#9E9488] hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Remove party"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lower line: Checkbox for planning email sent */}
                <div className="pt-2 border-t border-[#F5EFE6] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={p.planningEmailSent}
                      onChange={() => togglePlanningEmail(p.id)}
                      className="w-4 h-4 rounded text-[#945D33] accent-[#945D33] border-[#DFD7CB] cursor-pointer"
                    />
                    <span className="text-[#443D36] font-medium">
                      {p.planningEmailNote || `${p.name.split(' ')[0]} — planning email`}
                    </span>
                  </label>

                  {/* Optional extra chips (Dietary, Events) if present */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {p.dietary && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Diet: {p.dietary}
                      </span>
                    )}
                    {p.status === 'Yes' && p.thuPeles && (
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">Peleș Tour</span>
                    )}
                    {p.status === 'Yes' && p.satBrunch && (
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">Brunch</span>
                    )}
                    {p.status === 'Yes' && p.satExcursion && (
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">Excursion</span>
                    )}
                    {p.notes && (
                      <span className="text-[#9E9488] max-w-[200px] truncate" title={p.notes}>
                        &ldquo;{p.notes}&rdquo;
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>
        ) : (
          /* Table View (for deep logistics and printable manifest) */
          <div className="rounded-2xl bg-white border border-[#E7DFD5] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F4EE] border-b border-[#E7DFD5] text-[11px] uppercase tracking-wider text-[#7C7267] font-mono">
                  <tr>
                    <th className="py-3 px-4 font-medium">Guest / Party</th>
                    <th className="py-3 px-4 font-medium">Seats</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Planning Email</th>
                    <th className="py-3 px-4 font-medium">Events</th>
                    <th className="py-3 px-4 font-medium">Dietary</th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1] text-[#1C1917]">
                  {filteredParties.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1C1917]">{p.name}</div>
                        <div className="text-[11px] text-[#7C7267]">{p.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium">{p.partySize}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            p.status === 'Yes'
                              ? 'bg-emerald-50 text-emerald-800'
                              : p.status === 'No'
                              ? 'bg-stone-100 text-stone-500'
                              : p.status === 'Maybe'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-[#F3EDE4] text-[#574F47]'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={p.planningEmailSent}
                            onChange={() => togglePlanningEmail(p.id)}
                            className="w-3.5 h-3.5 text-[#945D33] accent-[#945D33]"
                          />
                          <span className="text-[11px] text-[#7C7267]">
                            {p.planningEmailSent ? 'Sent' : 'Pending'}
                          </span>
                        </label>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#7C7267]">
                        {p.thuPeles && <span className="mr-1.5">Peleș</span>}
                        {p.satBrunch && <span className="mr-1.5">Brunch</span>}
                        {p.satExcursion && <span>Excursion</span>}
                        {!p.thuPeles && !p.satBrunch && !p.satExcursion && '—'}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[#7C7267]">{p.dietary || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingGuest(p)}
                            className="p-1 hover:text-[#945D33]"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteGuest(p.id, p.name)}
                            className="p-1 hover:text-red-600"
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

        {/* 7. Catering & Dietary Requirements Digest */}
        {stats.dietaryCount > 0 && (
          <section className="p-5 rounded-2xl bg-white border border-[#E7DFD5] space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#945D33] font-mono font-medium">
              <Utensils className="w-4 h-4" />
              <span>Catering & Dietary Digest ({stats.dietaryCount} Notes)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {parties
                .filter((p) => p.dietary && p.dietary.trim())
                .map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DFD5] text-xs">
                    <span className="font-semibold text-[#1C1917]">{p.name}</span>
                    <span className="text-[#7C7267] block text-[11px]">{p.email}</span>
                    <span className="inline-block mt-1 text-[#945D33] bg-amber-50 px-2 py-0.5 rounded font-mono text-[11px] border border-amber-200/50">
                      {p.dietary}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>

      {/* MODAL: + Add Guest Party */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-[#E7DFD5] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <h3 className="font-serif font-bold text-lg text-[#1C1917]">Add Guest Party</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#9E9488] hover:text-[#1C1917] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGuest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                  Party Name / Primary Guest *
                </label>
                <input
                  type="text"
                  required
                  value={newGuest.name || ''}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  placeholder="e.g. Andrei and Mary Fratian"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#945D33]/40"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newGuest.email || ''}
                  onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                  placeholder="e.g. andreifratian@gmail.com"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#945D33]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                    Party Size (Guests)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newGuest.partySize || 2}
                    onChange={(e) => setNewGuest({ ...newGuest, partySize: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#945D33]/40"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={newGuest.status || 'Pending'}
                    onChange={(e) => setNewGuest({ ...newGuest, status: e.target.value as GuestStatus })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#945D33]/40"
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
                    className="w-4 h-4 rounded text-[#945D33] accent-[#945D33]"
                  />
                  <span className="text-xs text-[#1C1917] font-medium">Planning email already sent</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                  Planning Email Note
                </label>
                <input
                  type="text"
                  value={newGuest.planningEmailNote || ''}
                  onChange={(e) => setNewGuest({ ...newGuest, planningEmailNote: e.target.value })}
                  placeholder="e.g. Andrei — planning email"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#945D33]/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EAE1]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#574F47] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#945D33] hover:bg-[#7D4C25] text-white text-xs font-medium shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-[#E7DFD5] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <h3 className="font-serif font-bold text-lg text-[#1C1917]">Edit Party: {editingGuest.name}</h3>
              <button
                onClick={() => setEditingGuest(null)}
                className="text-[#9E9488] hover:text-[#1C1917] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                  Party Name / Primary Guest
                </label>
                <input
                  type="text"
                  required
                  value={editingGuest.name}
                  onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-sm text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingGuest.email || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-sm text-[#1C1917]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                    Party Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingGuest.partySize}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, partySize: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-sm text-[#1C1917]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={editingGuest.status}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, status: e.target.value as GuestStatus })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-sm text-[#1C1917]"
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
                    className="w-4 h-4 rounded text-[#945D33] accent-[#945D33]"
                  />
                  <span className="text-xs text-[#1C1917] font-medium">Planning email sent</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                  Planning Email Note
                </label>
                <input
                  type="text"
                  value={editingGuest.planningEmailNote || ''}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, planningEmailNote: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-xs text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                  Dietary Restrictions
                </label>
                <input
                  type="text"
                  value={editingGuest.dietary || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, dietary: e.target.value })}
                  placeholder="e.g. Vegetarian, Gluten-free"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-xs text-[#1C1917]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EAE1]">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#574F47] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#945D33] hover:bg-[#7D4C25] text-white text-xs font-medium shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-white border border-[#E7DFD5] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#945D33]" />
                <h3 className="font-serif font-bold text-lg text-[#1C1917]">Google Sheets Integration</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-[#9E9488] hover:text-[#1C1917] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#574F47]">
              <p className="leading-relaxed">
                Connect your Google Apps Script Webhook URL to automatically fetch and sync RSVP responses from your Google Drive spreadsheet:
              </p>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#7C7267] font-medium mb-1">
                  Google Apps Script Web App URL:
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#DFD7CB] rounded-xl text-xs font-mono text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#945D33]/40"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DFD5] space-y-1 text-[11px] text-[#7C7267]">
                <span className="font-semibold text-[#1C1917] block">Webhook status:</span>
                <p>
                  RSVP submissions on the wedding site write to this sheet. Clicking &ldquo;Sync Sheets&rdquo; in the admin bar merges all submitted responses into your live guest roster.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0EAE1]">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#574F47] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-5 py-2 rounded-xl bg-[#945D33] hover:bg-[#7D4C25] text-white text-xs font-medium shadow-sm"
              >
                Save & Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
