import React, { useState } from 'react';
import { TrendingUp, Flame, Star, Eye, ShoppingBag, DollarSign, GripVertical, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { MenuItem } from '../../../types';

interface RevenueGrowthChartProps {
  menuItems: MenuItem[];
  onReorderPriority?: (reorderedItems: MenuItem[]) => void;
}

const WEEKLY_REVENUE_DATA = [
  { day: 'Mon', revenue: 2450, orders: 420, conversion: 24.5 },
  { day: 'Tue', revenue: 3100, orders: 530, conversion: 26.1 },
  { day: 'Wed', revenue: 2980, orders: 490, conversion: 25.8 },
  { day: 'Thu', revenue: 3840, orders: 640, conversion: 28.4 },
  { day: 'Fri', revenue: 4520, orders: 780, conversion: 31.2 },
  { day: 'Sat', revenue: 3200, orders: 510, conversion: 27.0 },
  { day: 'Sun', revenue: 2100, orders: 360, conversion: 22.8 }
];

const HEATMAP_DATA = [
  { slot: '08:00 - 10:00 (Breakfast)', SouthIndian: 85, Healthy: 65, Beverages: 92, FastFood: 20 },
  { slot: '10:00 - 12:00 (Morning)', SouthIndian: 40, Healthy: 75, Beverages: 98, FastFood: 35 },
  { slot: '12:00 - 14:00 (Lunch Rush)', SouthIndian: 95, Healthy: 88, Beverages: 80, FastFood: 90 },
  { slot: '14:00 - 16:00 (Afternoon)', SouthIndian: 25, Healthy: 40, Beverages: 85, FastFood: 50 },
  { slot: '16:00 - 18:00 (Snacks)', SouthIndian: 70, Healthy: 50, Beverages: 90, FastFood: 85 },
  { slot: '18:00 - 20:00 (Dinner)', SouthIndian: 88, Healthy: 70, Beverages: 75, FastFood: 95 }
];

export const RevenueGrowthChart: React.FC<RevenueGrowthChartProps> = ({ menuItems, onReorderPriority }) => {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [activeTab, setActiveTab] = useState<'chart' | 'heatmap' | 'priority'>('chart');

  const totalViews = menuItems.reduce((acc, i) => acc + (i.analytics?.views || 1200), 0);
  const totalOrders = menuItems.reduce((acc, i) => acc + (i.analytics?.orders || 350), 0);
  const totalRevenue = menuItems.reduce((acc, i) => acc + (i.analytics?.revenue || i.price * 100), 0);

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setItems(newItems);
    if (onReorderPriority) {
      onReorderPriority(newItems);
    }
  };

  return (
    <div className="bg-[#0C0C0E] border border-zinc-800/80 rounded-3xl p-6 space-y-6 shadow-xl">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" />
            <span>LX AI Live Performance Engine</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Live Menu Analytics & Demand Heatmap</h3>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'chart'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Revenue Growth
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'heatmap'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Rush Hour Heatmap
          </button>
          <button
            onClick={() => setActiveTab('priority')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'priority'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Drag & Rank Priority
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold">Total Menu Views</span>
            <Eye className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{totalViews.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400 font-medium mt-1">+18.4% vs last week</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{totalOrders.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400 font-medium mt-1">+24.1% conversion rate</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">${totalRevenue.toLocaleString()}</div>
          <div className="text-[10px] text-indigo-400 font-medium mt-1">Avg dish $7.20</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold">Trending Score</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">96 / 100</div>
          <div className="text-[10px] text-orange-400 font-medium mt-1">High Student Demand</div>
        </div>
      </div>

      {/* Tab 1: Revenue Growth Chart */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_REVENUE_DATA}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
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
                <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Rush Hour Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 mb-2">
            Peak ordering intensity matrix across campus meal slots (higher value = denser kitchen load).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold">
                  <th className="p-3">Time Slot</th>
                  <th className="p-3 text-center">South Indian</th>
                  <th className="p-3 text-center">Healthy Meals</th>
                  <th className="p-3 text-center">Beverages</th>
                  <th className="p-3 text-center">Fast Food</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {HEATMAP_DATA.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/40">
                    <td className="p-3 font-medium text-white">{row.slot}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded font-bold font-mono ${
                        row.SouthIndian > 80 ? 'bg-indigo-600 text-white' : row.SouthIndian > 50 ? 'bg-indigo-900/60 text-indigo-300' : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        {row.SouthIndian}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded font-bold font-mono ${
                        row.Healthy > 80 ? 'bg-emerald-600 text-white' : row.Healthy > 50 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        {row.Healthy}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded font-bold font-mono ${
                        row.Beverages > 80 ? 'bg-amber-600 text-white' : row.Beverages > 50 ? 'bg-amber-900/60 text-amber-300' : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        {row.Beverages}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded font-bold font-mono ${
                        row.FastFood > 80 ? 'bg-rose-600 text-white' : row.FastFood > 50 ? 'bg-rose-900/60 text-rose-300' : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        {row.FastFood}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Drag & Rank Priority */}
      {activeTab === 'priority' && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Re-order menu item placement on the Student App homepage & KDS display queue.
          </p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex items-center justify-between text-xs hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 font-mono font-bold flex items-center justify-center text-[10px]">
                    #{index + 1}
                  </span>
                  <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
                  <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover" />
                  <div>
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-[10px] text-zinc-400">{item.category} • ${item.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    disabled={index === 0}
                    onClick={() => movePriority(index, 'up')}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === items.length - 1}
                    onClick={() => movePriority(index, 'down')}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
