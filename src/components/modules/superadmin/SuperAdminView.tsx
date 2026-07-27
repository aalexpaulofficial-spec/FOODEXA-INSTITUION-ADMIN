import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Globe, Building, Plus, ShieldCheck, TrendingUp, Search, DollarSign, Users,
  Store, ChevronRight, X, CheckCircle2, XCircle, AlertCircle, Filter,
  BarChart2, CreditCard, Clock, ArrowUpRight, Sparkles, Activity, Zap,
  RefreshCw, Sliders, Check, Building2, Phone, Mail, Calendar, Layers,
  FileText, Wifi, WifiOff, Database, Loader2, Bell, Trash2, Edit3,
  Download, Eye, ExternalLink, MessageSquare, ChevronDown, ChevronUp,
  TrendingDown, PieChart, BarChart, ArrowUp, ArrowDown, Copy, Send,
  CheckCheck, AlertTriangle, Info, UserMinus, UserPlus, History, Settings,
  CreditCard as CreditCardIcon, Receipt, Tag, Star, MapPin, Globe2
} from 'lucide-react';
import { useSupabaseData, InstitutionRequest, SupabaseInstitution, AuditLog, PlatformNotification } from '../../../hooks/useSupabaseData';
import { supabase } from '../../../lib/supabaseClient';

// ---------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------
const InstitutionLogo: React.FC<{ name: string; className?: string }> = ({
  name, className = 'w-10 h-10 rounded-xl',
}) => {
  const initials = name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`${className} bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-xs shadow-inner shrink-0`}>
      {initials || 'IN'}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Pending' },
    approved: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Approved' },
    active: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Active' },
    rejected: { color: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Rejected' },
    suspended: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', label: 'Suspended' },
    pending_approval: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Pending' },
    changes_requested: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Changes Requested' },
  };
  const s = map[status] || { color: 'bg-slate-800 text-slate-400 border-slate-700', label: status };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>;
};

const SkeletonCard = () => (
  <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 animate-pulse space-y-2">
    <div className="h-3 bg-slate-800 rounded w-1/2" />
    <div className="h-6 bg-slate-800 rounded w-1/3" />
    <div className="h-3 bg-slate-800 rounded w-2/3" />
  </div>
);

