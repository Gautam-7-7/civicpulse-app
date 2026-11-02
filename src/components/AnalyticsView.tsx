'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  MapPin, 
  Building2, 
  History,
  Activity,
  ArrowRight
} from 'lucide-react';

interface StatsData {
  summary: {
    total: number;
    open_count: number;
    assigned_count: number;
    in_progress_count: number;
    resolved_count: number;
    sla_breached_count: number;
  };
  wardStats: Array<{
    ward_id: number;
    ward_number: number;
    ward_name: string;
    zone: string;
    total_complaints: number;
    resolved_complaints: number;
  }>;
  departmentStats: Array<{
    department_name: string;
    complaint_count: number;
    staff_count: number;
  }>;
  recentActivity: Array<{
    history_id: number;
    old_status: string;
    new_status: string;
    changed_at: string;
    remarks: string;
    title: string;
    complaint_id: number;
  }>;
}

export function AnalyticsView() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Activity className="w-5 h-5 animate-spin mr-2 text-blue-500" /> Loading DBMS analytical summaries...
      </div>
    );
  }

  if (!data) return null;

  const s = data.summary || {
    total: 0,
    open_count: 0,
    assigned_count: 0,
    in_progress_count: 0,
    resolved_count: 0,
    sla_breached_count: 0,
  };

  const resolutionRate = s.total > 0 ? Math.round((Number(s.resolved_count) / Number(s.total)) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Ward Analytics & DBMS Aggregations</h2>
        </div>
        <p className="text-xs text-slate-400">
          Real-time metrics computed using SQL <code className="text-cyan-300 font-mono">COUNT, GROUP BY, SUM, JOIN</code> queries directly against MySQL.
        </p>
      </div>

      {/* 4 Key Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Grievances</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{s.total}</div>
          <span className="text-[11px] text-slate-500">Across Bengaluru Wards</span>
        </div>

        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Resolved Tickets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{s.resolved_count}</div>
          <span className="text-[11px] text-emerald-500/80">{resolutionRate}% Resolution Rate</span>
        </div>

        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>In Operations</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {Number(s.in_progress_count) + Number(s.assigned_count)}
          </div>
          <span className="text-[11px] text-slate-500">Assigned + Working</span>
        </div>

        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>SLA Breached</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{s.sla_breached_count}</div>
          <span className="text-[11px] text-rose-400/80">Pending Escaped SLA</span>
        </div>
      </div>

      {/* Ward & Department breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Breakdown */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Ward-Level Distribution (SQL GROUP BY)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Ward</th>
                  <th className="py-2.5 px-3">Zone</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-right">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.wardStats.map((w) => (
                  <tr key={w.ward_id}>
                    <td className="py-2.5 px-3 font-medium text-white">
                      Ward {w.ward_number}: {w.ward_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{w.zone}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-semibold text-blue-400">
                      {w.total_complaints}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                      {w.resolved_complaints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Departmental Load & Staff Capacity</h3>
          </div>

          <div className="space-y-3">
            {data.departmentStats.map((d) => (
              <div key={d.department_name} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-white">{d.department_name}</span>
                  <span className="text-[11px] text-slate-400">
                    {d.complaint_count} grievances • {d.staff_count} staff
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (Number(d.complaint_count) / Math.max(1, Number(s.total))) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Trigger Audit Stream */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Recent Trigger Executions (`status_history` Audit Stream)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.recentActivity.map((act) => (
            <div key={act.history_id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-blue-400">Complaint #{act.complaint_id}</span>
                <span className="text-slate-500">{new Date(act.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="font-medium text-white line-clamp-1">{act.title}</p>
              <div className="flex items-center gap-1.5 font-semibold">
                <span className="text-slate-400 capitalize">{act.old_status}</span>
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span className="text-emerald-400 capitalize">{act.new_status}</span>
              </div>
              {act.remarks && <p className="text-[11px] text-slate-400 italic line-clamp-1">"{act.remarks}"</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
