'use client';

import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  FileText, 
  ShieldCheck, 
  BarChart3, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Cpu,
  UserCheck,
  User
} from 'lucide-react';

export type UserRole = 'citizen' | 'admin';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dbStatus: { ok: boolean; message: string; version?: string } | null;
  onRefreshDb: () => void;
  isCheckingDb: boolean;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
}

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  dbStatus, 
  onRefreshDb, 
  isCheckingDb,
  currentRole,
  setCurrentRole
}: NavbarProps) {
  const tabs = [
    { id: 'complaints', label: 'Grievance Board', icon: FileText, roles: ['citizen', 'admin'] },
    { id: 'file', label: 'Report Grievance', icon: PlusCircle, roles: ['citizen'] },
    { id: 'vector', label: 'Vector DB Studio', icon: Cpu, roles: ['citizen', 'admin'], badge: 'AI' },
    { id: 'admin', label: 'Admin Triage', icon: ShieldCheck, roles: ['admin'] },
    { id: 'analytics', label: 'Analytics & SLA', icon: BarChart3, roles: ['admin'] },
    { id: 'settings', label: 'DB & Schema', icon: Database, roles: ['admin', 'citizen'] },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">CivicPulse</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  SQL + Vector
                </span>
              </div>
              <p className="text-[11px] text-slate-400">DBMS Level 3 • Dual Paradigm Grievance Engine</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isRelevantForRole = tab.roles.includes(currentRole);

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : isRelevantForRole
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 opacity-75'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Role Switcher + DB Status */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Role Switcher Pill */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setCurrentRole('citizen');
                  if (activeTab === 'admin' || activeTab === 'analytics') {
                    setActiveTab('complaints');
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  currentRole === 'citizen'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulate Citizen Persona: Gautam Sharma (Ward 174)"
              >
                <User className="w-3.5 h-3.5" />
                <span>Citizen</span>
              </button>
              <button
                onClick={() => {
                  setCurrentRole('admin');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  currentRole === 'admin'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulate Municipal Officer / Admin Persona"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin / Staff</span>
              </button>
            </div>

            {/* Database Status Pill */}
            <div 
              onClick={onRefreshDb}
              title={dbStatus?.message || 'Click to test MySQL connection'}
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                dbStatus?.ok
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/40'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/60 hover:bg-amber-900/40'
              }`}
            >
              {isCheckingDb ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : dbStatus?.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {isCheckingDb ? 'Pinging...' : dbStatus?.ok ? 'MySQL Live' : 'SQL Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2 gap-1 border-t border-slate-800/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
