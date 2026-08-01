import React from 'react';
import { Building, Store, Users, Clock, MapPin, Mail, Phone, Globe, CalendarDays, Shield, Utensils, UserCheck, AlertTriangle, Hash } from 'lucide-react';
import { CampusBlock, Institution, Vendor, Counter, StaffMember } from '../../../types';

interface CampusManagementProps {
  campusBlocks: CampusBlock[];
  currentInstitution: Institution | null;
  vendors: Vendor[];
  counters: Counter[];
  staff: StaffMember[];
}

export const CampusManagement: React.FC<CampusManagementProps> = ({
  campusBlocks,
  currentInstitution,
  vendors,
  counters,
  staff,
}) => {
  const inst = currentInstitution;
  const activeVendors = vendors.filter(v => v.status === 'approved').length;
  const pendingVendors = vendors.filter(v => v.status === 'pending').length;
  const activeCounters = counters.filter(c => c.isAvailable).length;
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Campus & Infrastructure Management</h1>
          <p className="text-xs text-slate-400">
            View institution details, campus blocks, counters, vendors, and staff assignments.
          </p>
        </div>
      </div>

      {/* Institution Info Card */}
      {inst && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Building className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200">Institution Information</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              inst.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : inst.status === 'pending_approval'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {inst.status === 'active' ? 'Active' : inst.status === 'pending_approval' ? 'Pending' : inst.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Building className="w-3.5 h-3.5" />
                <span>Institution Name</span>
              </div>
              <p className="text-sm font-bold text-white">{inst.name || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Hash className="w-3.5 h-3.5" />
                <span>Institution Code</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">{inst.institution_code || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>Campus / City</span>
              </div>
              <p className="text-sm font-bold text-white">{inst.campus || inst.city || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5" />
                <span>Contact Email</span>
              </div>
              <p className="text-sm font-bold text-white">{inst.email || inst.institutionEmail || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Phone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </div>
              <p className="text-sm font-bold text-white">{inst.phone || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Joined Date</span>
              </div>
              <p className="text-sm font-bold text-white">{inst.joinedDate || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Globe className="w-3.5 h-3.5" />
                <span>Website</span>
              </div>
              <p className="text-sm font-bold text-white">{inst.institutionWebsite || 'Not set'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" />
                <span>Plan</span>
              </div>
              <p className="text-sm font-bold text-indigo-400">{inst.plan || 'Basic'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5" />
                <span>Contact Person</span>
              </div>
              <p className="text-sm font-bold text-white">{inst.contactPerson || 'Not set'}</p>
            </div>
          </div>
        </div>
      )}

      {!inst && (
        <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <Building className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-400">No institution data available. Please refresh or contact support.</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase">Campus Blocks</span>
            <Building className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{campusBlocks.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase">Active Vendors</span>
            <Store className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{activeVendors}</div>
          {pendingVendors > 0 && (
            <div className="text-[10px] text-amber-400 font-medium mt-1">{pendingVendors} pending</div>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase">Active Counters</span>
            <Utensils className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{activeCounters}</div>
          <div className="text-[10px] text-slate-500 mt-1">{counters.length} total</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase">Staff Members</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{activeStaff}</div>
          <div className="text-[10px] text-slate-500 mt-1">{totalStaff} total</div>
        </div>
      </div>

      {/* Campus Blocks Cards */}
      {campusBlocks.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Building className="w-4 h-4 text-indigo-400" />
            <span>Campus Blocks</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campusBlocks.map((block) => (
              <div
                key={block.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <Building className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-white text-sm">{block.name}</h3>
                      <span className="text-[10px] text-slate-500 font-mono">{block.code}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Enrolled Students:</span>
                    <span className="font-mono font-bold text-slate-200">{block.totalStudents.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Departments Housed:</span>
                    <span className="font-bold text-slate-200">{block.departmentsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Canteens:</span>
                    <span className="font-bold text-emerald-400">{block.canteensCount} Outlets</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operating Schedule:</span>
                    <span className="font-mono text-[11px] text-slate-200">{block.operatingHours}</span>
                  </div>
                </div>

                {/* Food Courts list */}
                {block.foodCourts && block.foodCourts.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Food Courts & Counters
                    </span>
                    {block.foodCourts.map((fc, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{fc.name}</div>
                          <div className="text-[10px] text-slate-500">{fc.counters} Active KDS Counters</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-amber-400 font-bold">{fc.capacity} Seats</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <Building className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-400">No campus blocks configured yet. Add blocks from the Canteen Management module.</p>
        </div>
      )}

      {/* Vendor Status Overview */}
      {vendors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Vendor Status Overview</span>
          </h3>
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Block</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {vendors.slice(0, 10).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-100">{v.name}</td>
                      <td className="px-4 py-3 text-slate-300">{v.campusBlock || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-400">{v.outletType || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          v.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          v.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-amber-400">{v.rating?.toFixed(1) || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Counter Status Overview */}
      {counters.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Utensils className="w-4 h-4 text-cyan-400" />
            <span>Counter Status</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {counters.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{c.name}</div>
                  <span className={`w-2 h-2 rounded-full ${c.isAvailable ? 'bg-emerald-400' : 'bg-red-400'}`} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">{c.code}</div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Block: {c.campusBlock || 'N/A'}</span>
                  <span>Queue: {c.queueLength || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Wait: ~{c.avgWaitTimeMins || 0} min</span>
                  <span>Menu Items: {c.activeMenuCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
