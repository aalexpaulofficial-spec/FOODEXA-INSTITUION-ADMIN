import React, { useState } from 'react';
import {
  CreditCard, Building2, DollarSign, Users, Store, TrendingUp, Clock, CheckCircle2, XCircle,
  AlertTriangle, Loader2, Download, RefreshCw, Sparkles, ArrowUp, ArrowDown, Ban, Calendar
} from 'lucide-react';
import { useSuperAdminData } from './components/SuperAdminDataProvider';
import { StatusBadge, Modal } from './components/SuperAdminShared';

export const SubscriptionsPage: React.FC = () => {
  const {
    approvedInstitutions, institutionRequests, loading, totalRevenue, isRealtime, refresh,
    updateInstitution, createAuditLog,
  } = useSuperAdminData();

  const [upgradeModal, setUpgradeModal] = useState<any>(null);
  const [toasts, setToasts] = useState<{ id: string; msg: string; type?: string }[]>([]);
  const addToast = (msg: string, type: string = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const plans = ['Basic', 'Pro', 'Enterprise'] as const;

  const handleUpgrade = async (inst: any, newPlan: string) => {
    await updateInstitution(inst.id, { plan: newPlan as any });
    await createAuditLog(`Plan Changed to ${newPlan}`, inst.name, inst.id, `From ${inst.plan} to ${newPlan}`);
    addToast(`${inst.name} upgraded to ${newPlan}`);
    setUpgradeModal(null);
  };

  const handleDowngradePrompt = (inst: any) => {
    setUpgradeModal({ ...inst, downgrade: true });
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Basic': return { border: 'border-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-400' };
      case 'Pro': return { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-400' };
      case 'Enterprise': return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' };
      default: return { border: 'border-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-400' };
    }
  };

  const exportPaymentHistory = () => {
    const headers = 'Institution,Plan,Status,Monthly Revenue,Joined Date\n';
    const rows = approvedInstitutions.map((i) =>
      `${i.name},${i.plan || 'Basic'},${i.status},${i.monthly_revenue || 0},${i.joined_date || '—'}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'subscriptions.csv'; a.click();
    URL.revokeObjectURL(url);
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
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subscriptions &bull; FOODEXA Enterprise</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live</span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Connecting&hellip;</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Subscriptions</h1>
          <p className="text-xs text-slate-400 mt-1">Manage institution plans, billing, and renewals.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh</span>
          </button>
          <button onClick={exportPaymentHistory} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const count = approvedInstitutions.filter((i) => i.plan === plan).length;
          const revenue = approvedInstitutions.filter((i) => i.plan === plan).reduce((s, i) => s + (i.monthly_revenue || 0), 0);
          const c = getPlanColor(plan);
          return (
            <div key={plan} className={`p-5 rounded-2xl bg-[#0C0C0E] border ${c.border} space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <CreditCard className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{plan} Plan</h3>
                    <p className="text-[11px] text-slate-500">{count} institution{count !== 1 ? 's' : ''}</p>
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

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" /> Institution Plans & Billing
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
        ) : approvedInstitutions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No institutions subscribed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-500 font-bold">Institution</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-bold">Current Plan</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-bold">Billing Status</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-bold">Expiry / Joined</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-bold">Revenue</th>
                  <th className="text-left py-3 px-4 text-slate-500 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedInstitutions.map((inst) => (
                  <tr key={inst.id} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                    <td className="py-3 px-4 text-white font-semibold">{inst.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPlanColor(inst.plan || 'Basic').bg} ${getPlanColor(inst.plan || 'Basic').text}`}>
                        {inst.plan || 'Basic'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inst.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">{inst.joined_date ? new Date(inst.joined_date).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-amber-400 font-mono">₹{(inst.monthly_revenue || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {inst.plan !== 'Enterprise' && (
                          <button onClick={() => setUpgradeModal({ ...inst, downgrade: false })}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                            <ArrowUp className="w-2.5 h-2.5" /> Upgrade
                          </button>
                        )}
                        {inst.plan !== 'Basic' && (
                          <button onClick={() => handleDowngradePrompt(inst)}
                            className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                            <ArrowDown className="w-2.5 h-2.5" /> Downgrade
                          </button>
                        )}
                        <button onClick={() => addToast(`Invoice download not available yet for ${inst.name}`, 'info')}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold">
                          Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!upgradeModal} onClose={() => setUpgradeModal(null)} title={upgradeModal?.downgrade ? 'Change Plan' : 'Upgrade Plan'}>
        {upgradeModal && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              {upgradeModal.downgrade
                ? `Select a lower plan for ${upgradeModal.name}:`
                : `Select a higher plan for ${upgradeModal.name}:`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {plans.filter((p) => upgradeModal.downgrade ? p !== upgradeModal.plan : p !== upgradeModal.plan).map((plan) => (
                <button
                  key={plan}
                  onClick={() => handleUpgrade(upgradeModal, plan)}
                  className={`p-4 rounded-xl border text-center transition-all ${getPlanColor(plan).border} ${getPlanColor(plan).bg} hover:scale-[1.02]`}
                >
                  <p className={`text-sm font-bold ${getPlanColor(plan).text}`}>{plan}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {plan === 'Basic' ? 'Essential features' : plan === 'Pro' ? 'Advanced features' : 'Full enterprise suite'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;
