'use client';

import { motion } from 'framer-motion';
import {
    ShieldCheck,
    Sparkles,
    Fingerprint,
    SignalHigh,
    Lightbulb,
    History,
    ArrowUpRight,
    Zap,
} from 'lucide-react';
import { usePipeline } from '@/lib/pipeline-context';
import { NlqPanel } from './nlq-panel';

export function RichDashboard() {
    const {
        cleaning_metrics,
        enrichment_summary,
        insights,
        patterns,
        signal_vs_noise,   // ← now correctly sourced from context (not nested in insights)
        audit_trail,
        status,
    } = usePipeline();

    if (status === 'idle') return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">

            {/* 1. Data Quality Score */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-effect p-6 rounded-xl border border-blue-500/20"
            >
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold">Data Quality Index</h3>
                </div>
                {cleaning_metrics ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-gray-400">Before Clean</p>
                                <p className="text-2xl font-bold text-red-400">{cleaning_metrics.quality_score_delta[0]}%</p>
                            </div>
                            <div className="text-center pb-2">
                                <ArrowUpRight className="w-4 h-4 text-emerald-400 mx-auto" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">After Clean</p>
                                <p className="text-2xl font-bold text-emerald-400">{cleaning_metrics.quality_score_delta[1]}%</p>
                            </div>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${cleaning_metrics.quality_score_delta[1]}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="bg-emerald-500 h-full"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                                <p className="text-gray-400">Nulls Removed</p>
                                <p className="font-bold text-blue-400">{cleaning_metrics.dropped_nulls}</p>
                            </div>
                            <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                                <p className="text-gray-400">Dups Dropped</p>
                                <p className="font-bold text-purple-400">{cleaning_metrics.duplicates_removed}</p>
                            </div>
                        </div>
                    </div>
                ) : <p className="text-xs text-gray-500 animate-pulse">Calculating sanitation delta...</p>}
            </motion.div>

            {/* 2. Enrichment Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-effect p-6 rounded-xl border border-purple-500/20"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold">Automated Enrichment</h3>
                </div>
                {enrichment_summary ? (
                    <div className="space-y-2">
                        <p className="text-xs text-gray-400 mb-2">New features inferred via GPT-4o Brain:</p>
                        <div className="flex flex-wrap gap-2">
                            {enrichment_summary.features ? enrichment_summary.features.map((f: any) => {
                                const isHigh = f.importance === 'high';
                                return (
                                    <div key={f.name} className="group relative cursor-help">
                                        <span className={`px-2 py-1 rounded text-[10px] ${isHigh ? 'bg-purple-500/30 border-purple-400/40 text-purple-200' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'} border transition-all hover:border-purple-400/60`}>
                                            +{f.name}
                                        </span>
                                        {/* Hover tooltip for Enrichment */}
                                        <div className="absolute left-0 bottom-full mb-2 w-[220px] p-3 rounded-lg bg-gray-900 border border-purple-500/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[10px] font-bold text-purple-300 uppercase">AI Justification</span>
                                                <span className={`text-[8px] font-bold px-1 rounded ${isHigh ? 'bg-purple-500/30 text-purple-200' : 'bg-gray-800 text-gray-400'}`}>
                                                    {f.importance?.toUpperCase() || 'MEDIUM'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-300 leading-tight">{f.reason || 'Automatically inferred for enhanced semantic depth.'}</p>
                                        </div>
                                    </div>
                                );
                            }) : enrichment_summary.added_features?.map((f: string) => (
                                <span key={f} className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-[10px] text-purple-300">
                                    +{f}
                                </span>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-white/5 rounded border border-white/10">
                            <p className="text-[10px] text-gray-400 italic font-mono">"Sources merged: {enrichment_summary.merged_sources.join(', ')}"</p>
                        </div>
                    </div>
                ) : <p className="text-xs text-gray-500 animate-pulse">Injecting domain knowledge...</p>}
            </motion.div>

            {/* 3. Pattern Discovery — wired to real patterns array from context */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-effect p-6 rounded-xl border border-amber-500/20"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Fingerprint className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold">Pattern Discovery</h3>
                    {patterns && patterns.length > 0 && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                            {patterns.length} found
                        </span>
                    )}
                </div>
                <div className="space-y-4">
                    {patterns && patterns.length > 0 ? (
                        patterns.map((p: any, i: number) => {
                            const isCritical = p.severity === 'critical' || p.severity === 'high';
                            return (
                                <div key={i} className="group relative cursor-help">
                                    <p className={`text-xs font-bold flex items-center gap-1 ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>
                                        <Zap className="w-3 h-3" /> {p.type?.toUpperCase() || 'CORRELATION'}
                                    </p>
                                    <p className="text-[11px] text-gray-300 mt-0.5 line-clamp-1">{p.insight}</p>
                                    {/* Hover tooltip */}
                                    <div className="absolute left-0 bottom-full mb-2 w-[280px] p-4 rounded-xl bg-gray-900 border border-gray-700 shadow-[0_0_20px_rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white text-xs font-bold font-mono uppercase">Deep Dive</span>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {p.severity || 'low'}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">{p.details || 'No detailed info available for this pattern.'}</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {(p.fields || []).map((f: string) => (
                                                <span key={f} className="text-[9px] px-1.5 py-0.5 bg-gray-800 border border-gray-700 text-gray-400 rounded">{f}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-xs text-gray-500 animate-pulse">
                            {status === 'processing' ? 'Scanning for latent clusters...' : 'No significant patterns detected in dataset.'}
                        </p>
                    )}
                </div>
            </motion.div>

            {/* 4. Signal vs Noise — now reads from signal_vs_noise in context, not from insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-effect p-6 rounded-xl border border-blue-400/20 col-span-1 md:col-span-2 lg:col-span-1"
            >
                <div className="flex items-center gap-2 mb-4">
                    <SignalHigh className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold">Signal vs Noise (Weights)</h3>
                </div>
                <div className="space-y-3">
                    {signal_vs_noise && signal_vs_noise.length > 0 ? (
                        signal_vs_noise.map((s: any, i: number) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-300 font-mono truncate max-w-[60%]">{s.feature}</span>
                                    <span className="text-blue-400">{(s.importance * 100).toFixed(1)}% Signal</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-1">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${s.importance * 100}%` }}
                                        transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                                        className="bg-blue-500 h-full rounded-full"
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500 animate-pulse">
                            {status === 'processing' ? 'Profiling feature variance...' : 'No numeric fields detected for signal analysis.'}
                        </p>
                    )}
                </div>
            </motion.div>

            {/* 5. Actionable Insights */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-effect p-6 rounded-xl border border-emerald-400/20 col-span-1 md:col-span-2"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold">Actionable Takeaways</h3>
                    {Array.isArray(insights) && insights.length > 0 && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                            {insights.length} insights
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(insights) && insights.length > 0 ? (
                        insights.map((a: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <p className="text-xs font-bold text-emerald-400 mb-1">{a.headline}</p>
                                <p className="text-[10px] text-gray-400 mb-2">{a.recommended_action}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 rounded text-emerald-300 uppercase tracking-tighter">
                                        Fields: {a.evidence_fields?.join(', ') || 'Global'}
                                    </span>
                                    <span className="text-[9px] text-gray-400">Conf: {(a.confidence_score * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500 animate-pulse col-span-2">
                            {status === 'processing' ? 'Synthesizing findings...' : 'No insights generated yet.'}
                        </p>
                    )}
                </div>
            </motion.div>

            {/* 6. Pipeline Audit Trace */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-effect p-6 rounded-xl border border-gray-500/20 col-span-1 md:col-span-3 lg:col-span-3"
            >
                <div className="flex items-center gap-2 mb-6">
                    <History className="w-5 h-5 text-gray-400" />
                    <h3 className="font-bold">Pipeline Audit Trace</h3>
                </div>
                <div className="relative border-l-2 border-gray-800 ml-3 space-y-6">
                    {audit_trail.map((log, i) => (
                        <div key={i} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#0a0c10]" />
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-blue-400">{log.action}</p>
                                    <p className="text-[10px] text-gray-500 max-w-2xl">{log.details}</p>
                                </div>
                                <span className="text-[9px] text-gray-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
                    {status === 'processing' && (
                        <div className="relative pl-6 animate-pulse">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500" />
                            <p className="text-xs text-emerald-400">Synthesizing Final Report...</p>
                        </div>
                    )}
                    {audit_trail.length === 0 && status !== 'processing' && (
                        <p className="text-xs text-gray-600 pl-6">No audit entries yet. Run the pipeline to begin.</p>
                    )}
                </div>
            </motion.div>

            {/* Step 11: SQL Query Layer */}
            <NlqPanel />

        </div>
    );
}
