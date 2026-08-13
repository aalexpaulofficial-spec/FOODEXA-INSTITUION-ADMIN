import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Sparkles,
  QrCode,
  Clock,
  Bell,
  Utensils,
  ShoppingBag,
  Zap,
  Flame,
  ChevronRight,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import { MenuItem, Order, Announcement } from '../../types';
import { getStudentViewStatus } from '../../lib/orderUtils';

interface StudentDashboardSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  orders: Order[];
  announcements: Announcement[];
}

export const StudentDashboardSyncModal: React.FC<StudentDashboardSyncModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  orders,
  announcements,
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'live_order' | 'announcements'>('live_order');

  if (!isOpen) return null;

  // Latest active order — same Supabase source, updated in real time
  const activeStudentOrder = (Array.isArray(orders) && orders.length > 0
    ? [...orders].sort((a, b) => {
        const ta = new Date(a.created_at || a.orderTime || 0).getTime();
        const tb = new Date(b.created_at || b.orderTime || 0).getTime();
        return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
      })[0]
    : null) || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative font-sans">
        
        {/* Device Frame Top Bar */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">Live Student App View</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold animate-pulse">
              SYNCED LIVE
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="px-4 py-2 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/20 text-[11px] text-indigo-300 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Real-time WebSocket Control Center Sync Active</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">0ms delay</span>
        </div>

        {/* Student App Navigation Tabs */}
        <div className="flex bg-slate-950 p-1.5 border-b border-slate-800 text-xs font-semibold text-center">
          <button
            onClick={() => setActiveTab('live_order')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              activeTab === 'live_order'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Order
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-1.5 rounded-xl transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'announcements'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Announce</span>
            {announcements.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
        </div>

         {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">

          {/* TAB 1: LIVE ORDER STATUS & QR PICKUP */}
          {activeTab === 'live_order' && activeStudentOrder && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      Active Order ID
                    </span>
                    <div className="text-sm font-black text-amber-400 font-mono">
                      {activeStudentOrder.orderNumber}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                      activeStudentOrder.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : activeStudentOrder.status === 'ready'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                        : activeStudentOrder.status === 'preparing'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {getStudentViewStatus(activeStudentOrder.status)}
                  </span>
                </div>

                {/* Pickup Details Box */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">
                      Pickup Counter
                    </span>
                    <span className="text-sm font-black text-amber-400 font-mono mt-0.5 block">
                       {activeStudentOrder.pickupCounter || ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">
                      Pickup Number
                    </span>
                    <span className="text-sm font-black text-cyan-400 font-mono mt-0.5 block">
                      {activeStudentOrder.pickupNumber || activeStudentOrder.pickupCode}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">
                      Est. Wait Time
                    </span>
                    <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                      {activeStudentOrder.estimatedWaitMins || 8} Mins
                    </span>
                  </div>
                </div>

                {/* Simulated QR Code for Verification */}
                <div className="p-4 rounded-xl bg-white text-slate-950 flex flex-col items-center justify-center text-center space-y-2 border border-slate-300 shadow-inner">
                  <QrCode className="w-24 h-24 text-slate-950" />
                  <div className="font-mono font-black text-xs tracking-widest text-slate-900">
                    {activeStudentOrder.pickupCode}
                  </div>
                  <span className="text-[10px] text-slate-600 font-medium">
                    Show this QR at {activeStudentOrder.pickupCounter || ''} for verification
                  </span>
                </div>

                {/* Status Timeline */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Live Order Tracker (Kitchen Synced)
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-bold">
                    <div
                      className={`p-1.5 rounded-lg border ${
                        ['pending', 'preparing', 'ready', 'completed'].includes(activeStudentOrder.status)
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                    >
                      Placed
                    </div>
                    <div
                      className={`p-1.5 rounded-lg border ${
                        ['preparing', 'ready', 'completed'].includes(activeStudentOrder.status)
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                    >
                      Order Confirmed
                    </div>
                    <div
                      className={`p-1.5 rounded-lg border ${
                        ['preparing', 'ready', 'completed'].includes(activeStudentOrder.status)
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                    >
                      Preparing
                    </div>
                    <div
                      className={`p-1.5 rounded-lg border ${
                        ['ready', 'completed'].includes(activeStudentOrder.status)
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                    >
                      Ready at Counter
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="text-slate-300 pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span>
                    Items:{' '}
                    {(activeStudentOrder.items || []).map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    ₹{(activeStudentOrder.totalAmount || 0).toFixed(2)} ({(activeStudentOrder.paymentStatus || 'N/A').toUpperCase()})
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'live_order' && !activeStudentOrder && (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <ShoppingBag className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
              <p className="text-slate-300 font-semibold">No active student orders</p>
               <p className="text-[11px] text-slate-500">
                 Browse the student menu to place a new order.
               </p>
            </div>
          )}

          {/* TAB 2: LIVE MENU LISTING (OUT OF STOCK SYNCHRONIZATION) */}
          {activeTab === 'menu' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Campus Food Menu (Live Synced)</span>
                <span className="text-amber-400 font-bold">{menuItems.length} Available Items</span>
              </div>

              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl bg-slate-950 border transition-all flex items-center justify-between gap-3 ${
                      item.isAvailable
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-red-900/50 bg-red-950/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-800"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate flex items-center space-x-1.5">
                          <span>{item.name}</span>
                          {!item.isAvailable && (
                            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold">
                              OUT OF STOCK
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                          <span className="text-amber-400">{item.category}</span>
                          <span>&bull;</span>
                           <span>{item.counterNumber || ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-400 text-xs">
                        ₹{(item.price || 0).toFixed(2)}
                      </div>
                      {item.isAvailable ? (
                        <span className="mt-1 inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Available
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-400 italic">Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CAMPUS ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400 font-semibold">
                Campus Admin Announcements (Live Stream)
              </div>

              <div className="space-y-2">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-3.5 rounded-xl bg-slate-950 border space-y-1.5 ${
                      ann.isImportant
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{ann.title}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[9px]">
                        {ann.category}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{ann.content}</p>
                    <div className="text-[9px] text-slate-500 pt-1 font-mono">
                      By {ann.author} &bull; {ann.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
