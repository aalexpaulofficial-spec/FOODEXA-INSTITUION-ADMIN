import React, { useState } from 'react';
import {
  Search, Building2, Building, Users, Store, TrendingUp, DollarSign, Clock, CheckCircle2, XCircle,
  Loader2, MapPin, Calendar, CreditCard, Edit3, Trash2, Eye, ExternalLink, Phone, Globe, Layers, Tag,
  Sparkles, RefreshCw, Check, Plus, Mail, UserCheck, Ban, Activity, ChevronRight
} from 'lucide-react';
import { useSuperAdminData } from './components/SuperAdminDataProvider';
import { InstitutionLogo, StatusBadge, SkeletonCard, Modal } from './components/SuperAdminShared';
import { supabase } from '../../../../lib/supabaseClient';

export const InstitutionDirectoryPage: React.FC = () => {
  const {
    approvedInstitutions, loading, isRealtime,
    suspendInstitution, activateInstitution, disableInstitution, deleteInstitution, updateInstitution, createAuditLog,
    refresh,
  } = useSuperAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [disableConfirm, setDisableConfirm] = useState<any>(null);

  const [toasts, setToasts] = useState<{ id: string; msg: string; type?: string }[]>([]);
  const addToast = (msg: string, type: string = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const filteredInstitutions = approvedInstitutions.filter((i) => {
    const matchesSearch =
      i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = async () => {
    if (!editModal) return;
    await updateInstitution(editModal.id, editForm);
    addToast(`Updated: ${editModal.name}`);
    setEditModal(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteInstitution(deleteConfirm.id);
    addToast(`Deleted: ${deleteConfirm.name}`, 'error');
    setDeleteConfirm(null);
  };

  const handleSuspend = async (id: string, name: string) => {
    await suspendInstitution(id);
    addToast(`Suspended: ${name}`, 'info');
  };

  const handleDisable = async () => {
    if (!disableConfirm) return;
    await disableInstitution(disableConfirm.id);
    addToast(`Disabled: ${disableConfirm.name}`, 'info');
    setDisableConfirm(null);
  };

  const handleActivate = async (id: string, name: string) => {
    await activateInstitution(id);
    addToast(`Activated: ${name}`);
  };

  const openDashboard = (inst: any) => {
    window.open(`https://foodexa-institution-platform.vercel.app/?institution=${inst.id}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Institution Directory &bull; FOODEXA Enterprise</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live</span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Connecting&hellip;</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Institution Directory</h1>
          <p className="text-xs text-slate-400 mt-1">{approvedInstitutions.length} institutions on the platform.</p>
        </div>
        <button onClick={refresh} className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Active</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{approvedInstitutions.filter((i) => i.status === 'active').length}</div>
          <div className="text-[11px] text-emerald-400 font-medium">Live on platform</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Suspended / Disabled</span>
            <Ban className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">{approvedInstitutions.filter((i) => i.status === 'suspended' || i.status === 'disabled').length}</div>
          <div className="text-[11px] text-red-400 font-medium">Blocked accounts</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Students</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{approvedInstitutions.reduce((s, i) => s + (i.students_count || 0), 0).toLocaleString()}</div>
          <div className="text-[11px] text-indigo-400 font-medium">Across all institutions</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">₹{approvedInstitutions.reduce((s, i) => s + (i.monthly_revenue || 0), 0).toLocaleString()}</div>
          <div className="text-[11px] text-amber-400 font-medium">Monthly recurring</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" placeholder="Search institutions by name, email, code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
      ) : filteredInstitutions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-semibold">No institutions found.</p>
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
                <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {inst.contact_person || '—'}</span>
                <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {inst.plan || 'Basic'} Plan</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {inst.joined_date || inst.created_at ? new Date(inst.joined_date || inst.created_at).toLocaleDateString() : '—'}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {inst.students_count || 0} students</span>
                <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {inst.vendors_count || 0} vendors</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ₹{(inst.monthly_revenue || 0).toLocaleString()}</span>
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Last: {inst.last_login ? new Date(inst.last_login).toLocaleDateString() : '—'}</span>
              </div>

              <div className="flex gap-2 flex-wrap pt-1">
                <button onClick={() => { setSelectedInstitution(inst); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 text-[11px] font-semibold transition-all flex items-center gap-1">
                  <Eye className="w-3 h-3" /> View
                </button>
                <button onClick={() => { setEditModal(inst); setEditForm(inst); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 text-[11px] font-semibold transition-all flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
                {inst.status === 'active' ? (
                  <>
                    <button onClick={() => handleSuspend(inst.id, inst.name)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 text-[11px] font-semibold transition-all">
                      Suspend
                    </button>
                    <button onClick={() => setDisableConfirm(inst)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-[11px] font-semibold transition-all flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Disable
                    </button>
                  </>
                ) : inst.status === 'suspended' || inst.status === 'disabled' ? (
                  <button onClick={() => handleActivate(inst.id, inst.name)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold transition-all">
                    Reactivate
                  </button>
                ) : null}
                <button onClick={() => setDeleteConfirm(inst)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[11px] font-semibold transition-all flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
                <button onClick={() => openDashboard(inst)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-semibold transition-all flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Open Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selectedInstitution} onClose={() => setSelectedInstitution(null)} title="Institution Details" wide>
        {selectedInstitution && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <InstitutionLogo name={selectedInstitution.name} className="w-12 h-12 rounded-xl" />
              <div>
                <p className="font-bold text-white">{selectedInstitution.name}</p>
                <StatusBadge status={selectedInstitution.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div><span className="text-slate-500 block">Email</span>{selectedInstitution.email || '—'}</div>
              <div><span className="text-slate-500 block">Code</span><span className="text-amber-400 font-mono">{selectedInstitution.code || '—'}</span></div>
              <div><span className="text-slate-500 block">Contact</span>{selectedInstitution.contact_person || '—'}</div>
              <div><span className="text-slate-500 block">Phone</span>{selectedInstitution.phone || '—'}</div>
              <div><span className="text-slate-500 block">Plan</span>{selectedInstitution.plan || 'Basic'}</div>
              <div><span className="text-slate-500 block">Students</span>{selectedInstitution.students_count || 0}</div>
              <div><span className="text-slate-500 block">Vendors</span>{selectedInstitution.vendors_count || 0}</div>
              <div><span className="text-slate-500 block">Monthly Revenue</span>₹{(selectedInstitution.monthly_revenue || 0).toLocaleString()}</div>
              <div><span className="text-slate-500 block">Joined Date</span>{selectedInstitution.joined_date ? new Date(selectedInstitution.joined_date).toLocaleDateString() : '—'}</div>
              <div><span className="text-slate-500 block">Last Login</span>{selectedInstitution.last_login ? new Date(selectedInstitution.last_login).toLocaleString() : '—'}</div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Institution">
        {editModal && (
          <div className="space-y-3">
            <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Institution Name" />
            <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Email" />
            <input type="text" value={editForm.contact_person || ''} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Contact Person" />
            <input type="tel" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Phone" />

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

      <Modal open={!!disableConfirm} onClose={() => setDisableConfirm(null)} title="Disable Institution">
        {disableConfirm && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Are you sure you want to disable <strong className="text-white">{disableConfirm.name}</strong>?
              The institution admin will no longer be able to log in until re-enabled.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDisableConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
                Cancel
              </button>
              <button onClick={handleDisable}
                className="flex-1 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
                <Ban className="w-4 h-4" /> Disable
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InstitutionDirectoryPage;
