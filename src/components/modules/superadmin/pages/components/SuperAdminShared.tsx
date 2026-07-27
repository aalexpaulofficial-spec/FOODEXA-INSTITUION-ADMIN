import React from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Info, Sparkles, RefreshCw, Search, Bell, Plus, Building2, Users, Store, TrendingUp, DollarSign, Clock, CheckCircle, Loader2, Trash2, Send, Download, Eye, Edit3, Check, Copy } from 'lucide-react';
import { InstitutionRequest } from '../../../../../hooks/useSupabaseData';

export const InstitutionLogo: React.FC<{ name: string; className?: string }> = ({
  name, className = 'w-10 h-10 rounded-xl',
}) => {
  const initials = name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`${className} bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-xs shadow-inner shrink-0`}>
      {initials || 'IN'}
    </div>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Pending' },
    approved: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Approved' },
    active: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Active' },
    rejected: { color: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Rejected' },
    suspended: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', label: 'Suspended' },
    disabled: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', label: 'Disabled' },
    pending_approval: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Pending' },
    changes_requested: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Changes Requested' },
  };
  const s = map[status] || { color: 'bg-slate-800 text-slate-400 border-slate-700', label: status };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>;
};

export const SkeletonCard: React.FC = () => (
  <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 animate-pulse space-y-2">
    <div className="h-3 bg-slate-800 rounded w-1/2" />
    <div className="h-6 bg-slate-800 rounded w-1/3" />
    <div className="h-3 bg-slate-800 rounded w-2/3" />
  </div>
);

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }> = ({
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

export const downloadRequestPDF = (req: InstitutionRequest) => {
  const institutionCode = req.institution_code || 'N/A';
  const now = new Date().toLocaleString();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FOODEXA - Institution Request ${institutionCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; padding: 40px; color: #1e293b; }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #6366f1; letter-spacing: 2px; }
    .header p { color: #64748b; font-size: 12px; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; color: #6366f1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { padding: 10px 14px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; }
    .field label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .field span { font-size: 13px; font-weight: 600; color: #1e293b; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-pending { background: #fef3c7; color: #d97706; }
    .status-approved { background: #d1fae5; color: #059669; }
    .status-active { background: #d1fae5; color: #059669; }
    .status-rejected { background: #fee2e2; color: #dc2626; }
    .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
    .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-style: italic; color: #475569; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>FOODEXA</h1>
    <p>Institution Registration Request</p>
    <p>Code: ${institutionCode} | Generated: ${now}</p>
  </div>

  <div class="section">
    <h2>Institution Information</h2>
    <div class="grid">
      <div class="field"><label>Institution Name</label><span>${req.institution_name}</span></div>
      <div class="field"><label>Email</label><span>${req.institution_email}</span></div>
      <div class="field"><label>Contact Person</label><span>${req.contact_person}</span></div>
      <div class="field"><label>Phone</label><span>${req.phone_number || 'N/A'}</span></div>
      <div class="field"><label>Website</label><span>${req.institution_website || 'N/A'}</span></div>
      <div class="field"><label>Campus</label><span>${req.campus || 'N/A'}</span></div>
      <div class="field"><label>Role</label><span>${req.role || 'N/A'}</span></div>
      <div class="field"><label>Plan</label><span>${req.plan || 'Basic'}</span></div>
    </div>
  </div>

  <div class="section">
    <h2>Location</h2>
    <div class="grid">
      <div class="field"><label>City</label><span>${req.city || 'N/A'}</span></div>
      <div class="field"><label>State</label><span>${req.state || 'N/A'}</span></div>
      <div class="field"><label>Country</label><span>${req.country || 'N/A'}</span></div>
    </div>
  </div>

  <div class="section">
    <h2>Details</h2>
    <div class="grid">
      <div class="field"><label>Student Population</label><span>${req.student_population || 'N/A'}</span></div>
      <div class="field"><label>Food Courts</label><span>${req.food_courts_count || 'N/A'}</span></div>
      <div class="field"><label>Vendors</label><span>${req.vendors_count || 'N/A'}</span></div>
      <div class="field"><label>Status</label><span class="status status-${req.status}">${req.status}</span></div>
      <div class="field"><label>Submitted</label><span>${new Date(req.created_at).toLocaleString()}</span></div>
      ${req.updated_at ? `<div class="field"><label>Updated At</label><span>${new Date(req.updated_at).toLocaleString()}</span></div>` : ''}
    </div>
  </div>

  ${req.institution_code || req.generated_email || req.generated_password ? `
  <div class="section">
    <h2>Approval Details</h2>
    <div class="grid">
      ${req.institution_code ? `<div class="field"><label>Institution Code</label><span>${req.institution_code}</span></div>` : ''}
      ${req.generated_email ? `<div class="field"><label>Generated Email</label><span>${req.generated_email}</span></div>` : ''}
      ${req.generated_password ? `<div class="field"><label>Generated Password</label><span>${req.generated_password}</span></div>` : ''}
      ${req.approved_by ? `<div class="field"><label>Approved By</label><span>${req.approved_by}</span></div>` : ''}
      ${req.approved_at ? `<div class="field"><label>Approved At</label><span>${new Date(req.approved_at).toLocaleString()}</span></div>` : ''}
    </div>
  </div>` : ''}

  ${req.message ? `<div class="section"><h2>Message</h2><div class="message-box">${req.message}</div></div>` : ''}
  ${req.rejection_reason ? `<div class="section"><h2>Rejection Reason</h2><div class="message-box" style="border-color:#fca5a5;color:#dc2626;">${req.rejection_reason}</div></div>` : ''}
  ${req.admin_notes ? `<div class="section"><h2>Admin Notes</h2><div class="message-box" style="border-color:#93c5fd;color:#2563eb;">${req.admin_notes}</div></div>` : ''}

  <div class="footer">
    <p>FOODEXA Enterprise - Institution Management Platform</p>
    <p>This document was generated automatically on ${now}</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `institution-request-${req.institution_name.replace(/\s+/g, '-').toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(url);
};
