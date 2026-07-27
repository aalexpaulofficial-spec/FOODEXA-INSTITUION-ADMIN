import React, { useState } from 'react';
import {
  Search, Building2, Building, Users, Phone, Globe, Layers, Tag, CheckCircle2, XCircle, MessageSquare,
  Eye, Download, Loader2, Clock, MapPin, Calendar, CreditCard, Edit3, Trash2, Store, TrendingUp,
  DollarSign, Activity, BarChart2, Globe2, CheckCircle, X, Send, Copy, FileText, History,
  Check, AlarmClock, RefreshCw, Plus, Sparkles, Ban
} from 'lucide-react';
import { useSuperAdminData } from './components/SuperAdminDataProvider';
import { InstitutionLogo, StatusBadge, SkeletonCard, Modal, downloadRequestPDF } from './components/SuperAdminShared';
import { ApprovalDraft, ApprovalResult } from '../../../../hooks/useSupabaseData';

export const InstitutionRequestsPage: React.FC = () => {
  const {
    institutionRequests, approvedInstitutions, loading, totalStudents, totalOrders, totalVendors,
    totalRevenue, unreadCount, auditLogs, notifications, isRealtime,
    prepareApproval, approveRequest, rejectRequest, requestChanges, disableInstitution, suspendInstitution, activateInstitution,
    deleteInstitution, updateInstitution, editRequest, createAuditLog, markNotificationRead,
    markAllNotificationsRead, globalSearch, refresh,
  } = useSuperAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'active' | 'rejected' | 'suspended' | 'changes_requested' | 'disabled'>('all');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [changesModal, setChangesModal] = useState<any>(null);
  const [changesNotes, setChangesNotes] = useState('');
  const [editModal, setEditModal] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [disableConfirm, setDisableConfirm] = useState<any>(null);
  const [approvalDraft, setApprovalDraft] = useState<ApprovalDraft | null>(null);
  const [approvalInstitutionCode, setApprovalInstitutionCode] = useState('');
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<{ id: string; msg: string; type?: 'success' | 'info' | 'error' }[]>([]);
  const addToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

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

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const draft = await prepareApproval(id);
      setApprovalDraft(draft);
      setApprovalInstitutionCode(draft.institution_code);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Approval failed.', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmApproval = async () => {
    if (!approvalDraft) return;
    setApprovingId(approvalDraft.request.id);
    try {
      const result = await approveRequest(approvalDraft.request.id, {
        institution_code: approvalInstitutionCode,
        generated_email: approvalDraft.generated_email,
        generated_password: approvalDraft.generated_password,
      });
      setApprovalResult(result);
      setApprovalDraft(null);
      setApprovalInstitutionCode('');
      addToast(`Approved: ${result.institution_name}`);
    } catch (err: any) {
      console.error(err);
      addToast(err.message || 'Approval failed.', 'error');
    } finally {
      setApprovingId(null);
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

  const handleEdit = async () => {
    if (!editModal) return;
    await editRequest(editModal.id, editForm);
    addToast(`Updated: ${editModal.institution_name}`);
    setEditModal(null);
  };

  const handleDisable = async () => {
    if (!disableConfirm) return;
    const req = disableConfirm;
    const inst = approvedInstitutions.find((i) => i.institution_code === req.institution_code);
    if (inst) {
      await disableInstitution(inst.id);
    }
    addToast(`Disabled: ${req.institution_name}`, 'info');
    setDisableConfirm(null);
  };

  const handleCopyCredentials = () => {
    if (!approvalResult) return;
    const text = `Institution: ${approvalResult.institution_name}\nCode: ${approvalResult.institution_code}\nEmail: ${approvalResult.generated_email}\nPassword: ${approvalResult.generated_password}`;
    navigator.clipboard.writeText(text);
    addToast('Credentials copied to clipboard');
  };

  const handleSendEmailAgain = async () => {
    if (!approvalResult) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/approve-institution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          institution_name: approvalResult.institution_name,
          institution_email: approvalResult.generated_email,
          institution_code: approvalResult.institution_code,
          login_email: approvalResult.generated_email,
          temp_password: approvalResult.generated_password,
          portal_url: 'https://foodexa-institution-platform.vercel.app',
          contact_person: '',
          first_login_instructions: 'Please log in using the credentials above. You will be prompted to change your password on first login.',
          password_change_reminder: 'For security, please change your temporary password after your first login.',
        }),
      });
      if (response.ok) {
        addToast('Email sent successfully');
      } else if (response.status === 404) {
        console.warn('[Email] approve-institution Edge Function is not deployed. Deploy it via `supabase functions deploy approve-institution`.');
        addToast('Email function not deployed. Deploy approve-institution Edge Function first.', 'error');
      } else {
        const body = await response.text();
        console.error('[Email] Resend failed:', response.status, body);
        addToast(`Failed to send email (HTTP ${response.status}). Check console for details.`, 'error');
      }
    } catch (err: any) {
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        console.warn('[Email] approve-institution Edge Function is not available. Deploy it via `supabase functions deploy approve-institution`.');
        addToast('Email function not available. Deploy approve-institution Edge Function first.', 'error');
      } else {
        console.error('[Email] Resend error:', err);
        addToast('Failed to send email. Check console for details.', 'error');
      }
    }
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
            <span>Institution Requests &bull; FOODEXA Enterprise</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live</span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Connecting&hellip;</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Institution Requests</h1>
          <p className="text-xs text-slate-400 mt-1">Manage institution registrations, approvals, and onboarding.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Requests</span>
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
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{institutionRequests.filter((r) => r.status === 'approved').length}</div>
          <div className="text-[11px] text-emerald-400 font-medium">Active on platform</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Rejected</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">{institutionRequests.filter((r) => r.status === 'rejected').length}</div>
          <div className="text-[11px] text-red-400 font-medium">Declined</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Disabled</span>
            <Ban className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400 font-mono">{institutionRequests.filter((r) => r.status === 'disabled').length}</div>
          <div className="text-[11px] text-orange-400 font-medium">Blocked accounts</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 shadow-xl space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Changes Requested</span>
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">{institutionRequests.filter((r) => r.status === 'changes_requested').length}</div>
          <div className="text-[11px] text-blue-400 font-medium">Awaiting resubmission</div>
        </div>
      </div>

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
            <option value="disabled">Disabled</option>
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

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {req.contact_person}</span>
                  {req.role && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {req.role}</span>}
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {req.phone_number || '—'}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {req.campus || '—'}</span>
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {req.student_population || '—'} students</span>
                  <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {req.food_courts_count || '—'} courts</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {req.vendors_count || '—'} vendors</span>
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {req.city || '—'}{req.state ? `, ${req.state}` : ''}</span>
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
                    <button onClick={() => handleApprove(req.id)} disabled={approvingId === req.id}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {approvingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {approvingId === req.id ? 'Approving...' : 'Approve'}
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
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button onClick={() => setSelectedRequest(req)}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    <button onClick={() => { setEditModal(req); setEditForm(req); }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    {(req.status === 'active' || req.status === 'approved') && (
                      <button onClick={() => setDisableConfirm(req)}
                        className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5" /> Disable
                      </button>
                    )}
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
                  <button onClick={async () => { await handleApprove(selectedRequest.id); setSelectedRequest(null); }}
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

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Institution Request">
        {editModal && (
          <div className="space-y-3">
            <input type="text" value={editForm.institution_name || ''} onChange={(e) => setEditForm({ ...editForm, institution_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Institution Name" />
            <input type="text" value={editForm.campus || ''} onChange={(e) => setEditForm({ ...editForm, campus: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Campus" />
            <input type="text" value={editForm.city || ''} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="City" />
            <input type="text" value={editForm.state || ''} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="State" />
            <input type="text" value={editForm.country || ''} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Country" />
            <input type="email" value={editForm.institution_email || ''} onChange={(e) => setEditForm({ ...editForm, institution_email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Institution Email" />
            <input type="text" value={editForm.contact_person || ''} onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Contact Person" />
            <input type="text" value={editForm.role || ''} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Role" />
            <input type="tel" value={editForm.phone_number || ''} onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Phone Number" />
            <input type="url" value={editForm.institution_website || ''} onChange={(e) => setEditForm({ ...editForm, institution_website: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Institution Website" />
            <input type="number" value={editForm.student_population || ''} onChange={(e) => setEditForm({ ...editForm, student_population: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Student Population" />
            <input type="number" value={editForm.food_courts_count || ''} onChange={(e) => setEditForm({ ...editForm, food_courts_count: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Food Courts" />
            <input type="number" value={editForm.vendors_count || ''} onChange={(e) => setEditForm({ ...editForm, vendors_count: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50" placeholder="Vendors" />
            <textarea value={editForm.message || ''} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 resize-none" placeholder="Message" rows={3} />
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

      <Modal
        open={!!approvalDraft}
        onClose={() => {
          if (approvingId) return;
          setApprovalDraft(null);
          setApprovalInstitutionCode('');
        }}
        title="Approval Confirmation"
        wide
      >
        {approvalDraft && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-white">Review before creating the institution</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Nothing is saved until you click Approve & Create Institution.
                  </p>
                </div>
              </div>
            </div>

            {approvalDraft.email_already_exists && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <AlarmClock className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-black text-amber-400">Email Already Exists</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      The Institution Admin email <strong className="text-white">{approvalDraft.generated_email}</strong> already has an existing auth account (ID: {approvalDraft.existing_user_id}).
                      No new auth user will be created. The existing account will be assigned to this institution.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Institution Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div><span className="text-slate-500 block">Institution Name</span>{approvalDraft.request.institution_name}</div>
                  <div><span className="text-slate-500 block">Campus</span>{approvalDraft.request.campus || 'N/A'}</div>
                  <div><span className="text-slate-500 block">City</span>{approvalDraft.request.city || 'N/A'}</div>
                  <div><span className="text-slate-500 block">State</span>{approvalDraft.request.state || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Country</span>{approvalDraft.request.country || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Contact Person</span>{approvalDraft.request.contact_person}</div>
                  <div><span className="text-slate-500 block">Institution Email</span>{approvalDraft.request.institution_email}</div>
                  <div><span className="text-slate-500 block">Role</span>{approvalDraft.request.role || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Phone Number</span>{approvalDraft.request.phone_number || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Website</span>{approvalDraft.request.institution_website || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Student Population</span>{approvalDraft.request.student_population || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Food Courts</span>{approvalDraft.request.food_courts_count || 'N/A'}</div>
                  <div><span className="text-slate-500 block">Vendors</span>{approvalDraft.request.vendors_count || 'N/A'}</div>
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-500 block">Message</span>
                  <p className="mt-1 rounded-xl bg-slate-950 border border-slate-800 p-3 leading-relaxed">
                    {approvalDraft.request.message || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Generated Credentials</h4>
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-4">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Institution Code</span>
                    <input
                      type="text"
                      value={approvalInstitutionCode}
                      onChange={(e) => setApprovalInstitutionCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500/60"
                    />
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Institution Login Email</span>
                    <span className="text-sm text-white font-mono break-all">{approvalDraft.generated_email}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Temporary Password</span>
                    <span className="text-sm text-indigo-400 font-mono font-bold break-all">{approvalDraft.generated_password}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setApprovalDraft(null);
                  setApprovalInstitutionCode('');
                }}
                disabled={!!approvingId}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={!!approvingId || !approvalInstitutionCode.trim()}
                className="flex-1 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {approvingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve & Create Institution
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!approvalResult} onClose={() => setApprovalResult(null)} title="" wide>
        {approvalResult && (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Institution Approved</h2>
              <p className="text-xs text-slate-400 mt-1">The institution has been successfully onboarded.</p>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Institution Name</span>
                <span className="text-xs text-white font-bold">{approvalResult.institution_name}</span>
              </div>
              <div className="h-px bg-slate-800/60" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Institution Code</span>
                <span className="text-xs text-amber-400 font-mono font-bold">{approvalResult.institution_code}</span>
              </div>
              <div className="h-px bg-slate-800/60" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Login Email</span>
                <span className="text-xs text-white font-mono">{approvalResult.generated_email}</span>
              </div>
              <div className="h-px bg-slate-800/60" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Temporary Password</span>
                <span className="text-xs text-indigo-400 font-mono font-bold">{approvalResult.generated_password}</span>
              </div>
              <div className="h-px bg-slate-800/60" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Institution Portal URL</span>
                <span className="text-xs text-indigo-400 font-mono">https://foodexa-institution-platform.vercel.app</span>
              </div>
              <div className="h-px bg-slate-800/60" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Approved At</span>
                <span className="text-xs text-slate-300">{new Date(approvalResult.approved_at).toLocaleString()}</span>
              </div>
              <div className="h-px bg-slate-800/60" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Email Status</span>
                {approvalResult.email_already_existed ? (
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1"><AlarmClock className="w-3 h-3" /> Existing Account Used</span>
                ) : approvalResult.email_sent ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Sent Successfully</span>
                ) : (
                  <span className="text-xs text-orange-400 font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Not Sent (Function not deployed)</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCopyCredentials}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all">
                <Copy className="w-4 h-4" /> Copy Credentials
              </button>
              <button onClick={handleSendEmailAgain}
                className="flex-1 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center justify-center gap-2 transition-all">
                <Send className="w-4 h-4" /> Send Email Again
              </button>
              <button onClick={() => setApprovalResult(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!disableConfirm} onClose={() => setDisableConfirm(null)} title="Disable Institution">
        {disableConfirm && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Are you sure you want to disable <strong className="text-white">{disableConfirm.institution_name}</strong>?
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

export default InstitutionRequestsPage;
