import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  ShoppingBag,
  User,
  GraduationCap,
  UserCheck,
  UserX,
  CalendarClock
} from 'lucide-react';
import { KitchenQueueItem, OrderStatus } from '../../../types';

interface KitchenDashboardProps {
  queueItems: KitchenQueueItem[];
  currentInstitution?: { name: string; institution_code: string; campus?: string };
  onUpdateKitchenStatus: (itemId: string, status: OrderStatus) => void;
}

const getRoleDisplay = (role?: string) => {
  const r = (role || '').toLowerCase();
  if (r === 'student') return { icon: '🎓', text: 'Student', cls: 'text-indigo-300' };
  if (r === 'faculty') return { icon: '👨‍🏫', text: 'Faculty', cls: 'text-purple-300' };
  if (r === 'guest') return { icon: '👤', text: 'Guest', cls: 'text-slate-300' };
  return { icon: '👤', text: role || 'Unknown', cls: 'text-slate-400' };
};

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  queueItems,
  currentInstitution,
  onUpdateKitchenStatus
}) => {
  const [items, setItems] = useState<KitchenQueueItem[]>(queueItems);

  useEffect(() => {
    const timer = setInterval(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.status === 'preparing'
            ? { ...item, elapsedSeconds: item.elapsedSeconds + 1 }
            : item
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setItems(queueItems);
  }, [queueItems]);

  const pendingItems = items.filter((i) => i.status === 'pending');
  const acceptedItems = items.filter((i) => i.status === 'accepted');
  const preparingItems = items.filter((i) => i.status === 'preparing' || i.status === 'accepted');
  const readyItems = items.filter((i) => i.status === 'ready');

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 10;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderCustomerInfo = (item: KitchenQueueItem) => (
    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
      <div className="flex items-center gap-1.5">
        <User className="w-3 h-3 text-slate-500" />
        <span className="font-semibold text-slate-200">{item.customerName || '—'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-bold ${getRoleDisplay(item.customerRole).cls}`}>
          {getRoleDisplay(item.customerRole).icon} {getRoleDisplay(item.customerRole).text}
        </span>
      </div>
    </div>
  );

  const renderPickupInfo = (item: KitchenQueueItem) => (
    <div className="flex items-center justify-between text-[11px] text-slate-400">
      <div className="flex items-center gap-1">
        <CalendarClock className="w-3 h-3 text-slate-500" />
        <span className="font-mono">{item.pickupTime ? new Date(item.pickupTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
      </div>
      <div className="font-mono text-slate-300 font-semibold">{item.counterNumber}</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white">Kitchen Queue Display System (KDS)</h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold animate-pulse">
              LIVE KITCHEN
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time kitchen order dispatching, preparation countdown timers, and counter routing.
            Customer names and roles pulled from live profile data.
          </p>
        </div>

        {/* KDS Stats Ribbon */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Order Queue: <strong className="text-amber-400">{items.length} items</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            In Prep: <strong className="text-cyan-400 font-mono">{preparingItems.length}</strong>
          </div>
        </div>
      </div>

      {/* KDS Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Incoming / Pending Orders */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Incoming Queue ({pendingItems.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Awaiting Stove</span>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 shadow-lg hover:border-amber-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-amber-400 text-sm">{item.orderNumber}</span>
                  {item.isPriority && (
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold uppercase flex items-center space-x-1">
                      <Flame className="w-3 h-3 text-red-400" />
                      <span>Priority Express</span>
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-bold text-slate-200">{item.itemsSummary}</div>
                {renderPickupInfo(item)}
                {renderCustomerInfo(item)}

                {item.notes && (
                  <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-300 italic">
                    "{item.notes}"
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => onUpdateKitchenStatus(item.id, 'accepted')}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept Order</span>
                  </button>
                  <button
                    onClick={() => onUpdateKitchenStatus(item.id, 'preparing')}
                    className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-xs transition-colors flex items-center justify-center"
                  >
                    <Play className="w-3.5 h-3.5 fill-cyan-400" />
                  </button>
                </div>
              </div>
            ))}

            {pendingItems.length === 0 && (
              <div className="py-16 text-center text-slate-500 text-xs italic">
                No pending orders in queue.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Currently Preparing */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">
                On Stove / Preparing ({preparingItems.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Live Timer</span>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {preparingItems.map((item) => {
              const progressPct = Math.min(
                100,
                Math.floor((item.elapsedSeconds / (item.prepTimeMinutes * 60)) * 100)
              );

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-300 text-sm">{item.orderNumber}</span>
                    <div className="flex items-center space-x-1 text-cyan-400 font-mono font-bold text-xs">
                      <Timer className="w-3.5 h-3.5 animate-spin" />
                      <span>{formatSeconds(item.elapsedSeconds)}</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-slate-200">{item.itemsSummary}</div>
                  {renderPickupInfo(item)}
                  {renderCustomerInfo(item)}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Prep Progress</span>
                      <span className="font-mono">{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-1000"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onUpdateKitchenStatus(item.id, 'ready')}
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Ready for Pickup</span>
                  </button>
                </div>
              );
            })}

            {preparingItems.length === 0 && (
              <div className="py-16 text-center text-slate-500 text-xs italic">
                No orders currently being cooked.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Ready for Counter Pickup */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                Ready at Counter ({readyItems.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Student Pinged</span>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {readyItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400 text-sm">{item.orderNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                    Ready
                  </span>
                </div>

                <div className="text-[11px] font-bold text-slate-200">{item.itemsSummary}</div>
                {renderPickupInfo(item)}
                {renderCustomerInfo(item)}

                <button
                  onClick={() => onUpdateKitchenStatus(item.id, 'completed')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Complete Pickup</span>
                </button>
              </div>
            ))}

            {readyItems.length === 0 && (
              <div className="py-16 text-center text-slate-500 text-xs italic">
                No orders awaiting pickup right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
