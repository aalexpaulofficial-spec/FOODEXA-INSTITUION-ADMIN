import React, { useState, useEffect, useCallback } from 'react';
import { Download, Sparkles, Calendar, AlertTriangle, FileText, TrendingUp, Users, Utensils } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

type Period = 'daily' | 'weekly' | 'monthly';

interface OrderDetailRow {
  orderNumber: string;
  student: string;
  institution: string;
  canteen: string;
  date: string;
  time: string;
  items: string;
  quantities: string;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  pickupCode: string;
  tokenNumber: string;
}

interface DailyRevenueRow {
  date: string;
  orderCount: number;
  paidOrders: number;
  revenue: number;
  refundedAmount: number;
  netRevenue: number;
}

interface MenuPerformanceRow {
  foodName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  rating: string;
  availability: string;
}

interface StudentActivityRow {
  student: string;
  orders: number;
  totalSpent: number;
  completedOrders: number;
  cancelledOrders: number;
}

interface ReportData {
  institutionName: string;
  totalOrders: number;
  totalRevenue: number;
  totalStudents: number;
  periodRevenue: number;
  refundedAmount: number;
  paidOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  orderDetails: OrderDetailRow[];
  dailyRevenue: DailyRevenueRow[];
  menuPerformance: MenuPerformanceRow[];
  studentActivity: StudentActivityRow[];
}

function getISTDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const day = istNow.getUTCDate();

  let startIST: Date;
  if (period === 'daily') {
    startIST = new Date(Date.UTC(year, month, day, 0, 0, 0));
  } else if (period === 'weekly') {
    const dow = istNow.getUTCDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    startIST = new Date(Date.UTC(year, month, day + diff, 0, 0, 0));
  } else {
    startIST = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  }
  const endIST = new Date(Date.UTC(year, month, day, 23, 59, 59));
  const toUTC = (istDate: Date) => new Date(istDate.getTime() - 5.5 * 60 * 60 * 1000);
  return { start: toUTC(startIST), end: toUTC(endIST) };
}

