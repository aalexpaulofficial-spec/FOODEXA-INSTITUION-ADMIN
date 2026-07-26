import React, { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Flame,
  Clock,
  Sparkles,
  Award,
  Users,
  DollarSign
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const DAILY_REVENUE_DATA = [
  { day: 'Mon', revenue: 14200, orders: 2840 },
  { day: 'Tue', revenue: 16800, orders: 3360 },
  { day: 'Wed', revenue: 18450, orders: 3840 },
  { day: 'Thu', revenue: 17200, orders: 3440 },
  { day: 'Fri', revenue: 19800, orders: 4100 },
  { day: 'Sat', revenue: 8400, orders: 1680 },
  { day: 'Sun', revenue: 5200, orders: 1040 }
];

const PEAK_HOURS_DATA = [
  { hour: '8 AM', volume: 180 },
  { hour: '9 AM', volume: 340 },
  { hour: '10 AM', volume: 410 },
  { hour: '11 AM', volume: 680 },
  { hour: '12 PM', volume: 1420 },
  { hour: '1 PM', volume: 1100 },
  { hour: '2 PM', volume: 510 },
  { hour: '3 PM', volume: 290 },
  { hour: '4 PM', volume: 450 },
  { hour: '5 PM', volume: 620 },
  { hour: '6 PM', volume: 840 }
];

const POPULAR_MEALS_DATA = [
  { name: 'Protein Power Bowl', sales: 640 },
  { name: 'Cold Brew Latte', sales: 580 },
  { name: 'Butter Chicken Bowl', sales: 490 },
  { name: 'Paneer Kathi Roll', sales: 410 },
  { name: 'Avocado Toast', sales: 320 }
];

const DEPARTMENT_SHARE_DATA = [
  { name: 'Computer Science', value: 38, color: '#f59e0b' },
  { name: 'Electronics', value: 24, color: '#06b6d4' },
  { name: 'Mechanical', value: 18, color: '#10b981' },
  { name: 'Biotechnology', value: 12, color: '#8b5cf6' },
  { name: 'Business Admin', value: 8, color: '#ec4899' }
];

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Campus Operational Analytics</h1>
          <p className="text-xs text-slate-400">
            Comprehensive food court throughput, peak hour heatmaps, meal popularity & department breakdown.
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          {['24h', '7d', '30d', 'semester'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg uppercase transition-all ${
                timeRange === range
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Weekly Campus Food Volume</div>
          <div className="text-2xl font-black text-white font-mono">$100,050.00</div>
          <div className="text-[11px] text-emerald-400 font-mono">20,300 Total Meals Prepared</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">Busiest Canteen Counter</div>
          <div className="text-lg font-black text-amber-400">North Tech Hub - Counter 02</div>
          <div className="text-[11px] text-slate-400">Average 4.2 meals prepared per minute</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <div className="text-xs text-slate-400 uppercase font-semibold">AI Operational Efficiency</div>
          <div className="text-2xl font-black text-cyan-400 font-mono">98.4%</div>
          <div className="text-[11px] text-cyan-300 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Gemini peak rush accuracy score</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Daily Revenue & Order Volume</h3>
            <span className="text-[10px] font-mono text-slate-500">7 Day Trailing</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DAILY_REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Rush Hour Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Peak Rush Hour Distribution</h3>
            <span className="text-[10px] font-mono text-amber-400">Peak: 12 PM - 1 PM</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PEAK_HOURS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="volume" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Meals Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Top 5 Popular Student Meals</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={POPULAR_MEALS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="sales" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Share Pie */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Department Meal Order Breakdown</h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEPARTMENT_SHARE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {DEPARTMENT_SHARE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-[11px] text-slate-300">
            {DEPARTMENT_SHARE_DATA.map((item) => (
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
