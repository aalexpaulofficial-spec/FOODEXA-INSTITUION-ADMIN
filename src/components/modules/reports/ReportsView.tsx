import React, { useState, useEffect } from 'react';
import { Download, Sparkles, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

type Period = 'daily' | 'weekly' | 'monthly';

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

export const ReportsView: React.FC = () => {
  const { institutionId } = useAuth();
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
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
    orderDetails: {
      orderNumber: string; date: string; time: string; student: string;
      canteen: string; items: string; quantity: number; amount: number;
      paymentStatus: string; orderStatus: string; pickupStatus: string;
    }[];
  } | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!institutionId) return;
      setFetchError(null);
      try {
        const { start, end } = getISTDateRange(period);
        const startISO = start.toISOString();
        const endISO = end.toISOString();

        const [ordersResult, profilesResult] = await Promise.all([
          supabase
            .from('orders')
            .select('*, order_items(*, menu_items(food_name, price, regular_price))')
            .eq('institution_id', institutionId)
            .gte('created_at', startISO)
            .lte('created_at', endISO),
          supabase
            .from('profiles')
            .select('id, user_id, full_name, email')
            .eq('institution_id', institutionId)
            .eq('role', 'student'),
        ]);

        if (ordersResult.error) {
          console.error('[Reports] Orders fetch error:', ordersResult.error);
          setFetchError(`Unable to load report data: ${ordersResult.error.message}`);
          return;
        }

        const periodOrders = (ordersResult.data as any[]) || [];
        const profiles = (profilesResult.data as any[]) || [];
        const profileMap = new Map(profiles.map((p: any) => [p.user_id || p.id, p]));

        const allOrdersResult = await supabase
          .from('orders')
          .select('id, created_at, status, payment_status, total_amount')
          .eq('institution_id', institutionId);
        const allOrders = (allOrdersResult.data as any[]) || [];

        const totalOrders = allOrders.length;
        const totalStudents = profiles.length;
        const periodRevenue = periodOrders
          .filter((o: any) => o.payment_status === 'paid')
          .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
        const totalRevenue = allOrders
          .filter((o: any) => o.payment_status === 'paid')
          .reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
        const pendingOrders = periodOrders.filter((o: any) => o.status === 'pending').length;
        const preparingOrders = periodOrders.filter((o: any) => o.status === 'preparing').length;
        const readyOrders = periodOrders.filter((o: any) => o.status === 'ready').length;
        const completedOrders = periodOrders.filter((o: any) => o.status === 'completed').length;
        const cancelledOrders = periodOrders.filter((o: any) => o.status === 'cancelled').length;

        const mealCounts: Record<string, { orders: number; revenue: number }> = {};
        periodOrders.forEach((o: any) => {
          const orderItems = Array.isArray(o.order_items) ? o.order_items : [];
          orderItems.forEach((item: any) => {
            const itemName = item.item_name || item.menu_items?.food_name || 'Item';
            if (!mealCounts[itemName]) mealCounts[itemName] = { orders: 0, revenue: 0 };
            const qty = item.quantity || 1;
            const price = item.unit_price || item.menu_items?.price || item.price || 0;
            mealCounts[itemName].orders += qty;
            mealCounts[itemName].revenue += qty * price;
          });
        });
        const topMenuItems = Object.entries(mealCounts)
          .sort((a, b) => b[1].orders - a[1].orders)
          .slice(0, 10)
          .map(([name, data]) => ({ name, orders: data.orders, revenue: data.revenue }));

        const studentOrderCounts: Record<string, number> = {};
        periodOrders.forEach((o: any) => {
          const sid = o.student_id || o.studentId;
          if (sid) studentOrderCounts[sid] = (studentOrderCounts[sid] || 0) + 1;
        });
        const studentActivity = Object.entries(studentOrderCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([studentId, count]) => {
            const profile = profileMap.get(studentId);
            return { name: profile?.full_name || studentId, orders: count };
          });

        const statusCounts: Record<string, number> = {};
        periodOrders.forEach((o: any) => {
          const st = o.status || 'unknown';
          statusCounts[st] = (statusCounts[st] || 0) + 1;
        });
        const orderStatusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

        const orderDetails = periodOrders.map((o: any) => {
          const profile = profileMap.get(o.student_id || o.studentId);
          const orderItems = Array.isArray(o.order_items) ? o.order_items : [];
          const itemsStr = orderItems.map((it: any) => {
            const n = it.item_name || it.menu_items?.food_name || 'Item';
            return `${n} x${it.quantity || 1}`;
          }).join(', ');
          const totalQty = orderItems.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
          const createdDate = o.created_at ? new Date(new Date(o.created_at).getTime() + 5.5 * 60 * 60 * 1000) : null;
          return {
            orderNumber: o.order_number || o.id?.slice(0, 8) || '',
            date: createdDate ? createdDate.toISOString().split('T')[0] : '',
            time: createdDate ? createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : '',
            student: profile?.full_name || o.student_name || '',
            canteen: o.canteen_name || o.vendor_name || '',
            items: itemsStr,
            quantity: totalQty,
            amount: o.total_amount || 0,
            paymentStatus: o.payment_status || '',
            orderStatus: o.status || '',
            pickupStatus: o.counter_status || '',
          };
        });

        setReportData({
          totalOrders, totalRevenue, totalStudents, pendingOrders, preparingOrders,
          readyOrders, completedOrders, cancelledOrders, periodRevenue, topMenuItems,
          studentActivity, orderStatusBreakdown, orderDetails,
        });
      } catch (err) {
        console.error('[Reports] Fetch error:', err);
        setFetchError('Unable to load report data. Please try again.');
      }
    };

    fetchReportData();
  }, [institutionId, period]);

  const downloadCSV = (reportType: string, rows: string[][], headers: string[]) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
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
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 15;

      doc.setFillColor(45, 55, 72);
      doc.rect(0, 0, pageWidth, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FOODEXA', 15, 14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Institution Management Platform', 15, 20);
      doc.setFontSize(10);
      doc.text(`Report: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`, 15, 27);
      doc.text(`Period: ${formatDateRange(period)}`, pageWidth - 15, 27, { align: 'right' });
      doc.text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`, pageWidth - 15, 14, { align: 'right' });
      y = 40;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(
        reportType === 'revenue' ? 'Revenue Report' :
        reportType === 'orders' ? 'Orders Report' :
        reportType === 'menu' ? 'Menu Performance Report' :
        'Student Activity Report', 15, y
      );
      y += 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Institution ID: ${institutionId || 'N/A'}`, 15, y);
      y += 10;

      if (!reportData) {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('No data available for this period.', 15, y);
        doc.save(`FOODEXA_${reportType}_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
        setDownloadSuccessMsg(`Exported ${reportType} PDF`);
        setTimeout(() => setDownloadSuccessMsg(null), 3000);
        return;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);

      const drawTableHeader = (headers: string[], colX: number[]) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(240, 240, 240);
        doc.rect(12, y - 4, pageWidth - 24, 7, 'F');
        headers.forEach((h, i) => doc.text(h, colX[i], y));
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
      };

      if (reportType === 'revenue') {
        const lines = [
          `Period Revenue: Rs ${reportData.periodRevenue.toLocaleString('en-IN')}`,
          `Total Revenue (All Time): Rs ${reportData.totalRevenue.toLocaleString('en-IN')}`,
          `Total Orders (All Time): ${reportData.totalOrders}`,
          `Total Students: ${reportData.totalStudents}`,
          `Completed: ${reportData.completedOrders}`,
          `Cancelled: ${reportData.cancelledOrders}`,
        ];
        lines.forEach(line => { doc.text(line, 15, y); y += 6; });
        y += 5;

        if (reportData.orderStatusBreakdown.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Status Breakdown:', 15, y); y += 6;
          doc.setFont('helvetica', 'normal');
          reportData.orderStatusBreakdown.forEach(item => {
            doc.text(`  ${item.status}: ${item.count}`, 15, y); y += 5;
          });
          y += 5;
        }
        if (reportData.topMenuItems.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Top Items:', 15, y); y += 6;
          doc.setFont('helvetica', 'normal');
          reportData.topMenuItems.slice(0, 5).forEach(item => {
            doc.text(`  ${item.name}: ${item.orders} orders, Rs ${item.revenue.toLocaleString('en-IN')}`, 15, y); y += 5;
          });
        }
      } else if (reportType === 'orders') {
        const hdrs = ['Order #', 'Date', 'Time', 'Student', 'Amount', 'Payment', 'Status'];
        const colX = [15, 42, 68, 90, 130, 152, 175];
        drawTableHeader(hdrs, colX);
        reportData.orderDetails.slice(0, 40).forEach(order => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(order.orderNumber.substring(0, 12), colX[0], y);
          doc.text(order.date, colX[1], y);
          doc.text(order.time, colX[2], y);
          doc.text(order.student.substring(0, 18), colX[3], y);
          doc.text(`Rs ${order.amount}`, colX[4], y);
          doc.text(order.paymentStatus, colX[5], y);
          doc.text(order.orderStatus, colX[6], y);
          y += 5;
        });
        y += 5;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Orders: ${reportData.orderDetails.length}`, 15, y); y += 5;
        doc.text(`Period Revenue: Rs ${reportData.periodRevenue.toLocaleString('en-IN')}`, 15, y);
      } else if (reportType === 'menu') {
        const hdrs = ['Item Name', 'Orders', 'Revenue'];
        const colX = [15, 120, 155];
        drawTableHeader(hdrs, colX);
        reportData.topMenuItems.forEach(item => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(item.name.substring(0, 40), colX[0], y);
          doc.text(String(item.orders), colX[1], y);
          doc.text(`Rs ${item.revenue.toLocaleString('en-IN')}`, colX[2], y);
          y += 5;
        });
      } else if (reportType === 'students') {
        const hdrs = ['Student Name', 'Total Orders'];
        const colX = [15, 120];
        drawTableHeader(hdrs, colX);
        reportData.studentActivity.forEach(item => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(item.name.substring(0, 40), colX[0], y);
          doc.text(String(item.orders), colX[1], y);
          y += 5;
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 290, { align: 'center' });
        doc.text('Generated by FOODEXA', 15, 290);
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
        rows: [[formatDateRange(period), `₹${reportData.periodRevenue.toLocaleString('en-IN')}`, String(reportData.totalOrders), String(reportData.completedOrders), String(reportData.pendingOrders), String(reportData.preparingOrders), String(reportData.readyOrders), String(reportData.cancelledOrders)]],
      };
    } else if (reportType === 'orders') {
      return {
        headers: ['Order Number', 'Date', 'Time', 'Student', 'Canteen', 'Items', 'Quantity', 'Amount', 'Payment Status', 'Order Status', 'Pickup Status'],
        rows: reportData.orderDetails.map(item => [
          item.orderNumber, item.date, item.time, item.student, item.canteen,
          item.items, String(item.quantity), `₹${item.amount}`, item.paymentStatus, item.orderStatus, item.pickupStatus,
        ]),
      };
    } else if (reportType === 'menu') {
      return {
        headers: ['Item', 'Orders', 'Revenue'],
        rows: reportData.topMenuItems.map(item => [item.name, String(item.orders), `₹${item.revenue.toLocaleString('en-IN')}`]),
      };
    } else if (reportType === 'students') {
      return {
        headers: ['Student', 'Orders'],
        rows: reportData.studentActivity.map(item => [item.name, String(item.orders)]),
      };
    }
    return { headers: [], rows: [] };
  };

  const handleDownload = (reportType: string, format: 'CSV' | 'Excel' | 'PDF') => {
    if (format === 'PDF') {
      downloadPDF(reportType);
      return;
    }
    const { headers, rows } = getReportContent(reportType);
    if (format === 'CSV') downloadCSV(reportType, rows, headers);
    else if (format === 'Excel') downloadExcel(reportType, rows, headers);
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

      {fetchError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {!institutionId && (
        <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold text-center">
          No institution associated with this account. Please contact support.
        </div>
      )}

      {reportData && (
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

      {!reportData && !fetchError && institutionId && (
        <div className="p-8 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">Loading report data...</p>
        </div>
      )}

      {reportData && reportData.totalOrders === 0 && (
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">No orders found for this period.</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting a different time range.</p>
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
                  disabled={!reportData}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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