const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }> = ({
  open, onClose, title, children, wide,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} bg-slate-900 border border-slate-800 rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400">
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-base font-bold text-white mb-4">{title}</h2>
        {children}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// PDF Download Helper
// ---------------------------------------------------------------
const downloadRequestPDF = (req: InstitutionRequest) => {
  const lines = [
    'INSTITUTION REGISTRATION REQUEST',
    '================================',
    '',
    `Institution Name: ${req.institution_name}`,
    `Campus: ${req.campus || 'N/A'}`,
    `City: ${req.city || 'N/A'}`,
    `State: ${req.state || 'N/A'}`,
    `Country: ${req.country || 'N/A'}`,
    `Email: ${req.institution_email}`,
    `Contact Person: ${req.contact_person}`,
    `Role: ${req.role || 'N/A'}`,
    `Phone: ${req.phone_number || 'N/A'}`,
    `Website: ${req.institution_website || 'N/A'}`,
    `Student Population: ${req.student_population || 'N/A'}`,
    `Food Courts: ${req.food_courts_count || 'N/A'}`,
    `Vendors: ${req.vendors_count || 'N/A'}`,
    `Message: ${req.message || 'None'}`,
    `Plan: ${req.plan || 'Basic'}`,
    `Status: ${req.status}`,
    `Submitted: ${new Date(req.created_at).toLocaleString()}`,
    req.updated_at ? `Updated: ${new Date(req.updated_at).toLocaleString()}` : '',
    req.institution_code ? `Institution Code: ${req.institution_code}` : '',
    req.generated_email ? `Generated Email: ${req.generated_email}` : '',
    req.generated_password ? `Generated Password: ${req.generated_password}` : '',
    req.approved_by ? `Approved By: ${req.approved_by}` : '',
    req.approved_at ? `Approved At: ${new Date(req.approved_at).toLocaleString()}` : '',
    req.rejection_reason ? `Rejection Reason: ${req.rejection_reason}` : '',
    req.admin_notes ? `Admin Notes: ${req.admin_notes}` : '',
  ].filter(Boolean).join('\n');

  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `request-${req.institution_name.replace(/\s+/g, '-').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------
export const SuperAdminView: React.FC = () => {
  const {
    institutionRequests, approvedInstitutions, loading, error, isRealtime,
    totalStudents, totalOrders, totalVendors, totalRevenue, auditLogs,
    notifications, unreadCount, approveRequest, rejectRequest, requestChanges,
    suspendInstitution, activateInstitution, deleteInstitution, updateInstitution,
    createAuditLog, markNotificationRead, markAllNotificationsRead,
    globalSearch, refresh,
  } = useSupabaseData();

  const [activeTab, setActiveTab] = useState<
    'approvals' | 'directory' | 'analytics' | 'subscriptions' | 'notifications' | 'audit_logs'
  >('approvals');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'active' | 'rejected' | 'suspended' | 'changes_requested'>('all');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toasts, setToasts] = useState<{ id: string; msg: string; type?: 'success' | 'info' | 'error' }[]>([]);
  const addToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addContact, setAddContact] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addPlan, setAddPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Basic');
  const [addLoading, setAddLoading] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<InstitutionRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<InstitutionRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [changesModal, setChangesModal] = useState<InstitutionRequest | null>(null);
  const [changesNotes, setChangesNotes] = useState('');
  const [editModal, setEditModal] = useState<SupabaseInstitution | null>(null);
  const [editForm, setEditForm] = useState<Partial<SupabaseInstitution>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<SupabaseInstitution | null>(null);

  // ---------------------------------------------------------------
  // Global Search
  // ---------------------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (globalSearchTerm.length >= 2) {
        const results = await globalSearch(globalSearchTerm);
        setGlobalSearchResults(results);
      } else {
        setGlobalSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [globalSearchTerm, globalSearch]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowGlobalSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ---------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------
  const pendingRequests = institutionRequests.filter((r) => r.status === 'pending');
  const allRequests = institutionRequests.filter((r) => {
    const matchesSearch =
      r.institution_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.institution_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.institution_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.campus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInstitutions = approvedInstitutions.filter((i) => {
    const matchesSearch =
      i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // ---------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------
  const handleApprove = async (id: string, name: string) => {
    try {
      await approveRequest(id);
      addToast(`Approved: ${name}`);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Approval failed.', 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await rejectRequest(rejectModal.id, rejectReason);
    addToast(`Rejected: ${rejectModal.institution_name}`, 'error');
    setRejectModal(null);
    setRejectReason('');
  };

  const handleRequestChanges = async () => {
    if (!changesModal || !changesNotes) return;
    await requestChanges(changesModal.id, changesNotes);
    addToast(`Changes requested for ${changesModal.institution_name}`, 'info');
    setChangesModal(null);
    setChangesNotes('');
  };

  const handleSuspend = async (id: string, name: string) => {
    await suspendInstitution(id);
    addToast(`Suspended: ${name}`, 'info');
  };

  const handleActivate = async (id: string, name: string) => {
    await activateInstitution(id);
    addToast(`Activated: ${name}`);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteInstitution(deleteConfirm.id);
    addToast(`Deleted: ${deleteConfirm.name}`, 'error');
    setDeleteConfirm(null);
  };

  const handleEdit = async () => {
    if (!editModal) return;
    await updateInstitution(editModal.id, editForm);
    addToast(`Updated: ${editModal.name}`);
    setEditModal(null);
  };

  const handleManualOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail) return;
    setAddLoading(true);
    const { error: insertErr } = await supabase.from('institution_requests').insert({
      institution_name: addName, institution_email: addEmail,
      contact_person: addContact, phone_number: addPhone, city: addCity,
      plan: addPlan, status: 'active',
    });
    setAddLoading(false);
    if (insertErr) {
      addToast(`Error: ${insertErr.message}`, 'error');
    } else {
      await createAuditLog('Institution Onboarded Manually', addName);
      addToast(`Onboarded ${addName}!`);
      setShowAddModal(false);
      setAddName(''); setAddEmail(''); setAddContact(''); setAddPhone(''); setAddCity('');
      refresh();
    }
  };

  // ---------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-950 border border-red-500/40 flex items-center justify-center">
          <Database className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Supabase Connection Error</h2>
        <p className="text-sm text-slate-400 max-w-md">{error}</p>
        <button onClick={refresh} className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
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
          <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-2xl text-white text-xs font-bold shadow-2xl flex items-center space-x-2 ${
            toast.type === 'error' ? 'bg-red-950 border border-red-500/40' :
            toast.type === 'info' ? 'bg-slate-900 border border-slate-700' :
            'bg-[#0C0C0E] border border-amber-500/40'
          }`}>
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
            <span>Super Admin &bull; FOODEXA Enterprise</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><Wifi className="w-3 h-3" /> Live</span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]"><WifiOff className="w-3 h-3" /> Connecting&hellip;</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Master Governance Console</h1>
          <p className="text-xs text-slate-400 mt-1">All data is live from Supabase &mdash; no mock records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Global Search */}
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search everything..."
                value={globalSearchTerm}
                onChange={(e) => { setGlobalSearchTerm(e.target.value); setShowGlobalSearch(true); }}
                onFocus={() => setShowGlobalSearch(true)}
                className="w-64 bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            {showGlobalSearch && globalSearchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                {globalSearchResults.map((r) => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => {
                      if (r.type === 'institution' || r.type === 'request') {
                        setActiveTab(r.type === 'institution' ? 'directory' : 'approvals');
                      }
                      setShowGlobalSearch(false);
                      setGlobalSearchTerm('');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-800 transition-colors border-b border-slate-800/50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                      {r.type.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{r.subtitle}</p>
                    </div>
                    {r.status && <StatusBadge status={r.status} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllNotificationsRead} className="text-[10px] text-amber-400 hover:text-amber-300">
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No notifications yet</div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`px-4 py-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 ${!n.read ? 'bg-slate-800/30' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {n.type === 'success' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                         n.type === 'error' ? <XCircle className="w-3 h-3 text-red-400" /> :
                         n.type === 'warning' ? <AlertTriangle className="w-3 h-3 text-amber-400" /> :
                         <Info className="w-3 h-3 text-blue-400" />}
                        <span className="text-[11px] font-bold text-white">{n.title}</span>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400">{n.message}</p>
                      <p className="text-[9px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button onClick={refresh} className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Onboard Institution</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Requests</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{institutionRequests.length}</div>
            <div className="text-[11px] text-amber-400 font-medium flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{pendingRequests.length} Pending</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Active</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{approvedInstitutions.filter((i) => i.status === 'active').length}</div>
            <div className="text-[11px] text-emerald-400 font-medium">Live on platform</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Students</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalStudents.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-400 font-medium">Global</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Vendors</span>
              <Store className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalVendors.toLocaleString()}</div>
            <div className="text-[11px] text-cyan-400 font-medium">All institutions</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Orders</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalOrders.toLocaleString()}</div>
            <div className="text-[11px] text-purple-400 font-medium">All time</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <span>Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalRevenue >= 100000 ? `${(totalRevenue / 100000).toFixed(1)}L` : `₹${totalRevenue.toLocaleString()}`}</div>
            <div className="text-[11px] text-amber-400 font-medium">Monthly</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-0">
        {([
          { id: 'approvals' as const, label: 'Institution Requests', badge: pendingRequests.length },
          { id: 'directory' as const, label: 'Directory', badge: 0 },
          { id: 'analytics' as const, label: 'Analytics', badge: 0 },
          { id: 'subscriptions' as const, label: 'Subscriptions', badge: 0 },
          { id: 'notifications' as const, label: 'Notifications', badge: unreadCount },
          { id: 'audit_logs' as const, label: 'Audit Logs', badge: 0 },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold capitalize transition-all border-b-2 -mb-px ${
              activeTab === tab.id ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">{tab.badge}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* ==================== TAB: APPROVALS ==================== */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
              <option value="changes_requested">Changes Requested</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
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
                <div key={req.id} className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 hover:border-amber-500/20 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <InstitutionLogo name={req.institution_name} />
                      <div>
                        <p className="text-sm font-bold text-white">{req.institution_name}</p>
                        <p className="text-xs text-slate-400">{req.institution_email}</p>
                        {req.institution_code && <p className="text-[10px] text-amber-400 font-mono">Code: {req.institution_code}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={req.status} />
                      <span className="text-[10px] text-slate-600">{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {req.contact_person}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {req.phone_number || '—'}</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {[req.city, req.state, req.country].filter(Boolean).join(', ') || '—'}</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {req.student_population || '—'} students</span>
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {req.plan || 'Basic'} Plan</span>
                  </div>

                  {req.rejection_reason && (
                    <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-[11px] text-red-400">
                      <strong>Rejection Reason:</strong> {req.rejection_reason}
                    </div>
                  )}
                  {req.admin_notes && req.status === 'changes_requested' && (
                    <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-400">
                      <strong>Admin Notes:</strong> {req.admin_notes}
                    </div>
                  )}

                  {req.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button onClick={() => handleApprove(req.id, req.institution_name)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => setRejectModal(req)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button onClick={() => setChangesModal(req)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                        <MessageSquare className="w-3.5 h-3.5" /> Request Changes
                      </button>
                      <button onClick={() => setSelectedRequest(req)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => downloadRequestPDF(req)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {req.status !== 'pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => setSelectedRequest(req)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                      <button onClick={() => downloadRequestPDF(req)}
                        className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: DIRECTORY ==================== */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search institutions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm font-semibold">No approved institutions yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredInstitutions.map((inst) => (
                <div key={inst.id} className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 hover:border-indigo-500/30 transition-all space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <InstitutionLogo name={inst.name} />
                      <div>
                        <p className="text-sm font-bold text-white">{inst.name}</p>
                        <p className="text-xs text-slate-400">{inst.email}</p>
                        {inst.code && <p className="text-[10px] text-amber-400 font-mono">{inst.code}</p>}
                      </div>
                    </div>
                    <StatusBadge status={inst.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {inst.contact_person || '—'}</span>
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {inst.plan || 'Basic'} Plan</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {inst.joined_date || '—'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {inst.students_count || 0} students</span>
                    <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {inst.vendors_count || 0} vendors</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { setEditModal(inst); setEditForm(inst); }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 text-[11px] font-semibold transition-all flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    {inst.status === 'active' ? (
                      <button onClick={() => handleSuspend(inst.id, inst.name)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 text-[11px] font-semibold transition-all">
                        Suspend
                      </button>
                    ) : inst.status === 'suspended' ? (
                      <button onClick={() => handleActivate(inst.id, inst.name)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold transition-all">
                        Reactivate
                      </button>
                    ) : null}
                    <button onClick={() => setDeleteConfirm(inst)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[11px] font-semibold transition-all flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: ANALYTICS ==================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="text-3xl font-black text-emerald-400">{institutionRequests.filter((r) => r.status === 'approved').length}</div>
              <p className="text-[11px] text-slate-500">Active on platform</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" /> Rejected
              </div>
              <div className="text-3xl font-black text-red-400">{institutionRequests.filter((r) => r.status === 'rejected').length}</div>
              <p className="text-[11px] text-slate-500">Declined requests</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" /> Changes Requested
              </div>
              <div className="text-3xl font-black text-blue-400">{institutionRequests.filter((r) => r.status === 'changes_requested').length}</div>
              <p className="text-[11px] text-slate-500">Awaiting resubmission</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Global Students
              </div>
              <div className="text-3xl font-black text-white">{totalStudents.toLocaleString()}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-cyan-400" /> Global Vendors
              </div>
              <div className="text-3xl font-black text-white">{totalVendors.toLocaleString()}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Total Orders
              </div>
              <div className="text-3xl font-black text-white">{totalOrders.toLocaleString()}</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" /> Total Revenue
              </div>
              <div className="text-3xl font-black text-white">₹{totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" /> Institution Status Breakdown
            </h3>
            <div className="space-y-3">
              {(['approved', 'pending', 'rejected', 'suspended', 'changes_requested'] as const).map((status) => {
                const count = institutionRequests.filter((r) => r.status === status).length;
                const pct = institutionRequests.length > 0 ? (count / institutionRequests.length) * 100 : 0;
                const colors: Record<string, string> = {
                  approved: 'bg-emerald-500', pending: 'bg-amber-500', rejected: 'bg-red-500',
                  suspended: 'bg-slate-500', changes_requested: 'bg-blue-500',
                };
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 capitalize font-semibold">{status.replace('_', ' ')}</span>
                      <span className="text-slate-500 font-mono">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${colors[status]} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-amber-400" /> Platform Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
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
              All data sourced live from Supabase
            </p>
          </div>
        </div>
      )}

      {/* ==================== TAB: SUBSCRIPTIONS ==================== */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {['Basic', 'Pro', 'Enterprise'].map((plan) => {
            const count = approvedInstitutions.filter((i) => i.plan === plan).length;
            const revenue = approvedInstitutions.filter((i) => i.plan === plan).reduce((s, i) => s + (i.monthly_revenue || 0), 0);
            const colors: Record<string, { border: string; bg: string; text: string }> = {
              Basic: { border: 'border-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-400' },
              Pro: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
              Enterprise: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
            };
            const c = colors[plan] || colors.Basic;
            return (
              <div key={plan} className={`p-5 rounded-2xl bg-[#0C0C0E] border ${c.border} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                      <CreditCard className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{plan} Plan</h3>
                      <p className="text-[11px] text-slate-500">{count} institution{count !== 1 ? 's' : ''} subscribed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">₹{revenue.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">Monthly Revenue</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-[10px] text-slate-500">Active</p>
                    <p className="text-xs font-bold text-emerald-400">{approvedInstitutions.filter((i) => i.plan === plan && i.status === 'active').length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-[10px] text-slate-500">Suspended</p>
                    <p className="text-xs font-bold text-red-400">{approvedInstitutions.filter((i) => i.plan === plan && i.status === 'suspended').length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/50">
                    <p className="text-[10px] text-slate-500">Avg Revenue</p>
                    <p className="text-xs font-bold text-amber-400">₹{count > 0 ? Math.round(revenue / count).toLocaleString() : 0}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== TAB: NOTIFICATIONS ==================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">{notifications.length} notification{notifications.length !== 1 ? 's' : ''} &bull; {unreadCount} unread</p>
            {unreadCount > 0 && (
              <button onClick={markAllNotificationsRead} className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-amber-400 font-semibold">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Bell className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} onClick={() => markNotificationRead(n.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    n.read ? 'bg-[#0C0C0E] border-slate-800' : 'bg-[#0C0C0E] border-amber-500/30 shadow-lg'
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      n.type === 'success' ? 'bg-emerald-500/10' : n.type === 'error' ? 'bg-red-500/10' :
                      n.type === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                    }`}>
                      {n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                       n.type === 'error' ? <XCircle className="w-4 h-4 text-red-400" /> :
                       n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                       <Info className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white">{n.title}</p>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB: AUDIT LOGS ==================== */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">{auditLogs.length} log entry{auditLogs.length !== 1 ? 's' : ''}</span>
          </div>
          {auditLogs.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">No audit logs yet.</p>
              <p className="text-slate-600 text-xs">Actions like approve, reject, and delete will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-500 font-bold">User</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-bold">Action</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-bold">Target</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-bold">Details</th>
                    <th className="text-left py-3 px-4 text-slate-500 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                      <td className="py-3 px-4 text-white font-semibold max-w-[150px] truncate">{log.user_name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action.includes('Approved') || log.action.includes('Reactived') || log.action.includes('Onboarded') ? 'bg-emerald-500/10 text-emerald-400' :
                          log.action.includes('Rejected') || log.action.includes('Deleted') ? 'bg-red-500/10 text-red-400' :
                          log.action.includes('Suspended') ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>{log.action}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">{log.target}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{log.details || '—'}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
      <Modal open={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Request Details" wide>
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <InstitutionLogo name={selectedRequest.institution_name} className="w-12 h-12 rounded-xl" />
              <div>
                <p className="font-bold text-white">{selectedRequest.institution_name}</p>
                <StatusBadge status={selectedRequest.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div><span className="text-slate-500 block">Institution Name</span>{selectedRequest.institution_name}</div>
              <div><span className="text-slate-500 block">Campus</span>{selectedRequest.campus || '—'}</div>
              <div><span className="text-slate-500 block">City</span>{selectedRequest.city || '—'}</div>
              <div><span className="text-slate-500 block">State</span>{selectedRequest.state || '—'}</div>
              <div><span className="text-slate-500 block">Country</span>{selectedRequest.country || '—'}</div>
              <div><span className="text-slate-500 block">Institution Email</span>{selectedRequest.institution_email}</div>
              <div><span className="text-slate-500 block">Contact Person</span>{selectedRequest.contact_person}</div>
              <div><span className="text-slate-500 block">Role</span>{selectedRequest.role || '—'}</div>
              <div><span className="text-slate-500 block">Phone Number</span>{selectedRequest.phone_number || '—'}</div>
              <div><span className="text-slate-500 block">Institution Website</span>
                {selectedRequest.institution_website
                  ? <a href={selectedRequest.institution_website} target="_blank" rel="noreferrer" className="text-indigo-400 underline">{selectedRequest.institution_website}</a>
                  : '—'}
              </div>
              <div><span className="text-slate-500 block">Student Population</span>{selectedRequest.student_population || '—'}</div>
              <div><span className="text-slate-500 block">Food Courts</span>{selectedRequest.food_courts_count || '—'}</div>
              <div><span className="text-slate-500 block">Vendors</span>{selectedRequest.vendors_count || '—'}</div>
              <div><span className="text-slate-500 block">Message</span>{selectedRequest.message || '—'}</div>
              <div><span className="text-slate-500 block">Status</span><StatusBadge status={selectedRequest.status} /></div>
              {selectedRequest.institution_code && <div><span className="text-slate-500 block">Institution Code</span><span className="text-amber-400 font-mono">{selectedRequest.institution_code}</span></div>}
              {selectedRequest.generated_email && <div><span className="text-slate-500 block">Generated Email</span><span className="text-indigo-400 font-mono">{selectedRequest.generated_email}</span></div>}
              {selectedRequest.generated_password && <div><span className="text-slate-500 block">Generated Password</span><span className="text-indigo-400 font-mono">{selectedRequest.generated_password}</span></div>}
              {selectedRequest.approved_by && <div><span className="text-slate-500 block">Approved By</span>{selectedRequest.approved_by}</div>}
              {selectedRequest.approved_at && <div><span className="text-slate-500 block">Approved At</span>{new Date(selectedRequest.approved_at).toLocaleString()}</div>}
              <div><span className="text-slate-500 block">Created At</span>{new Date(selectedRequest.created_at).toLocaleString()}</div>
              {selectedRequest.updated_at && <div><span className="text-slate-500 block">Updated At</span>{new Date(selectedRequest.updated_at).toLocaleString()}</div>}
            </div>
            {selectedRequest.rejection_reason && (
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-400">
                <strong>Rejection Reason:</strong> {selectedRequest.rejection_reason}
              </div>
            )}
            {selectedRequest.admin_notes && (
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-400">
                <strong>Admin Notes:</strong> {selectedRequest.admin_notes}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              {selectedRequest.status === 'pending' && (
                <>
                  <button onClick={async () => { await handleApprove(selectedRequest.id, selectedRequest.institution_name); setSelectedRequest(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(selectedRequest); setSelectedRequest(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              )}
              <button onClick={() => downloadRequestPDF(selectedRequest)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center gap-2">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== REJECT MODAL ==================== */}
      <Modal open={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject Institution Request">
        {rejectModal && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Provide a reason for rejecting <strong className="text-white">{rejectModal.institution_name}</strong>:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 resize-none"
            />
            <button onClick={handleReject}
              className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center gap-2">
              <XCircle className="w-4 h-4" /> Reject Request
            </button>
          </div>
        )}
      </Modal>

      {/* ==================== REQUEST CHANGES MODAL ==================== */}
      <Modal open={!!changesModal} onClose={() => { setChangesModal(null); setChangesNotes(''); }} title="Request Changes">
        {changesModal && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Request changes for <strong className="text-white">{changesModal.institution_name}</strong>:</p>
            <textarea
              value={changesNotes}
              onChange={(e) => setChangesNotes(e.target.value)}
              placeholder="Describe what changes are needed..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
            />
            <button onClick={handleRequestChanges} disabled={!changesNotes}
              className="w-full py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50">
              <Send className="w-4 h-4" /> Send Request
            </button>
          </div>
        )}
      </Modal>

      {/* ==================== EDIT INSTITUTION MODAL ==================== */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Institution">
        {editModal && (
          <div className="space-y-3">
            <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" />
            <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" />
            <input type="text" value={editForm.contact_person || ''} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" />
            <input type="tel" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" />

            <select value={editForm.plan || 'Basic'} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as 'Basic' | 'Pro' | 'Enterprise' })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
              <option value="Basic">Basic</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
            <button onClick={handleEdit}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        )}
      </Modal>

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Institution">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete <strong className="text-white">{deleteConfirm.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-bold flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== MANUAL ONBOARD MODAL ==================== */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Manually Onboard Institution">
        <form onSubmit={handleManualOnboard} className="space-y-3">
          <input required type="text" placeholder="Institution Name *" value={addName} onChange={(e) => setAddName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
          <input required type="email" placeholder="Email *" value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
          <input type="text" placeholder="Contact Person" value={addContact} onChange={(e) => setAddContact(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none" />
          <input type="tel" placeholder="Phone Number" value={addPhone} onChange={(e) => setAddPhone(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none" />
          <input type="text" placeholder="City" value={addCity} onChange={(e) => setAddCity(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none" />
          <select value={addPlan} onChange={(e) => setAddPlan(e.target.value as 'Basic' | 'Pro' | 'Enterprise')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
            <option value="Basic">Basic</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <button type="submit" disabled={addLoading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-60">
            {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {addLoading ? 'Saving...' : 'Onboard to Supabase'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
