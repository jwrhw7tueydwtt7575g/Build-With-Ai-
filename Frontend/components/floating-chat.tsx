'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Database } from 'lucide-react';
import { usePipeline } from '@/lib/pipeline-context';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    sql?: string;
    timestamp: Date;
}

export function FloatingChat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: "Hi! I'm your **Data Intelligence Agent**. Upload and process your data, then ask me anything about it — anomalies, patterns, correlations, SQL queries, you name it.",
            timestamp: new Date(),
        },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { status } = usePipeline();

    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, open]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const question = input.trim();
        setInput('');

        const userMsg: ChatMessage = { role: 'user', content: question, timestamp: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/api/nlq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });
            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data.human_readable_answer,
                    sql: data.sql,
                    timestamp: new Date(),
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: "I couldn't reach the backend. Make sure the server is running on port 8000.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const hasData = status === 'completed';

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_24px_rgba(6,182,212,0.5)] flex items-center justify-center hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={open ? {} : { boxShadow: ['0 0 16px rgba(6,182,212,0.4)', '0 0 28px rgba(6,182,212,0.8)', '0 0 16px rgba(6,182,212,0.4)'] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <X className="w-6 h-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                            <MessageCircle className="w-6 h-6 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="chat-panel"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[560px] flex flex-col rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.6)] border border-cyan-500/20"
                        style={{ background: 'rgba(8, 12, 20, 0.96)', backdropFilter: 'blur(24px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Data Intelligence Agent</p>
                                <p className="text-[10px] text-cyan-400 flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${hasData ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    {hasData ? 'Dataset loaded · Ready to query' : 'Waiting for data pipeline...'}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100 rounded-br-sm'
                                                : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                        {msg.sql && (
                                            <div className="w-full p-2 rounded-lg bg-black/50 border border-cyan-500/20">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Database className="w-3 h-3 text-cyan-400" />
                                                    <span className="text-[9px] text-cyan-400 uppercase font-bold tracking-widest">SQL</span>
                                                </div>
                                                <code className="text-[10px] text-emerald-300 font-mono block leading-relaxed">{msg.sql}</code>
                                            </div>
                                        )}
                                        <span className="text-[9px] text-gray-600">{msg.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
                                            <User className="w-3 h-3 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading && (
                                <div className="flex gap-2 justify-start">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0">
                                        <Bot className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="px-3 py-2 rounded-2xl rounded-bl-sm bg-white/5 border border-white/10">
                                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 py-3 border-t border-white/10 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && send()}
                                placeholder="Ask about your data..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/40 transition-colors"
                            />
                            <button
                                onClick={send}
                                disabled={loading || !input.trim()}
                                className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/40 transition-all flex items-center justify-center disabled:opacity-40"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
