import React, { useState } from 'react';
import {
  Globe,
  Building,
  Plus,
  ShieldCheck,
  TrendingUp,
  Search,
  DollarSign,
  Users,
  Store,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  BarChart2,
  CreditCard,
  Clock,
  ArrowUpRight,
  Sparkles,
  Activity,
  Zap,
  RefreshCw,
  Sliders,
  Check,
  Building2,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileText,
  Wifi,
  WifiOff,
  Database,
  Loader2
} from 'lucide-react';
import { useSupabaseData, InstitutionRequest, SupabaseInstitution } from '../../../hooks/useSupabaseData';
import { supabase } from '../../../lib/supabaseClient';

// ---------------------------------------------------------------
// Fallback Logo
// ---------------------------------------------------------------
const InstitutionLogo: React.FC<{ name: string; className?: string }> = ({
  name,
  className = 'w-10 h-10 rounded-xl',
}) => {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`${className} bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-xs shadow-inner shrink-0`}
    >
      {initials || 'IN'}
    </div>
  );
};

// ---------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: string; label: string }> = {
    pending:       { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',    label: 'Pending' },
    active:        { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Active' },
    rejected:      { color: 'bg-red-500/10 text-red-400 border-red-500/30',          label: 'Rejected' },
    suspended:     { color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',    label: 'Suspended' },
    pending_approval: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Pending' },
  };
  const s = map[status] || { color: 'bg-slate-800 text-slate-400 border-slate-700', label: status };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>
      {s.label}
    </span>
  );
};

// ---------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------
const SkeletonCard = () => (
  <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 animate-pulse space-y-2">
    <div className="h-3 bg-slate-800 rounded w-1/2" />
    <div className="h-6 bg-slate-800 rounded w-1/3" />
    <div className="h-3 bg-slate-800 rounded w-2/3" />
  </div>
);

