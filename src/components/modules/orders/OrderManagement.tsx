import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Search,
  Clock,
  QrCode,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Store,
  GraduationCap,
  Mail,
  Smartphone,
  CalendarClock,
  CreditCard,
  PackageOpen,
  Hash,
  KeyRound,
  Zap,
  Building2,
  AlertTriangle,
  ChefHat,
  Bell,
  ChevronRight,
  Timer,
} from 'lucide-react';
import { Order, OrderStatus, Counter } from '../../../types';
import { isWithinCancelWindow, getCancelRemainingMs, CANCEL_BLOCK_MESSAGE, getOrderStatusLabel, getStatusHistoryLabel } from '../../../lib/orderUtils';

interface OrderManagementProps {
  orders: Order[];
  currentInstitution?: { name: string; institution_code: string; campus?: string };
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onFetchOrderDetails?: (orderId: string) => Promise<Order | null>;
  onOpenQRScanner: () => void;
  counters?: Counter[];
}

const PIPELINE_SECTIONS = [
  { id: 'incoming', label: 'INCOMING QUEUE', statuses: ['pending', 'awaiting_confirmation'] as OrderStatus[], color: 'amber', icon: <Bell className="w-4 h-4" /> },
  { id: 'confirmed', label: 'CONFIRMED', statuses: ['confirmed'] as OrderStatus[], color: 'orange', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'preparing', label: 'PREPARING', statuses: ['preparing'] as OrderStatus[], color: 'cyan', icon: <ChefHat className="w-4 h-4" /> },
  { id: 'ready', label: 'READY COUNTER', statuses: ['ready'] as OrderStatus[], color: 'emerald', icon: <Zap className="w-4 h-4" /> },
  { id: 'completed', label: 'COMPLETED', statuses: ['completed'] as OrderStatus[], color: 'green', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'cancelled', label: 'CANCELLED', statuses: ['cancelled'] as OrderStatus[], color: 'red', icon: <XCircle className="w-4 h-4" /> },
] as const;

