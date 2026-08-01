import React, { useState } from 'react';
import { UserCheck, Shield, Key, Plus, Check, X, Trash2, Pencil } from 'lucide-react';
import { StaffMember } from '../../../types';

interface StaffManagementProps {
  staff: StaffMember[];
  onTogglePermission: (staffId: string, permKey: string) => void;
  onAddStaff: (staff: Partial<StaffMember>) => Promise<string | null>;
  onUpdateStaff: (staffId: string, updates: Partial<StaffMember>) => Promise<void>;
  onDeleteStaff: (staffId: string) => Promise<void>;
}

const PERMISSIONS: { key: keyof StaffMember['permissions']; label: string }[] = [
  { key: 'menuEdit', label: 'Menu Edit' },
  { key: 'orderManage', label: 'Order Manage' },
  { key: 'vendorApprove', label: 'Vendor Approve' },
  { key: 'analyticsView', label: 'Analytics View' },
];

export const StaffManagement: React.FC<StaffManagementProps> = ({
  staff,
  onTogglePermission,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffMember['role']>('Kitchen Manager');
  const [assignedCampusBlock, setAssignedCampusBlock] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('Kitchen Manager');
    setAssignedCampusBlock('');
    setEditingId(null);
  };

  const startEdit = (s: StaffMember) => {
    setEditingId(s.id);
    setName(s.name);
    setEmail(s.email);
    setRole(s.role);
    setAssignedCampusBlock(s.assignedCampusBlock);
    setShowAdd(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await onUpdateStaff(editingId, { name, email, role, assignedCampusBlock });
      } else {
        await onAddStaff({ name, email, role, assignedCampusBlock });
      }
      resetForm();
      setShowAdd(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!window.confirm('Delete this staff member? This cannot be undone.')) return;
    await onDeleteStaff(staffId);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Staff & RBAC Role Permissions</h1>
          <p className="text-xs text-slate-400">
            Manage university cafeteria operators, kitchen managers, and role permission matrices.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAdd(!showAdd); }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAdd ? 'Close' : 'Add Staff'}</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maria Santos" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@university.edu" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as StaffMember['role'])} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500">
                <option value="Institution Admin">Institution Admin</option>
                <option value="Kitchen Manager">Kitchen Manager</option>
                <option value="Campus Supervisor">Campus Supervisor</option>
                <option value="Support Staff">Support Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Assigned Block</label>
              <input value={assignedCampusBlock} onChange={(e) => setAssignedCampusBlock(e.target.value)} placeholder="e.g. Block A" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500" />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <button type="button" onClick={() => { setShowAdd(false); resetForm(); }} className="px-3 py-2 rounded-lg border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !name.trim() || !email.trim()} className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold disabled:opacity-50">
              {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Staff'}
            </button>
          </div>
        </form>
      )}

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
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
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

                  {PERMISSIONS.map((perm) => (
                    <td key={perm.key} className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => onTogglePermission(s.id, perm.key)}
                        className={`p-1 rounded-md text-xs font-bold ${
                          s.permissions[perm.key] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'
                        }`}
                        title={`Toggle ${perm.label}`}
                      >
                        {s.permissions[perm.key] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  ))}

                  <td className="px-4 py-3.5 text-center font-mono text-emerald-400 font-semibold">{s.status}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center space-x-1">
                      <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    <UserCheck className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    No staff members added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
