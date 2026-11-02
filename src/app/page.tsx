'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, UserRole } from '@/components/Navbar';
import { ComplaintCard, Complaint } from '@/components/ComplaintCard';
import { ComplaintDetailModal } from '@/components/ComplaintDetailModal';
import { NewComplaintForm } from '@/components/NewComplaintForm';
import { AdminConsole } from '@/components/AdminConsole';
import { AnalyticsView } from '@/components/AnalyticsView';
import { DatabaseSettings } from '@/components/DatabaseSettings';
import { VectorSearchStudio } from '@/components/VectorSearchStudio';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Inbox,
  User,
  ShieldCheck,
  Cpu,
  Layers
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('complaints');
  const [currentRole, setCurrentRole] = useState<UserRole>('citizen');
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string; version?: string } | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // Data states
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyMyComplaints, setOnlyMyComplaints] = useState(false);

  // Selected complaint modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    checkDbStatus();
    loadReferenceData();
    loadStaff();
    loadComplaints();
  }, []);

  const checkDbStatus = async () => {
    try {
      setIsCheckingDb(true);
      const res = await fetch('/api/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({ ok: false, message: 'Could not connect to MySQL server.' });
    } finally {
      setIsCheckingDb(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const res = await fetch('/api/reference');
      const data = await res.json();
      if (data.success) {
        setWards(data.wards || []);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error loading reference data', err);
    }
  };

  const loadStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error('Error loading staff', err);
    }
  };

  const loadComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (wardFilter !== 'all') params.append('ward_id', wardFilter);
      if (categoryFilter !== 'all') params.append('category_id', categoryFilter);

      const res = await fetch(`/api/complaints?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Error loading complaints', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  // Re-fetch complaints when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadComplaints();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, wardFilter, categoryFilter]);

  // Role-filtered complaints (for Citizen "My Grievances" view)
  const displayedComplaints = complaints.filter((c) => {
    if (currentRole === 'citizen' && onlyMyComplaints) {
      // Citizen Gautam Sharma user_id = 6 or matching email
      return (c as any).citizen_id === 6 || c.citizen_name?.includes('Gautam') || c.citizen_email?.includes('gautam');
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        onRefreshDb={checkDbStatus}
        isCheckingDb={isCheckingDb}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Active Role Persona Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${currentRole === 'citizen' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
              {currentRole === 'citizen' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-slate-400">Authenticated Persona:</span>{' '}
              <strong className="text-white">
                {currentRole === 'citizen' ? 'Gautam Sharma (Resident, Ward 174 HSR Layout)' : 'System Administrator (Municipal Command Center)'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Role: {currentRole.toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-400">
              {currentRole === 'citizen' ? 'Can submit, track, and upvote issues' : 'Full access to stored procedures, triage, and SLA triggers'}
            </span>
          </div>
        </div>

        {/* DB Disconnected Alert Banner */}
        {dbStatus && !dbStatus.ok && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="text-white block">MySQL Connection Needs Attention:</strong>
                <span>{dbStatus.message}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition-colors"
            >
              Configure / Seed Database →
            </button>
          </div>
        )}

        {/* Tab 1: Browse Complaints */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            {/* Header & Quick Action */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Bengaluru Grievance Board
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Active municipal complaints tracked across South, East & Mahadevapura zones.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {currentRole === 'citizen' && (
                  <button
                    onClick={() => setOnlyMyComplaints(!onlyMyComplaints)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      onlyMyComplaints
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {onlyMyComplaints ? 'Showing My Reports (Gautam)' : 'Filter: My Reports'}
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('file')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  Report Grievance
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search grievance titles or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>

                {/* Ward Filter */}
                <select
                  value={wardFilter}
                  onChange={(e) => setWardFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="all">All Wards</option>
                  {wards.map((w) => (
                    <option key={w.ward_id} value={w.ward_id}>
                      Ward {w.ward_number} ({w.ward_name})
                    </option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={loadComplaints}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Refresh Complaints"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingComplaints ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Complaints Grid */}
            {loadingComplaints ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : displayedComplaints.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40">
                <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">No Grievances Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  No complaints match your active filters. You can file a new grievance or seed the sample data.
                </p>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-white hover:bg-slate-700 font-medium"
                >
                  Go to Database & Seed Tool
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedComplaints.map((c) => (
                  <ComplaintCard
                    key={c.complaint_id}
                    complaint={c}
                    onSelect={(comp) => setSelectedComplaint(comp)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: File New Complaint */}
        {activeTab === 'file' && (
          <NewComplaintForm
            wards={wards}
            categories={categories}
            currentUserId={currentRole === 'citizen' ? 6 : 1}
            onSuccess={() => {
              loadComplaints();
              setActiveTab('complaints');
            }}
          />
        )}

        {/* Tab 3: Vector Database & Semantic Search Studio */}
        {activeTab === 'vector' && <VectorSearchStudio />}

        {/* Tab 4: Staff & Admin Console */}
        {activeTab === 'admin' && (
          <AdminConsole
            complaints={complaints}
            staff={staff}
            onRefresh={() => {
              loadComplaints();
              loadStaff();
            }}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
          />
        )}

        {/* Tab 5: Ward Analytics */}
        {activeTab === 'analytics' && <AnalyticsView />}

        {/* Tab 6: Database Settings & Seeds */}
        {activeTab === 'settings' && (
          <DatabaseSettings
            dbStatus={dbStatus}
            onRefreshDb={() => {
              checkDbStatus();
              loadReferenceData();
              loadStaff();
              loadComplaints();
            }}
            isCheckingDb={isCheckingDb}
          />
        )}
      </main>

      {/* Selected Complaint Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onUpdated={() => {
            loadComplaints();
            loadStaff();
          }}
          staffList={staff}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>CivicPulse • PES University DBMS Experiential Learning Project (Level 3)</p>
        <p className="text-[11px] text-slate-600 mt-1">Multi-Paradigm: MySQL 8.0 (ACID Relational) + Vector Database (128-D Cosine Index)</p>
      </footer>
    </div>
  );
}
