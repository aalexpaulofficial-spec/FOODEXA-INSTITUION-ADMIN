import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Flame,
  Hash,
  KeyRound,
  QrCode,
  Timer,
  User,
} from 'lucide-react';
import { KitchenQueueItem, OrderStatus } from '../../../types';

interface KitchenDashboardProps {
  queueItems: KitchenQueueItem[];
  currentInstitution?: { name: string; institution_code: string; campus?: string };
  onUpdateKitchenStatus: (itemId: string, status: OrderStatus) => void;
}

const getRoleDisplay = (role?: string) => {
  const r = (role || '').toLowerCase();
  if (r === 'student') return { label: 'Student', cls: 'text-indigo-300' };
  if (r === 'faculty') return { label: 'Faculty', cls: 'text-purple-300' };
  if (r === 'guest') return { label: 'Guest', cls: 'text-slate-300' };
  return { label: role || 'Unknown', cls: 'text-slate-400' };
};

const formatTime = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  queueItems,
  onUpdateKitchenStatus,
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

  const incomingItems = items.filter((item) => item.status === 'pending');
  const preparingItems = items.filter((item) => item.status === 'preparing');
  const readyItems = items.filter((item) => item.status === 'ready');
  const completedItems = items.filter((item) => item.status === 'completed');

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderCustomerInfo = (item: KitchenQueueItem) => {
    const role = getRoleDisplay(item.customerRole);
    return (
      <div className="flex items-center justify-between gap-3 text-[11px] pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-200 truncate">{item.customerName || '-'}</span>
        </div>
        <span className={`text-xs font-bold shrink-0 ${role.cls}`}>{role.label}</span>
      </div>
    );
  };

  const renderPickupInfo = (item: KitchenQueueItem) => (
    <div className="flex items-center justify-between text-[11px] text-slate-400">
      <div className="flex items-center gap-1">
        <CalendarClock className="w-3 h-3 text-slate-500" />
        <span className="font-mono">{formatTime(item.orderTime || item.pickupTime)}</span>
      </div>
      <div className="font-mono text-slate-300 font-semibold">{item.counterNumber || '-'}</div>
    </div>
  );

  const renderOrderMeta = (item: KitchenQueueItem) => (
    <div className="grid grid-cols-2 gap-2 text-[11px]">
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
        <Hash className="w-3 h-3 text-slate-500 shrink-0" />
        <span>Token</span>
        <span className="font-mono font-bold text-slate-200 truncate">{item.tokenNumber || '-'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
        <KeyRound className="w-3 h-3 text-slate-500 shrink-0" />
        <span>Code</span>
        <span className="font-mono font-bold text-slate-200 truncate">{item.pickupCode || '-'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
        <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
        <span className="capitalize truncate">{item.paymentStatus || 'pending'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
        <QrCode className="w-3 h-3 text-slate-500 shrink-0" />
        <span className="font-mono truncate">{item.qrCodeData || item.pickupCode || '-'}</span>
      </div>
    </div>
  );

  const renderItems = (item: KitchenQueueItem) => {
    if (!item.items?.length) {
      return <div className="text-[11px] font-bold text-slate-200">{item.itemsSummary || 'No items listed'}</div>;
    }

    return (
      <div className="space-y-1">
        {item.items.map((orderItem, index) => (
          <div key={`${item.id}-${index}`} className="flex justify-between gap-3 rounded-lg bg-slate-900/70 px-2.5 py-1.5 text-[11px]">
            <span className="text-slate-200">{orderItem.quantity}x {orderItem.name}</span>
            <span className="font-mono text-emerald-400">Rs {((orderItem.quantity || 0) * (orderItem.price || 0)).toFixed(0)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderCard = (
    item: KitchenQueueItem,
    tone: 'amber' | 'cyan' | 'emerald' | 'green',
    action?: React.ReactNode
  ) => {
    const border = {
      amber: 'border-slate-800/80 hover:border-amber-500/40',
      cyan: 'border-cyan-500/30',
      emerald: 'border-emerald-500/30',
      green: 'border-green-500/20',
    }[tone];
    const text = {
      amber: 'text-amber-400',
      cyan: 'text-cyan-300',
      emerald: 'text-emerald-400',
      green: 'text-green-400',
    }[tone];

    return (
      <div key={item.id} className={`p-4 rounded-xl bg-slate-950 border ${border} space-y-3 shadow-lg transition-all`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-mono font-bold text-sm ${text}`}>{item.orderNumber || '-'}</span>
          {item.isPriority && (
            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold uppercase flex items-center space-x-1">
              <Flame className="w-3 h-3 text-red-400" />
              <span>Priority</span>
            </span>
          )}
        </div>
        {renderItems(item)}
        {renderPickupInfo(item)}
        {renderOrderMeta(item)}
        {renderCustomerInfo(item)}
        {item.notes && (
          <div className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-300 italic">
            "{item.notes}"
          </div>
        )}
        {action}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white">Kitchen Queue Display System</h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold animate-pulse">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Supabase Realtime orders for the logged-in institution.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Queue: <strong className="text-amber-400">{incomingItems.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Preparing: <strong className="text-cyan-400 font-mono">{preparingItems.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Ready: <strong className="text-emerald-400 font-mono">{readyItems.length}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Incoming Queue ({incomingItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Pending</span>
          </div>
          <div className="space-y-3 min-h-[400px]">
            {incomingItems.map((item) =>
              renderCard(item, 'amber', (
                <button
                  onClick={() => onUpdateKitchenStatus(item.id, 'preparing')}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept</span>
                </button>
              ))
            )}
            {incomingItems.length === 0 && <div className="py-16 text-center text-slate-500 text-xs italic">No pending orders.</div>}
          </div>
        </section>

        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Preparing ({preparingItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Live Timer</span>
          </div>
          <div className="space-y-3 min-h-[400px]">
            {preparingItems.map((item) => {
              const prepSeconds = Math.max((item.prepTimeMinutes || 1) * 60, 1);
              const progressPct = Math.min(100, Math.floor((item.elapsedSeconds / prepSeconds) * 100));
              return renderCard(item, 'cyan', (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {formatSeconds(item.elapsedSeconds)}</span>
                      <span className="font-mono">{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-1000" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateKitchenStatus(item.id, 'ready')}
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ready</span>
                  </button>
                </div>
              ));
            })}
            {preparingItems.length === 0 && <div className="py-16 text-center text-slate-500 text-xs italic">No orders preparing.</div>}
          </div>
        </section>

        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Ready Counter ({readyItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Ready</span>
          </div>
          <div className="space-y-3 min-h-[400px]">
            {readyItems.map((item) =>
              renderCard(item, 'emerald', (
                <button
                  onClick={() => onUpdateKitchenStatus(item.id, 'completed')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Complete</span>
                </button>
              ))
            )}
            {readyItems.length === 0 && <div className="py-16 text-center text-slate-500 text-xs italic">No orders ready.</div>}
          </div>
        </section>

        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-green-400">Completed ({completedItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Picked Up</span>
          </div>
          <div className="space-y-3 min-h-[400px]">
            {completedItems.map((item) => renderCard(item, 'green'))}
            {completedItems.length === 0 && <div className="py-16 text-center text-slate-500 text-xs italic">No completed pickups.</div>}
          </div>
        </section>
      </div>
    </div>
  );
};
