import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Order } from '../../../types';

interface AnalyticsViewProps {
  orders?: Order[];
  students?: any[];
}

const COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ orders = [], students = [] }) => {
  const [timeRange] = useState('7d');

  const { dailyRevenue, popularMeals, departmentShare, totalRevenue, totalMeals, roleBreakdown } = useMemo(() => {
    const daily: Record<string, { revenue: number; orders: number }> = {};
    const meals: Record<string, number> = {};
    const depts: Record<string, number> = {};
    const roles: Record<string, number> = {};
    let rev = 0;
    let mealsCount = 0;

    orders.forEach(o => {
      const day = new Date(o.orderTime).toLocaleDateString('en', { weekday: 'short' });
      if (!daily[day]) daily[day] = { revenue: 0, orders: 0 };
      daily[day].revenue += o.totalAmount;
      daily[day].orders += 1;
      rev += o.totalAmount;

      o.items.forEach(item => {
        meals[item.name] = (meals[item.name] || 0) + item.quantity;
        mealsCount += item.quantity;
      });

      depts[o.studentDepartment] = (depts[o.studentDepartment] || 0) + 1;
      const r = (o as any).userRole || 'unknown';
      roles[r] = (roles[r] || 0) + 1;
    });

    const dailyRevenueData = Object.entries(daily).map(([day, data]) => ({ day, revenue: data.revenue, orders: data.orders }));
    const popularMealsData = Object.entries(meals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, sales]) => ({ name, sales }));
    const total = Object.values(meals).reduce((a, b) => a + b, 0);
    const departmentShareData = Object.entries(depts).map(([name, value], i) => ({ name, value: Math.round((value / orders.length) * 100), color: COLORS[i % COLORS.length] }));
    const roleBreakdownData = Object.entries(roles).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

    return { dailyRevenue: dailyRevenueData, popularMeals: popularMealsData, departmentShare: departmentShareData, totalRevenue: rev, totalMeals: mealsCount, roleBreakdown: roleBreakdownData };
  }, [orders]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Campus Operational Analytics</h1>
          <p className="text-xs text-slate-400">Live order analytics from Supabase.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Revenue</div>
           <div className="text-2xl font-black text-white font-mono">₹{totalRevenue.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-400 font-mono">{totalMeals} Total Meals</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Orders</div>
          <div className="text-2xl font-black text-white font-mono">{orders.length}</div>
          <div className="text-[11px] text-slate-400">Across all counters</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Data Source</div>
          <div className="text-lg font-black text-cyan-400">Live Supabase</div>
          <div className="text-[11px] text-cyan-300 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-time analytics</span>
          </div>
        </div>
      </div>

      {/* Role Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Orders by Customer Role</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: 'student', label: '🎓 Student', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
            { key: 'faculty', label: '👨‍🏫 Faculty', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
            { key: 'guest', label: '👤 Guest', color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
          ].map((r) => {
            const count = orders.filter(o => (o as any).userRole?.toLowerCase() === r.key).length;
            return (
              <div key={r.key} className={`p-4 rounded-xl border ${r.color} space-y-1`}>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">{r.label}</div>
                <div className="text-2xl font-black font-mono">{count}</div>
                <div className="text-[10px] opacity-70">orders</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Revenue by Day</h3>
            <span className="text-[10px] font-mono text-slate-500">{timeRange === '7d' ? '7 Day' : 'All Time'}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue.length > 0 ? dailyRevenue : [{ day: 'N/A', revenue: 0, orders: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Top Meals</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={popularMeals.length > 0 ? popularMeals : [{ name: 'No data', sales: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="sales" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Department Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentShare.length > 0 ? departmentShare : [{ name: 'No data', value: 100, color: '#333' }]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {departmentShare.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[11px] text-slate-300">
            {departmentShare.map((item: any) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
