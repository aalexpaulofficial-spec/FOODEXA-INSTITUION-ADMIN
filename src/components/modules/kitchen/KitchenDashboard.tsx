import React, { useEffect, useMemo, useState } from 'react';
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
  ChefHat,
  XCircle,
  AlertTriangle,
  Building2,
  Store,
  Mail,
  BadgeCheck,
} from 'lucide-react';
import { Order, OrderStatus, Counter } from '../../../types';
import { getCancelRemainingMs, CANCEL_BLOCK_MESSAGE } from '../../../lib/orderUtils';
import { useLanguage } from '../../../context/LanguageContext';

interface KitchenDashboardProps {
  orders: Order[];
  currentInstitution?: { name: string; institution_code: string; campus?: string };
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatingOrderId?: string | null;
  counters?: Counter[];
}

const getRoleDisplay = (role?: string) => {
  const r = (role || '').toLowerCase();
  if (r === 'student') return { label: 'Student', cls: 'text-indigo-300' };
  if (r === 'faculty') return { label: 'Faculty', cls: 'text-purple-300' };
  if (r === 'guest') return { label: 'Guest', cls: 'text-slate-300' };
  return { label: role || '', cls: 'text-slate-400' };
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatSeconds = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const isPaid = (item: Order) => String(item.paymentStatus || '').toLowerCase() === 'paid';

const statusText = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
    case 'awaiting_confirmation':
      return 'WAITING FOR CONFIRMATION';
    case 'confirmed':
      return 'ORDER CONFIRMED';
    case 'preparing':
      return 'PREPARING';
    case 'ready':
      return 'READY AT COUNTER';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return String(status || '').toUpperCase();
  }
};

const statusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
    case 'awaiting_confirmation':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'confirmed':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'preparing':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'ready':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'completed':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'cancelled':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
};

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  orders,
  currentInstitution,
  onUpdateOrderStatus,
  updatingOrderId,
  counters,
}) => {
  const { t } = useLanguage();
  const safeOrders = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);

  const counterById = useMemo(() => {
    const map: Record<string, string> = {};
    (counters || []).forEach((c: any) => { map[c.id] = c.name || ''; });
    return map;
  }, [counters]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // INCOMING QUEUE: paid orders waiting for institution confirmation
  const incomingItems = useMemo(
    () => safeOrders.filter((o) => {
      const status = String(o.status || '').toLowerCase();
      return (status === 'pending' || status === 'awaiting_confirmation') && isPaid(o);
    }),
    [safeOrders]
  );
  // PREPARING: confirmed / preparing orders (confirmed = kitchen starts next)
  const confirmedItems = useMemo(() => safeOrders.filter((o) => String(o.status || '').toLowerCase() === 'confirmed'), [safeOrders]);
  const preparingItems = useMemo(() => safeOrders.filter((o) => String(o.status || '').toLowerCase() === 'preparing'), [safeOrders]);
  const readyItems = useMemo(() => safeOrders.filter((o) => String(o.status || '').toLowerCase() === 'ready'), [safeOrders]);
  const completedItems = useMemo(() => safeOrders.filter((o) => String(o.status || '').toLowerCase() === 'completed'), [safeOrders]);
  const cancelledItems = useMemo(() => safeOrders.filter((o) => String(o.status || '').toLowerCase() === 'cancelled'), [safeOrders]);

  const getElapsedSeconds = (order: Order): number => {
    const startedAt = order.preparingAt || order.created_at || order.orderTime || '';
    const t = new Date(startedAt).getTime();
    if (Number.isNaN(t)) return 0;
    return Math.max(0, Math.floor((now - t) / 1000));
  };

  const renderStatusBadge = (item: Order) => (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusColor(item.status)}`}>
      {statusText(item.status)}
    </span>
  );

  const renderCustomerInfo = (item: Order) => {
    const role = getRoleDisplay(item.userRole);
    return (
      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="font-semibold text-slate-200 truncate">{item.studentName || ''}</span>
          </div>
          <span className={`text-xs font-bold shrink-0 ${role.cls}`}>{role.label}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Hash className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="font-mono truncate">{item.studentId || ''}</span>
          </div>
          {item.userEmail && (
            <div className="flex items-center gap-1 min-w-0">
              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">{item.userEmail}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 min-w-0">
          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{item.institutionName || currentInstitution?.name || ''}</span>
          <span className="text-slate-600">•</span>
          <Store className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{item.canteenName || (item.canteen_id && counterById[item.canteen_id]) || item.vendorName || item.pickupCounter || ''}</span>
        </div>
      </div>
    );
  };

  const renderPickupInfo = (item: Order) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <CalendarClock className="w-3 h-3 text-slate-500" />
          <span className="font-mono">Ordered: {formatTime(item.orderTime || item.created_at || item.pickupTimeEstimated)}</span>
        </div>
        <div className="font-mono text-slate-300 font-semibold">{item.pickupCounter || ''}</div>
      </div>
      {item.estimatedReadyTime && (
        <div className="flex items-center gap-1 text-[10px] text-amber-400/90">
          <Timer className="w-3 h-3" />
          <span className="font-mono">Est. Ready: {formatTime(item.estimatedReadyTime)}</span>
        </div>
      )}
    </div>
  );

  const renderOrderMeta = (item: Order) => (
    <div className="grid grid-cols-2 gap-2 text-[11px]">
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
        <Hash className="w-3 h-3 text-slate-500 shrink-0" />
        <span>Token</span>
        <span className="font-mono font-bold text-slate-200 truncate">{item.tokenNumber || ''}</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
        <KeyRound className="w-3 h-3 text-slate-500 shrink-0" />
        <span>Code</span>
        <span className="font-mono font-bold text-slate-200 truncate">{item.pickupCode || ''}</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
        <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
        <span className="capitalize truncate">{item.paymentStatus || ''}</span>
        {isPaid(item) && <BadgeCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
      </div>
      <div className="flex items-center gap-1.5 text-slate-400 min-w-0">
        <QrCode className="w-3 h-3 text-slate-500 shrink-0" />
        <span className="font-mono truncate">{item.qrCodeData || item.pickupCode || ''}</span>
      </div>
      {item.paymentReference && (
        <div className="col-span-2 flex items-center gap-1.5 text-slate-400 min-w-0">
          <BadgeCheck className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="shrink-0">Razorpay</span>
          <span className="font-mono text-slate-300 truncate">{item.paymentReference}</span>
        </div>
      )}
    </div>
  );

  const renderItems = (item: Order) => {
    const displayItems = item.orderItems?.length
      ? item.orderItems.map((oi) => ({
          name: oi.menu_items?.food_name || oi.item_name || 'Item',
          quantity: oi.quantity || 1,
          unit_price: oi.unit_price || 0,
          total_price: oi.total_price || (oi.quantity || 0) * (oi.unit_price || 0),
          canteen_id: oi.canteen_id || null,
        }))
      : item.items?.length
        ? item.items.map((it) => ({
            name: it.name || 'Item',
            quantity: it.quantity || 1,
            unit_price: it.price || 0,
            total_price: (it.quantity || 0) * (it.price || 0),
            canteen_id: null,
          }))
        : [];

    if (!displayItems.length) return null;

    const total = displayItems.reduce((s, di) => s + di.total_price, 0);

    return (
      <div className="space-y-1.5">
        {displayItems.map((orderItem, index) => (
          <div key={`${item.id}-${index}`} className="flex justify-between gap-3 rounded-lg bg-slate-900/70 px-2.5 py-1.5 text-[11px]">
            <span className="text-slate-200 flex-1 min-w-0">{orderItem.name}</span>
            {orderItem.canteen_id && counterById[orderItem.canteen_id] && (
              <span className="text-[10px] text-slate-400 ml-1 rounded bg-slate-800/50 text-amber-400 px-1 py-0.5">
                {counterById[orderItem.canteen_id]}
              </span>
            )}
            <span className="text-slate-400 shrink-0">x{orderItem.quantity}</span>
            <span className="text-slate-400 shrink-0">₹{orderItem.unit_price} each</span>
          </div>
        ))}
        <div className="border-t border-slate-700/60 pt-1.5 flex justify-between text-[11px]">
          <span className="text-slate-400 font-semibold">TOTAL</span>
          <span className="text-emerald-400 font-mono font-bold">₹{total.toFixed(0)}</span>
        </div>
      </div>
    );
  };

  const renderCard = (
    item: Order,
    tone: 'amber' | 'orange' | 'cyan' | 'emerald' | 'green' | 'red',
    action?: React.ReactNode
  ) => {
    const border = {
      amber: 'border-slate-800/80 hover:border-amber-500/40',
      orange: 'border-orange-500/30',
      cyan: 'border-cyan-500/30',
      emerald: 'border-emerald-500/30',
      green: 'border-green-500/20',
      red: 'border-red-500/30',
    }[tone];
    const text = {
      amber: 'text-amber-400',
      orange: 'text-orange-400',
      cyan: 'text-cyan-300',
      emerald: 'text-emerald-400',
      green: 'text-green-400',
      red: 'text-red-400',
    }[tone];

    return (
      <div key={item.id} className={`p-4 rounded-xl bg-slate-950 border ${border} space-y-3 shadow-lg transition-all`}>
        <div className="flex items-center justify-between gap-3">
          <span className={`font-mono font-bold text-sm ${text}`}>{item.orderNumber || ''}</span>
          <div className="flex items-center gap-2">
            {renderStatusBadge(item)}
            {item.isPriority && (
              <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold uppercase flex items-center space-x-1">
                <Flame className="w-3 h-3 text-red-400" />
                <span>Priority</span>
              </span>
            )}
          </div>
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

  const renderIncomingActions = (item: Order) => {
    const isUpdating = updatingOrderId === item.id;

    const cancelRemainingMs = getCancelRemainingMs(item);
    const cancelAction = cancelRemainingMs > 0 ? (
      <button
        onClick={() => onUpdateOrderStatus(item.id, 'cancelled')}
        disabled={isUpdating}
        className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>Cancel Order</span>
        <span className="px-1.5 py-0.5 rounded bg-red-500/20 font-mono text-[10px]">
          {Math.ceil(cancelRemainingMs / 1000)}s
        </span>
      </button>
    ) : (
      <div className="w-full py-2 rounded-xl bg-red-500/5 text-red-400/70 border border-red-500/10 text-[10px] font-semibold flex items-center justify-center space-x-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>{CANCEL_BLOCK_MESSAGE}</span>
      </div>
    );

    return (
      <div className="space-y-2">
        <button
          onClick={() => onUpdateOrderStatus(item.id, 'confirmed')}
          disabled={isUpdating}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs tracking-wide transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
        >
          {isUpdating ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <BadgeCheck className="w-4 h-4" />
              <span>CONFIRM ORDER</span>
            </>
          )}
        </button>
        {cancelAction}
      </div>
    );
  };

  const renderConfirmedAction = (item: Order) => {
    const isUpdating = updatingOrderId === item.id;
    return (
      <button
        onClick={() => onUpdateOrderStatus(item.id, 'preparing')}
        disabled={isUpdating}
        className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? (
          <>
            <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
            <span>Starting...</span>
          </>
        ) : (
          <>
            <ChefHat className="w-4 h-4" />
            <span>Start Preparing</span>
          </>
        )}
      </button>
    );
  };

  const renderPreparingAction = (item: Order) => {
    const elapsedSeconds = getElapsedSeconds(item);
    const prepSeconds = Math.max((item.estimatedWaitMins || 1) * 60, 1);
    const progressPct = Math.min(100, Math.floor((elapsedSeconds / prepSeconds) * 100));
    const isUpdating = updatingOrderId === item.id;
    return (
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {formatSeconds(elapsedSeconds)}</span>
            <span className="font-mono">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-1000" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <button
          onClick={() => onUpdateOrderStatus(item.id, 'ready')}
          disabled={isUpdating}
          className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('kitchen.ready')}</span>
            </>
          )}
        </button>
      </div>
    );
  };

  const renderReadyAction = (item: Order) => {
    const isUpdating = updatingOrderId === item.id;
    return (
      <button
        onClick={() => onUpdateOrderStatus(item.id, 'completed')}
        disabled={isUpdating}
        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdating ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-transparent animate-spin" />
            <span>Updating...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Complete Pickup</span>
          </>
        )}
      </button>
    );
  };

  const preparingCount = confirmedItems.length + preparingItems.length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white">{t('kitchen.title')}</h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold animate-pulse">
              {t('kitchen.live')}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {t('kitchen.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Incoming Queue: <strong className="text-amber-400 font-mono">{incomingItems.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Preparing: <strong className="text-cyan-400 font-mono">{preparingCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Ready: <strong className="text-emerald-400 font-mono">{readyItems.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Completed: <strong className="text-green-400 font-mono">{completedItems.length}</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* INCOMING QUEUE */}
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">Incoming Queue ({incomingItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">paid • awaiting confirmation</span>
          </div>
          <div className="space-y-3 min-h-[400px]">
            {incomingItems.map((item) => renderCard(item, 'amber', renderIncomingActions(item)))}
            {incomingItems.length === 0 && <div className="py-16 text-center text-slate-500 text-xs italic">No paid orders waiting for confirmation.</div>}
          </div>
        </section>

        {/* PREPARING */}
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Preparing ({preparingCount})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">confirmed / preparing</span>
          </div>
          <div className="space-y-3 min-h-[400px]">
            {confirmedItems.map((item) => renderCard(item, 'orange', renderConfirmedAction(item)))}
            {preparingItems.map((item) => renderCard(item, 'cyan', renderPreparingAction(item)))}
            {preparingCount === 0 && <div className="py-16 text-center text-slate-500 text-xs italic">{t('kitchen.no_orders_preparing')}</div>}
          </div>
        </section>

        {/* READY COUNTER */}
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Ready Counter ({readyItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">awaiting pickup</span>
          </div>
          <div className="space-y-3 min-h-[400px]">
            {readyItems.map((item) => renderCard(item, 'emerald', renderReadyAction(item)))}
            {readyItems.length === 0 && <div className="py-16 text-center text-slate-500 text-xs italic">{t('kitchen.no_orders_ready')}</div>}
          </div>
        </section>

        {/* COMPLETED */}
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-green-400">Completed ({completedItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">picked up</span>
          </div>
          <div className="space-y-3 min-h-[400px]">
            {completedItems.map((item) => renderCard(item, 'green'))}
            {completedItems.length === 0 && <div className="py-16 text-center text-slate-500 text-xs italic">{t('kitchen.no_completed_pickups')}</div>}
          </div>
        </section>
      </div>

      {cancelledItems.length > 0 && (
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-red-400">{t('kitchen.cancelled')} ({cancelledItems.length})</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{t('kitchen.cancelled')}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {cancelledItems.map((item) => renderCard(item, 'red'))}
          </div>
        </section>
      )}
    </div>
  );
};