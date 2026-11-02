'use client';

import React, { useState } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  FileCode2, 
  Table, 
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';

interface DatabaseSettingsProps {
  dbStatus: { ok: boolean; message: string; version?: string } | null;
  onRefreshDb: () => void;
  isCheckingDb: boolean;
}

export function DatabaseSettings({ dbStatus, onRefreshDb, isCheckingDb }: DatabaseSettingsProps) {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleRunSeed = async () => {
    try {
      setSeeding(true);
      setSeedResult(null);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      setSeedResult(data);
      if (data.success) {
        onRefreshDb();
      }
    } catch (err: any) {
      setSeedResult({ success: false, error: err.message });
    } finally {
      setSeeding(false);
    }
  };

  const tables = [
    { name: 'wards', role: 'Municipal boundary references (Bangalore Wards 149-176)' },
    { name: 'departments', role: 'Municipal civic agencies (Roads, BWSSB, BESCOM, Sanitation)' },
    { name: 'issue_categories', role: 'Issue taxonomies, default priorities, and SLA hour policies' },
    { name: 'users', role: 'Citizens, Staff, Supervisors, and Admin accounts' },
    { name: 'staff_profiles', role: 'Officer department linkage, designations, and active ticket load' },
    { name: 'complaints', role: 'Core grievance records with lat/lng, FULLTEXT index, SLA timestamps' },
    { name: 'assignments', role: 'Active & archived officer task dispatches' },
    { name: 'status_history', role: 'Immutable state transition audit trail written by MySQL Triggers' },
    { name: 'citizen_feedback', role: 'Post-resolution ratings (1-5 stars) and review comments' },
    { name: 'complaint_upvotes', role: 'Civic engagement table allowing residents to upvote existing issues' },
    { name: 'complaint_embeddings', role: 'Vector database extension storing 128-D dense vectors for semantic search' },
  ];

  const advancedFeatures = [
    {
      title: 'Advanced Feature 1: Triggers (BEFORE INSERT, BEFORE/AFTER UPDATE)',
      desc: 'Automatic derivation of SLA target deadlines from category policies, automatic timestamping of resolutions, and immutable logging into status_history without application layer intervention.',
    },
    {
      title: 'Advanced Feature 2: Stored Procedure & Atomic Routing (sp_auto_assign_complaint)',
      desc: 'Workload-balanced staff assignment executing as a single atomic transaction: queries active department capacity, deactivates previous assignments, increments officer load, and transitions complaint status.',
    },
    {
      title: 'Advanced Feature 3: Vector Database & Semantic Similarity Search (Option 2)',
      desc: '128-dimensional continuous vector embeddings mapped via subword and domain concept hashing, evaluated via Cosine Similarity (u · v) to detect semantic duplicates and cluster redundant complaints in real time.',
    },
    {
      title: 'Advanced Feature 4: Full-Text Search (MATCH ... AGAINST)',
      desc: 'MySQL FULLTEXT index on complaints(title, description) supporting natural language duplicate queries alongside vector retrieval.',
    },
    {
      title: 'Advanced Feature 5: Analytical Aggregations & Views',
      desc: 'Multi-table analytical queries with GROUP BY, HAVING, and aggregate functions (COUNT, SUM, CASE) powering ward-level SLA breach detection and performance scorecards.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Database Control & Schema Architecture</h2>
        </div>
        <p className="text-xs text-slate-400">
          Direct management of MySQL schema, connection variables, seed data, and trigger execution.
        </p>
      </div>

      {/* Connection & Seeding Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Connection status */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Connection Status</span>
            <button
              onClick={onRefreshDb}
              disabled={isCheckingDb}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} /> Test Ping
            </button>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            dbStatus?.ok 
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
              : 'bg-amber-950/30 border-amber-800/60 text-amber-300'
          }`}>
            {dbStatus?.ok ? (
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-6 h-6 shrink-0 text-amber-400" />
            )}
            <div className="text-xs">
              <span className="font-bold block text-sm">
                {dbStatus?.ok ? 'Connected to MySQL' : 'Database Disconnected'}
              </span>
              <span className="text-slate-400">{dbStatus?.message}</span>
              {dbStatus?.version && (
                <span className="block font-mono text-[11px] text-slate-500 mt-1">
                  Engine: MySQL {dbStatus.version}
                </span>
              )}
            </div>
          </div>

          <div className="text-xs space-y-1.5 text-slate-400 font-mono bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div>HOST: <span className="text-white">localhost:3306</span></div>
            <div>DATABASE: <span className="text-white">civicpulse</span></div>
            <div>USER: <span className="text-white">root</span></div>
            <div className="text-[11px] text-slate-500 font-sans mt-2">
              Configuration loaded from <code className="text-cyan-300">.env.local</code>
            </div>
          </div>
        </div>

        {/* One-click Seeder */}
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              One-Click DDL & Seed Execution
            </span>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Instantly applies <code className="text-cyan-300 font-mono">civicpulse_ddl_mysql.sql</code> and populates all 12 tables with sample Bangalore municipal data (<code className="text-cyan-300 font-mono">civicpulse_seed_data.sql</code>).
            </p>

            {seedResult && (
              <div className={`p-3.5 rounded-2xl text-xs mb-3 border ${
                seedResult.success 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
              }`}>
                {seedResult.success ? (
                  <span>✅ {seedResult.message}</span>
                ) : (
                  <span>❌ {seedResult.error}</span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleRunSeed}
            disabled={seeding}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {seeding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Executing DDL & Seeds...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Initialize / Reload Database Seeds
              </>
            )}
          </button>
        </div>
      </div>

      {/* Relational Tables Architecture */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Table className="w-4 h-4 text-blue-400" /> Relational Entities Implemented (Course Rubric)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {tables.map((t) => (
            <div key={t.name} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <span className="font-mono font-bold text-blue-400 block mb-1">`{t.name}`</span>
              <p className="text-[11px] text-slate-400">{t.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Features (Triggers & Procedures) */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" /> Advanced DBMS Features Implemented
        </h3>

        <div className="space-y-3">
          {advancedFeatures.map((f, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <span className="font-semibold text-white block mb-1">{f.title}</span>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
