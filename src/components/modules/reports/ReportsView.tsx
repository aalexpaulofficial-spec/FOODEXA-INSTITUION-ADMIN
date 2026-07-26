import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  Calendar,
  CheckCircle2,
  DollarSign,
  Utensils,
  Leaf
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const handleSimulateDownload = (filename: string, format: string) => {
    // Generate dummy blob download
    const content = `FOODEXA Institution Operational Report\nFormat: ${format}\nTimestamp: ${new Date().toISOString()}\nExport Status: Complete`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format.toLowerCase()}`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadSuccessMsg(`Successfully generated and downloaded ${filename}.${format.toLowerCase()}!`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const reportsList = [
    {
      id: 'rep-1',
      title: 'Daily Campus Food Court Revenue & Settlement Report',
      period: 'Daily (26 July 2026)',
      type: 'Financial & Wallet',
      description: 'Itemized sales breakdowns, commission splits, and student meal wallet settlements.'
    },
    {
      id: 'rep-2',
      title: 'Weekly Canteen Outlet Throughput & SLA Audit',
      period: 'Weekly (19 July - 25 July 2026)',
      type: 'Operational SLA',
      description: 'Average prep times, kitchen order dispatch latencies, and student rating logs.'
    },
    {
      id: 'rep-3',
      title: 'AI Overproduction & Zero Food Waste Report',
      period: 'Monthly (July 2026)',
      type: 'Sustainability',
      description: 'Google Gemini overproduction estimation, leftover ingredient logs, and food rescue scores.'
    },
    {
      id: 'rep-4',
      title: 'Student Meal Plan & Wallet Audit Trail',
      period: 'Semester 2026-A',
      type: 'Auditing',
      description: 'UPI top-up histories, meal pass redemptions, and subsidy allocations.'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Reports & Data Exports</h1>
          <p className="text-xs text-slate-400">
            Generate and export official campus audit logs, revenue settlements, and zero food waste reports.
          </p>
        </div>
      </div>

      {downloadSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccessMsg}</span>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reportsList.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-sm font-bold text-white">{rep.title}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                  {rep.type}
                </span>
              </div>
              <p className="text-xs text-slate-400">{rep.description}</p>
              <div className="text-[11px] text-slate-500 font-mono">Period: {rep.period}</div>
            </div>

            {/* Export Format Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => handleSimulateDownload(rep.id, 'CSV')}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => handleSimulateDownload(rep.id, 'EXCEL')}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Excel</span>
              </button>

              <button
                onClick={() => handleSimulateDownload(rep.id, 'PDF')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-amber-500/20 flex items-center space-x-1"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
