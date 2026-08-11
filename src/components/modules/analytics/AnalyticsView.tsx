import React, { useMemo, useState } from 'react';
import { Sparkles, BarChart3, TrendingUp, PieChart as PieChartIcon, Clock, Calendar } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Order } from '../../../types';

interface AnalyticsViewProps {
  orders?: Order[];
  students?: any[];
}

const COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ orders = [], students = [] }) => {
  const [timeRange] = useState('7d');

  const analytics = useMemo(() => {
    const daily: Record<string, { revenue: number; orders: number }> = {};
    const meals: Record<string, number> = {};
    const depts: Record<string, number> = {};
    const hours: Record<string, number> = {};
    let rev = 0;
    let mealsCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    orders.forEach(o => {
      const day = o.orderTime ? new Date(o.orderTime).toLocaleDateString('en', { weekday: 'short' }) : 'Unknown';
      if (!daily[day]) daily[day] = { revenue: 0, orders: 0 };
      daily[day].revenue += o.totalAmount;
      daily[day].orders += 1;
      rev += o.totalAmount;

      if (o.items) {
        o.items.forEach(item => {
          meals[item.name] = (meals[item.name] || 0) + item.quantity;
          mealsCount += item.quantity;
        });
      }

      depts[o.studentDepartment || 'Unknown'] = (depts[o.studentDepartment || 'Unknown'] || 0) + 1;

      if (o.orderTime) {
        const hour = new Date(o.orderTime).getHours();
        const hourLabel = `${hour}:00`;
        hours[hourLabel] = (hours[hourLabel] || 0) + 1;
      }

      if (o.status === 'completed') completedCount++;
      if (o.status === 'cancelled') cancelledCount++;
    });

    const dailyRevenueData = Object.entries(daily).map(([day, data]) => ({ day, revenue: data.revenue, orders: data.orders }));
    const popularMealsData = Object.entries(meals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, sales]) => ({ name, sales }));
    const departmentShareData = Object.entries(depts).map(([name, value], i) => ({ name, value: orders.length > 0 ? Math.round((value / orders.length) * 100) : 0, color: COLORS[i % COLORS.length] }));
    const hourlyData = Object.entries(hours).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([hour, count]) => ({ hour, count }));
    const avgOrderValue = orders.length > 0 ? rev / orders.length : 0;

    return {
      dailyRevenue: dailyRevenueData,
      popularMeals: popularMealsData,
      departmentShare: departmentShareData,
      hourlyData,
      totalRevenue: rev,
      totalMeals: mealsCount,
      avgOrderValue,
      completedCount,
      cancelledCount,
      hasData: orders.length > 0,
    };
  }, [orders]);

  if (!analytics.hasData) {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white">Campus Operational Analytics</h1>
            <p className="text-xs text-slate-400">Live order analytics from Supabase.</p>
          </div>
        </div>
        <div className="p-16 text-center rounded-2xl bg-slate-900/80 border border-slate-800">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No data available for this period</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Analytics will appear here once students start placing orders. All charts are built from live Supabase data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Campus Operational Analytics</h1>
          <p className="text-xs text-slate-400">Live order analytics from Supabase.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Revenue</div>
          <div className="text-2xl font-black text-white font-mono">₹{analytics.totalRevenue.toFixed(2)}</div>
          <div className="text-[11px] text-emerald-400 font-mono">{analytics.totalMeals} Total Meals</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Orders</div>
          <div className="text-2xl font-black text-white font-mono">{orders.length}</div>
          <div className="text-[11px] text-slate-400">Across all counters</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Avg Order Value</div>
          <div className="text-2xl font-black text-white font-mono">₹{analytics.avgOrderValue.toFixed(0)}</div>
          <div className="text-[11px] text-slate-400">Per order average</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Completion Rate</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {orders.length > 0 ? Math.round((analytics.completedCount / orders.length) * 100) : 0}%
          </div>
          <div className="text-[11px] text-slate-400">{analytics.completedCount} completed, {analytics.cancelledCount} cancelled</div>
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
              <AreaChart data={analytics.dailyRevenue}>
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
              <BarChart layout="vertical" data={analytics.popularMeals}>
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
          <h3 className="text-sm font-bold text-slate-200">Orders by Time of Day</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Department Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.departmentShare} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {analytics.departmentShare.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[11px] text-slate-300">
            {analytics.departmentShare.map((item: any) => (
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
