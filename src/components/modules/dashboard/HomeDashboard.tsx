import React, { useMemo } from 'react';
import { ShoppingBag, DollarSign, Users, Utensils, PlusCircle, UserCheck, Bell, FileSpreadsheet, BrainCircuit, Sparkles, QrCode, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Institution, Order, Vendor } from '../../../types';

interface HomeDashboardProps {
  currentInstitution: Institution;
  orders: Order[];
  vendors: Vendor[];
  onNavigate: (tab: string) => void;
  onOpenQRScanner: () => void;
}

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

  const totalRevenue = useMemo(() =>
    orders.reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );

  const activeStudents = useMemo(() =>
    [...new Set(orders.map(o => o.studentId))].length,
    [orders]
  );

  const mealsServed = useMemo(() =>
    orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
    [orders]
  );

  const hourlyData = useMemo(() => {
    const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'];
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      const hour = new Date(o.orderTime).getHours() || parseInt(o.orderTime.split(':')[0]);
      const label = `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`;
      counts[label] = (counts[label] || 0) + 1;
    });
    return hours.map(h => ({ time: h, orders: counts[h] || 0 }));
  }, [orders]);

  const peakHour = useMemo(() => {
    if (hourlyData.length === 0) return '—';
    return hourlyData.reduce((max, curr) => curr.orders > max.orders ? curr : max).time;
  }, [hourlyData]);

  return (
    <div className="space-y-8 font-sans">
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
            Welcome, Administrator
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mb-6 leading-relaxed">
            Foodexa AI is monitoring <span className="text-white font-medium">{currentInstitution.name || 'your institution'}</span>. You have {orders.length} orders and {vendors.filter(v => v.status === 'pending').length} vendor requests pending.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => onNavigate('ai_center')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              <span>View AI Center</span>
            </button>
            <button onClick={onOpenQRScanner} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-zinc-700 transition-all flex items-center gap-2">
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>Express Pickup Scanner</span>
            </button>
            <button onClick={() => onNavigate('reports')} className="px-5 py-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-lg border border-zinc-800 transition-all">
              Download PDF Reports
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Total Revenue</p>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold font-mono text-white">₹{totalRevenue.toFixed(2)}</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="w-[75%] h-full bg-emerald-500" />
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Active Students</p>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold font-mono text-white">{activeStudents.toLocaleString()}</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="w-[45%] h-full bg-indigo-500" />
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Meals Served</p>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold font-mono text-white">{mealsServed.toLocaleString()}</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="w-[88%] h-full bg-amber-500" />
          </div>
        </div>

        <div className="bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Orders</p>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold text-white">{orders.length}</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-4 flex gap-1">
            <div className="w-1/4 h-full bg-indigo-500" />
            <div className="w-1/4 h-full bg-indigo-500" />
            <div className="w-1/4 h-full bg-indigo-500/20" />
            <div className="w-1/4 h-full bg-indigo-500/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-[#0C0C0E] border border-zinc-800/50 p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">Today's Order Traffic</h3>
              <p className="text-xs text-zinc-400">Order distribution across hours</p>
            </div>
            {peakHour !== '—' && (
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold rounded-md font-mono">
                Peak: {peakHour}
              </span>
            )}
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData.length > 0 ? hourlyData : [{ time: '12 PM', orders: 0 }]}>
                <defs>
                  <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="time" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0c0c0e', borderColor: '#27272a', borderRadius: '12px', color: '#fafafa', fontSize: '12px' }} />
                <Area type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#orderGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0C0C0E] border border-zinc-800/50 p-5 rounded-2xl flex flex-col gap-3">
          <h3 className="font-bold text-sm tracking-tight text-white mb-1">Quick Operational Actions</h3>
          <button onClick={() => onNavigate('menus')} className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center gap-3 text-left transition-colors">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><PlusCircle className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-semibold text-white">Add Menu Item</p>
              <p className="text-[10px] text-zinc-500">Configure prices & nutritional values</p>
            </div>
          </button>

          <button onClick={() => onNavigate('canteens')} className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center gap-3 text-left transition-colors">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><UserCheck className="w-4 h-4" /></div>
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

          <button onClick={() => onNavigate('notifications')} className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center gap-3 text-left transition-colors">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Bell className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-semibold text-white">Broadcast Announcement</p>
              <p className="text-[10px] text-zinc-500">Send campus food court notices</p>
            </div>
          </button>

          <button onClick={() => onNavigate('reports')} className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-xl flex items-center gap-3 text-left transition-colors">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><FileSpreadsheet className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-semibold text-white">Export Audit Reports</p>
              <p className="text-[10px] text-zinc-500">Generate CSV or PDF reports</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-[#0C0C0E] border border-zinc-800/50 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-tight text-white">Live Kitchen Queue</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-500 border-b border-zinc-800/50 bg-zinc-900/20">
                <tr>
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Items</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Counter</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No active orders in queue</td></tr>
                ) : (
                  orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).map(o => {
                    const role = (o.userRole || '').toLowerCase();
                    const roleBadge = role === 'student' ? '🎓 Student' : role === 'faculty' ? '👨‍🏫 Faculty' : role === 'guest' ? '👤 Guest' : '';
                    return (
                    <tr key={o.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 font-mono text-indigo-400 font-bold">{o.orderNumber}</td>
                      <td className="p-4 text-zinc-200">{o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
                      <td className="p-4 text-zinc-300 font-medium">{o.studentName}</td>
                      <td className="p-4 text-zinc-400 text-[11px]">{roleBadge}</td>
                      <td className="p-4 text-zinc-400">{o.pickupCounter}</td>
                      <td className="p-4">
                        <span className={`flex items-center gap-2 text-zinc-300`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            o.status === 'preparing' ? 'bg-amber-500' :
                            o.status === 'ready' ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`} />
                          {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

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
              <p className="text-xs font-semibold mb-1 text-zinc-300">Live Order Summary</p>
              <p className="text-[10px] text-zinc-500 leading-tight mb-3">
                <span className="text-white font-bold">{pendingCount}</span> pending,{' '}
                <span className="text-white font-bold">{preparingCount}</span> preparing,{' '}
                <span className="text-white font-bold">{readyCount}</span> ready for pickup.
              </p>
              <button onClick={() => onNavigate('kitchen')} className="text-indigo-400 text-[10px] font-bold hover:underline flex items-center gap-1">
                <span>View Kitchen Dashboard</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl">
              <p className="text-xs font-semibold mb-1 text-zinc-300">Vendor Summary</p>
              <p className="text-[10px] text-zinc-500 leading-tight mb-3">
                <span className="text-white font-bold">{vendors.length}</span> vendors registered,{' '}
                <span className="text-white font-bold">{vendors.filter(v => v.status === 'pending').length}</span> pending approval.
              </p>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl mt-auto">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Powered by Google Gemini</span>
              </div>
              <p className="text-[10px] text-indigo-300/80 italic leading-relaxed">
                Real-time analytics and insights powered by live Supabase data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
