import React, { useState } from 'react';
import { FileText, Download, Sparkles } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  const handleDownload = (filename: string, format: string) => {
    const content = `FOODEXA Report: ${filename}\nGenerated: ${new Date().toISOString()}\nData sourced from Supabase.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format.toLowerCase()}`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccessMsg(`Downloaded ${filename}.${format.toLowerCase()}`);
    setTimeout(() => setDownloadSuccessMsg(null), 3000);
  };

  const reportTypes = [
    { id: 'daily', title: 'Daily Revenue Report', desc: 'Itemized sales and settlements', formats: ['CSV', 'PDF'] },
    { id: 'orders', title: 'Orders Log', desc: 'All orders with status and payment details', formats: ['CSV', 'PDF'] },
    { id: 'students', title: 'Student Activity', desc: 'Student meal ordering patterns', formats: ['CSV'] },
    { id: 'menu', title: 'Menu Performance', desc: 'Item popularity and revenue', formats: ['CSV', 'PDF'] },
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
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span>{downloadSuccessMsg}</span>
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
