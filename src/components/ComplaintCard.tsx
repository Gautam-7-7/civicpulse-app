'use client';

import React from 'react';
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  ArrowRight,
  ShieldAlert,
  Building
} from 'lucide-react';

export interface Complaint {
  complaint_id: number;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reported_at: string;
  sla_due_at: string;
  resolved_at: string | null;
  ward_id: number;
  ward_number: number;
  ward_name: string;
  zone: string;
  category_id: number;
  category_name: string;
  sla_hours: number;
  department_name: string;
  citizen_name: string;
  citizen_email?: string;
  assigned_staff_name: string | null;
  staff_designation?: string;
  is_sla_breached?: number;
  hours_left_sla?: number;
}

interface ComplaintCardProps {
  complaint: Complaint;
  onSelect: (complaint: Complaint) => void;
}

export function ComplaintCard({ complaint, onSelect }: ComplaintCardProps) {
  // Priority color config
  const priorityStyles = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };

  // Status color config
  const statusStyles = {
    open: 'bg-slate-800 text-slate-300 border-slate-700',
    assigned: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
    in_progress: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    resolved: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    closed: 'bg-gray-800 text-gray-400 border-gray-700',
    rejected: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
  };

  const isBreached = complaint.status !== 'resolved' && (complaint.is_sla_breached === 1 || (complaint.hours_left_sla !== undefined && complaint.hours_left_sla < 0));

  return (
    <div 
      onClick={() => onSelect(complaint)}
      className="group relative cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-blue-950/20 transition-all duration-200"
    >
      {/* Top row: Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-400">
            #{complaint.complaint_id}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${statusStyles[complaint.status] || statusStyles.open}`}>
            {complaint.status.replace('_', ' ')}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${priorityStyles[complaint.priority] || priorityStyles.medium}`}>
            {complaint.priority}
          </span>
        </div>

        {/* SLA Status */}
        {complaint.status === 'resolved' ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> Resolved
          </span>
        ) : isBreached ? (
          <span className="flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-900/60">
            <ShieldAlert className="w-3.5 h-3.5" /> SLA Breached
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
            <Clock className="w-3.5 h-3.5" /> 
            {complaint.hours_left_sla !== undefined && complaint.hours_left_sla >= 0
              ? `${complaint.hours_left_sla}h left in SLA`
              : 'Within SLA'}
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1 mb-1.5">
        {complaint.title}
      </h3>
      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
        {complaint.description}
      </p>

      {/* Meta tags */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">Ward {complaint.ward_number}: {complaint.ward_name}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{complaint.department_name}</span>
        </div>
      </div>

      {/* Footer info: Citizen & Assigned Staff */}
      <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">By {complaint.citizen_name}</span>
        </div>
        <span className="flex items-center gap-1 text-blue-400 group-hover:translate-x-1 transition-transform font-medium">
          View Details <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
