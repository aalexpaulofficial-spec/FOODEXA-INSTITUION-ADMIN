import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, Users, ShoppingBag, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

export const ReportsView: React.FC = () => {
  const { user, institutionId } = useAuth();
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{
    totalOrders: number;
    totalRevenue: number;
    totalStudents: number;
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    dailyRevenue: number;
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

        const totalOrders = orders?.length || 0;
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0;
        const totalStudents = profiles?.length || 0;
        const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
        const preparingOrders = orders?.filter(o => o.status === 'preparing').length || 0;
        const readyOrders = orders?.filter(o => o.status === 'ready').length || 0;
        const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
        const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyRevenue = orders
          ?.filter(o => new Date(o.orderTime) >= today)
          ?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0;

        const mealCounts: Record<string, { orders: number; revenue: number }> = {};
        orders?.forEach(o => {
          o.items?.forEach(item => {
            if (!mealCounts[item.name]) mealCounts[item.name] = { orders: 0, revenue: 0 };
            mealCounts[item.name].orders += item.quantity;
            mealCounts[item.name].revenue += item.quantity * item.price;
          });
        });
        const topMenuItems = Object.entries(mealCounts)
          .sort((a, b) => b[1].orders - a[1].orders)
          .slice(0, 10)
          .map(([name, data]) => ({ name, orders: data.orders, revenue: data.revenue }));

        const studentOrderCounts: Record<string, number> = {};
        orders?.forEach(o => {
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
        orders?.forEach(o => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        const orderStatusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

        setReportData({
          totalOrders, totalRevenue, totalStudents, pendingOrders, preparingOrders,
          readyOrders, completedOrders, cancelledOrders, dailyRevenue, topMenuItems,
          studentActivity, orderStatusBreakdown,
        });
      } catch (err) {
        console.error('[Reports] Fetch error:', err);
      }
    };

    fetchReportData();
  }, [institutionId]);

  const handleDownload = (reportType: string, format: string) => {
    let content = '';
    if (reportType === 'daily-revenue') {
      content = `FOODEXA Daily Revenue Report\nGenerated: ${new Date().toISOString()}\nInstitution ID: ${institutionId}\n\n`;
      content += `Total Revenue Today: ₹${reportData?.dailyRevenue.toFixed(2) || '0.00'}\n`;
      content += `Total Revenue (All Time): ₹${reportData?.totalRevenue.toFixed(2) || '0.00'}\n`;
      content += `Total Orders: ${reportData?.totalOrders || 0}\n`;
      content += `Total Students: ${reportData?.totalStudents || 0}\n`;
      content += `\nOrder Status Breakdown:\n`;
      reportData?.orderStatusBreakdown.forEach(item => {
        content += `  ${item.status}: ${item.count}\n`;
      });
      content += `\nTop Menu Items:\n`;
      reportData?.topMenuItems.forEach(item => {
        content += `  ${item.name}: ${item.orders} orders, ₹${item.revenue.toFixed(2)}\n`;
      });
    } else if (reportType === 'orders') {
      content = `FOODEXA Orders Report\nGenerated: ${new Date().toISOString()}\nInstitution ID: ${institutionId}\n\n`;
      content += `Total Orders: ${reportData?.totalOrders || 0}\n`;
      content += `Pending: ${reportData?.pendingOrders || 0}\n`;
      content += `Preparing: ${reportData?.preparingOrders || 0}\n`;
      content += `Ready: ${reportData?.readyOrders || 0}\n`;
      content += `Completed: ${reportData?.completedOrders || 0}\n`;
      content += `Cancelled: ${reportData?.cancelledOrders || 0}\n`;
    } else if (reportType === 'students') {
      content = `FOODEXA Student Activity Report\nGenerated: ${new Date().toISOString()}\nInstitution ID: ${institutionId}\n\n`;
      content += `Total Students: ${reportData?.totalStudents || 0}\n`;
      content += `\nTop Active Students:\n`;
      reportData?.studentActivity.forEach(item => {
        content += `  ${item.name}: ${item.orders} orders\n`;
      });
    } else if (reportType === 'menu') {
      content = `FOODEXA Menu Performance Report\nGenerated: ${new Date().toISOString()}\nInstitution ID: ${institutionId}\n\n`;
      content += `Total Menu Items: ${reportData?.topMenuItems.length || 0}\n`;
      content += `\nTop Items by Orders:\n`;
      reportData?.topMenuItems.forEach(item => {
        content += `  ${item.name}: ${item.orders} orders, ₹${item.revenue.toFixed(2)} revenue\n`;
      });
    }

    const blob = new Blob([content], { type: format === 'PDF' ? 'application/pdf' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccessMsg(`Downloaded ${reportType}.${format.toLowerCase()}`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const reportTypes = [
    { id: 'daily-revenue', title: 'Daily Revenue Report', desc: 'Today\'s sales and order settlements', formats: ['CSV', 'PDF'] },
    { id: 'orders', title: 'Orders Report', desc: 'All orders with status and payment details', formats: ['CSV', 'PDF'] },
    { id: 'students', title: 'Student Activity Report', desc: 'Student meal ordering patterns', formats: ['CSV'] },
    { id: 'menu', title: 'Menu Performance Report', desc: 'Item popularity and revenue by dish', formats: ['CSV', 'PDF'] },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Reports & Data Exports</h1>
          <p className="text-xs text-slate-400">Generate reports from live Supabase data.</p>
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
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Revenue</div>
            <div className="text-lg font-black text-white font-mono mt-1">₹{reportData.totalRevenue.toFixed(2)}</div>
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
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Today Revenue</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-1">₹{reportData.dailyRevenue.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FileText className="w-5 h-5" />
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
                  onClick={() => handleDownload(report.id, fmt)}
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
