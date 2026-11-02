'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  MapPin, 
  User, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  History,
  Star,
  UserCheck,
  Send,
  Zap
} from 'lucide-react';
import { Complaint } from './ComplaintCard';

interface StatusHistoryItem {
  history_id: number;
  old_status: string;
  new_status: string;
  changed_at: string;
  remarks: string | null;
}

interface StaffMember {
  staff_id: number;
  full_name: string;
  designation: string;
  department_name: string;
  active_load: number;
}

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onUpdated: () => void;
  staffList: StaffMember[];
}

export function ComplaintDetailModal({ complaint, onClose, onUpdated, staffList }: ComplaintDetailModalProps) {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status);
      fetchDetails(complaint.complaint_id);
    }
  }, [complaint]);

  const fetchDetails = async (id: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/complaints/${id}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
        setFeedback(data.feedback || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!complaint) return null;

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    try {
      setUpdating(true);
      setMessage(null);
      const res = await fetch(`/api/complaints/${complaint.complaint_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          remarks: remarks.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Status updated to ${selectedStatus}. MySQL trigger logged history entry!`, type: 'success' });
        setRemarks('');
        await fetchDetails(complaint.complaint_id);
        onUpdated();
      } else {
        setMessage({ text: data.error || 'Failed to update status', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating status', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignStaff = async (auto = false) => {
    try {
      setUpdating(true);
      setMessage(null);
      const res = await fetch(`/api/complaints/${complaint.complaint_id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          auto 
            ? { auto_assign: true }
            : { staff_id: Number(selectedStaffId) }
        ),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        setSelectedStaffId('');
        await fetchDetails(complaint.complaint_id);
        onUpdated();
      } else {
        setMessage({ text: data.error || 'Failed to assign staff', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error assigning staff', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-blue-400">
              #{complaint.complaint_id}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {complaint.category_name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Message feedback */}
          {message && (
            <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{complaint.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-2xl border border-slate-800/70">
              {complaint.description}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 block mb-1">Ward Location</span>
              <span className="font-medium text-white flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Ward {complaint.ward_number} ({complaint.ward_name})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 block mb-1">Department</span>
              <span className="font-medium text-white flex items-center gap-1 truncate">
                <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{complaint.department_name}</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 block mb-1">Priority (Trigger Set)</span>
              <span className="font-semibold capitalize text-amber-400">
                {complaint.priority}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <span className="text-slate-400 block mb-1">SLA Deadline</span>
              <span className="font-medium text-white flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {complaint.sla_due_at ? new Date(complaint.sla_due_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Assigned Staff & Citizen info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block">Reported By</span>
                <span className="font-medium text-white">{complaint.citizen_name}</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                {new Date(complaint.reported_at).toLocaleDateString()}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block">Assigned Staff</span>
                <span className="font-medium text-emerald-400">
                  {complaint.assigned_staff_name || 'Unassigned'}
                </span>
                {complaint.staff_designation && (
                  <span className="block text-[11px] text-slate-400">{complaint.staff_designation}</span>
                )}
              </div>
              <UserCheck className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Staff Actions Panel */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/30 border border-slate-800 space-y-4">
            <h4 className="text-xs uppercase font-bold tracking-wider text-blue-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Staff & Municipal Actions (DML + Triggers)
            </h4>

            {/* Status change action */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Update Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Status Remarks (Logged in History)</label>
                <input
                  type="text"
                  placeholder="e.g. Work crew dispatched"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Commit Status Change
                </button>
              </div>
            </div>

            {/* Auto Assignment or Manual Assign */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none"
                >
                  <option value="">Select Staff to Assign...</option>
                  {staffList.map((s) => (
                    <option key={s.staff_id} value={s.staff_id}>
                      {s.full_name} ({s.department_name} • Active Load: {s.active_load})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssignStaff(false)}
                  disabled={!selectedStaffId || updating}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium disabled:opacity-50"
                >
                  Assign Staff
                </button>
              </div>

              <button
                onClick={() => handleAssignStaff(true)}
                disabled={updating}
                title="Executes CALL sp_auto_assign_complaint(id, dept_id)"
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 text-purple-400" /> Run Stored Procedure (Auto-Assign)
              </button>
            </div>
          </div>

          {/* Audit History Timeline (status_history table populated by MySQL trigger!) */}
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-400" /> Trigger Audit Trail (`status_history` table)
            </h4>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950/30 border border-slate-800/60">
                No state transitions logged yet for this complaint.
              </p>
            ) : (
              <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-4">
                {history.map((item) => (
                  <div key={item.history_id} className="relative text-xs">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <span className="capitalize text-slate-400">{item.old_status || 'Initial'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="capitalize text-blue-400">{item.new_status}</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.changed_at).toLocaleString()}
                        </span>
                      </div>
                      {item.remarks && (
                        <p className="text-slate-400 text-[11px] italic mt-1">
                          "{item.remarks}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Citizen Feedback if resolved */}
          {feedback && (
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-300">Citizen Rating & Feedback</span>
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3.5 h-3.5 ${i < feedback.rating ? 'fill-amber-400' : 'text-slate-600'}`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-300 italic">"{feedback.comments}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
