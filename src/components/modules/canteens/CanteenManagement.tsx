import React, { useState } from 'react';
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
  Power
} from 'lucide-react';
import { Vendor, Counter } from '../../../types';

interface CanteenManagementProps {
  vendors: Vendor[];
  counters?: Counter[];
  onApproveVendor: (vendorId: string) => void;
  onRejectVendor: (vendorId: string) => void;
  onSuspendVendor: (vendorId: string) => void;
  onAddCounter?: (counter: Counter) => void;
  onToggleCounterAvailability?: (counterId: string) => void;
}

const CATEGORY_OPTIONS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Beverages',
  'Desserts',
  'Healthy Meals',
  'Fast Food'
];

export const CanteenManagement: React.FC<CanteenManagementProps> = ({
  vendors,
  counters = [],
  onApproveVendor,
  onRejectVendor,
  onSuspendVendor,
  onAddCounter,
  onToggleCounterAvailability
}) => {
  const [activeTab, setActiveTab] = useState<'registered' | 'counters' | 'pending'>('counters');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorModal, setSelectedVendorModal] = useState<Vendor | null>(null);

  // New Counter Modal State
  const [isAddCounterOpen, setIsAddCounterOpen] = useState(false);
  const [newCounterCode, setNewCounterCode] = useState('');
  const [newCounterName, setNewCounterName] = useState('');
  const [newCampusBlock, setNewCampusBlock] = useState('Central Food Court');
  const [newOperatingHours, setNewOperatingHours] = useState('08:00 AM - 09:00 PM');
  const [newSelectedCategories, setNewSelectedCategories] = useState<string[]>(['Breakfast', 'Fast Food']);
  const [newAssignedStaff, setNewAssignedStaff] = useState('Rajesh Kumar, Anita Roy');

  const registeredVendors = vendors.filter((v) => v.status === 'approved' || v.status === 'suspended');
  const pendingVendors = vendors.filter((v) => v.status === 'pending');

  const displayedVendors = (activeTab === 'registered' ? registeredVendors : pendingVendors).filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.campusBlock.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCounters = counters.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.campusBlock.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.categories.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCategoryToggle = (cat: string) => {
    setNewSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleCreateCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterCode.trim() || !newCounterName.trim()) return;

    const createdCounter: Counter = {
      id: `cnt-${Date.now()}`,
      code: newCounterCode.trim(),
      name: newCounterName.trim(),
      campusBlock: newCampusBlock,
      categories: newSelectedCategories.length > 0 ? newSelectedCategories : ['Snacks'],
      operatingHours: newOperatingHours,
      isAvailable: true,
      assignedStaff: newAssignedStaff.split(',').map((s) => s.trim()).filter(Boolean),
      queueLength: 0,
      avgWaitTimeMins: 5,
      activeMenuCount: 12
    };

    if (onAddCounter) {
      onAddCounter(createdCounter);
    }

    setIsAddCounterOpen(false);
    setNewCounterCode('');
    setNewCounterName('');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Campus Counter & Canteen Management</h1>
          <p className="text-xs text-slate-400">
            Control campus food counters (Counter A, B, C, D), assign categories, staff, timing, & vendor outlets.
          </p>
        </div>

        {/* Tab Switcher */}
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

      {/* Action Bar & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'counters'
                ? 'Search counter code (Counter A, B, C...), categories, block...'
                : 'Search vendor outlet name, owner, or campus block...'
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {activeTab === 'counters' && (
          <button
            onClick={() => {
              setNewCounterCode(`Counter ${String.fromCharCode(65 + counters.length)}`);
              setNewCounterName(`Counter ${String.fromCharCode(65 + counters.length)} - Campus Food Express`);
              setIsAddCounterOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Counter (Unlimited)</span>
          </button>
        )}
      </div>

      {/* COUNTERS TAB CONTENT */}
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

                  <button
                    onClick={() => onToggleCounterAvailability && onToggleCounterAvailability(counter.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 border transition-all ${
                      counter.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{counter.isAvailable ? 'OPEN / ACTIVE' : 'CLOSED'}</span>
                  </button>
                </div>

                {/* Categories Assigned */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Assigned Menu Categories:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {counter.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 border border-amber-500/20 text-[11px] font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live Telemetry Bar */}
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

                {/* Staff Assigned */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assigned Kitchen Staff:</span>
                  </span>
                  <span className="text-slate-200 font-semibold">{counter.assignedStaff.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}

          {displayedCounters.length === 0 && (
            <div className="col-span-2 p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500 space-y-3">
              <Layers className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
              <p className="font-semibold text-slate-300">No counters match your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* VENDORS / OUTLETS TAB CONTENT */}
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

              {/* Action Bar */}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE NEW COUNTER MODAL */}
      {isAddCounterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 relative animate-fade-in">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Create Campus Food Counter</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Configure a new serving counter (Counter A, B, C, D...) with category mapping and staff assignment.
                </p>
              </div>
              <button
                onClick={() => setIsAddCounterOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCounterSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Counter Code (e.g. Counter E)</label>
                  <input
                    type="text"
                    required
                    value={newCounterCode}
                    onChange={(e) => setNewCounterCode(e.target.value)}
                    placeholder="Counter E"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Campus Block Location</label>
                  <select
                    value={newCampusBlock}
                    onChange={(e) => setNewCampusBlock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Central Food Court">Central Food Court</option>
                    <option value="North Tech Hub">North Tech Hub</option>
                    <option value="South Science Wing">South Science Wing</option>
                    <option value="Hostel Quad B">Hostel Quad B</option>
                    <option value="Library Plaza">Library Plaza</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Counter Title / Display Name</label>
                <input
                  type="text"
                  required
                  value={newCounterName}
                  onChange={(e) => setNewCounterName(e.target.value)}
                  placeholder="e.g. Counter E - Fresh Juice & Smoothie Bar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1.5">
                  Assigned Menu Categories
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = newSelectedCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={`px-3 py-1.5 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Operating Timing</label>
                  <input
                    type="text"
                    value={newOperatingHours}
                    onChange={(e) => setNewOperatingHours(e.target.value)}
                    placeholder="08:00 AM - 09:00 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Assigned Kitchen Staff</label>
                  <input
                    type="text"
                    value={newAssignedStaff}
                    onChange={(e) => setNewAssignedStaff(e.target.value)}
                    placeholder="Name 1, Name 2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCounterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  Create Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR PROFILE MODAL */}
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
                <div className="font-bold text-slate-300">Food Safety & Hygiene Documentation</div>
                <div className="flex items-center space-x-2 text-emerald-400 pt-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>FSSAI License & Health Clearance Verified</span>
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
                    ${selectedVendorModal.monthlyRevenue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Contact & Owner Details</div>
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
    </div>
  );
};
