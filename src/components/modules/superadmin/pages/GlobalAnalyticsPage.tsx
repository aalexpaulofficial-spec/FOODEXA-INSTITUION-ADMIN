import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, Users, Store, DollarSign, Activity, CheckCircle2, XCircle, MessageSquare,
  Building2, Loader2, Download, Sparkles, RefreshCw, Globe2, Clock, Zap, ArrowUpRight
} from 'lucide-react';
import { useSuperAdminData } from './components/SuperAdminDataProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const GlobalAnalyticsPage: React.FC = () => {
  const {
    institutionRequests, approvedInstitutions, loading, totalStudents, totalOrders, totalVendors,
    totalRevenue, isRealtime, refresh,
  } = useSuperAdminData();

  const pendingRequests = institutionRequests.filter((r) => r.status === 'pending');

  const statusData = [
    { name: 'Active', value: institutionRequests.filter((r) => r.status === 'active').length, color: '#10B981' },
    { name: 'Pending', value: institutionRequests.filter((r) => r.status === 'pending').length, color: '#F59E0B' },
    { name: 'Rejected', value: institutionRequests.filter((r) => r.status === 'rejected').length, color: '#EF4444' },
    { name: 'Suspended', value: institutionRequests.filter((r) => r.status === 'suspended').length, color: '#6B7280' },
    { name: 'Changes Requested', value: institutionRequests.filter((r) => r.status === 'changes_requested').length, color: '#6366F1' },
  ];

  const planData = [
    { name: 'Basic', count: approvedInstitutions.filter((i) => i.plan === 'Basic').length, revenue: approvedInstitutions.filter((i) => i.plan === 'Basic').reduce((s, i) => s + (i.monthly_revenue || 0), 0), color: '#6B7280' },
    { name: 'Pro', count: approvedInstitutions.filter((i) => i.plan === 'Pro').length, revenue: approvedInstitutions.filter((i) => i.plan === 'Pro').reduce((s, i) => s + (i.monthly_revenue || 0), 0), color: '#6366F1' },
    { name: 'Enterprise', count: approvedInstitutions.filter((i) => i.plan === 'Enterprise').length, revenue: approvedInstitutions.filter((i) => i.plan === 'Enterprise').reduce((s, i) => s + (i.monthly_revenue || 0), 0), color: '#F59E0B' },
  ];

  const exportCSV = () => {
    const headers = 'Metric,Value\n';
    const rows = [
      `Total Institutions,${approvedInstitutions.length}`,
      `Total Requests,${institutionRequests.length}`,
      `Active Institutions,${approvedInstitutions.filter((i) => i.status === 'active').length}`,
      `Suspended Institutions,${approvedInstitutions.filter((i) => i.status === 'suspended').length}`,
      `Total Students,${totalStudents}`,
      `Total Orders,${totalOrders}`,
      `Total Vendors,${totalVendors}`,
      `Total Revenue,${totalRevenue}`,
      `Pending Requests,${pendingRequests.length}`,
    ].join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'foodexa-analytics.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Global Analytics &bull; FOODEXA Enterprise</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live</span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Connecting&hellip;</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Global Analytics</h1>
          <p className="text-xs text-slate-400 mt-1">Live platform analytics from Supabase.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh</span>
          </button>
          <button onClick={exportCSV} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-[#0C0C0E] border border-slate-800 animate-pulse space-y-2">
              <div className="h-3 bg-slate-800 rounded w-1/2" />
              <div className="h-6 bg-slate-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" /> Institution Growth
              </div>
              <div className="text-3xl font-black text-white">{approvedInstitutions.length}</div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Total approved institutions</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Student Growth
              </div>
              <div className="text-3xl font-black text-white">{totalStudents.toLocaleString()}</div>
              <p className="text-[11px] text-indigo-400">Registered students</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Orders
              </div>
              <div className="text-3xl font-black text-white">{totalOrders.toLocaleString()}</div>
              <p className="text-[11px] text-purple-400">All time orders</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" /> Revenue
              </div>
              <div className="text-3xl font-black text-white">₹{totalRevenue.toLocaleString()}</div>
              <p className="text-[11px] text-amber-400">Total revenue</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart className="w-4 h-4 text-amber-400" /> Institution Status Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#0C0C0E', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12 }}
                    labelStyle={{ color: '#FAFAFA' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" /> Plan Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={planData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, count }) => `${name}: ${count}`}>
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0C0C0E', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" /> Revenue by Plan
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={planData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0C0C0E', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12 }} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" /> Platform Health
              </h3>
              <div className="space-y-3">
                {(['active', 'pending', 'rejected', 'suspended', 'changes_requested'] as const).map((status) => {
                  const count = institutionRequests.filter((r) => r.status === status).length;
                  const pct = institutionRequests.length > 0 ? (count / institutionRequests.length) * 100 : 0;
                  const colors: Record<string, string> = {
                    active: 'bg-emerald-500', pending: 'bg-amber-500', rejected: 'bg-red-500',
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
              <p className="text-[10px] text-slate-600 border-t border-slate-800 pt-3 flex items-center gap-2">
                <Zap className="w-3 h-3 text-amber-400" /> AI Insights: {approvedInstitutions.filter((i) => i.status === 'active').length > 5 ? 'Platform performing well' : 'Platform growing'}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-amber-400" /> Platform Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Institutions</p>
                <p className="text-xl font-black text-white">{approvedInstitutions.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Registered Students</p>
                <p className="text-xl font-black text-white">{totalStudents.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Total Orders</p>
                <p className="text-xl font-black text-white">{totalOrders.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500 text-[11px] uppercase font-bold">Pending Review</p>
                <p className="text-xl font-black text-amber-400">{pendingRequests.length}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalAnalyticsPage;
