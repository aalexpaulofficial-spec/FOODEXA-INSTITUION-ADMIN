import React, { useState } from 'react';
import { UserCheck, Shield, Key, Plus, Check, X } from 'lucide-react';
import { StaffMember } from '../../../types';

interface StaffManagementProps {
  staff: StaffMember[];
  onTogglePermission: (staffId: string, permKey: string) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ staff, onTogglePermission }) => {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Staff & RBAC Role Permissions</h1>
          <p className="text-xs text-slate-400">
            Manage university cafeteria operators, kitchen managers, and role permission matrices.
          </p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Staff Member</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Assigned Block</th>
                <th className="px-4 py-3.5 text-center">Menu Edit</th>
                <th className="px-4 py-3.5 text-center">Order Manage</th>
                <th className="px-4 py-3.5 text-center">Vendor Approve</th>
                <th className="px-4 py-3.5 text-center">Analytics View</th>
                <th className="px-4 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-100">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 font-medium">{s.assignedCampusBlock}</td>

                  {/* Permission Toggles */}
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => onTogglePermission(s.id, 'menuEdit')}
                      className={`p-1 rounded-md text-xs font-bold ${
                        s.permissions.menuEdit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {s.permissions.menuEdit ? '✓' : '✕'}
                    </button>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => onTogglePermission(s.id, 'orderManage')}
                      className={`p-1 rounded-md text-xs font-bold ${
                        s.permissions.orderManage ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {s.permissions.orderManage ? '✓' : '✕'}
                    </button>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => onTogglePermission(s.id, 'vendorApprove')}
                      className={`p-1 rounded-md text-xs font-bold ${
                        s.permissions.vendorApprove ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {s.permissions.vendorApprove ? '✓' : '✕'}
                    </button>
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => onTogglePermission(s.id, 'analyticsView')}
                      className={`p-1 rounded-md text-xs font-bold ${
                        s.permissions.analyticsView ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                      }`}
                    >
                      {s.permissions.analyticsView ? '✓' : '✕'}
                    </button>
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono text-emerald-400 font-semibold">
                    {s.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
