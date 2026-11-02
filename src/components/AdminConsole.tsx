'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Send,
  RefreshCw,
  Search
} from 'lucide-react';
import { Complaint } from './ComplaintCard';

interface StaffMember {
  staff_id: number;
  full_name: string;
  designation: string;
  department_name: string;
  active_load: number;
  phone: string;
}

interface AdminConsoleProps {
  complaints: Complaint[];
  staff: StaffMember[];
  onRefresh: () => void;
  onSelectComplaint: (c: Complaint) => void;
}

export function AdminConsole({ complaints, staff, onRefresh, onSelectComplaint }: AdminConsoleProps) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const departments = Array.from(new Set(complaints.map((c) => c.department_name)));

  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterDept !== 'all' && c.department_name !== filterDept) return false;
    return true;
  });

  const unassignedComplaints = complaints.filter((c) => !c.assigned_staff_name && c.status === 'open');

  const handleQuickStatus = async (id: number, nextStatus: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, remarks: `Status updated via Admin Console to ${nextStatus}` }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner(`Complaint #${id} updated to ${nextStatus}. Trigger logged to status_history!`);
        onRefresh();
      }
    } catch (err: any) {
      setBanner(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoAssign = async (id: number) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/complaints/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_assign: true }),
      });
      const data = await res.json();
      if (data.success) {
        setBanner(`Stored procedure sp_auto_assign_complaint executed for complaint #${id}!`);
        onRefresh();
      } else {
        setBanner(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setBanner(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Municipal Staff & Operations Console</h2>
          </div>
          <p className="text-xs text-slate-400">
            Workforce assignment, status lifecycle mutations, and trigger verification.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Records
        </button>
      </div>

      {banner && (
        <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 text-xs text-indigo-200 flex items-center justify-between">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Staff Load Overview */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Staff Workload & Active Tickets (`staff_profiles` table)
          </h3>
          <span className="text-xs text-slate-400">
            {staff.length} Active Officers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {staff.map((s) => (
            <div key={s.staff_id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white truncate">{s.full_name}</span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                  s.active_load > 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  Load: {s.active_load}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{s.designation}</p>
              <p className="text-[10px] text-slate-500">{s.department_name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Complaints Management Table */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Operational Queue ({filteredComplaints.length})
          </h3>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints List / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ID & Title</th>
                <th className="py-3 px-3">Ward</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Assigned To</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredComplaints.map((c) => (
                <tr key={c.complaint_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                    <div 
                      onClick={() => onSelectComplaint(c)} 
                      className="cursor-pointer hover:text-blue-400 line-clamp-1"
                    >
                      <span className="font-mono text-slate-500 mr-1.5">#{c.complaint_id}</span>
                      {c.title}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">{c.category_name}</span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    Ward {c.ward_number}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full capitalize text-[10px] font-semibold border bg-slate-800 border-slate-700">
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3 capitalize font-semibold">
                    <span className={
                      c.priority === 'critical' ? 'text-red-400' :
                      c.priority === 'high' ? 'text-orange-400' : 'text-amber-400'
                    }>
                      {c.priority}
                    </span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-slate-400">
                    {c.assigned_staff_name ? (
                      <span className="text-emerald-400">{c.assigned_staff_name}</span>
                    ) : (
                      <button
                        onClick={() => handleAutoAssign(c.complaint_id)}
                        disabled={actionLoading}
                        className="px-2 py-0.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800 text-[10px] font-medium hover:bg-purple-900/60"
                      >
                        ⚡ Auto-Assign (SP)
                      </button>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {c.status === 'open' && (
                        <button
                          onClick={() => handleQuickStatus(c.complaint_id, 'assigned')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/30 hover:bg-purple-600/50"
                        >
                          Assign
                        </button>
                      )}
                      {c.status === 'assigned' && (
                        <button
                          onClick={() => handleQuickStatus(c.complaint_id, 'in_progress')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/30 hover:bg-blue-600/50"
                        >
                          Start Work
                        </button>
                      )}
                      {c.status === 'in_progress' && (
                        <button
                          onClick={() => handleQuickStatus(c.complaint_id, 'resolved')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/50"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={() => onSelectComplaint(c)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
