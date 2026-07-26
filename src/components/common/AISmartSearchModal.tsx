import React, { useState } from 'react';
import { Search, Sparkles, X, User, ShoppingBag, Store, FileText, ArrowRight } from 'lucide-react';
import { Student, Order, Vendor, MenuItem } from '../../types';

interface AISmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  orders: Order[];
  vendors: Vendor[];
  menuItems: MenuItem[];
  onSelectResult: (type: string, item: any) => void;
}

export const AISmartSearchModal: React.FC<AISmartSearchModalProps> = ({
  isOpen,
  onClose,
  students,
  orders,
  vendors,
  menuItems,
  onSelectResult
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredStudents = q
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      )
    : students.slice(0, 2);

  const filteredOrders = q
    ? orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.studentName.toLowerCase().includes(q) ||
          o.pickupCode.includes(q)
      )
    : orders.slice(0, 2);

  const filteredVendors = q
    ? vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.campusBlock.toLowerCase().includes(q) ||
          v.outletType.toLowerCase().includes(q)
      )
    : vendors.slice(0, 2);

  const filteredMenu = q
    ? menuItems.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.vendorName.toLowerCase().includes(q)
      )
    : menuItems.slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/60">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="AI Smart Search: Try 'Alex CS2023', 'Order #FX-4801', 'Green Fork'..."
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5 text-xs">
          {!q && (
            <div className="text-[11px] font-medium text-slate-500 flex items-center space-x-1.5 pb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Suggested & Recent Cross-Entity Queries</span>
            </div>
          )}

          {/* Students Section */}
          {filteredStudents.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Students ({filteredStudents.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredStudents.map((std) => (
                  <button
                    key={std.id}
                    onClick={() => {
                      onSelectResult('student', std);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between text-left transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={std.avatar} alt={std.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <div className="font-semibold text-slate-200 group-hover:text-amber-400">{std.name}</div>
                        <div className="text-[11px] text-slate-400">{std.studentId} • {std.department}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders Section */}
          {filteredOrders.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Orders ({filteredOrders.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredOrders.map((ord) => (
                  <button
                    key={ord.id}
                    onClick={() => {
                      onSelectResult('order', ord);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between text-left transition-all group"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center space-x-2">
                        <span>{ord.orderNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                          Pickup QR: {ord.pickupCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{ord.studentName} • {ord.vendorName} • ${ord.totalAmount.toFixed(2)}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vendors Section */}
          {filteredVendors.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canteen Outlets ({filteredVendors.length})</span>
              </div>
              <div className="space-y-1.5">
                {filteredVendors.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSelectResult('vendor', v);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between text-left transition-all group"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-emerald-400">{v.name}</div>
                      <div className="text-[11px] text-slate-400">{v.outletType} • {v.campusBlock}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredStudents.length === 0 && filteredOrders.length === 0 && filteredVendors.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="font-medium text-slate-300">No cross-entity matches found for "{query}"</p>
              <p className="text-[11px] text-slate-500 mt-1">Try searching by student ID, order pickup code, or dish name.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Smart Search powered by Google Gemini 3.6</span>
          </div>
          <div className="font-mono text-[10px] text-slate-600">Press ESC to dismiss</div>
        </div>
      </div>
    </div>
  );
};
