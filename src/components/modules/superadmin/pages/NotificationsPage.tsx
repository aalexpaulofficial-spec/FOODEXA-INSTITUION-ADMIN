import React, { useState } from 'react';
import {
  Bell, CheckCircle2, XCircle, AlertTriangle, Info, Loader2, RefreshCw, Sparkles, Trash2,
  Filter, CheckCheck, Clock
} from 'lucide-react';
import { useSuperAdminData } from './components/SuperAdminDataProvider';
import { supabase } from '../../../../lib/supabaseClient';
import { Modal } from './components/SuperAdminShared';

export const NotificationsPage: React.FC = () => {
  const {
    notifications, unreadCount, markNotificationRead, markAllNotificationsRead, isRealtime, refresh,
  } = useSuperAdminData();

  const [filter, setFilter] = useState<'all' | 'unread' | 'success' | 'warning' | 'error' | 'info'>('all');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const deleteNotification = async (id: string) => {
    await supabase.from('platform_notifications').delete().eq('id', id);
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications &bull; FOODEXA Enterprise</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live</span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Connecting&hellip;</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-400 mt-1">{notifications.length} total &bull; {unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllNotificationsRead} className="px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold transition-all flex items-center gap-2">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'unread', 'success', 'warning', 'error', 'info'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${
              filter === f
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bell className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No notifications yet.</p>
          <p className="text-slate-600 text-xs">New institution registrations and system updates will appear here.</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Filter className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No notifications match this filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((n) => (
            <div key={n.id}
              className={`p-4 rounded-2xl border transition-all ${
                n.read ? 'bg-[#0C0C0E] border-slate-800 opacity-70' : 'bg-[#0C0C0E] border-amber-500/30 shadow-lg'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  n.type === 'success' ? 'bg-emerald-500/10' : n.type === 'error' ? 'bg-red-500/10' :
                  n.type === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                }`}>
                  {n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   n.type === 'error' ? <XCircle className="w-4 h-4 text-red-400" /> :
                   n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                   <Info className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">{n.title}</p>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read && (
                    <button onClick={() => markNotificationRead(n.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 transition-all" title="Mark Read">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n.id)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 transition-all" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
