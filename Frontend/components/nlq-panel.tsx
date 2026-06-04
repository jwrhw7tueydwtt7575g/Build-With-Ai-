'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Database, Search, Loader2, MessageSquare, ChevronRight } from 'lucide-react';
import { usePipeline } from '@/lib/pipeline-context';

export function NlqPanel() {
    const { status, nlq_result, runNlq, suggestedQueries } = usePipeline();
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (status !== 'completed') return null;

    const handleQuery = async () => {
        if (!question.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await runNlq(question);
        } catch (e: any) {
            setError(e.message || 'Query failed');
        } finally {
            setLoading(false);
        }
    };

    const displayQueries = suggestedQueries && suggestedQueries.length > 0
        ? suggestedQueries
        : [
            'Show all records with urgency score above 0.8',
            'Find anomalies in the amount field',
            'List top 10 rows by confidence score',
        ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-effect p-6 rounded-xl border border-cyan-500/20 col-span-1 md:col-span-2 lg:col-span-3 mt-2"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">Step 11 — SQL Query Layer</h3>
                <span className="ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    NLQ Active
                </span>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus-within:border-cyan-500/50 transition-colors">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                        placeholder="Ask a question about your data..."
                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                    />
                </div>
                <button
                    onClick={handleQuery}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Query'}
                </button>
            </div>

            {/* Suggested Queries */}
            <div className="flex flex-wrap gap-2 mb-5">
                {displayQueries.map((q) => (
                    <button
                        key={q}
                        onClick={() => { setQuestion(q); }}
                        className="text-[10px] px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400 transition-all flex items-center gap-1"
                    >
                        <ChevronRight className="w-3 h-3" />
                        {q}
                    </button>
                ))}
            </div>

            {/* Results */}
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-xs text-red-400 mb-3"
                    >
                        ⚠ {error}
                    </motion.p>
                )}

                {nlq_result && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                    >
                        {/* SQL Block */}
                        <div className="p-3 rounded-lg bg-black/40 border border-cyan-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className="w-3 h-3 text-cyan-400" />
                                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-widest">Generated Synapse SQL</span>
                            </div>
                            <code className="text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre-wrap block">
                                {nlq_result.sql}
                            </code>
                        </div>

                        {/* Natural Language Answer */}
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex gap-2">
                            <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300">{nlq_result.human_readable_answer}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!nlq_result && !loading && (
                <p className="text-xs text-gray-600 italic">Enter a natural language question to generate Synapse SQL...</p>
            )}
        </motion.div>
    );
}
