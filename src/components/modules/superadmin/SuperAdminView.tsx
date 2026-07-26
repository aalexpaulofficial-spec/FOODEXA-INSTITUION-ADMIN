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
  FileSpreadsheet,
  Building2,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { Institution, Vendor, AuditLog } from '../../../types';

interface SuperAdminViewProps {
  institutions: Institution[];
  onSelectInstitution: (inst: Institution) => void;
  onAddInstitution: (inst: Institution) => void;
}

// Fallback Logo Component to guarantee no broken images
const InstitutionLogo: React.FC<{ src?: string; name: string; className?: string }> = ({
  src,
  name,
  className = 'w-10 h-10 rounded-xl'
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (!src || imgError) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-xs shadow-inner shrink-0`}
      >
        {initials || 'IN'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`${className} object-cover border border-slate-800 shrink-0`}
    />
  );
};

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  institutions: initialInstitutions,
  onSelectInstitution,
  onAddInstitution
}) => {
  const [institutionsList, setInstitutionsList] = useState<Institution[]>(initialInstitutions);
  const [activeTab, setActiveTab] = useState<
    'directory' | 'analytics' | 'subscriptions' | 'governance' | 'approvals' | 'audit_logs' | 'ai_insights'
  >('directory');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_approval' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'Basic' | 'Pro' | 'Enterprise'>('all');

  // Toast System
  const [toasts, setToasts] = useState<{ id: string; msg: string; type?: 'success' | 'info' }[]>([]);

  // Onboarding Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'University' | 'College' | 'Institute' | 'Healthcare'>('University');
  const [studentsCount, setStudentsCount] = useState('15000');
  const [vendorsCount, setVendorsCount] = useState('10');
  const [location, setLocation] = useState('Boston, MA');
  const [contactPerson, setContactPerson] = useState('Dr. Sarah Jenkins');
  const [email, setEmail] = useState('admin@university.edu');
  const [phone, setPhone] = useState('+1 (555) 800-2020');
  const [plan, setPlan] = useState<'Enterprise' | 'Pro' | 'Basic'>('Enterprise');
  const [autoProvisionKDS, setAutoProvisionKDS] = useState(true);

  // Selected Detail Modal
  const [selectedInstForDetails, setSelectedInstForDetails] = useState<Institution | null>(null);

  const addToast = (msg: string, type: 'success' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Sync state if props change
  React.useEffect(() => {
    setInstitutionsList(initialInstitutions);
  }, [initialInstitutions]);

  // Handle Approve / Suspend / Activate Institution
  const handleUpdateStatus = (instId: string, newStatus: 'active' | 'pending_approval' | 'suspended') => {
    setInstitutionsList((prev) =>
      prev.map((inst) => (inst.id === instId ? { ...inst, status: newStatus } : inst))
    );
    addToast(`✔ Updated status of institution to ${newStatus.toUpperCase()}`);
  };

  // Handle Plan Upgrade
  const handleUpdatePlan = (instId: string, newPlan: 'Basic' | 'Pro' | 'Enterprise') => {
    setInstitutionsList((prev) =>
      prev.map((inst) => (inst.id === instId ? { ...inst, plan: newPlan } : inst))
    );
    addToast(`✔ Upgraded license tier to ${newPlan}`);
  };

  // Handle Onboard Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInst: Institution = {
      id: `inst-${Date.now()}`,
      name: name || 'Stanford Campus Center',
      code: code || `INST-${Math.floor(1000 + Math.random() * 9000)}`,
      location: location || 'Palo Alto, CA',
      studentsCount: parseInt(studentsCount) || 12000,
      vendorsCount: parseInt(vendorsCount) || 8,
      dailyOrdersCount: Math.round((parseInt(studentsCount) || 12000) * 0.25),
      monthlyRevenue: plan === 'Enterprise' ? 185000 : plan === 'Pro' ? 95000 : 45000,
      status: 'active',
      contactPerson: contactPerson || 'Dean Alex Morgan',
      email: email || 'contact@stanford.edu',
      phone: phone || '+1 (555) 900-1122',
      joinedDate: new Date().toISOString().split('T')[0],
      plan: plan,
      type: type,
      lastActivity: 'Just onboarded',
      renewalDate: '2027-07-26',
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=200'
    };

    setInstitutionsList((prev) => [newInst, ...prev]);
    onAddInstitution(newInst);
    setShowAddModal(false);
    addToast(`✔ Successfully onboarded ${newInst.name}!`);

    // Reset Form
    setName('');
    setCode('');
  };

  // Filtered List for Directory & Approvals
  const filteredInstitutions = institutionsList.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
    const matchesPlan = planFilter === 'all' || inst.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate Aggregated Telemetry
  const totalStudents = institutionsList.reduce((acc, curr) => acc + curr.studentsCount, 0);
  const totalCanteens = institutionsList.reduce((acc, curr) => acc + curr.vendorsCount, 0);
  const totalDailyOrders = institutionsList.reduce((acc, curr) => acc + curr.dailyOrdersCount, 0);
  const totalMonthlyRevenue = institutionsList.reduce((acc, curr) => acc + curr.monthlyRevenue, 0);
  const pendingApprovalsCount = institutionsList.filter((i) => i.status === 'pending_approval').length;

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      {/* Floating Toast Notification */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto px-4 py-3 rounded-2xl bg-[#0C0C0E] border border-amber-500/40 text-white text-xs font-bold shadow-2xl flex items-center space-x-2 animate-bounce-short"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toast.msg}</span>
          </div>
        ))}
      </div>

      {/* Top Console Master Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span>superadmin.foodexa.com • Enterprise Portal</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Master Governance Console</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-amber-500/30">
              SaaS v4.8
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global orchestration of multi-institution campus canteens, licensing, SLA compliance, and cross-campus telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => addToast('✔ Synchronized real-time telemetry across all 5 campuses', 'info')}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Sync Telemetry</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Institution</span>
          </button>
        </div>
      </div>

      {/* Global SaaS Platform Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Onboarded Campuses</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{institutionsList.length}</div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{institutionsList.filter((i) => i.status === 'active').length} Active SLA</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Global Student Base</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalStudents.toLocaleString()}</div>
          <div className="text-[11px] text-indigo-400 font-medium">Across all universities</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Food Court Outlets</span>
            <Store className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalCanteens} Outlets</div>
          <div className="text-[11px] text-amber-400 font-medium">100% KDS Integrated</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Daily Order Volume</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalDailyOrders.toLocaleString()}</div>
          <div className="text-[11px] text-cyan-400 font-medium">+14.2% peak surge</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Monthly Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${totalMonthlyRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-300 font-medium">Platform ARR: $5.7M</div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'directory'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Institutions Directory ({institutionsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'approvals'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>System Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'subscriptions'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscriptions & Licensing</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Global Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'governance'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Vendor Governance</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'audit_logs'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Global Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_insights')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'ai_insights'
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Platform AI Insights</span>
        </button>
      </div>

      {/* TAB 1: INSTITUTIONS DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search institution name, code, contact admin, or campus..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="all">All SLA Statuses</option>
                <option value="active">Active SLA</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={planFilter}
                onChange={(e: any) => setPlanFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Plans</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Pro">Pro Tier</option>
                <option value="Basic">Basic Tier</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInstitutions.map((inst) => (
              <div
                key={inst.id}
                className="p-5 rounded-3xl bg-[#0C0C0E] border border-slate-800/90 hover:border-slate-700 transition-all shadow-xl space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <InstitutionLogo name={inst.name} src={inst.logoUrl} />
                      <div>
                        <h3 className="font-bold text-white text-sm tracking-tight group-hover:text-amber-300 transition-colors">
                          {inst.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">{inst.code} • {inst.location}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                        inst.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : inst.status === 'pending_approval'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {inst.status === 'pending_approval' ? 'PENDING' : inst.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Plan & Contact Row */}
                  <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Plan:</span>
                      <span className="font-bold text-amber-400 font-mono">{inst.plan} Tier</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {inst.lastActivity || 'Active recently'}
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Enrolled Students:</span>
                      <span className="font-mono text-slate-100 font-bold">
                        {inst.studentsCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Food Court Outlets:</span>
                      <span className="font-bold text-amber-400 font-mono">{inst.vendorsCount} Canteens</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Daily Orders Volume:</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {inst.dailyOrdersCount.toLocaleString()} orders/day
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Monthly Volume:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${inst.monthlyRevenue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="p-2.5 rounded-xl bg-slate-900/40 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-slate-200 font-semibold">{inst.contactPerson}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                      <span>{inst.email}</span>
                      <span>{inst.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Card Action Button */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      addToast(`✔ Switch context to ${inst.name}`);
                      onSelectInstitution(inst);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5"
                  >
                    <span>Switch to Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => setSelectedInstForDetails(inst)}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
                    >
                      View Full Details
                    </button>

                    {inst.status === 'active' ? (
                      <button
                        onClick={() => handleUpdateStatus(inst.id, 'suspended')}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        Suspend SLA
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(inst.id, 'active')}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        Activate SLA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="p-6 rounded-3xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Pending Institution & Vendor Governance Approvals</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review incoming university registration applications, SLA agreements, and canteen vendor licenses.
            </p>
          </div>

          <div className="space-y-4">
            {institutionsList.filter((i) => i.status === 'pending_approval').length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-slate-300">All Institution Applications Approved</p>
                <p className="text-[11px]">There are currently no pending SLA approvals in the queue.</p>
              </div>
            ) : (
              institutionsList
                .filter((i) => i.status === 'pending_approval')
                .map((inst) => (
                  <div
                    key={inst.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <InstitutionLogo name={inst.name} src={inst.logoUrl} className="w-12 h-12 rounded-2xl" />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-sm">{inst.name}</h3>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                            {inst.plan} Tier Request
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {inst.location} • Contact: {inst.contactPerson} ({inst.email})
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Capacity: {inst.studentsCount.toLocaleString()} Students | Expected Canteens: {inst.vendorsCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleUpdateStatus(inst.id, 'active')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Provision</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(inst.id, 'suspended')}
                        className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 font-bold text-xs"
                      >
                        Reject Application
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTIONS & LICENSING */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>SaaS Subscription Management & MRR Breakdown</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-2">
                <div className="text-indigo-400 font-bold uppercase text-[10px]">Enterprise SLA Tier</div>
                <div className="text-xl font-black text-white font-mono">$4,999 / mo per campus</div>
                <p className="text-slate-400 text-[11px]">Includes Unlimited KDS terminals, LX AI Auto-Categorization, Priority 24/7 SLA.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold uppercase text-[10px]">Pro SLA Tier</div>
                <div className="text-xl font-black text-white font-mono">$2,499 / mo per campus</div>
                <p className="text-slate-400 text-[11px]">Includes up to 10 Canteen Outlets, LX AI Assistant, Standard SLA.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Starter SLA Tier</div>
                <div className="text-xl font-black text-white font-mono">$999 / mo per campus</div>
                <p className="text-slate-400 text-[11px]">Includes up to 3 Canteen Outlets, Basic Reporting, Community Support.</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-4 overflow-x-auto">
            <h3 className="font-bold text-white text-sm">Active University Licensing Licenses</h3>

            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Institution</th>
                  <th className="p-3">License Tier</th>
                  <th className="p-3">Monthly MRR</th>
                  <th className="p-3">SLA Status</th>
                  <th className="p-3">Next Renewal Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {institutionsList.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-sans font-bold text-white flex items-center space-x-2">
                      <InstitutionLogo name={inst.name} src={inst.logoUrl} className="w-7 h-7 rounded-lg" />
                      <span>{inst.name}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[10px]">
                        {inst.plan}
                      </span>
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">
                      ${(inst.plan === 'Enterprise' ? 4999 : inst.plan === 'Pro' ? 2499 : 999).toLocaleString()} /mo
                    </td>
                    <td className="p-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        ACTIVE
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{inst.renewalDate || '2027-01-15'}</td>
                    <td className="p-3 text-right font-sans">
                      <select
                        value={inst.plan}
                        onChange={(e: any) => handleUpdatePlan(inst.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px]"
                      >
                        <option value="Enterprise">Set Enterprise</option>
                        <option value="Pro">Set Pro</option>
                        <option value="Basic">Set Basic</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-amber-400" />
              <span>Cross-Campus Daily Order & Revenue Growth</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campus Revenue Share Visualizer */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-xs text-slate-300 uppercase">Campus Revenue Contribution</h3>
                {institutionsList.map((inst) => {
                  const percentage = Math.round((inst.monthlyRevenue / totalMonthlyRevenue) * 100) || 10;
                  return (
                    <div key={inst.id} className="space-y-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-200">{inst.name}</span>
                        <span className="text-emerald-400 font-mono">${inst.monthlyRevenue.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Peak Order Hours Across All Universities */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-xs text-slate-300 uppercase">Peak Campus Order Hours</h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-sans">Breakfast Rush (08:00 - 10:00)</span>
                    <span className="text-amber-400 font-bold">1,840 Orders / Hr</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-sans">Lunch Peak (12:00 - 14:00)</span>
                    <span className="text-emerald-400 font-bold">4,920 Orders / Hr</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-sans">Evening Snack (16:00 - 18:00)</span>
                    <span className="text-cyan-400 font-bold">2,150 Orders / Hr</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-sans">Late Night Hostel (21:00 - 23:00)</span>
                    <span className="text-indigo-400 font-bold">1,210 Orders / Hr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VENDOR GOVERNANCE */}
      {activeTab === 'governance' && (
        <div className="p-6 rounded-3xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Store className="w-5 h-5 text-amber-400" />
            <span>Global Food Court Vendor Governance & Health Scores</span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitor all vendor outlets operating across registered university campuses, hygiene certifications, and order throughput.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-slate-400 text-xs font-bold">Total Active Outlets</div>
              <div className="text-2xl font-black text-white font-mono">{totalCanteens} Outlets</div>
              <p className="text-emerald-400 text-[11px]">All certified by Campus Food Authority</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-slate-400 text-xs font-bold">Average Hygiene SLA Rating</div>
              <div className="text-2xl font-black text-amber-400 font-mono">4.88 / 5.0</div>
              <p className="text-slate-400 text-[11px]">Audited daily by Student Feedback</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-slate-400 text-xs font-bold">Kitchen Hardware Terminals</div>
              <div className="text-2xl font-black text-cyan-400 font-mono">100% Online</div>
              <p className="text-cyan-400 text-[11px]">Real-time WebSocket connection active</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GLOBAL AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="p-6 rounded-3xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Real-time System Audit & Security Event Trail</span>
          </h2>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-slate-300">
              <div>
                <span className="text-amber-400 font-bold">[13:42:01 UTC]</span> Super Admin provisioned new SLA tier for Apex University
              </div>
              <span className="text-emerald-400 text-[10px]">SUCCESS (IP: 192.168.1.1)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-slate-300">
              <div>
                <span className="text-amber-400 font-bold">[11:15:30 UTC]</span> Automatic database backup completed for 5 campus environments
              </div>
              <span className="text-emerald-400 text-[10px]">SUCCESS (SYSTEM)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-slate-300">
              <div>
                <span className="text-amber-400 font-bold">[09:02:18 UTC]</span> Horizon Tech canteen vendor menu catalog synchronized with KDS
              </div>
              <span className="text-emerald-400 text-[10px]">SUCCESS (KDS)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AI INSIGHTS */}
      {activeTab === 'ai_insights' && (
        <div className="p-6 rounded-3xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>LX AI Master Engine System Telemetry & Insights</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 space-y-2">
              <h3 className="font-extrabold text-indigo-300 uppercase text-[11px]">Semester Demand Prediction</h3>
              <p className="text-slate-300 leading-relaxed">
                LX AI predicts a 28% order volume surge during upcoming Midterm Exams week across Apex University and Horizon Tech campuses.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/30 space-y-2">
              <h3 className="font-extrabold text-amber-300 uppercase text-[11px]">Kitchen Bottleneck Prevention</h3>
              <p className="text-slate-300 leading-relaxed">
                Recommends activating 2 additional express pickup kiosks at North Tech Hub between 12:30 PM - 1:15 PM.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInstForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0C0C0E] border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <InstitutionLogo name={selectedInstForDetails.name} src={selectedInstForDetails.logoUrl} className="w-10 h-10 rounded-xl" />
                <div>
                  <h3 className="font-bold text-white text-base">{selectedInstForDetails.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedInstForDetails.code}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInstForDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">LOCATION</span>
                  <span className="text-slate-100 font-bold">{selectedInstForDetails.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">ADMIN CONTACT</span>
                  <span className="text-amber-400 font-bold">{selectedInstForDetails.contactPerson}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">EMAIL</span>
                  <span className="text-slate-200">{selectedInstForDetails.email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PHONE</span>
                  <span className="text-slate-200">{selectedInstForDetails.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">STUDENTS</span>
                  <span className="text-white font-bold text-sm">{selectedInstForDetails.studentsCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CANTEENS</span>
                  <span className="text-amber-400 font-bold text-sm">{selectedInstForDetails.vendorsCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">MONTHLY REVENUE</span>
                  <span className="text-emerald-400 font-bold text-sm">${selectedInstForDetails.monthlyRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const inst = selectedInstForDetails;
                setSelectedInstForDetails(null);
                onSelectInstitution(inst);
              }}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
            >
              Switch to Campus Admin Portal
            </button>
          </div>
        </div>
      )}

      {/* Onboard New Institution Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0C0C0E] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Onboard New University Institution</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Institution Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stanford University Campus"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Campus Identifier Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. STAN-MAIN"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Institution Type</label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="University">University</option>
                    <option value="College">College</option>
                    <option value="Institute">Institute</option>
                    <option value="Healthcare">Healthcare College</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Student Capacity</label>
                  <input
                    type="number"
                    value={studentsCount}
                    onChange={(e) => setStudentsCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Canteen Outlets Count</label>
                  <input
                    type="number"
                    value={vendorsCount}
                    onChange={(e) => setVendorsCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Campus Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Palo Alto, California"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Primary Admin Contact</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Admin Official Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">SLA License Tier</label>
                <select
                  value={plan}
                  onChange={(e: any) => setPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Enterprise">Enterprise Tier ($4,999/mo - Unlimited KDS)</option>
                  <option value="Pro">Pro Tier ($2,499/mo - Up to 10 Outlets)</option>
                  <option value="Basic">Basic Tier ($999/mo - Standard)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  Provision & Deploy Institution Environment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
