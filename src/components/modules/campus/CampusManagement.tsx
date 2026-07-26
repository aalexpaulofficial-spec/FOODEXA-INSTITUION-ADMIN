import React, { useState } from 'react';
import { Building, Store, Users, Clock, Plus, Layers, MapPin } from 'lucide-react';
import { CampusBlock } from '../../../types';

interface CampusManagementProps {
  campusBlocks: CampusBlock[];
}

export const CampusManagement: React.FC<CampusManagementProps> = ({ campusBlocks }) => {
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Campus & Infrastructure Management</h1>
          <p className="text-xs text-slate-400">
            Configure university campus blocks, food courts, counter capacity, and operating schedules.
          </p>
        </div>
      </div>

      {/* Campus Blocks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
        ))}
      </div>
    </div>
  );
};
