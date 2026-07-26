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
    active: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Active' },
    rejected: { color: 'bg-red-500/10 text-red-400 border-red-500/30', label: 'Rejected' },
    suspended: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', label: 'Suspended' },
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
  const lines = [
    'INSTITUTION REGISTRATION REQUEST',
    '================================',
    '',
    `Institution Name: ${req.institution_name}`,
    `Email: ${req.institution_email}`,
    `Contact Person: ${req.contact_person}`,
    `Phone: ${req.phone_number || 'N/A'}`,
    `Website: ${req.institution_website || 'N/A'}`,
    `City: ${req.city || 'N/A'}`,
    `State: ${req.state || 'N/A'}`,
    `Country: ${req.country || 'N/A'}`,
    `Campus: ${req.campus || 'N/A'}`,
    `Student Population: ${req.student_population || 'N/A'}`,
    `Food Courts: ${req.food_courts_count || 'N/A'}`,
    `Vendors: ${req.vendors_count || 'N/A'}`,
    `Plan: ${req.plan || 'Basic'}`,
    `Status: ${req.status}`,
    `Submitted: ${new Date(req.created_at).toLocaleString()}`,
    `Message: ${req.message || 'None'}`,
    req.rejection_reason ? `Rejection Reason: ${req.rejection_reason}` : '',
    req.admin_notes ? `Admin Notes: ${req.admin_notes}` : '',
    req.institution_code ? `Institution Code: ${req.institution_code}` : '',
  ].filter(Boolean).join('\n');

  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `request-${req.institution_name.replace(/\s+/g, '-').toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};
