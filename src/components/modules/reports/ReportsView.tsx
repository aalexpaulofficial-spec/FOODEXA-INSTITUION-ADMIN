import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Sparkles, Users, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

type Period = 'daily' | 'weekly' | 'monthly';

function getDateRange(period: Period) {
  const now = new Date();
  const start = new Date();
  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
}

function formatDateRange(period: Period) {
  const { start, end } = getDateRange(period);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

export const ReportsView: React.FC = () => {
  const { user, institutionId } = useAuth();
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('daily');
  const [reportData, setReportData] = useState<{
    totalOrders: number;
    totalRevenue: number;
    totalStudents: number;
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    periodRevenue: number;
    topMenuItems: { name: string; orders: number; revenue: number }[];
    studentActivity: { name: string; orders: number }[];
    orderStatusBreakdown: { status: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!institutionId) return;
      try {
        const { data: orders, error: ordersErr } = await supabase
          .from('orders')
          .select('*')
          .eq('institution_id', institutionId);

        if (ordersErr) throw ordersErr;

        const { data: profiles, error: profilesErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('institution_id', institutionId)
          .eq('role', 'student');

        if (profilesErr) throw profilesErr;

        const { data: menuItems, error: menuItemsErr } = await supabase
          .from('menu_items')
          .select('*')
          .eq('institution_id', institutionId);

        if (menuItemsErr) throw menuItemsErr;

        const { start, end } = getDateRange(period);

        const periodOrders = orders?.filter(o => {
          const t = new Date(o.orderTime).getTime();
          return t >= start.getTime() && t <= end.getTime();
        }) || [];

        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0;
        const totalStudents = profiles?.length || 0;
        const pendingOrders = periodOrders.filter(o => o.status === 'pending').length;
        const preparingOrders = periodOrders.filter(o => o.status === 'preparing').length;
        const readyOrders = periodOrders.filter(o => o.status === 'ready').length;
        const completedOrders = periodOrders.filter(o => o.status === 'completed').length;
        const cancelledOrders = periodOrders.filter(o => o.status === 'cancelled').length;
        const periodRevenue = periodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        const mealCounts: Record<string, { orders: number; revenue: number }> = {};
        periodOrders.forEach(o => {
          o.items?.forEach(item => {
            if (!mealCounts[item.name]) mealCounts[item.name] = { orders: 0, revenue: 0 };
            mealCounts[item.name].orders += item.quantity;
            mealCounts[item.name].revenue += item.quantity * (item.price || 0);
          });
        });
        const topMenuItems = Object.entries(mealCounts)
          .sort((a, b) => b[1].orders - a[1].orders)
          .slice(0, 10)
          .map(([name, data]) => ({ name, orders: data.orders, revenue: data.revenue }));

        const studentOrderCounts: Record<string, number> = {};
        periodOrders.forEach(o => {
          if (o.studentId) {
            studentOrderCounts[o.studentId] = (studentOrderCounts[o.studentId] || 0) + 1;
          }
        });
        const studentActivity = Object.entries(studentOrderCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([studentId, count]) => {
            const profile = profiles?.find(p => p.user_id === studentId);
            return { name: profile?.full_name || studentId, orders: count };
          });

        const statusCounts: Record<string, number> = {};
        periodOrders.forEach(o => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        const orderStatusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

        setReportData({
          totalOrders, totalRevenue, totalStudents, pendingOrders, preparingOrders,
          readyOrders, completedOrders, cancelledOrders, periodRevenue, topMenuItems,
          studentActivity, orderStatusBreakdown,
        });
      } catch (err) {
        console.error('[Reports] Fetch error:', err);
      }
    };

    fetchReportData();
  }, [institutionId, period]);

  const downloadCSV = (reportType: string, rows: string[][], headers: string[]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    downloadBlob(csv, `${reportType}-${period}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
    setDownloadSuccessMsg(`Exported ${reportType} CSV`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const downloadExcel = (reportType: string, rows: string[][], headers: string[]) => {
    const BOM = '\uFEFF';
    const sheet = rows.length > 0 ? [headers, ...rows] : [headers];
    const xlsx = sheet.map(row => row.join('\t')).join('\n');
    downloadBlob(BOM + xlsx, `${reportType}-${period}-${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    setDownloadSuccessMsg(`Exported ${reportType} Excel`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const downloadPDF = (reportType: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-${period}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccessMsg(`Exported ${reportType} PDF`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getReportContent = (reportType: string): { headers: string[]; rows: string[][] } => {
    if (!reportData) return { headers: [], rows: [] };
    if (reportType === 'revenue') {
      return {
        headers: ['Period', 'Revenue', 'Orders', 'Completed', 'Pending', 'Preparing', 'Ready', 'Cancelled'],
        rows: [[formatDateRange(period), `₹${reportData.periodRevenue.toFixed(2)}`, String(reportData.totalOrders), String(reportData.completedOrders), String(reportData.pendingOrders), String(reportData.preparingOrders), String(reportData.readyOrders), String(reportData.cancelledOrders)]],
      };
    } else if (reportType === 'orders') {
      return {
        headers: ['Status', 'Count'],
        rows: reportData.orderStatusBreakdown.map(item => [item.status, String(item.count)]),
      };
    } else if (reportType === 'menu') {
      return {
        headers: ['Item', 'Orders', 'Revenue'],
        rows: reportData.topMenuItems.map(item => [item.name, String(item.orders), `₹${item.revenue.toFixed(2)}`]),
      };
    } else if (reportType === 'students') {
      return {
        headers: ['Student', 'Orders'],
        rows: reportData.studentActivity.map(item => [item.name, String(item.orders)]),
      };
    }
    return { headers: [], rows: [] };
  };

  const getPDFContent = (reportType: string): string => {
    if (!reportData) return '';
    const lines: string[] = [
      `FOODEXA ${period.charAt(0).toUpperCase() + period.slice(1)} Report`,
      `Generated: ${new Date().toISOString()}`,
      `Period: ${formatDateRange(period)}`,
      `Institution ID: ${institutionId}`,
      '',
    ];
    if (reportType === 'revenue') {
      lines.push(`Period Revenue: ₹${reportData.periodRevenue.toFixed(2)}`);
      lines.push(`Total Revenue: ₹${reportData.totalRevenue.toFixed(2)}`);
      lines.push(`Orders: ${reportData.totalOrders}`);
      lines.push(`Students: ${reportData.totalStudents}`);
      lines.push('Status Breakdown:');
      reportData.orderStatusBreakdown.forEach(item => lines.push(`  ${item.status}: ${item.count}`));
      lines.push('Top Items:');
      reportData.topMenuItems.slice(0, 5).forEach(item => lines.push(`  ${item.name}: ${item.orders} orders`));
    } else if (reportType === 'orders') {
      lines.push('Order Status Breakdown:');
      reportData.orderStatusBreakdown.forEach(item => lines.push(`  ${item.status}: ${item.count}`));
    } else if (reportType === 'menu') {
      lines.push('Top Menu Items:');
      reportData.topMenuItems.forEach(item => lines.push(`  ${item.name}: ${item.orders} orders, ₹${item.revenue.toFixed(2)}`));
    } else if (reportType === 'students') {
      lines.push('Student Activity:');
      reportData.studentActivity.forEach(item => lines.push(`  ${item.name}: ${item.orders} orders`));
    }
    return lines.join('\n');
  };

  const handleDownload = (reportType: string, format: 'CSV' | 'Excel' | 'PDF') => {
    const { headers, rows } = getReportContent(reportType);
    if (format === 'CSV') downloadCSV(reportType, rows, headers);
    else if (format === 'Excel') downloadExcel(reportType, rows, headers);
    else if (format === 'PDF') downloadPDF(reportType, getPDFContent(reportType));
  };

  const reportTypes = [
    { id: 'revenue', title: `${period.charAt(0).toUpperCase() + period.slice(1)} Revenue Report`, desc: `Sales and order settlements for ${formatDateRange(period)}`, formats: ['CSV', 'Excel', 'PDF'] },
    { id: 'orders', title: 'Orders Report', desc: 'All orders with status and payment details', formats: ['CSV', 'Excel', 'PDF'] },
    { id: 'students', title: 'Student Activity Report', desc: 'Student meal ordering patterns', formats: ['CSV', 'Excel'] },
    { id: 'menu', title: 'Menu Performance Report', desc: 'Item popularity and revenue by dish', formats: ['CSV', 'Excel', 'PDF'] },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Reports & Data Exports</h1>
          <p className="text-xs text-slate-400">Generate reports from live Supabase data.</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
          {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg transition-all ${period === p ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {downloadSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span>{downloadSuccessMsg}</span>
        </div>
      )}

      {reportData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Period Revenue</div>
            <div className="text-lg font-black text-white font-mono mt-1">₹{reportData.periodRevenue.toFixed(2)}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Orders</div>
            <div className="text-lg font-black text-white font-mono mt-1">{reportData.totalOrders}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Students</div>
            <div className="text-lg font-black text-white font-mono mt-1">{reportData.totalStudents}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Completed</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-1">{reportData.completedOrders}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{report.title}</h3>
                <p className="text-xs text-slate-400">{report.desc}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {report.formats.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => handleDownload(report.id, fmt as 'CSV' | 'Excel' | 'PDF')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{fmt}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
