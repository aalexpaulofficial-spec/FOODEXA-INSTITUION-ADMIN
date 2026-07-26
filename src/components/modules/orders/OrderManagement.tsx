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
  DollarSign
} from 'lucide-react';
import { Order, OrderStatus } from '../../../types';

interface OrderManagementProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onOpenQRScanner: () => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  onUpdateOrderStatus,
  onOpenQRScanner
}) => {
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = activeStatusFilter === 'all' || o.status === activeStatusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.pickupCode.includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

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
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order #, student, vendor, pickup code..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Canteen Vendor</th>
                <th className="px-4 py-3.5">Ordered Items</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Pickup Code</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                    {ord.orderNumber}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-100">{ord.studentName}</div>
                    <div className="text-[10px] text-slate-500">{ord.studentDepartment}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 font-medium">
                    {ord.vendorName}
                  </td>
                  <td className="px-4 py-3.5 max-w-xs truncate text-slate-400">
                    {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                    ${ord.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-cyan-300 font-bold">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {ord.pickupCode}
                    </span>
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
              ))}
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
