import React, { useState, useCallback } from 'react';
import {
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  ChevronRight,
  ShieldCheck,
  Search,
  Plus,
  Users,
  Utensils,
  Layers,
  AlertCircle,
  Power,
  Edit3,
  Trash2
} from 'lucide-react';
import { Vendor, Counter, CampusBlock } from '../../../types';

interface CanteenManagementProps {
  vendors: Vendor[];
  counters?: Counter[];
  campusBlocks?: CampusBlock[];
  onApproveVendor: (vendorId: string) => void;
  onRejectVendor: (vendorId: string) => void;
  onSuspendVendor: (vendorId: string) => void;
  onAddCounter: (counter: Counter) => Promise<string | null>;
  onUpdateCounter?: (counterId: string, updates: Partial<Counter>) => Promise<void>;
  onDeleteCounter?: (counterId: string) => Promise<void>;
  onArchiveCounter?: (counterId: string) => Promise<void>;
  onRestoreCounter?: (counterId: string) => Promise<void>;
  onUpdateCounterStatus?: (counterId: string, status: string) => Promise<void>;
  onToggleCounterAvailability?: (counterId: string) => Promise<void>;
  onDeleteVendor?: (vendorId: string) => Promise<void>;
}

// ─── CounterModalForm extracted OUTSIDE the parent component ────────────────
// This is critical: defining it inside the parent causes React to unmount +
// remount the entire modal on every state change (every keystroke), which
// produces the blink/flash. Keeping it outside preserves the DOM tree.
interface CounterModalFormProps {
  isEdit: boolean;
  counterName: string;
  assignedStaff: string;
  counterError: string | null;
  isSaving: boolean;
  onCounterNameChange: (v: string) => void;
  onAssignedStaffChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const CounterModalForm: React.FC<CounterModalFormProps> = ({
  isEdit,
  counterName,
  assignedStaff,
  counterError,
  isSaving,
  onCounterNameChange,
  onAssignedStaffChange,
  onSubmit,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 relative animate-fade-in">
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>{isEdit ? 'Edit Campus Food Counter' : 'Create Campus Food Counter'}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isEdit ? 'Update counter name and staff assignment.' : 'Configure a new serving counter with staff assignment.'}
          </p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {counterError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{counterError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div>
          <label className="text-slate-400 font-semibold block mb-1">Counter Name *</label>
          <input
            type="text"
            required
            value={counterName}
            onChange={(e) => onCounterNameChange(e.target.value)}
            placeholder="e.g. Counter A - Main Kitchen"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-slate-400 font-semibold block mb-1">Assigned Kitchen Staff</label>
          <input
            type="text"
            value={assignedStaff}
            onChange={(e) => onAssignedStaffChange(e.target.value)}
            placeholder="Name 1, Name 2"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isEdit ? 'Update Counter' : 'Create Counter'}
          </button>
        </div>
      </form>
    </div>
  </div>
);
// ────────────────────────────────────────────────────────────────────────────

export const CanteenManagement: React.FC<CanteenManagementProps> = ({
  vendors,
  counters = [],
  campusBlocks = [],
  onApproveVendor,
  onRejectVendor,
  onSuspendVendor,
  onAddCounter,
  onUpdateCounter,
  onDeleteCounter,
  onArchiveCounter,
  onRestoreCounter,
  onUpdateCounterStatus,
  onToggleCounterAvailability,
  onDeleteVendor
}) => {
  const [activeTab, setActiveTab] = useState<'registered' | 'counters' | 'pending'>('counters');
  const [counterStatusFilter, setCounterStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorModal, setSelectedVendorModal] = useState<Vendor | null>(null);

  const [isAddCounterOpen, setIsAddCounterOpen] = useState(false);
  const [isEditCounterOpen, setIsEditCounterOpen] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [counterError, setCounterError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteVendorConfirm, setDeleteVendorConfirm] = useState<string | null>(null);

  const [newCounterName, setNewCounterName] = useState('');
  const [newAssignedStaff, setNewAssignedStaff] = useState('');

  const registeredVendors = vendors.filter((v) => v.status === 'approved' || v.status === 'suspended');
  const pendingVendors = vendors.filter((v) => v.status === 'pending');

  const displayedVendors = (activeTab === 'registered' ? registeredVendors : pendingVendors).filter(
    (v) =>
      (v.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.campusBlock || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCounters = counters.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = counterStatusFilter === 'all' || c.status === counterStatusFilter || (counterStatusFilter === 'active' && c.isAvailable);
    return matchesSearch && matchesStatus;
  });

  const counterStats = {
    total: counters.length,
    active: counters.filter(c => c.isAvailable && c.status !== 'archived').length,
    archived: counters.filter(c => c.status === 'archived').length,
    inactive: counters.filter(c => !c.isAvailable && c.status !== 'archived').length,
  };

  const resetForm = useCallback(() => {
    setNewCounterName('');
    setNewAssignedStaff('');
    setCounterError(null);
  }, []);

  const handleCreateCounterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;

    setIsSaving(true);
    setCounterError(null);

    const createdCounter: Counter = {
      id: '',
      code: newCounterName.trim(),
      name: newCounterName.trim(),
      campusBlock: '',
      categories: [],
      operatingHours: '',
      isAvailable: true,
      assignedStaff: newAssignedStaff ? newAssignedStaff.split(',').map((s) => s.trim()).filter(Boolean) : [],
      queueLength: 0,
      avgWaitTimeMins: 0,
      activeMenuCount: 0,
      status: 'active'
    };

    const result = await onAddCounter(createdCounter);
    if (result === null) {
      setCounterError('Failed to create counter. Check console for details.');
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsAddCounterOpen(false);
    resetForm();
  }, [newCounterName, newAssignedStaff, onAddCounter, resetForm]);

  const handleEditCounterOpen = useCallback((counter: Counter) => {
    setEditingCounter(counter);
    setNewCounterName(counter.name);
    setNewAssignedStaff(counter.assignedStaff?.join(', ') || '');
    setCounterError(null);
    setIsEditCounterOpen(true);
  }, []);

  const handleEditCounterSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCounter || !newCounterName.trim()) return;