function formatDateRange(period: Period) {
  const { start, end } = getISTDateRange(period);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' };
  return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

function toISTDateString(utcStr: string): string {
  if (!utcStr) return '';
  const d = new Date(new Date(utcStr).getTime() + 5.5 * 60 * 60 * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function toISTTimeString(utcStr: string): string {
  if (!utcStr) return '';
  const d = new Date(new Date(utcStr).getTime() + 5.5 * 60 * 60 * 1000);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
}

export const ReportsView: React.FC = () => {
  const { institutionId } = useAuth();
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('daily');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReportData = useCallback(async () => {
    if (!institutionId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const { start, end } = getISTDateRange(period);
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      const [instResult, ordersResult, profilesResult, allOrdersResult, menuItemsResult] = await Promise.all([
        supabase.from('institutions').select('name').eq('id', institutionId).single(),
        supabase.from('orders').select('*, order_items(*, menu_items(food_name, price, regular_price, category_id))').eq('institution_id', institutionId).gte('created_at', startISO).lte('created_at', endISO),
        supabase.from('profiles').select('id, user_id, full_name, email').eq('institution_id', institutionId).eq('role', 'student'),
        supabase.from('orders').select('id, created_at, status, payment_status, total_amount, student_id').eq('institution_id', institutionId),
        supabase.from('menu_items').select('id, food_name, category_name, is_available, rating').eq('institution_id', institutionId),
      ]);

      if (ordersResult.error) {
        console.error('[Reports] Orders fetch error:', ordersResult.error);
        setFetchError(`Unable to load report data: ${ordersResult.error.message}`);
        return;
      }

      const periodOrders = (ordersResult.data as any[]) || [];
      const allOrders = (allOrdersResult.data as any[]) || [];
      const profiles = (profilesResult.data as any[]) || [];
      const menuItems = (menuItemsResult.data as any[]) || [];
      const profileMap = new Map(profiles.map((p: any) => [p.user_id || p.id, p]));
      const institutionName = (instResult.data as any)?.name || 'Institution';

      const totalOrders = allOrders.length;
      const totalStudents = profiles.length;
      const periodRevenue = periodOrders.filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      const totalRevenue = allOrders.filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      const refundedAmount = periodOrders.filter((o: any) => o.payment_status === 'refunded').reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      const paidOrders = periodOrders.filter((o: any) => o.payment_status === 'paid').length;
      const completedOrders = periodOrders.filter((o: any) => o.status === 'completed').length;
      const cancelledOrders = periodOrders.filter((o: any) => o.status === 'cancelled').length;

      const orderDetails: OrderDetailRow[] = periodOrders.map((o: any) => {
        const profile = profileMap.get(o.student_id || o.studentId);
        const orderItems = Array.isArray(o.order_items) ? o.order_items : [];
        const itemsStr = orderItems.map((it: any) => {
          const n = it.item_name || it.menu_items?.food_name || 'Item';
          return `${n} x${it.quantity || 1}`;
        }).join('; ');
        const quantitiesStr = orderItems.map((it: any) => String(it.quantity || 1)).join('; ');
        const subtotal = orderItems.reduce((s: number, it: any) => s + ((it.quantity || 1) * (it.unit_price || it.menu_items?.price || it.price || 0)), 0);
        return {
          orderNumber: o.order_number || o.id?.slice(0, 8) || '',
          student: profile?.full_name || o.student_name || '',
          institution: institutionName,
          canteen: o.canteen_name || o.vendor_name || '',
          date: toISTDateString(o.created_at),
          time: toISTTimeString(o.created_at),
          items: itemsStr,
          quantities: quantitiesStr,
          subtotal,
          total: o.total_amount || 0,
          paymentMethod: o.payment_method || '',
          paymentStatus: o.payment_status || '',
          orderStatus: o.status || '',
          pickupCode: o.pickup_code || '',
          tokenNumber: o.token_number || '',
        };
      });

      const dailyMap: Record<string, { orderCount: number; paidOrders: number; revenue: number; refundedAmount: number }> = {};
      periodOrders.forEach((o: any) => {
        const dateKey = toISTDateString(o.created_at);
        if (!dateKey) return;
        if (!dailyMap[dateKey]) dailyMap[dateKey] = { orderCount: 0, paidOrders: 0, revenue: 0, refundedAmount: 0 };
        dailyMap[dateKey].orderCount += 1;
        if (o.payment_status === 'paid') { dailyMap[dateKey].paidOrders += 1; dailyMap[dateKey].revenue += (o.total_amount || 0); }
        if (o.payment_status === 'refunded') { dailyMap[dateKey].refundedAmount += (o.total_amount || 0); }
      });
      const dailyRevenue: DailyRevenueRow[] = Object.entries(dailyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, d]) => ({ date, orderCount: d.orderCount, paidOrders: d.paidOrders, revenue: d.revenue, refundedAmount: d.refundedAmount, netRevenue: d.revenue - d.refundedAmount }));

      const mealMap: Record<string, { category: string; quantitySold: number; revenue: number }> = {};
      periodOrders.forEach((o: any) => {
        const orderItems = Array.isArray(o.order_items) ? o.order_items : [];
        orderItems.forEach((it: any) => {
          const name = it.item_name || it.menu_items?.food_name || 'Item';
          if (!mealMap[name]) mealMap[name] = { category: it.menu_items?.category_id || '', quantitySold: 0, revenue: 0 };
          const qty = it.quantity || 1;
          const price = it.unit_price || it.menu_items?.price || it.price || 0;
          mealMap[name].quantitySold += qty;
          mealMap[name].revenue += qty * price;
        });
      });
      const menuRatingMap = new Map(menuItems.map((m: any) => [m.food_name, { rating: m.rating, available: m.is_available }]));
      const menuPerformance: MenuPerformanceRow[] = Object.entries(mealMap)
        .sort((a, b) => b[1].quantitySold - a[1].quantitySold)
        .slice(0, 20)
        .map(([name, d]) => {
          const meta = menuRatingMap.get(name);
          return { foodName: name, category: d.category, quantitySold: d.quantitySold, revenue: d.revenue, rating: meta?.rating ? String(meta.rating) : 'N/A', availability: meta?.available !== false ? 'Available' : 'Unavailable' };
        });

      const studentMap: Record<string, { orders: number; totalSpent: number; completedOrders: number; cancelledOrders: number }> = {};
      allOrders.forEach((o: any) => {
        const sid = o.student_id || o.studentId;
        if (!sid) return;
        if (!studentMap[sid]) studentMap[sid] = { orders: 0, totalSpent: 0, completedOrders: 0, cancelledOrders: 0 };
        studentMap[sid].orders += 1;
        if (o.payment_status === 'paid') studentMap[sid].totalSpent += (o.total_amount || 0);
        if (o.status === 'completed') studentMap[sid].completedOrders += 1;
        if (o.status === 'cancelled') studentMap[sid].cancelledOrders += 1;
      });
      const studentActivity: StudentActivityRow[] = Object.entries(studentMap)
        .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
        .slice(0, 20)
        .map(([sid, d]) => {
          const profile = profileMap.get(sid);
          return { student: profile?.full_name || sid, orders: d.orders, totalSpent: d.totalSpent, completedOrders: d.completedOrders, cancelledOrders: d.cancelledOrders };
        });

      setReportData({
        institutionName, totalOrders, totalRevenue, totalStudents, periodRevenue,
        refundedAmount, paidOrders, completedOrders, cancelledOrders,
        orderDetails, dailyRevenue, menuPerformance, studentActivity,
      });
    } catch (err: any) {
      console.error('[Reports] Fetch error:', err);
      setFetchError(`Unable to load report data: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [institutionId, period]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (reportType: string, rows: string[][], headers: string[]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadBlob(csv, `FOODEXA_${reportType}_${period}_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
    setDownloadSuccessMsg(`Exported ${reportType} CSV`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const downloadExcel = (reportType: string, rows: string[][], headers: string[]) => {
    const BOM = '\uFEFF';
    const sheet = rows.length > 0 ? [headers, ...rows] : [headers];
    const xlsx = sheet.map(row => row.join('\t')).join('\n');
    downloadBlob(BOM + xlsx, `FOODEXA_${reportType}_${period}_${new Date().toISOString().split('T')[0]}.xls`, 'application/vnd.ms-excel;charset=utf-8');
    setDownloadSuccessMsg(`Exported ${reportType} Excel`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const downloadPDF = async (reportType: string) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      doc.setFillColor(45, 55, 72);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('FOODEXA - Institution Management Platform', 15, 12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 15, 18);
      doc.text(`Period: ${formatDateRange(period)}`, 15, 23);
      doc.text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`, pageWidth - 15, 18, { align: 'right' });
      doc.text(`Institution: ${reportData?.institutionName || 'N/A'}`, pageWidth - 15, 23, { align: 'right' });
      y = 36;

      doc.setTextColor(0, 0, 0);

      if (!reportData || (reportType === 'orders' && reportData.orderDetails.length === 0) || (reportType === 'revenue' && reportData.dailyRevenue.length === 0) || (reportType === 'menu' && reportData.menuPerformance.length === 0) || (reportType === 'students' && reportData.studentActivity.length === 0)) {
        doc.setFontSize(11);
        doc.setTextColor(120, 120, 120);
        doc.text('No data available for this period.', 15, y);
        doc.save(`FOODEXA_${reportType}_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
        setDownloadSuccessMsg(`Exported ${reportType} PDF (no data)`);
        setTimeout(() => setDownloadSuccessMsg(null), 3000);
        return;
      }

      const drawTable = (headers: string[], rows: string[][], colWidths: number[]) => {
        const startX = 12;
        const rowHeight = 6;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(240, 240, 240);
        doc.rect(startX, y - 4, pageWidth - 24, rowHeight, 'F');
        let x = startX + 2;
        headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
        y += rowHeight;
        doc.setFont('helvetica', 'normal');
        rows.forEach(row => {
          if (y > 185) { doc.addPage(); y = 20; }
          x = startX + 2;
          row.forEach((cell, i) => {
            const text = String(cell).length > 25 ? String(cell).substring(0, 25) + '...' : String(cell);
            doc.text(text, x, y);
            x += colWidths[i];
          });
          y += rowHeight;
        });
        y += 4;
      };

      if (reportType === 'orders') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Orders Report', 15, y);
        y += 8;
        const hdrs = ['Order #', 'Student', 'Canteen', 'Date', 'Time', 'Items', 'Qty', 'Subtotal', 'Total', 'Payment', 'Status', 'Pickup Code', 'Token'];
        const widths = [22, 30, 28, 22, 18, 50, 12, 20, 20, 20, 18, 22, 18];
        const rows = reportData.orderDetails.map(o => [o.orderNumber, o.student, o.canteen, o.date, o.time, o.items, o.quantities, `Rs ${o.subtotal.toFixed(0)}`, `Rs ${o.total.toFixed(0)}`, o.paymentStatus, o.orderStatus, o.pickupCode, o.tokenNumber]);
        drawTable(hdrs, rows, widths);
      } else if (reportType === 'revenue') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Daily Revenue Report', 15, y);
        y += 4;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Period Revenue: Rs ${reportData.periodRevenue.toLocaleString('en-IN')} | Refunded: Rs ${reportData.refundedAmount.toLocaleString('en-IN')} | Net: Rs ${(reportData.periodRevenue - reportData.refundedAmount).toLocaleString('en-IN')}`, 15, y);
        y += 8;
        const hdrs = ['Date', 'Order Count', 'Paid Orders', 'Revenue', 'Refunded', 'Net Revenue'];
        const widths = [40, 35, 35, 45, 45, 45];
        const rows = reportData.dailyRevenue.map(d => [d.date, String(d.orderCount), String(d.paidOrders), `Rs ${d.revenue.toLocaleString('en-IN')}`, `Rs ${d.refundedAmount.toLocaleString('en-IN')}`, `Rs ${d.netRevenue.toLocaleString('en-IN')}`]);
        drawTable(hdrs, rows, widths);
      } else if (reportType === 'menu') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Menu Performance Report', 15, y);
        y += 8;
        const hdrs = ['Food Name', 'Category', 'Qty Sold', 'Revenue', 'Rating', 'Availability'];
        const widths = [60, 40, 30, 40, 25, 35];
        const rows = reportData.menuPerformance.map(m => [m.foodName, m.category, String(m.quantitySold), `Rs ${m.revenue.toLocaleString('en-IN')}`, m.rating, m.availability]);
        drawTable(hdrs, rows, widths);
      } else if (reportType === 'students') {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Activity Report', 15, y);
        y += 8;
        const hdrs = ['Student', 'Orders', 'Total Spent', 'Completed', 'Cancelled'];
        const widths = [70, 30, 45, 35, 35];
        const rows = reportData.studentActivity.map(s => [s.student, String(s.orders), `Rs ${s.totalSpent.toLocaleString('en-IN')}`, String(s.completedOrders), String(s.cancelledOrders)]);
        drawTable(hdrs, rows, widths);
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 200, { align: 'center' });
        doc.text('Generated by FOODEXA Institution Dashboard', 15, 200);
      }

      doc.save(`FOODEXA_${reportType}_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
      setDownloadSuccessMsg(`Exported ${reportType} PDF`);
      setTimeout(() => setDownloadSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('[Reports] PDF generation error:', err);
      setDownloadSuccessMsg(`PDF export failed: ${err.message || 'Unknown error'}`);
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    }
  };

  const getReportContent = (reportType: string): { headers: string[]; rows: string[][] } => {
    if (!reportData) return { headers: [], rows: [] };
    if (reportType === 'orders') {
      return {
        headers: ['Order Number', 'Student', 'Institution', 'Canteen', 'Date', 'Time', 'Items', 'Quantities', 'Subtotal', 'Total', 'Payment Method', 'Payment Status', 'Order Status', 'Pickup Code', 'Token Number'],
        rows: reportData.orderDetails.map(o => [o.orderNumber, o.student, o.institution, o.canteen, o.date, o.time, o.items, o.quantities, `Rs ${o.subtotal.toFixed(0)}`, `Rs ${o.total.toFixed(0)}`, o.paymentMethod, o.paymentStatus, o.orderStatus, o.pickupCode, o.tokenNumber]),
      };
    } else if (reportType === 'revenue') {
      return {
        headers: ['Date', 'Order Count', 'Paid Orders', 'Revenue', 'Refunded Amount', 'Net Revenue'],
        rows: reportData.dailyRevenue.map(d => [d.date, String(d.orderCount), String(d.paidOrders), `Rs ${d.revenue.toLocaleString('en-IN')}`, `Rs ${d.refundedAmount.toLocaleString('en-IN')}`, `Rs ${d.netRevenue.toLocaleString('en-IN')}`]),
      };
    } else if (reportType === 'menu') {
      return {
        headers: ['Food Name', 'Category', 'Quantity Sold', 'Revenue', 'Rating', 'Availability'],
        rows: reportData.menuPerformance.map(m => [m.foodName, m.category, String(m.quantitySold), `Rs ${m.revenue.toLocaleString('en-IN')}`, m.rating, m.availability]),
      };
    } else if (reportType === 'students') {
      return {
        headers: ['Student', 'Orders', 'Total Spent', 'Completed Orders', 'Cancelled Orders'],
        rows: reportData.studentActivity.map(s => [s.student, String(s.orders), `Rs ${s.totalSpent.toLocaleString('en-IN')}`, String(s.completedOrders), String(s.cancelledOrders)]),
      };
    }
    return { headers: [], rows: [] };
  };

  const handleDownload = (reportType: string, format: 'CSV' | 'Excel' | 'PDF') => {
    if (format === 'PDF') { downloadPDF(reportType); return; }
    const { headers, rows } = getReportContent(reportType);
    if (format === 'CSV') downloadCSV(reportType, rows, headers);
    else if (format === 'Excel') downloadExcel(reportType, rows, headers);
  };

  const reportTypes = [
    { id: 'revenue', title: `${period.charAt(0).toUpperCase() + period.slice(1)} Revenue Report`, desc: `Sales and order settlements for ${formatDateRange(period)}`, formats: ['CSV', 'Excel', 'PDF'] as const, icon: TrendingUp },
    { id: 'orders', title: 'Orders Report', desc: 'All orders with status, payment, and item details', formats: ['CSV', 'Excel', 'PDF'] as const, icon: FileText },
    { id: 'students', title: 'Student Activity Report', desc: 'Student meal ordering patterns and spending', formats: ['CSV', 'Excel', 'PDF'] as const, icon: Users },
    { id: 'menu', title: 'Menu Performance Report', desc: 'Item popularity, revenue, and availability', formats: ['CSV', 'Excel', 'PDF'] as const, icon: Utensils },
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
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg transition-all ${period === p ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {downloadSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <Sparkles className="w-4 h-4" /><span>{downloadSuccessMsg}</span>
        </div>
      )}
      {fetchError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /><span>{fetchError}</span>
        </div>
      )}
      {!institutionId && (
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold text-center">
          No institution associated with this account. Please contact support.
        </div>
      )}

      {reportData && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Period Revenue</div>
            <div className="text-lg font-black text-white font-mono mt-1">₹{reportData.periodRevenue.toLocaleString('en-IN')}</div>
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

      {loading && (
        <div className="p-8 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">Loading report data...</p>
        </div>
      )}

      {!reportData && !loading && !fetchError && institutionId && (
        <div className="p-8 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">Loading report data...</p>
        </div>
      )}

      {reportData && !loading && reportData.totalOrders === 0 && (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">No orders found for this period.</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different time range.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{report.title}</h3>
                  <p className="text-xs text-slate-400">{report.desc}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {report.formats.map((fmt) => (
                  <button key={fmt} onClick={() => handleDownload(report.id, fmt)} disabled={loading || !reportData}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    <Download className="w-3.5 h-3.5" /><span>{fmt}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