// ---------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------
export const SuperAdminView: React.FC = () => {
  const {
    institutionRequests,
    approvedInstitutions,
    loading,
    error,
    isRealtime,
    totalStudents,
    totalOrders,
    approveRequest,
    rejectRequest,
    suspendInstitution,
    activateInstitution,
    refresh,
  } = useSupabaseData();

  const [activeTab, setActiveTab] = useState<
    'directory' | 'analytics' | 'approvals' | 'governance'
  >('approvals');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'suspended'>('all');

  // Toast
  const [toasts, setToasts] = useState<{ id: string; msg: string; type?: 'success' | 'info' | 'error' }[]>([]);
  const addToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // Onboard Modal (manual add)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addContact, setAddContact] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addPlan, setAddPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Basic');
  const [addLoading, setAddLoading] = useState(false);

  // Detail modal
  const [selectedRequest, setSelectedRequest] = useState<InstitutionRequest | null>(null);

  // ---------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------
  const pendingRequests = institutionRequests.filter((r) => r.status === 'pending');
  const allRequests = institutionRequests.filter((r) => {
    const matchesSearch =
      r.institution_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.institution_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInstitutions = approvedInstitutions.filter((i) => {
    const matchesSearch =
      i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // ---------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------
  const handleApprove = async (id: string, name: string) => {
    await approveRequest(id);
    addToast(`✔ Approved: ${name}`);
  };

  const handleReject = async (id: string, name: string) => {
    await rejectRequest(id);
    addToast(`✖ Rejected: ${name}`, 'error');
  };

  const handleSuspend = async (id: string, name: string) => {
    await suspendInstitution(id);
    addToast(`⏸ Suspended: ${name}`, 'info');
  };

  const handleActivate = async (id: string, name: string) => {
    await activateInstitution(id);
    addToast(`✔ Activated: ${name}`);
  };

  const handleManualOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail) return;
    setAddLoading(true);

    const { error: insertErr } = await supabase.from('institution_requests').insert({
      institution_name: addName,
      institution_email: addEmail,
      contact_person: addContact,
      phone_number: addPhone,
      city: addCity,
      plan: addPlan,
      status: 'active',
    });

    setAddLoading(false);
    if (insertErr) {
      addToast(`Error: ${insertErr.message}`, 'error');
    } else {
      addToast(`✔ Onboarded ${addName}!`);
      setShowAddModal(false);
      setAddName(''); setAddEmail(''); setAddContact(''); setAddPhone(''); setAddCity('');
      refresh();
    }
  };

  // ---------------------------------------------------------------
  // Render — Error State
  // ---------------------------------------------------------------
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-950 border border-red-500/40 flex items-center justify-center">
          <Database className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Supabase Connection Error</h2>
        <p className="text-sm text-slate-400 max-w-md">{error}</p>
        <button
          onClick={refresh}
          className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      {/* Toast */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-2xl text-white text-xs font-bold shadow-2xl flex items-center space-x-2 ${
              toast.type === 'error'
                ? 'bg-red-950 border border-red-500/40'
                : toast.type === 'info'
                ? 'bg-slate-900 border border-slate-700'
                : 'bg-[#0C0C0E] border border-amber-500/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toast.msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>Super Admin • FOODEXA Enterprise</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                <Wifi className="w-3 h-3" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]">
                <WifiOff className="w-3 h-3" /> Connecting…
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Master Governance Console</h1>
          <p className="text-xs text-slate-400 mt-1">
            All data is live from Supabase — no mock records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refresh}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Institution</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Institution Requests</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{institutionRequests.length}</div>
            <div className="text-[11px] text-amber-400 font-medium flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{pendingRequests.length} Pending Approval</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Active Institutions</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {approvedInstitutions.filter((i) => i.status === 'active').length}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">Live on platform</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Global Students</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalStudents.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-400 font-medium">From Supabase</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Total Orders</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalOrders.toLocaleString()}</div>
            <div className="text-[11px] text-cyan-400 font-medium">All time</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-0">
        {(['approvals', 'directory', 'analytics', 'governance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'approvals' ? (
              <span className="flex items-center gap-2">
                Institution Requests
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                    {pendingRequests.length}
                  </span>
                )}
              </span>
            ) : tab}
          </button>
        ))}
      </div>

      {/* ---- TAB: Approvals (Institution Requests) ---- */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search requests…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : allRequests.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Building className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-semibold">No institution requests yet.</p>
              <p className="text-slate-600 text-xs">When institutions register from the main website, they appear here instantly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 hover:border-amber-500/20 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <InstitutionLogo name={req.institution_name} />
                      <div>
                        <p className="text-sm font-bold text-white">{req.institution_name}</p>
                        <p className="text-xs text-slate-400">{req.institution_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={req.status} />
                      <span className="text-[10px] text-slate-600">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {req.contact_person}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {req.phone_number || '—'}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {[req.city, req.state, req.country].filter(Boolean).join(', ') || '—'}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {req.student_population || '—'} students</span>
                  </div>

                  {req.message && (
                    <p className="text-[11px] text-slate-500 italic border-l-2 border-slate-800 pl-3">
                      {req.message}
                    </p>
                  )}

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(req.id, req.institution_name)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(req.id, req.institution_name)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all"
                      >
                        Details
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- TAB: Directory (Approved Institutions) ---- */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search institutions…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-semibold">No approved institutions yet.</p>
              <p className="text-slate-600 text-xs">Approved requests will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredInstitutions.map((inst) => (
                <div
                  key={inst.id}
                  className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 hover:border-indigo-500/30 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <InstitutionLogo name={inst.name} />
                      <div>
                        <p className="text-sm font-bold text-white">{inst.name}</p>
                        <p className="text-xs text-slate-400">{inst.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={inst.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {inst.contact_person || '—'}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {inst.location || '—'}</span>
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {inst.plan || 'Basic'} Plan</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {inst.joined_date || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    {inst.status === 'active' ? (
                      <button
                        onClick={() => handleSuspend(inst.id, inst.name)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 text-[11px] font-semibold transition-all"
                      >
                        Suspend
                      </button>
                    ) : inst.status === 'suspended' ? (
                      <button
                        onClick={() => handleActivate(inst.id, inst.name)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold transition-all"
                      >
                        Reactivate
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- TAB: Analytics ---- */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" /> Total Requests
              </div>
              <div className="text-3xl font-black text-white">{institutionRequests.length}</div>
              <p className="text-[11px] text-slate-500">All time registrations</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Approved
              </div>
              <div className="text-3xl font-black text-emerald-400">
                {institutionRequests.filter((r) => r.status === 'active').length}
              </div>
              <p className="text-[11px] text-slate-500">Active on platform</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" /> Rejected
              </div>
              <div className="text-3xl font-black text-red-400">
                {institutionRequests.filter((r) => r.status === 'rejected').length}
              </div>
              <p className="text-[11px] text-slate-500">Declined requests</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" /> Platform Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Registered Students</p>
                <p className="text-xl font-black text-white">{totalStudents.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Total Orders</p>
                <p className="text-xl font-black text-white">{totalOrders.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Institutions</p>
                <p className="text-xl font-black text-white">{approvedInstitutions.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Pending Review</p>
                <p className="text-xl font-black text-amber-400">{pendingRequests.length}</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 border-t border-slate-800 pt-3">
              All data sourced live from Supabase — <code>oxsbkwcmpsadbcceaalc.supabase.co</code>
            </p>
          </div>
        </div>
      )}

      {/* ---- TAB: Governance ---- */}
      {activeTab === 'governance' && (
        <div className="p-6 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Governance & Compliance
          </div>
          <p className="text-xs text-slate-400">
            All Super Admin actions (approve, reject, suspend, activate) are written directly to your Supabase database in real time.
            Use the Supabase Dashboard → Table Editor to view detailed audit logs.
          </p>
          <a
            href="https://app.supabase.com/project/oxsbkwcmpsadbcceaalc"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-amber-500/40 transition-all"
          >
            <Database className="w-4 h-4 text-amber-400" />
            Open Supabase Dashboard
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* ---- Detail Modal ---- */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <InstitutionLogo name={selectedRequest.institution_name} className="w-12 h-12 rounded-xl" />
              <div>
                <p className="font-bold text-white">{selectedRequest.institution_name}</p>
                <StatusBadge status={selectedRequest.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div><span className="text-slate-500 block">Email</span>{selectedRequest.institution_email}</div>
              <div><span className="text-slate-500 block">Contact</span>{selectedRequest.contact_person}</div>
              <div><span className="text-slate-500 block">Phone</span>{selectedRequest.phone_number || '—'}</div>
              <div><span className="text-slate-500 block">Location</span>{[selectedRequest.city, selectedRequest.state, selectedRequest.country].filter(Boolean).join(', ') || '—'}</div>
              <div><span className="text-slate-500 block">Students</span>{selectedRequest.student_population || '—'}</div>
              <div><span className="text-slate-500 block">Food Courts</span>{selectedRequest.food_courts_count || '—'}</div>
              <div><span className="text-slate-500 block">Vendors</span>{selectedRequest.vendors_count || '—'}</div>
              <div><span className="text-slate-500 block">Website</span>
                {selectedRequest.institution_website
                  ? <a href={selectedRequest.institution_website} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{selectedRequest.institution_website}</a>
                  : '—'}
              </div>
            </div>
            {selectedRequest.message && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic">
                {selectedRequest.message}
              </div>
            )}
            {selectedRequest.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={async () => { await handleApprove(selectedRequest.id, selectedRequest.institution_name); setSelectedRequest(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold"
                >
                  Approve
                </button>
                <button
                  onClick={async () => { await handleReject(selectedRequest.id, selectedRequest.institution_name); setSelectedRequest(null); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Manual Onboard Modal ---- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold text-white">Manually Onboard Institution</h2>
            <form onSubmit={handleManualOnboard} className="space-y-3">
              <input required type="text" placeholder="Institution Name *" value={addName} onChange={(e) => setAddName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
              <input required type="email" placeholder="Email *" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
              <input type="text" placeholder="Contact Person" value={addContact} onChange={(e) => setAddContact(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none" />
              <input type="tel" placeholder="Phone Number" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none" />
              <input type="text" placeholder="City" value={addCity} onChange={(e) => setAddCity(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none" />
              <select value={addPlan} onChange={(e) => setAddPlan(e.target.value as 'Basic' | 'Pro' | 'Enterprise')} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {addLoading ? 'Saving…' : 'Onboard to Supabase'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