    setIsSaving(true);
    setCounterError(null);

    if (onUpdateCounter) {
      await onUpdateCounter(editingCounter.id, {
        name: newCounterName.trim(),
        assignedStaff: newAssignedStaff ? newAssignedStaff.split(',').map((s) => s.trim()).filter(Boolean) : [],
      });
    }

    setIsSaving(false);
    setIsEditCounterOpen(false);
    setEditingCounter(null);
    resetForm();
  }, [editingCounter, newCounterName, newAssignedStaff, onUpdateCounter, resetForm]);

  const handleDeleteVendor = async (vendorId: string) => {
    if (onDeleteVendor) { await onDeleteVendor(vendorId); }
    setDeleteVendorConfirm(null);
  };

  const handleDeleteCounterConfirm = async (counterId: string) => {
    if (onDeleteCounter) {
      await onDeleteCounter(counterId);
    }
  };

  const handleOpenCreateModalCustom = useCallback(() => {
    setNewCounterName('');
    setNewAssignedStaff('');
    setCounterError(null);
    setIsAddCounterOpen(true);
  }, []);

  const handleCloseAddModal = useCallback(() => {
    setIsAddCounterOpen(false);
    resetForm();
  }, [resetForm]);

  const handleCloseEditModal = useCallback(() => {
    setIsEditCounterOpen(false);
    setEditingCounter(null);
    resetForm();
  }, [resetForm]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Campus Counter &amp; Canteen Management</h1>
          <p className="text-xs text-slate-400">
            Control campus food counters, assign categories, staff, timing, &amp; vendor outlets.
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('counters')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'counters'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Campus Counters ({counters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('registered')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'registered'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Registered Outlets ({registeredVendors.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pending Approvals</span>
            {pendingVendors.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                {pendingVendors.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'counters'
                ? 'Search counter code, name, categories, block...'
                : 'Search vendor outlet name, owner, or campus block...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {activeTab === 'counters' && (
          <button
            onClick={handleOpenCreateModalCustom}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Counter</span>
          </button>
        )}
      </div>

      {activeTab === 'counters' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Counters</div>
              <div className="text-lg font-black text-white font-mono">{counterStats.total}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/20">
              <div className="text-[10px] text-emerald-400 uppercase font-semibold">Active</div>
              <div className="text-lg font-black text-emerald-400 font-mono">{counterStats.active}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-red-500/20">
              <div className="text-[10px] text-red-400 uppercase font-semibold">Inactive</div>
              <div className="text-lg font-black text-red-400 font-mono">{counterStats.inactive}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/20">
              <div className="text-[10px] text-indigo-400 uppercase font-semibold">Archived</div>
              <div className="text-lg font-black text-indigo-400 font-mono">{counterStats.archived}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {['all', 'active', 'inactive', 'archived'].map((st) => (
              <button key={st} onClick={() => setCounterStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all border ${counterStatusFilter === st ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}>
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab === 'counters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {displayedCounters.map((counter) => (
            <div
              key={counter.id}
              className={`p-5 rounded-2xl bg-slate-900/80 border transition-all shadow-xl space-y-4 flex flex-col justify-between ${
                counter.isAvailable ? 'border-slate-800 hover:border-amber-500/40' : 'border-red-900/40 bg-slate-950/90'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-black text-sm">
                      {counter.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{counter.name}</h3>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                        <span>{counter.campusBlock}</span>
                        <span>•</span>
                        <span className="text-amber-400/90 font-mono">{counter.operatingHours}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onToggleCounterAvailability && onToggleCounterAvailability(counter.id)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 border transition-all ${
                        counter.isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{counter.isAvailable ? 'OPEN' : 'CLOSED'}</span>
                    </button>
                    {counter.status === 'archived' ? (
                      <button
                        onClick={() => onRestoreCounter && onRestoreCounter(counter.id)}
                        className="px-3 py-1 rounded-xl text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => onArchiveCounter && onArchiveCounter(counter.id)}
                        className="px-3 py-1 rounded-xl text-[11px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-white hover:bg-zinc-700"
                      >
                        Archive
                      </button>
                    )}
                    <button
                      onClick={() => handleEditCounterOpen(counter)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Edit Counter"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${counter.code} - ${counter.name}? This cannot be undone.`)) {
                          handleDeleteCounterConfirm(counter.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete Counter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Assigned Menu Categories:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(counter.categories || []).map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 border border-amber-500/20 text-[11px] font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Queue Size</div>
                    <div className="text-sm font-black text-white mt-0.5 font-mono">
                      {counter.queueLength} Orders
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Avg Wait</div>
                    <div className="text-sm font-black text-emerald-400 mt-0.5 font-mono">
                      {counter.avgWaitTimeMins} Mins
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Menu Items</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5 font-mono">
                      {counter.activeMenuCount} Items
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assigned Kitchen Staff:</span>
                  </span>
                  <span className="text-slate-200 font-semibold">{counter.assignedStaff?.join(', ') || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}

          {displayedCounters.length === 0 && (
            <div className="col-span-2 p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500 space-y-3">
              <Layers className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
              <p className="font-semibold text-slate-300">No counters match your search criteria</p>
              <button onClick={handleOpenCreateModalCustom} className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-colors">
                <Plus className="w-3.5 h-3.5 inline mr-1" />Create First Counter
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab !== 'counters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{vendor.name}</h3>
                      <div className="text-[11px] text-slate-400">{vendor.outletType}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      vendor.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : vendor.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {vendor.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Owner:</span>
                    <span className="text-slate-200 font-medium">{vendor.ownerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Campus Block:</span>
                    <span className="text-slate-200 font-medium">{vendor.campusBlock}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Operating Hours:</span>
                    <span className="text-slate-200 font-mono text-[11px]">{vendor.openingHours}</span>
                  </div>
                  {vendor.status === 'approved' && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Rating:</span>
                      <span className="text-amber-400 font-bold flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{vendor.rating} / 5.0</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedVendorModal(vendor)}
                  className="flex-1 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                >
                  <span>View Outlet Docs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {vendor.status === 'pending' && (
                  <button
                    onClick={() => onApproveVendor(vendor.id)}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-emerald-500/20"
                  >
                    Approve
                  </button>
                )}
                {vendor.status === 'approved' && (
                  <button
                    onClick={() => setDeleteVendorConfirm(vendor.id)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className='w-3.5 h-3.5' />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Modals rendered via stable external component ─── */}
      {isAddCounterOpen && (
        <CounterModalForm
          isEdit={false}
          counterName={newCounterName}
          assignedStaff={newAssignedStaff}
          counterError={counterError}
          isSaving={isSaving}
          onCounterNameChange={setNewCounterName}
          onAssignedStaffChange={setNewAssignedStaff}
          onSubmit={handleCreateCounterSubmit}
          onClose={handleCloseAddModal}
        />
      )}
      {isEditCounterOpen && (
        <CounterModalForm
          isEdit={true}
          counterName={newCounterName}
          assignedStaff={newAssignedStaff}
          counterError={counterError}
          isSaving={isSaving}
          onCounterNameChange={setNewCounterName}
          onAssignedStaffChange={setNewAssignedStaff}
          onSubmit={handleEditCounterSubmit}
          onClose={handleCloseEditModal}
        />
      )}

      {selectedVendorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedVendorModal.name}</h2>
                <p className="text-xs text-amber-400">{selectedVendorModal.outletType}</p>
              </div>
              <button
                onClick={() => setSelectedVendorModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-300">Food Safety &amp; Hygiene Documentation</div>
                <div className="flex items-center space-x-2 text-emerald-400 pt-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>FSSAI License &amp; Health Clearance Verified</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Seating Capacity</div>
                  <div className="text-sm font-bold text-white mt-1">{selectedVendorModal.seatingCapacity} Seats</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Sales Revenue</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                    ₹{(selectedVendorModal.monthlyRevenue || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Contact &amp; Owner Details</div>
                <div className="text-slate-200">{selectedVendorModal.ownerName} ({selectedVendorModal.email})</div>
                <div className="text-slate-400 font-mono">{selectedVendorModal.phone}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex space-x-2">
              {selectedVendorModal.status === 'pending' ? (
                <>
                  <button
                    onClick={() => {
                      onApproveVendor(selectedVendorModal.id);
                      setSelectedVendorModal(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
                  >
                    Approve Canteen Vendor
                  </button>
                  <button
                    onClick={() => {
                      onRejectVendor(selectedVendorModal.id);
                      setSelectedVendorModal(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold"
                  >
                    Reject Application
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onSuspendVendor(selectedVendorModal.id);
                    setSelectedVendorModal(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs"
                >
                  Suspend Outlet Access
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteVendorConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0C0C0E] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Delete Vendor</h3>
            </div>
            <p className="text-xs text-zinc-400">Are you sure you want to permanently delete this vendor? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeleteVendorConfirm(null)} className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs">Cancel</button>
              <button onClick={() => handleDeleteVendor(deleteVendorConfirm)} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
