import React, { useState } from 'react';
import { FileUp, XCircle, AlertTriangle, CheckCircle2, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { MenuItem } from '../../../types';

interface BulkMenuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedItems: MenuItem[]) => void;
  onNotify: (msg: string) => void;
}

interface ParsedRow {
  id: string;
  name: string;
  category: string;
  price: string;
  prepTime: string;
  calories: string;
  type: string;
  vendorName: string;
  description: string;
  errors: string[];
}

export const BulkMenuImportModal: React.FC<BulkMenuImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onNotify
}) => {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = () => {
    setFileUploaded(true);
    // In a real implementation, this would parse the uploaded CSV/Excel file
    // For now, show empty state to demonstrate the UI
    setParsedRows([]);
    onNotify('✔ File upload triggered. Please implement actual CSV parsing.');
  };

  const handleFixRow = (id: string, field: keyof ParsedRow, value: string) => {
    setParsedRows(prev =>
      prev.map(row => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        const errors: string[] = [];
        if (!updated.name) errors.push('Missing Name');
        if (!updated.category) errors.push('Missing Category');
        if (!updated.price || parseFloat(updated.price) <= 0) errors.push('Price must be > 0');
        return { ...updated, errors };
      })
    );
  };

  const handleFinalImport = () => {
    const validRows = parsedRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) {
      alert('Please fix row errors before importing.');
      return;
    }

    const createdMenuItems: MenuItem[] = validRows.map((r, index) => ({
      id: `bulk-${Date.now()}-${index}`,
      vendorId: r.vendorName || '',
      vendorName: r.vendorName || '',
      name: r.name,
      category: r.category || '',
      price: parseFloat(r.price) || 0,
      prepTimeMinutes: parseInt(r.prepTime) || 0,
      calories: parseInt(r.calories) || 0,
      proteinGrams: 0,
      isVegetarian: r.type === 'Veg',
      dietaryType: r.type === 'Non-Veg' ? 'Non-Veg' : 'Veg',
      isAvailable: true,
      stockCount: 0,
      imageUrl: '',
      description: r.description || '',
      allergens: [],
      aiPopularityScore: 0,
      status: 'published',
      tags: ['Bulk Import', r.category],
      isTodaysSpecial: false,
      availableToday: true
    }));

    onImportSuccess(createdMenuItems);
    onNotify(`✔ ${createdMenuItems.length} menu items imported successfully!`);
    onClose();
    setFileUploaded(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0C0C0E] border border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-6 relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Bulk Menu Import (CSV / Excel)</h2>
              <p className="text-xs text-zinc-400">Upload bulk catalog sheets and review LX validation before publishing.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {!fileUploaded ? (
          <div className="space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileUpload(); }}
              onClick={handleFileUpload}
              className={`p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/40'
              }`}
            >
              <FileUp className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-bold text-white mb-1">Drag & Drop CSV / Excel File Here</p>
              <p className="text-xs text-zinc-400 mb-4">Supports .csv, .xlsx up to 10MB (max 500 rows per batch)</p>
              <span className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-700 transition-colors inline-block">
                Browse Workstation Files
              </span>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-300">Download Official FOODEXA Standard Menu CSV Template</span>
              </div>
              <button
                onClick={() => onNotify('✔ Downloading FOODEXA_Menu_Template.csv')}
                className="text-indigo-400 hover:underline font-bold"
              >
                Download Template ↓
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Reviewing <strong className="text-white">{parsedRows.length}</strong> catalog rows. Highlighted red rows require fix.
              </span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{parsedRows.filter(r => r.errors.length === 0).length} Ready to Import</span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto border border-zinc-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 text-zinc-400 font-semibold border-b border-zinc-800 sticky top-0">
                  <tr>
                    <th className="p-3">Status</th>
                    <th className="p-3">Food Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price ($)</th>
                    <th className="p-3">Prep Time</th>
                    <th className="p-3">Validation Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-[#0C0C0E]">
                  {parsedRows.map((row) => {
                    const hasErr = row.errors.length > 0;
                    return (
                      <tr key={row.id} className={hasErr ? 'bg-red-500/10' : 'hover:bg-zinc-900/40'}>
                        <td className="p-3">
                          {hasErr ? (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold inline-flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Error</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-white">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleFixRow(row.id, 'name', e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 text-xs font-semibold text-white focus:outline-none w-full"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.category}
                            placeholder="Select Category"
                            onChange={(e) => handleFixRow(row.id, 'category', e.target.value)}
                            className={`bg-transparent border-b ${!row.category ? 'border-red-500 text-red-300' : 'border-transparent text-zinc-300'} focus:outline-none text-xs w-full`}
                          />
                        </td>
                        <td className="p-3 font-mono">
                          <input
                            type="text"
                            value={row.price}
                            onChange={(e) => handleFixRow(row.id, 'price', e.target.value)}
                            className={`bg-transparent border-b ${parseFloat(row.price) <= 0 ? 'border-red-500 text-red-300' : 'border-transparent text-white'} focus:outline-none text-xs w-20`}
                          />
                        </td>
                        <td className="p-3 text-zinc-400">{row.prepTime} mins</td>
                        <td className="p-3">
                          {hasErr ? (
                            <span className="text-red-400 text-[11px] font-medium">{row.errors.join(', ')}</span>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">Passes LX Schema Check</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setFileUploaded(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold"
              >
                Upload Different File
              </button>
              <button
                onClick={handleFinalImport}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
              >
                <span>Confirm & Import Valid Menu Items</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
