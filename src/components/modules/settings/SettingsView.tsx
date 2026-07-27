import React, { useState } from 'react';
import { Settings, Shield, Building, Lock, CheckCircle2, Key, History } from 'lucide-react';
import { Institution, AuditLog } from '../../../types';

interface SettingsViewProps {
  currentInstitution: Institution;
  auditLogs: AuditLog[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentInstitution, auditLogs }) => {
  const [instName, setInstName] = useState(currentInstitution.name);
  const [email, setEmail] = useState(currentInstitution.email);
  const [phone, setPhone] = useState(currentInstitution.phone);
  const [tfaEnabled, setTfaEnabled] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Institution Profile & Security Settings</h1>
          <p className="text-xs text-slate-400">
            Configure university branding, 2FA security, session controls, and platform audit logs.
          </p>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Institution settings updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings Form */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Building className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">Institution Profile & Contact</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-400 font-semibold block mb-1">Institution Name</label>
              <input
                type="text"
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Security & 2FA */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">Security & Workstation Controls</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Enforce 2FA for Kitchen Staff</div>
                <div className="text-[10px] text-slate-400">Require 4-digit OTP upon KDS login</div>
              </div>
              <input
                type="checkbox"
                checked={tfaEnabled}
                onChange={(e) => setTfaEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 text-amber-500 border-slate-700"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200">Active Session</div>
              <div className="text-[11px] text-slate-400">Secured via Supabase Auth</div>
              <div className="text-[10px] text-emerald-400 font-mono pt-1">Session Encrypted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200">System Audit Logs</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Real-Time Security Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action Description</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-400">{log.timestamp}</td>
                  <td className="px-4 py-3 text-amber-400 font-semibold">{log.user}</td>
                  <td className="px-4 py-3 text-slate-200 font-sans">{log.action}</td>
                  <td className="px-4 py-3 text-cyan-400">{log.module}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
