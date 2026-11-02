'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Layers,
  Database,
  Search,
  ThumbsUp,
  Cpu
} from 'lucide-react';

interface Ward {
  ward_id: number;
  ward_number: number;
  ward_name: string;
  zone: string;
}

interface Category {
  category_id: number;
  category_name: string;
  department_id: number;
  sla_hours: number;
  default_priority: string;
  department_name: string;
}

interface VectorMatch {
  complaint_id: number;
  title: string;
  description: string;
  status: string;
  similarity: number;
  matchType: 'high' | 'medium' | 'low';
}

interface NewComplaintFormProps {
  wards: Ward[];
  categories: Category[];
  currentUserId?: number;
  onSuccess: () => void;
}

export function NewComplaintForm({ 
  wards, 
  categories, 
  currentUserId = 6, 
  onSuccess 
}: NewComplaintFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wardId, setWardId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('12.9116');
  const [longitude, setLongitude] = useState<string>('77.6534');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Vector DB Duplicate Detection States
  const [similarMatches, setSimilarMatches] = useState<VectorMatch[]>([]);
  const [isSearchingVector, setIsSearchingVector] = useState(false);
  const [upvotedComplaints, setUpvotedComplaints] = useState<number[]>([]);

  const selectedCategory = categories.find((c) => c.category_id === Number(categoryId));

  const quickLocations = [
    { name: 'HSR Layout (27th Main)', lat: '12.9116', lng: '77.6534', wardNum: 174 },
    { name: 'Bellandur (Outer Ring Rd)', lat: '12.9348', lng: '77.6789', wardNum: 150 },
    { name: 'Koramangala (80ft Rd)', lat: '12.9352', lng: '77.6245', wardNum: 151 },
    { name: 'Indiranagar (100ft Rd)', lat: '12.9719', lng: '77.6412', wardNum: 160 },
    { name: 'Varthur (Main Rd)', lat: '12.9412', lng: '77.7465', wardNum: 149 },
  ];

  const handleSelectQuickLocation = (loc: typeof quickLocations[0]) => {
    setLatitude(loc.lat);
    setLongitude(loc.lng);
    const matchedWard = wards.find((w) => w.ward_number === loc.wardNum);
    if (matchedWard) {
      setWardId(String(matchedWard.ward_id));
    }
  };

  // Vector Similarity Search (Debounced on title/description change)
  const runVectorDuplicateCheck = useCallback(async (queryText: string, currentWard: string) => {
    if (!queryText || queryText.trim().length < 6) {
      setSimilarMatches([]);
      return;
    }

    try {
      setIsSearchingVector(true);
      const res = await fetch('/api/vector/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: queryText,
          ward_id: currentWard ? Number(currentWard) : undefined,
          threshold: 0.52,
          limit: 3,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSimilarMatches(data.matches || []);
      }
    } catch (err) {
      console.warn('Vector duplicate search error:', err);
    } finally {
      setIsSearchingVector(false);
    }
  }, []);

  useEffect(() => {
    const combinedText = `${title} ${description}`.trim();
    const timeout = setTimeout(() => {
      runVectorDuplicateCheck(combinedText, wardId);
    }, 450);

    return () => clearTimeout(timeout);
  }, [title, description, wardId, runVectorDuplicateCheck]);

  // Handle Upvoting an existing duplicate instead of re-reporting
  const handleUpvoteExisting = async (complaintId: number) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setUpvotedComplaints((prev) => [...prev, complaintId]);
        setStatusMsg({
          text: `You have successfully upvoted complaint #${complaintId}. Municipal authorities have been notified of another affected citizen!`,
          type: 'success',
        });
      }
    } catch (err) {
      console.error('Error upvoting complaint:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !wardId || !categoryId) {
      setStatusMsg({ text: 'Please fill in Title, Description, Ward, and Category', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMsg(null);

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          ward_id: Number(wardId),
          category_id: Number(categoryId),
          priority: priority || undefined,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          citizen_id: currentUserId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          text: `Complaint #${data.complaint.complaint_id} filed successfully! MySQL Trigger auto-calculated SLA Due: ${new Date(data.complaint.sla_due_at).toLocaleString()}`,
          type: 'success',
        });
        setTitle('');
        setDescription('');
        setCategoryId('');
        setWardId('');
        setPriority('');
        setSimilarMatches([]);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setStatusMsg({ text: data.error || 'Failed to file complaint', type: 'error' });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error communicating with server', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title Card */}
      <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">File a Citizen Grievance</h2>
            <p className="text-xs text-slate-400">
              Submit civic issues directly to municipal departments with automated SLA tracking and Vector AI duplicate detection.
            </p>
          </div>
        </div>

        {/* Database Trigger & Vector Callout */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-2.5 text-blue-200">
            <Database className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-white">SQL Trigger:</span>
              Fires <code className="text-cyan-300 font-mono text-[11px]">BEFORE INSERT ON complaints</code> to derive SLA deadline & priority.
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 flex items-start gap-2.5 text-indigo-200">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-white">Vector DB Layer:</span>
              128-D dense embeddings match semantic duplicates before redundant filing.
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl space-y-6">
        {statusMsg && (
          <div className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300">
              Grievance Headline / Title <span className="text-rose-400">*</span>
            </label>
            {isSearchingVector && (
              <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                <Search className="w-3 h-3 animate-spin" /> Checking Vector DB for duplicates...
              </span>
            )}
          </div>
          <input
            type="text"
            required
            placeholder="e.g. Broken water pipeline leaking on 19th Main Road"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Category & Ward Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Issue Category <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Category...</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name} ({cat.department_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Municipal Ward <span className="text-rose-400">*</span>
            </label>
            <select
              required
              value={wardId}
              onChange={(e) => setWardId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Bengaluru Ward...</option>
              {wards.map((w) => (
                <option key={w.ward_id} value={w.ward_id}>
                  Ward {w.ward_number}: {w.ward_name} ({w.zone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Category Trigger Preview */}
        {selectedCategory && (
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>SLA Target: <strong className="text-white">{selectedCategory.sla_hours} hours</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Default Priority: <strong className="text-amber-400 capitalize">{selectedCategory.default_priority}</strong></span>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Detailed Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            required
            rows={4}
            placeholder="Describe the exact location, duration of the issue, and impact on residents..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* =================================================================== */}
        {/* VECTOR DATABASE DUPLICATE DETECTION ALERT BOX                       */}
        {/* =================================================================== */}
        {similarMatches.length > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 text-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="font-bold text-sm text-white">
                  Potential Duplicate Issue Detected (Vector Database)
                </span>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Cosine Similarity Search
              </span>
            </div>

            <p className="text-xs text-amber-200/90 leading-relaxed">
              Our 128-dimensional Vector Similarity engine found {similarMatches.length} existing reported complaints matching your description. Instead of creating a duplicate ticket, you can upvote an existing report to escalate municipal urgency.
            </p>

            <div className="space-y-2.5 pt-1">
              {similarMatches.map((m) => {
                const isUpvoted = upvotedComplaints.includes(m.complaint_id);
                const percent = Math.round(m.similarity * 100);

                return (
                  <div 
                    key={m.complaint_id} 
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">#{m.complaint_id}: {m.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] uppercase font-semibold">
                          {m.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{m.description}</p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[10px] text-cyan-400 font-mono">
                          Vector Match: {percent}% Cosine Sim
                        </span>
                        <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full ${percent >= 75 ? 'bg-rose-500' : 'bg-amber-400'}`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvoteExisting(m.complaint_id)}
                      disabled={isUpvoted}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-all ${
                        isUpvoted
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {isUpvoted ? 'Upvoted ✓' : 'Upvote Existing'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick GPS Location Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Quick Landmark Location (Presets or Custom Coordinates)
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {quickLocations.map((loc) => (
              <button
                type="button"
                key={loc.name}
                onClick={() => handleSelectQuickLocation(loc)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3 h-3 text-blue-400" />
                {loc.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Latitude</span>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="12.9116"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Longitude</span>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="77.6534"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Priority Override (Optional) */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Priority Level (Leave empty for Trigger Automatic Derivation)
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
          >
            <option value="">Auto (Trigger will deduce from Category)</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {submitting ? (
            'Inserting into MySQL & Vector DB...'
          ) : (
            <>
              <Send className="w-4 h-4" /> Submit Grievance & Execute MySQL Triggers
            </>
          )}
        </button>
      </form>
    </div>
  );
}
