'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Search, 
  Database, 
  RefreshCw, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface VectorResult {
  complaint_id: number;
  title: string;
  description: string;
  status: string;
  ward_id: number;
  category_id: number;
  similarity: number;
  matchType: 'high' | 'medium' | 'low';
}

interface VectorStats {
  totalVectors: number;
  dimension: number;
  indexType: string;
  similarityMetric: string;
  storagePath: string;
  lastUpdated: string;
}

export function VectorSearchStudio() {
  const [query, setQuery] = useState('water logging on street');
  const [threshold, setThreshold] = useState(0.40);
  const [results, setResults] = useState<VectorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<VectorStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Pre-configured evaluation queries to showcase semantic match vs keyword failure
  const sampleQueries = [
    { label: 'Rainwater Stagnation', text: 'stagnant rainwater pooling on asphalt' },
    { label: 'Pothole Hazard', text: 'large road crater skidding two wheelers' },
    { label: 'Dark Streetlight', text: 'dark street lights after dusk at junction' },
    { label: 'Garbage Overflow', text: 'smelly waste accumulation near children park' },
    { label: 'Sewage Leak', text: 'black foul smelling liquid backing up on road' },
  ];

  useEffect(() => {
    loadStats();
    handleSearch('water logging on street');
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/vector/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load vector stats:', err);
    }
  };

  const handleSearch = async (textToSearch: string) => {
    if (!textToSearch.trim()) return;
    try {
      setLoading(true);
      const startTime = performance.now();
      const res = await fetch('/api/vector/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSearch,
          threshold,
          limit: 6,
        }),
      });
      const data = await res.json();
      const endTime = performance.now();
      setLatency(Number((endTime - startTime).toFixed(1)));

      if (data.success) {
        setResults(data.matches || []);
      }
    } catch (err) {
      console.error('Vector search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromSql = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await fetch('/api/vector/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`Synced ${data.indexedCount} complaints from MySQL into Vector Database`);
        loadStats();
        handleSearch(query);
      } else {
        setSyncMessage(`Sync warning: ${data.error}`);
      }
    } catch (err: any) {
      setSyncMessage(err.message || 'Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Vector Database & Semantic Search Studio</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  Paradigm #2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dense 128-Dimensional Vector Embeddings with Cosine Similarity for Duplicate Detection and Semantic Clustering.
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncFromSql}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync MySQL → Vector DB'}
          </button>
        </div>

        {syncMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800 text-xs text-indigo-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Vector DB Architecture Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Vectors</span>
            <span className="text-lg font-bold text-white">{stats?.totalVectors ?? '5'} indexed</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Embedding Dimension</span>
            <span className="text-lg font-bold text-cyan-400">128-D Dense</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Similarity Metric</span>
            <span className="text-lg font-bold text-indigo-400">Cosine Similarity</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Query Latency</span>
            <span className="text-lg font-bold text-emerald-400">{latency ? `${latency} ms` : '< 2 ms'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Search Console */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-6">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Semantic Query Text (Test Natural Language Retrieval)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder="Try: 'deep crater in road' or 'street completely dark without lights'..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <button
              onClick={() => handleSearch(query)}
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              {loading ? 'Searching...' : 'Vector Search'}
            </button>
          </div>
        </div>

        {/* Quick Sample Queries */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">
            Demonstration Presets (Showcasing Semantic Matching):
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setQuery(item.text);
                  handleSearch(item.text);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-indigo-300 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Similarity Threshold Slider */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Cosine Similarity Cutoff Threshold: <strong className="text-white font-mono">{threshold.toFixed(2)}</strong></span>
          </div>
          <input
            type="range"
            min="0.20"
            max="0.85"
            step="0.05"
            value={threshold}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setThreshold(val);
              handleSearch(query);
            }}
            className="w-full sm:w-64 accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Results List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ranked Nearest Neighbors ({results.length} Matches Found)
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Ranking Metric: Dot Product (L2 Normalized Cosine Similarity)
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
              No vector matches found above similarity threshold of {threshold.toFixed(2)}. Try lowering the threshold or entering a different query.
            </div>
          ) : (
            results.map((res, idx) => {
              const percent = Math.round(res.similarity * 100);
              return (
                <div
                  key={res.complaint_id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-400 font-bold">#{idx + 1}</span>
                      <span className="text-sm font-semibold text-white">
                        Complaint #{res.complaint_id}: {res.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] uppercase font-semibold">
                        {res.status}
                      </span>
                      <span className="text-[11px] text-slate-400">Ward {res.ward_id}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{res.description}</p>
                  </div>

                  {/* Similarity Score Meter */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center shrink-0 min-w-[140px] pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-base font-bold font-mono ${
                        percent >= 70 ? 'text-emerald-400' : percent >= 55 ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {percent}%
                      </span>
                      <span className="text-[10px] text-slate-400">similarity</span>
                    </div>
                    <div className="w-24 bg-slate-800 rounded-full h-2 mt-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          percent >= 70 ? 'bg-emerald-500' : percent >= 55 ? 'bg-amber-400' : 'bg-slate-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
