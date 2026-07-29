import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  QrCode,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronRight,
  User,
  Store,
  DollarSign,
  GraduationCap,
  UserCheck,
  UserX,
  Building2,
  MapPin,
  Smartphone,
  Mail,
  CalendarClock,
  CreditCard,
  Loader2,
  PackageOpen,
  AlertTriangle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Order, OrderStatus } from '../../../types';

interface OrderManagementProps {
  orders: Order[];
  currentInstitution?: { name: string; institution_code: string; campus?: string };
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onOpenQRScanner: () => void;
}

const STATUS_TABS: { id: string; label: string; color: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Orders', color: 'text-slate-300', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { id: 'pending', label: 'Pending', color: 'text-amber-400', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'accepted', label: 'Accepted', color: 'text-indigo-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { id: 'preparing', label: 'Preparing', color: 'text-cyan-400', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'ready', label: 'Ready', color: 'text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { id: 'completed', label: 'Completed', color: 'text-green-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { id: 'cancelled', label: 'Cancelled', color: 'text-red-400', icon: <XCircle className="w-3.5 h-3.5" /> },
];

const getRoleBadge = (role?: string) => {
  const normalized = (role || '').toLowerCase();
  if (normalized === 'student') {
    return { icon: '🎓', label: 'Student', cls: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' };
  }
  if (normalized === 'faculty') {
    return { icon: '👨‍🏫', label: 'Faculty', cls: 'bg-purple-500/10 text-purple-300 border-purple-500/20' };
  }
  if (normalized === 'guest') {
    return { icon: '👤', label: 'Guest', cls: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
  }
  return null;
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    case 'accepted': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    case 'preparing': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
    case 'ready': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    case 'completed': return 'bg-green-500/10 text-green-400 border border-green-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-400 border border-red-500/20';
    default: return 'bg-slate-800 text-slate-400 border border-slate-700';
  }
};

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  currentInstitution,
  onUpdateOrderStatus,
  onOpenQRScanner
}) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);

  const safeOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);

  const filteredOrders = useMemo(() => {
    return safeOrders.filter((o) => {
      const matchesStatus = activeStatusFilter === 'all' || o.status === activeStatusFilter;
      const matchesRole = activeRoleFilter === 'all' || (o.userRole || '').toLowerCase() === activeRoleFilter;
      const matchesSearch =
        (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.pickupCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.userRole || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [safeOrders, activeStatusFilter, activeRoleFilter, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: safeOrders.length };
    safeOrders.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [safeOrders]);

  const roleCounts = useMemo(() => {
    return safeOrders.reduce((acc, o) => {
      const r = (o.userRole || 'unknown').toLowerCase();
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [safeOrders]);

  if (safeOrders.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white">Order Management</h1>
            <p className="text-xs text-slate-400">Real-time campus order stream and pickup management.</p>
          </div>
          <button
            onClick={onOpenQRScanner}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2 shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>QR Pickup Scanner</span>
          </button>
        </div>
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
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white">Order Management</h1>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold animate-pulse">
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {safeOrders.length} total order{safeOrders.length !== 1 ? 's' : ''} — Real-time campus order stream with pickup verification.
          </p>
        </div>

        <button
          onClick={onOpenQRScanner}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2 shrink-0"
        >
          <QrCode className="w-4 h-4" />
          <span>Launch Express QR Pickup Scanner</span>
        </button>
      </div>

      {/* Status Tabs & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all flex items-center space-x-1.5 ${
                  activeStatusFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                  activeStatusFilter === tab.id ? 'bg-slate-950/20' : 'bg-slate-800/60'
                }`}>
                  {statusCounts[tab.id] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={activeRoleFilter}
              onChange={(e) => setActiveRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Student ({roleCounts.student || 0})</option>
              <option value="faculty">Faculty ({roleCounts.faculty || 0})</option>
              <option value="guest">Guest ({roleCounts.guest || 0})</option>
            </select>
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Order #</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Counter</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Pickup Time</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Search className="w-8 h-8 text-slate-600" />
                      <p className="text-sm text-slate-500 font-semibold">No orders match your filters</p>
                      <button
                        onClick={() => { setActiveStatusFilter('all'); setActiveRoleFilter('all'); setSearchTerm(''); }}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const roleBadge = getRoleBadge(ord.userRole);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                        {ord.orderNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100">{ord.studentName || '—'}</div>
                        <div className="text-[10px] text-slate-500">{ord.studentDepartment || ''}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {roleBadge && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.cls}`}>
                            <span>{roleBadge.icon}</span>
                            <span>{roleBadge.label}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 font-medium">
                        {ord.pickupCounter || '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">
                        ₹{(ord.totalAmount || 0).toFixed(0)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        <div className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          <span>{ord.pickupTimeEstimated || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(ord.status)}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedOrderModal(ord)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Order {selectedOrderModal.orderNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedOrderModal.status)}`}>
                    {selectedOrderModal.status}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Placed at {selectedOrderModal.orderTime || '—'}</p>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Info */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Customer</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-200">{selectedOrderModal.studentName || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-sm">{getRoleBadge(selectedOrderModal.userRole)?.icon || '👤'}</span>
                  <span className="font-semibold">{getRoleBadge(selectedOrderModal.userRole)?.label || selectedOrderModal.userRole || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedOrderModal.userEmail || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedOrderModal.userPhone || '—'}</span>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Order Info</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Store className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedOrderModal.vendorName || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span className="capitalize">{selectedOrderModal.paymentStatus || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pickup: {selectedOrderModal.pickupTimeEstimated || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono">
                  <span className="text-amber-400 font-bold">{selectedOrderModal.pickupCounter || '—'}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Timeline</div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 relative">
                <div className="flex flex-col items-center z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">✓</div>
                  <span className="mt-1">Placed</span>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    ['accepted', 'preparing', 'ready', 'completed'].includes(selectedOrderModal.status)
                      ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}>2</div>
                  <span className="mt-1">Accepted</span>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    ['preparing', 'ready', 'completed'].includes(selectedOrderModal.status)
                      ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}>3</div>
                  <span className="mt-1">Preparing</span>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    ['ready', 'completed'].includes(selectedOrderModal.status)
                      ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}>4</div>
                  <span className="mt-1">Ready</span>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    selectedOrderModal.status === 'completed'
                      ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                  }`}>5</div>
                  <span className="mt-1">Picked Up</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-300 uppercase tracking-wider">Items</div>
              {(Array.isArray(selectedOrderModal.items) ? selectedOrderModal.items : []).map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
                  <span className="text-slate-200">{item.quantity || 0}x {item.name || 'Item'}</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Status Change Buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
              {selectedOrderModal.status === 'pending' && (
                <button
                  onClick={() => { onUpdateOrderStatus(selectedOrderModal.id, 'accepted'); setSelectedOrderModal(null); }}
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Accept Order
                </button>
              )}
              {(selectedOrderModal.status === 'pending' || selectedOrderModal.status === 'accepted') && (
                <button
                  onClick={() => { onUpdateOrderStatus(selectedOrderModal.id, 'preparing'); setSelectedOrderModal(null); }}
                  className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                >
                  Start Preparing
                </button>
              )}
              {(selectedOrderModal.status === 'preparing' || selectedOrderModal.status === 'accepted') && (
                <button
                  onClick={() => { onUpdateOrderStatus(selectedOrderModal.id, 'ready'); setSelectedOrderModal(null); }}
                  className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Mark Ready
                </button>
              )}
              {selectedOrderModal.status === 'ready' && (
                <button
                  onClick={() => { onUpdateOrderStatus(selectedOrderModal.id, 'completed'); setSelectedOrderModal(null); }}
                  className="flex-1 py-2 rounded-xl bg-indigo-500 text-white font-bold text-xs"
                >
                  Complete Pickup
                </button>
              )}
              {!['completed', 'cancelled'].includes(selectedOrderModal.status) && (
                <button
                  onClick={() => { onUpdateOrderStatus(selectedOrderModal.id, 'cancelled'); setSelectedOrderModal(null); }}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-xs"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
