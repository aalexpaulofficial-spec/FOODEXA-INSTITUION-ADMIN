import React from 'react';
import {
  ShoppingBag,
  DollarSign,
  Users,
  Utensils,
  PlusCircle,
  UserCheck,
  Bell,
  FileSpreadsheet,
  BrainCircuit,
  Sparkles,
  QrCode,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Institution, Order, Vendor } from '../../../types';

interface HomeDashboardProps {
  currentInstitution: Institution;
  orders: Order[];
  vendors: Vendor[];
  onNavigate: (tab: string) => void;
  onOpenQRScanner: () => void;
}

const HOURLY_ORDER_DATA = [
  { time: '08:00 AM', orders: 120, revenue: 840 },
  { time: '09:00 AM', orders: 280, revenue: 1960 },
  { time: '10:00 AM', orders: 310, revenue: 2170 },
  { time: '11:00 AM', orders: 540, revenue: 3780 },
  { time: '12:00 PM', orders: 1250, revenue: 8750 },
  { time: '01:00 PM', orders: 980, revenue: 6860 },
  { time: '02:00 PM', orders: 420, revenue: 2940 },
  { time: '03:00 PM', orders: 210, revenue: 1470 },
  { time: '04:00 PM', orders: 360, revenue: 2520 }
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentInstitution,
  orders,
  vendors,
  onNavigate,
  onOpenQRScanner
}) => {
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="space-y-8 font-sans">
      {/* WELCOME BANNER */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900/40 via-zinc-900 to-zinc-900 border border-indigo-500/10 p-8 h-auto sm:h-52 flex flex-col justify-center shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none hidden sm:block">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-indigo-400">
            <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="50" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="z-10 relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>Operational Intelligence Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-white">
            Good morning, Administrator
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mb-6 leading-relaxed">
            Foodexa AI has processed last night's data for <span className="text-white font-medium">{currentInstitution.name}</span>. You have <span className="text-indigo-400 font-semibold">12 high-priority</span> operational insights and {vendors.filter(v => v.status === 'pending').length || 2} vendor requests.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('ai_center')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>View AI Center</span>
            </button>
            <button
              onClick={onOpenQRScanner}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-zinc-700 transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>Express Pickup Scanner</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-5 py-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-lg border border-zinc-800 transition-all"
            >
              Download PDF Reports
            </button>
          </div>
        </div>
      </section>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Today's Revenue</p>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold font-mono text-white">$12,482.00</span>
            <span className="text-emerald-500 text-[10px] font-bold pb-1">+12.4% ↑</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="w-[75%] h-full bg-emerald-500" />
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Active Students</p>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold font-mono text-white">3,842</span>
            <span className="text-emerald-500 text-[10px] font-bold pb-1">+4.2% ↑</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="w-[45%] h-full bg-indigo-500" />
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Meals Served</p>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold font-mono text-white">1,209</span>
            <span className="text-amber-500 text-[10px] font-bold pb-1">-2.1% ↓</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="w-[88%] h-full bg-amber-500" />
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Queue Status</p>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold text-white">Optimal</span>
            <span className="text-indigo-400 text-[10px] font-bold pb-1">Stable</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 flex gap-1">
            <div className="w-1/4 h-full bg-indigo-500" />
            <div className="w-1/4 h-full bg-indigo-500" />
            <div className="w-1/4 h-full bg-indigo-500/20" />
            <div className="w-1/4 h-full bg-indigo-500/20" />
          </div>
        </div>
      </div>

      {/* HOURLY RUSH CHART & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Hourly Chart */}
        <div className="lg:col-span-8 bg-[#0C0C0E] border border-zinc-800/50 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">Today's Hourly Peak Rush</h3>
              <p className="text-xs text-zinc-400">Order traffic across all campus dining blocks</p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold rounded-md font-mono">
              Peak Rush: 12:00 PM
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_ORDER_DATA}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0c0e',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    color: '#fafafa',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#orderGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-4 bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl flex flex-col gap-3">
          <h3 className="font-bold text-sm tracking-tight text-white mb-1">Quick Operational Actions</h3>
          <button
            onClick={() => onNavigate('menus')}
            className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center gap-3 text-left transition-colors"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Add Menu Item</p>
              <p className="text-[10px] text-zinc-500">Configure prices & nutritional values</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('canteens')}
            className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center gap-3 text-left transition-colors"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white">Approve Canteens</p>
                {vendors.filter((v) => v.status === 'pending').length > 0 && (
                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-bold rounded border border-amber-500/20">
                    {vendors.filter((v) => v.status === 'pending').length} Pending
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500">Review vendor food safety licenses</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('notifications')}
            className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center gap-3 text-left transition-colors"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Broadcast Announcement</p>
              <p className="text-[10px] text-zinc-500">Send campus food court notices</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center gap-3 text-left transition-colors"
          >
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Export Audit Reports</p>
              <p className="text-[10px] text-zinc-500">Generate CSV or PDF reports</p>
            </div>
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION: TWO COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LIVE KITCHEN QUEUE TABLE */}
        <div className="lg:col-span-8 bg-[#0C0C0E] border border-zinc-800/50 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-tight text-white">Live Kitchen Queue</h3>
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-md border border-indigo-500/20">
                Refreshes in 5s
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-500 border-b border-zinc-800/50 bg-zinc-900/20">
                <tr>
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Student</th>
                  <th className="p-4 font-semibold">Canteen</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Time Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <tr className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-mono text-indigo-400 font-bold">#FX-8902</td>
                  <td className="p-4 text-zinc-200">Sarah Jenkins</td>
                  <td className="p-4 text-zinc-400">Central Courtyard</td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      Preparing
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white font-mono">4:12 mins</td>
                </tr>
                <tr className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-mono text-indigo-400 font-bold">#FX-8903</td>
                  <td className="p-4 text-zinc-200">David Miller</td>
                  <td className="p-4 text-zinc-400">East Wing Bistro</td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Ready
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400 font-mono">--</td>
                </tr>
                <tr className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-mono text-indigo-400 font-bold">#FX-8904</td>
                  <td className="p-4 text-zinc-200">Alex Wong</td>
                  <td className="p-4 text-zinc-400">Medical Food Court</td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      Incoming
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white font-mono">8:45 mins</td>
                </tr>
                <tr className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4 font-mono text-indigo-400 font-bold">#FX-8905</td>
                  <td className="p-4 text-zinc-200">Elena Rossi</td>
                  <td className="p-4 text-zinc-400">Central Courtyard</td>
                  <td className="p-4">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      Preparing
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white font-mono">2:30 mins</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* AI FORECAST INSIGHTS CARD */}
        <div className="lg:col-span-4 bg-[#0C0C0E] border border-indigo-500/20 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-600/10 blur-[50px] pointer-events-none" />

          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-indigo-500/20 rounded flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-sm text-indigo-300 tracking-tight">AI Forecast Insights</h3>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl">
              <p className="text-xs font-semibold mb-1 text-zinc-300">Demand Forecast: Lunch Rush</p>
              <p className="text-[10px] text-zinc-500 leading-tight mb-3">
                Predicted <span className="text-white font-bold">18% increase</span> in Chicken Teriyaki demand for Block C at 12:45 PM.
              </p>
              <button
                onClick={() => onNavigate('kitchen')}
                className="text-indigo-400 text-[10px] font-bold hover:underline flex items-center gap-1"
              >
                <span>Notify Kitchen Staff</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl">
              <p className="text-xs font-semibold mb-1 text-zinc-300">Waste Reduction Alert</p>
              <p className="text-[10px] text-zinc-500 leading-tight mb-3">
                East Bistro is overproducing Breakfast Sandwiches. Suggested reduction: <span className="text-white font-bold">15 units</span> daily.
              </p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-amber-500" />
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl mt-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Powered by Google Gemini</span>
              </div>
              <p className="text-[10px] text-indigo-300/80 italic leading-relaxed">
                "Operations are currently 92% efficient. Increasing counter staffing in Block A by 1 will reduce wait times by 4 mins."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

