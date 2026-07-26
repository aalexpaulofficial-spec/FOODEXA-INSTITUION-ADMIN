import React, { useState, useMemo } from 'react';
import {
  History, Shield, User, Calendar, Clock, Globe, Smartphone, Filter, Download, Loader2,
  RefreshCw, Sparkles, Search, ChevronDown, ChevronUp, Monitor
} from 'lucide-react';
import { useSuperAdminData } from './components/SuperAdminDataProvider';

export const AuditLogsPage: React.FC = () => {
  const {
    auditLogs, approvedInstitutions, loading, isRealtime, refresh,
  } = useSuperAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [institutionFilter, setInstitutionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'institution_admin'>('all');
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (searchTerm && !log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !log.action?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !log.target?.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      if (dateFilter === 'today') {
        const today = new Date().toDateString();
        if (new Date(log.created_at).toDateString() !== today) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        if (new Date(log.created_at) < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (new Date(log.created_at) < monthAgo) return false;
      }

      if (institutionFilter !== 'all' && !log.target?.toLowerCase().includes(institutionFilter.toLowerCase())) return false;
      if (actionFilter !== 'all' && !log.action?.toLowerCase().includes(actionFilter.toLowerCase())) return false;

      return true;
    });
  }, [auditLogs, searchTerm, dateFilter, institutionFilter, actionFilter]);

  const exportLogs = () => {
    const headers = 'User,Action,Target,Details,Date,Time,IP Address\n';
    const rows = filteredLogs.map((log) => {
      const dt = new Date(log.created_at);
      return `${log.user_name},${log.action},${log.target},${log.details || ''},${dt.toLocaleDateString()},${dt.toLocaleTimeString()},${log.ip_address || 'web-client'}`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    if (action.includes('Approved') || action.includes('Reactivated') || action.includes('Onboarded')) return 'bg-emerald-500/10 text-emerald-400';
    if (action.includes('Rejected') || action.includes('Deleted')) return 'bg-red-500/10 text-red-400';
    if (action.includes('Suspended')) return 'bg-amber-500/10 text-amber-400';
    if (action.includes('Updated') || action.includes('Changed')) return 'bg-blue-500/10 text-blue-400';
    return 'bg-slate-800 text-slate-400';
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Audit Logs &bull; FOODEXA Enterprise</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live</span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Connecting&hellip;</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">{auditLogs.length} log entries &bull; Complete activity history.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh</span>
          </button>
          <button onClick={exportLogs} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50" />
        </div>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white">
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select value={institutionFilter} onChange={(e) => setInstitutionFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white">
          <option value="all">All Institutions</option>
          {approvedInstitutions.map((i) => (
            <option key={i.id} value={i.name}>{i.name}</option>
          ))}
        </select>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white">
          <option value="all">All Actions</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
          <option value="updated">Updated</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-amber-400 animate-spin" /></div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No audit logs found.</p>
          <p className="text-slate-600 text-xs">Actions like approve, reject, suspend, and delete will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800">
                <th className="text-left py-3 px-4 text-slate-500 font-bold">User</th>
                <th className="text-left py-3 px-4 text-slate-500 font-bold">Role</th>
                <th className="text-left py-3 px-4 text-slate-500 font-bold">Action</th>
                <th className="text-left py-3 px-4 text-slate-500 font-bold">Target / Institution</th>
                <th className="text-left py-3 px-4 text-slate-500 font-bold">Date</th>
                <th className="text-left py-3 px-4 text-slate-500 font-bold">Time</th>
                <th className="text-left py-3 px-4 text-slate-500 font-bold">IP / Device</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-400">
                        {log.user_name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <span className="text-white font-semibold max-w-[120px] truncate">{log.user_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                      {log.user_name === 'System' || log.user_name?.includes('admin') ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">{log.target}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                      <Monitor className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{log.ip_address || 'web-client'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
