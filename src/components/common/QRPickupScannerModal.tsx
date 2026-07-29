import React, { useState, useMemo } from 'react';
import { QrCode, CheckCircle2, AlertCircle, X, ShoppingBag, User } from 'lucide-react';
import { Order } from '../../types';

interface QRPickupScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onCompleteOrder: (orderId: string) => void;
}

export const QRPickupScannerModal: React.FC<QRPickupScannerModalProps> = ({
  isOpen,
  onClose,
  orders,
  onCompleteOrder
}) => {
  const [scannedCode, setScannedCode] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const safeOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);

  if (!isOpen) return null;

  const handleVerify = (codeToVerify: string) => {
    const clean = codeToVerify.trim().toLowerCase();
    const found = safeOrders.find(
      (o) =>
        (o.pickupCode || '').toLowerCase() === clean ||
        (o.orderNumber || '').toLowerCase() === clean ||
        (o.pickupNumber && o.pickupNumber.toLowerCase() === clean) ||
        (o.orderNumber || '').toLowerCase().includes(clean)
    );

    if (found) {
      setMatchedOrder(found);
      setStatusMsg(null);
    } else {
      setMatchedOrder(null);
      setStatusMsg('Invalid QR / Pickup Code. Please re-scan student app QR code.');
    }
  };

  const handleHandover = () => {
    if (matchedOrder) {
      onCompleteOrder(matchedOrder.id);
      setStatusMsg(`Order ${matchedOrder.orderNumber} successfully handed over!`);
      setTimeout(() => {
        setMatchedOrder(null);
        setScannedCode('');
        setStatusMsg(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm mb-1">
          <QrCode className="w-5 h-5" />
          <span>Express QR Pickup Verification</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Scan student app QR code or enter 4-digit pickup code for instant pickup verification.
        </p>

        {/* Scanner Simulation */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden mb-4">
          <div className="w-24 h-24 border-2 border-dashed border-amber-500/60 rounded-xl flex items-center justify-center bg-amber-500/5 relative">
            <QrCode className="w-12 h-12 text-amber-400 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 via-amber-500/20 to-amber-500/0 animate-scan" />
          </div>
           <span className="text-[11px] text-slate-500 mt-2 font-mono">QR Scanner Ready</span>
        </div>

        {/* Manual Pickup Code Input */}
        <div className="space-y-3 mb-4">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Enter Pickup Code / Order ID
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => {
                setScannedCode(e.target.value);
                if (e.target.value.length >= 4) {
                  handleVerify(e.target.value);
                }
              }}
               placeholder="Enter order pickup code"
               className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 text-sm font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleVerify(scannedCode)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
            >
              Verify
            </button>
          </div>
        </div>

        {/* Quick Pickup Codes */}
        <div className="mb-4">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1.5">
            Quick Pickup Codes:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {safeOrders.slice(0, 20).map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setScannedCode(o.pickupCode);
                  handleVerify(o.pickupCode);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
              >
                {o.pickupCode} ({o.studentName.split(' ')[0]})
              </button>
            ))}
          </div>
        </div>

        {/* Verification Result */}
        {matchedOrder && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 mb-4 animate-fade-in">
            <div className="flex items-center justify-between font-bold border-b border-emerald-500/20 pb-1.5">
              <span className="flex items-center space-x-1.5 font-mono text-amber-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{matchedOrder.orderNumber}</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-mono">
                {matchedOrder.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Pickup Counter</span>
                 <span className="font-bold text-amber-400 font-mono">{matchedOrder.pickupCounter || ''}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Pickup Number</span>
                <span className="font-bold text-cyan-300 font-mono">{matchedOrder.pickupNumber || matchedOrder.pickupCode}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-slate-200">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{matchedOrder.studentName} ({matchedOrder.studentDepartment})</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              <span>{(Array.isArray(matchedOrder.items) ? matchedOrder.items : []).map((i) => `${i.quantity || 0}x ${i.name || ''}`).join(', ')}</span>
            </div>

            <button
              onClick={handleHandover}
              className="w-full mt-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              Confirm Meal Handover & Complete Order
            </button>
          </div>
        )}

        {statusMsg && !matchedOrder && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
