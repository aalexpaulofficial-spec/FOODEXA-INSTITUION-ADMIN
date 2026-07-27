import React, { useState } from 'react';
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
  CreditCard
} from 'lucide-react';
import { Order, OrderStatus } from '../../../types';

interface OrderManagementProps {
  orders: Order[];
  currentInstitution?: { name: string; institution_code: string; campus?: string };
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onOpenQRScanner: () => void;
}

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

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = activeStatusFilter === 'all' || o.status === activeStatusFilter;
    const matchesRole = activeRoleFilter === 'all' || (o.userRole || '').toLowerCase() === activeRoleFilter;
    const matchesSearch =
      (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.pickupCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.userRole || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (currentInstitution?.institution_code || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesRole && matchesSearch;
  });

  const roleCounts = orders.reduce((acc, o) => {
    const r = (o.userRole || 'unknown').toLowerCase();
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Order Management</h1>
          <p className="text-xs text-slate-400">
            Real-time campus order stream, pickup status timeline, and QR code verification.
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

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            {['all', 'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setActiveStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                  activeStatusFilter === st
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
            <select
              value={activeRoleFilter}
              onChange={(e) => setActiveRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search order #, customer, email, vendor, role, code..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
        {activeRoleFilter !== 'all' && (
          <div className="text-[10px] text-slate-400">
            Showing {filteredOrders.length} order(s) with role <span className="text-amber-400 font-bold capitalize">{activeRoleFilter}</span>
          </div>
        )}
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
                <th className="px-4 py-3.5">Institution Code</th>
                <th className="px-4 py-3.5">Counter</th>
                <th className="px-4 py-3.5">Pickup Time</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((ord) => {
                const roleBadge = getRoleBadge(ord.userRole);
                return (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                      {ord.orderNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-100">{ord.studentName}</div>
                      <div className="text-[10px] text-slate-500">{ord.studentDepartment}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {roleBadge && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.cls}`}>
                          <span>{roleBadge.icon}</span>
                          <span>{roleBadge.label}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px]">
                      {currentInstitution?.institution_code || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 font-medium">
                      {ord.pickupCounter}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      <div className="flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" />
                        <span>{ord.pickupTimeEstimated}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ord.status === 'ready'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : ord.status === 'preparing'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedOrderModal(ord)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Timeline</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Timeline Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Order Details: {selectedOrderModal.orderNumber}</span>
                </h2>
                <p className="text-xs text-slate-400">Placed at {selectedOrderModal.orderTime}</p>
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
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Customer Information</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-200">{selectedOrderModal.studentName}</span>
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
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentInstitution?.name || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentInstitution?.campus || '—'}</span>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Order Information</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Store className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedOrderModal.vendorName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                  <span className="capitalize">{selectedOrderModal.paymentStatus}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pickup: {selectedOrderModal.pickupTimeEstimated}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono">
                  <span className="text-amber-400 font-bold">{selectedOrderModal.pickupCounter}</span>
                </div>
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Order Timeline Status
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 relative">
                <div className="flex flex-col items-center z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                    ✓
                  </div>
                  <span className="mt-1">Placed</span>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      ['preparing', 'ready', 'completed'].includes(selectedOrderModal.status)
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    2
                  </div>
                  <span className="mt-1">Preparing</span>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      ['ready', 'completed'].includes(selectedOrderModal.status)
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    3
                  </div>
                  <span className="mt-1">Ready</span>
                </div>
                <div className="flex flex-col items-center z-10">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      selectedOrderModal.status === 'completed'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    4
                  </div>
                  <span className="mt-1">Picked Up</span>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-300 uppercase tracking-wider">Purchased Items</div>
              {selectedOrderModal.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between"
                >
                  <span className="text-slate-200">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Status Change Buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  onUpdateOrderStatus(selectedOrderModal.id, 'ready');
                  setSelectedOrderModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Mark Ready
              </button>
              <button
                onClick={() => {
                  onUpdateOrderStatus(selectedOrderModal.id, 'completed');
                  setSelectedOrderModal(null);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