const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; glow: string }> = {
  amber:   { bg: 'bg-amber-500/5',  border: 'border-amber-500/20',  text: 'text-amber-400',  badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',  glow: 'shadow-amber-500/10' },
  orange:  { bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400', glow: 'shadow-orange-500/10' },
  cyan:    { bg: 'bg-cyan-500/5',   border: 'border-cyan-500/20',   text: 'text-cyan-400',   badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',   glow: 'shadow-cyan-500/10' },
  emerald: { bg: 'bg-emerald-500/5',border: 'border-emerald-500/20',text: 'text-emerald-400',badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', glow: 'shadow-emerald-500/10' },
  green:   { bg: 'bg-green-500/5',  border: 'border-green-500/20',  text: 'text-green-400',  badge: 'bg-green-500/10 border-green-500/20 text-green-400',  glow: 'shadow-green-500/10' },
  red:     { bg: 'bg-red-500/5',    border: 'border-red-500/20',    text: 'text-red-400',    badge: 'bg-red-500/10 border-red-500/20 text-red-400',    glow: 'shadow-red-500/10' },
};

const getRoleBadge = (role?: string) => {
  const normalized = (role || '').toLowerCase();
  if (normalized === 'student') return { icon: '🎓', label: 'Student', cls: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' };
  if (normalized === 'faculty') return { icon: '👨‍🏫', label: 'Faculty', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
  if (normalized === 'guest')   return { icon: '👤', label: 'Guest', cls: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
  return null;
};

const formatTime = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' });
};

const timeAgo = (value?: string): string => {
  if (!value) return '';
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return '';
  const secs = Math.floor((Date.now() - t) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

function OrderCard({
  order,
  sectionId,
  onAction,
  onView,
  onCancel,
  counterById,
  now,
}: {
  order: Order;
  sectionId: string;
  onAction: (id: string, status: OrderStatus) => void;
  onView: (id: string) => void;
  onCancel: (id: string) => void;
  counterById: Record<string, string>;
  now: number;
}) {
  const roleBadge = getRoleBadge(order.userRole);
  const displayItems = order.orderItems?.length
    ? order.orderItems.map(oi => ({
        name: oi.menu_items?.food_name || oi.item_name || 'Item',
        quantity: oi.quantity || 1,
        price: oi.total_price || 0,
      }))
    : (order.items || []).map(it => ({ name: it.name || 'Item', quantity: it.quantity || 1, price: it.price || 0 }));

  return (
    <div className={`rounded-2xl border ${sectionId === 'incoming' ? 'border-amber-500/20 bg-amber-500/[0.03]' : 'border-slate-800 bg-slate-900/80'} shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl`}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-amber-400 text-sm">{order.orderNumber}</span>
              {roleBadge && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadge.cls}`}>
                  {roleBadge.icon} {roleBadge.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <User className="w-3 h-3 text-slate-500" />
              <span className="text-xs font-semibold text-slate-200">{order.studentName || 'Student'}</span>
              {order.userEmail && <span className="text-[10px] text-slate-500 truncate">{order.userEmail}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono font-bold text-emerald-400 text-sm">₹{(order.totalAmount || 0).toFixed(0)}</div>
            <div className="text-[10px] text-slate-500">{timeAgo(order.orderTime || order.created_at)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {sectionId === 'incoming' && (
            <>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase">
                ✓ PAYMENT RECEIVED
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase animate-pulse">
                AWAITING CONFIRMATION
              </span>
            </>
          )}
          {sectionId === 'confirmed' && (
            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold uppercase">
              ✓ CONFIRMED — AWAITING PREPARATION
            </span>
          )}
          {sectionId === 'preparing' && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold uppercase animate-pulse">
              🔥 PREPARING NOW
            </span>
          )}
          {sectionId === 'ready' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase">
              ✓ READY FOR PICKUP
            </span>
          )}
          {sectionId === 'completed' && (
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold uppercase">
              ✓ COMPLETED
            </span>
          )}
          {sectionId === 'cancelled' && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase">
              ✕ CANCELLED
            </span>
          )}
          {order.paymentStatus === 'paid' && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              PAID
            </span>
          )}
        </div>

        {displayItems.length > 0 && (
          <div className="space-y-1">
            {displayItems.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs text-slate-400">
                <span>{item.quantity}× {item.name}</span>
                <span className="font-mono text-slate-300">₹{item.price.toFixed(0)}</span>
              </div>
            ))}
            {displayItems.length > 3 && (
              <span className="text-[10px] text-slate-500">+{displayItems.length - 3} more items</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
          {order.tokenNumber && (
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" /> Token: <span className="font-mono font-bold text-slate-300">{order.tokenNumber}</span>
            </span>
          )}
          {order.pickupCode && (
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3" /> Code: <span className="font-mono font-bold text-slate-300">{order.pickupCode}</span>
            </span>
          )}
          {order.pickupCounter && (
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3" /> {order.pickupCounter}
            </span>
          )}
        </div>
      </div>

      <div className={`px-4 py-3 border-t ${sectionId === 'incoming' ? 'border-amber-500/10' : 'border-slate-800'} flex flex-wrap gap-2`}>
        {sectionId === 'incoming' && (
          <>
            <button
              onClick={() => onAction(order.id, 'confirmed')}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:shadow-amber-500/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              CONFIRM ORDER
            </button>
            {!['completed', 'cancelled'].includes(order.status) && getCancelRemainingMs(order) > 0 && (
              <button
                onClick={() => onCancel(order.id)}
                className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span className="font-mono">{Math.ceil(getCancelRemainingMs(order) / 1000)}s</span>
              </button>
            )}
          </>
        )}
        {sectionId === 'confirmed' && (
          <button
            onClick={() => onAction(order.id, 'preparing')}
            className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <ChefHat className="w-4 h-4" />
            START PREPARING
          </button>
        )}
        {sectionId === 'preparing' && (
          <button
            onClick={() => onAction(order.id, 'ready')}
            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Zap className="w-4 h-4" />
            MARK READY
          </button>
        )}
        {sectionId === 'ready' && (
          <button
            onClick={() => onAction(order.id, 'completed')}
            className="flex-1 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            MARK COMPLETED
          </button>
        )}
        <button
          onClick={() => onView(order.id)}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          Details
        </button>
      </div>
    </div>
  );
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  currentInstitution,
  onUpdateOrderStatus,
  onFetchOrderDetails,
  onOpenQRScanner,
  counters,
}) => {
  const [activeSection, setActiveSection] = useState<string>('incoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [extraDetails, setExtraDetails] = useState<Order | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const prevOrderCountRef = useRef(0);
  const toastIdRef = useRef(0);

  const counterById = useMemo(() => {
    const map: Record<string, string> = {};
    (counters || []).forEach((c: any) => { map[c.id] = c.name || ''; });
    return map;
  }, [counters]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const safeOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);

  useEffect(() => {
    if (prevOrderCountRef.current > 0 && safeOrders.length > prevOrderCountRef.current) {
      const newest = safeOrders[0];
      if (newest) {
        toastIdRef.current += 1;
        setToast({ message: `New FOODEXA Order Received — #${newest.orderNumber || newest.id?.slice(0, 8)}`, id: toastIdRef.current });
        setTimeout(() => setToast(null), 5000);
      }
    }
    prevOrderCountRef.current = safeOrders.length;
  }, [safeOrders]);

  useEffect(() => {
    if (selectedOrderId && onFetchOrderDetails) {
      let cancelled = false;
      setExtraDetails(null);
      onFetchOrderDetails(selectedOrderId)
        .then((d) => { if (!cancelled) setExtraDetails(d); })
        .catch(() => { if (!cancelled) setExtraDetails(null); });
      return () => { cancelled = true; };
    }
    setExtraDetails(null);
  }, [selectedOrderId, onFetchOrderDetails]);

  const selectedOrder = useMemo(
    () => safeOrders.find((o) => o.id === selectedOrderId) || null,
    [safeOrders, selectedOrderId]
  );
  const viewOrder = selectedOrder ? { ...selectedOrder, ...(extraDetails || {}) } : null;

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_SECTIONS.forEach(s => { counts[s.id] = 0; });
    safeOrders.forEach(o => {
      for (const s of PIPELINE_SECTIONS) {
        if (s.statuses.includes(o.status as OrderStatus)) {
          counts[s.id]++;
          break;
        }
      }
    });
    return counts;
  }, [safeOrders]);

  const filteredOrders = useMemo(() => {
    return safeOrders.filter((o) => {
      const active = PIPELINE_SECTIONS.find(s => s.id === activeSection);
      const matchesSection = active ? active.statuses.includes(o.status as OrderStatus) : true;
      const matchesSearch =
        (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.pickupCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.tokenNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSection && matchesSearch;
    });
  }, [safeOrders, activeSection, searchTerm]);

  return (
    <div className="space-y-5 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white">Order Management</h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold animate-pulse">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {safeOrders.length} total order{safeOrders.length !== 1 ? 's' : ''} — Real-time Supabase stream.
          </p>
        </div>
        <button
          onClick={onOpenQRScanner}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2 shrink-0"
        >
          <QrCode className="w-4 h-4" />
          <span>QR Pickup Scanner</span>
        </button>
      </div>

      {safeOrders.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center">
            <PackageOpen className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-200">No orders yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Orders from students will appear here in real-time once they place them through the student app.
            </p>
          </div>
          <button
            onClick={onOpenQRScanner}
            className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-colors"
          >
            Launch QR Scanner
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PIPELINE_SECTIONS.map((section) => {
              const colors = SECTION_COLORS[section.color];
              const count = sectionCounts[section.id] || 0;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`p-3 rounded-xl border transition-all text-center ${
                    isActive
                      ? `${colors.bg} ${colors.border} ${colors.glow} shadow-lg`
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`flex items-center justify-center gap-1.5 mb-1 ${isActive ? colors.text : 'text-slate-500'}`}>
                    {section.icon}
                    <span className="text-[9px] font-bold uppercase tracking-wider">{section.label}</span>
                  </div>
                  <div className={`text-2xl font-black ${isActive ? colors.text : 'text-slate-400'}`}>
                    {count}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order #, student name, token, pickup code..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/80 border border-slate-800">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-semibold">No orders in this section</p>
                <button
                  onClick={() => setActiveSection('incoming')}
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-bold"
                >
                  View Incoming Queue
                </button>
              </div>
            ) : (
              <div className={`grid gap-3 ${activeSection === 'incoming' ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    sectionId={activeSection}
                    onAction={(id, status) => { onUpdateOrderStatus(id, status); }}
                    onView={(id) => setSelectedOrderId(id)}
                    onCancel={(id) => { onUpdateOrderStatus(id, 'cancelled'); }}
                    counterById={counterById}
                    now={now}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {viewOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Order {viewOrder.orderNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {getOrderStatusLabel(viewOrder.status)}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Placed at {viewOrder.orderTime || viewOrder.created_at || ''}</p>
              </div>
              <button onClick={() => setSelectedOrderId(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Student</div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300"><User className="w-3.5 h-3.5 text-slate-500" /><span className="font-semibold text-slate-200">{viewOrder.studentName || ''}</span></div>
                <div className="flex items-center gap-2 text-slate-300"><GraduationCap className="w-3.5 h-3.5 text-slate-500" /><span className="font-semibold">ID: {viewOrder.studentId || ''}</span></div>
                <div className="flex items-center gap-2 text-slate-400"><Mail className="w-3.5 h-3.5 text-slate-500" /><span>{viewOrder.userEmail || ''}</span></div>
                <div className="flex items-center gap-2 text-slate-400"><Smartphone className="w-3.5 h-3.5 text-slate-500" /><span>{viewOrder.userPhone || ''}</span></div>
                <div className="flex items-center gap-2 text-slate-400"><Building2 className="w-3.5 h-3.5 text-slate-500" /><span>{viewOrder.institutionName || currentInstitution?.name || ''}</span></div>
                <div className="flex items-center gap-2 text-slate-400"><Store className="w-3.5 h-3.5 text-slate-500" /><span>{viewOrder.vendorName || viewOrder.pickupCounter || ''}</span></div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Order Info</div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20`}>{getOrderStatusLabel(viewOrder.status)}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Kitchen</span><span className="text-slate-200 font-medium">{viewOrder.kitchenStatus || ''}</span></div>
                <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Counter</span><span className="text-slate-200 font-medium">{viewOrder.counterStatus || ''}</span></div>
                <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Token</span><span className="font-mono font-bold text-slate-200">{viewOrder.tokenNumber || ''}</span></div>
                <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Pickup Code</span><span className="font-mono font-bold text-slate-200">{viewOrder.pickupCode || ''}</span></div>
                <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Placed At</span><span className="font-mono text-slate-200">{formatTime(viewOrder.orderTime || viewOrder.created_at || '')}</span></div>
                {viewOrder.confirmedAt && <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Confirmed At</span><span className="font-mono text-slate-200">{formatTime(viewOrder.confirmedAt)}</span></div>}
                {viewOrder.confirmedByName && <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Confirmed By</span><span className="text-slate-200">{viewOrder.confirmedByName}</span></div>}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-500" />Payment</div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${String(viewOrder.paymentStatus || '').toLowerCase() === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{viewOrder.paymentStatus || '—'}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Method</span><span className="text-slate-200 font-medium">Razorpay</span></div>
                <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Payment ID</span><span className="font-mono text-slate-200 truncate">{viewOrder.razorpayPaymentId || '—'}</span></div>
                <div className="flex items-start gap-2 text-slate-300"><span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 shrink-0">Amount</span><span className="font-mono font-bold text-emerald-400">₹{(viewOrder.totalAmount || 0).toFixed(2)}</span></div>
              </div>
            </div>

            {viewOrder.statusHistory && viewOrder.statusHistory.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Status History</div>
                <div className="space-y-1.5">
                  {viewOrder.statusHistory
                    .slice()
                    .sort((a, b) => new Date(a.changed_at || a.changedAt || 0).getTime() - new Date(b.changed_at || b.changedAt || 0).getTime())
                    .map((h, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="font-semibold text-slate-200 capitalize">{getStatusHistoryLabel(h.status)}</span>
                          {h.changed_by_name && <span className="text-[10px] text-slate-500 truncate">by {h.changed_by_name}</span>}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">{formatTime(h.changed_at || h.changedAt || '')}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">QR Code</div>
              <div className="p-3 rounded-xl bg-white text-slate-950 flex flex-col items-center justify-center text-center space-y-1.5 border border-slate-300">
                <QrCode className="w-16 h-16 text-slate-950" />
                <div className="font-mono font-black text-xs tracking-widest text-slate-900">{viewOrder.qrCodeData || viewOrder.pickupCode || ''}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Items</div>
              {(() => {
                const displayItems = viewOrder.orderItems?.length
                  ? viewOrder.orderItems.map((oi) => ({
                      name: oi.menu_items?.food_name || oi.item_name || 'Item',
                      quantity: oi.quantity || 1,
                      unit_price: oi.unit_price || 0,
                      total_price: oi.total_price || (oi.quantity || 0) * (oi.unit_price || 0),
                      canteen_id: oi.menu_items?.canteen_id || null,
                    }))
                  : (viewOrder.items || []).map((it) => ({
                      name: it.name || 'Item',
                      quantity: it.quantity || 1,
                      unit_price: it.price || 0,
                      total_price: (it.quantity || 0) * (it.price || 0),
                      canteen_id: null,
                    }));
                if (!displayItems.length) return <div className="text-xs text-slate-500">No items.</div>;
                return (
                  <div className="space-y-2">
                    {displayItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between gap-2">
                        <span className="text-slate-200 text-xs">
                          {item.quantity}x {item.name}
                          {item.canteen_id && counterById[item.canteen_id] && (
                            <span className="text-[10px] text-amber-400 ml-1 bg-slate-800/50 px-1 py-0.5 rounded">{counterById[item.canteen_id]}</span>
                          )}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold text-xs">₹{item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase">Total</span>
                <span className="font-mono font-bold text-emerald-400">₹{(viewOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
              {['pending', 'awaiting_confirmation'].includes(viewOrder.status) && (
                <button
                  onClick={() => { onUpdateOrderStatus(viewOrder.id, 'confirmed'); setSelectedOrderId(null); }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Order</span>
                </button>
              )}
              {viewOrder.status === 'confirmed' && (
                <button
                  onClick={() => { onUpdateOrderStatus(viewOrder.id, 'preparing'); setSelectedOrderId(null); }}
                  className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>Start Preparing</span>
                </button>
              )}
              {viewOrder.status === 'preparing' && (
                <button
                  onClick={() => { onUpdateOrderStatus(viewOrder.id, 'ready'); setSelectedOrderId(null); }}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Mark Ready
                </button>
              )}
              {viewOrder.status === 'ready' && (
                <button
                  onClick={() => { onUpdateOrderStatus(viewOrder.id, 'completed'); setSelectedOrderId(null); }}
                  className="flex-1 py-2 rounded-xl bg-indigo-500 text-white font-bold text-xs"
                >
                  Complete Pickup
                </button>
              )}
              {!['completed', 'cancelled'].includes(viewOrder.status) && (
                isWithinCancelWindow(viewOrder) ? (
                  <button
                    onClick={() => { onUpdateOrderStatus(viewOrder.id, 'cancelled'); setSelectedOrderId(null); }}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                ) : (
                  <div className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {CANCEL_BLOCK_MESSAGE}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl shadow-amber-500/30 border border-amber-400">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
