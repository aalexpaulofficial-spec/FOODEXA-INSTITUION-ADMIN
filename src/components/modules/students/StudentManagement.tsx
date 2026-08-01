import React, { useState } from 'react';
import {
  Search,
  Filter,
  User,
  QrCode,
  Wallet,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  X,
  PlusCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Student, Order } from '../../../types';

interface StudentManagementProps {
  students: Student[];
  orders: Order[];
  onUpdateStudentStatus: (studentId: string, status: 'active' | 'suspended') => void;
  onDeleteStudent?: (studentId: string) => Promise<void>;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  orders,
  onUpdateStudentStatus,
  onDeleteStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeStudentDrawer, setActiveStudentDrawer] = useState<Student | null>(null);

  const departments = Array.from(new Set(students.map((s) => s.department)));
  const blocks = Array.from(new Set(students.map((s) => s.campusBlock)));

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || s.department === selectedDept;
    const matchesBlock = selectedBlock === 'all' || s.campusBlock === selectedBlock;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesDept && matchesBlock && matchesStatus;
  });

  const getStudentOrders = (studentId: string) =>
    orders.filter((o) => o.studentId === studentId);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Student Management</h1>
          <p className="text-xs text-slate-400">
            View student profiles, digital campus QR IDs, meal plan status, and LX AI interaction metrics.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <User className="w-3.5 h-3.5 text-amber-400" />
          <span>Total Registered: <strong className="text-white">{students.length}</strong></span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, ID (e.g. CS2023-8891), or email..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Campus Block Filter */}
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Campus Blocks</option>
            {blocks.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Student List Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Student</th>
                <th className="px-4 py-3.5">Student ID</th>
                <th className="px-4 py-3.5">Department & Sem</th>
                <th className="px-4 py-3.5">Campus Block</th>
                <th className="px-4 py-3.5">Wallet Balance</th>
                <th className="px-4 py-3.5">LX AI Queries</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-100">{student.name}</div>
                        <div className="text-[10px] text-slate-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-amber-400 font-semibold">
                    {student.studentId}
                  </td>
                  <td className="px-4 py-3.5">
                    <div>{student.department}</div>
                    <div className="text-[10px] text-slate-500">Semester {student.semester}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400">{student.campusBlock}</td>
                  <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">
                    ₹{(student.walletBalance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[11px] font-mono border border-cyan-500/20">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>{student.lxInteractionsCount} Asked</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        student.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-1">
                    <button
                      onClick={() => setActiveStudentDrawer(student)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Profile</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {onDeleteStudent && (
                      <button
                        onClick={() => { if (window.confirm('Delete this student? This action cannot be undone.')) onDeleteStudent(student.id); }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Profile Drawer */}
      {activeStudentDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveStudentDrawer(null)}
              className="absolute top-6 right-6 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Summary */}
            <div className="flex items-center space-x-4 border-b border-slate-800 pb-5">
              <img
                src={activeStudentDrawer.avatar}
                alt={activeStudentDrawer.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shadow-xl"
              />
              <div>
                <h2 className="text-lg font-bold text-white">{activeStudentDrawer.name}</h2>
                <div className="text-xs text-amber-400 font-mono font-semibold">
                  {activeStudentDrawer.studentId}
                </div>
                <div className="text-xs text-slate-400">{activeStudentDrawer.department} • Semester {activeStudentDrawer.semester}</div>
              </div>
            </div>

            {/* Digital Campus QR ID Badge */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-center space-x-1.5">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>FOODEXA Digital Campus ID</span>
              </div>
              <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl border border-slate-700 flex items-center justify-center shadow-inner">
                {/* Simulated QR Code matrix */}
                <div className="w-full h-full bg-slate-950 rounded p-1 flex flex-col justify-between">
                  <div className="grid grid-cols-4 gap-1">
                    <div className="h-4 bg-amber-400 rounded-sm" />
                    <div className="h-4 bg-slate-800 rounded-sm" />
                    <div className="h-4 bg-amber-400 rounded-sm" />
                    <div className="h-4 bg-slate-800 rounded-sm" />
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="h-4 bg-slate-800 rounded-sm" />
                    <div className="h-4 bg-amber-400 rounded-sm" />
                    <div className="h-4 bg-slate-800 rounded-sm" />
                  </div>
                  <div className="text-[8px] font-mono text-center text-slate-400 truncate">
                    {activeStudentDrawer.qrCode}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Scan at any canteen KDS or express locker for sub-30s pickup.
              </p>
            </div>

            {/* Wallet & Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Meal Wallet Balance</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                     ₹{(activeStudentDrawer.walletBalance || 0).toFixed(2)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Meals Ordered</div>
                <div className="text-lg font-black text-white font-mono mt-1">
                  {activeStudentDrawer.totalOrders}
                </div>
              </div>
            </div>

            {/* Dietary Tags */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-2">Dietary Preferences</label>
              <div className="flex flex-wrap gap-1.5">
                {(activeStudentDrawer.dietaryPreference || []).length > 0 ? (
                  (activeStudentDrawer.dietaryPreference || []).map((pref) => (
                    <span
                      key={pref}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium"
                    >
                      {pref}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No dietary restrictions noted.</span>
                )}
              </div>
            </div>

            {/* Order History */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Recent Order History
              </h3>
              <div className="space-y-2">
                {getStudentOrders(activeStudentDrawer.id).length > 0 ? (
                  getStudentOrders(activeStudentDrawer.id).map((ord) => {
                    const role = (ord as any).userRole || 'student';
                    const roleBadge = role.toLowerCase() === 'student' ? '🎓 Student' : role.toLowerCase() === 'faculty' ? '👨‍🏫 Faculty' : role.toLowerCase() === 'guest' ? '👤 Guest' : role;
                    return (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{ord.orderNumber} • {ord.vendorName}</div>
                        <div className="text-[10px] text-slate-500">{ord.orderTime} • {ord.paymentMethod}</div>
                        <div className="text-[10px] text-indigo-300 font-semibold mt-0.5">{roleBadge}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">₹{(ord.totalAmount || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">{ord.status}</div>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-500 py-3 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                    No recent order records found.
                  </div>
                )}
              </div>
            </div>

            {/* Status Management */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  const nextStatus = activeStudentDrawer.status === 'active' ? 'suspended' : 'active';
                  onUpdateStudentStatus(activeStudentDrawer.id, nextStatus);
                  setActiveStudentDrawer({ ...activeStudentDrawer, status: nextStatus });
                }}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-2 ${
                  activeStudentDrawer.status === 'active'
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {activeStudentDrawer.status === 'active'
                    ? 'Suspend Campus Meal Wallet'
                    : 'Re-activate Student Account'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
