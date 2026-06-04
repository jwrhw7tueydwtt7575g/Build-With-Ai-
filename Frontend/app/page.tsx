'use client';

import { Header } from '@/components/header';
import { AetherBackground } from '@/components/aether-background';
import { IngestionZone } from '@/components/ingestion-zone';
import { PipelineTracker } from '@/components/pipeline-tracker';
import { ExecutionIntelligence } from '@/components/execution-intelligence';
import { RichDashboard } from '@/components/rich-dashboard';
import { AnomalyExplorer } from '@/components/anomaly-explorer';
import { DataGrid } from '@/components/data-grid';
import { FloatingChat } from '@/components/floating-chat';
import { useEffect, useState } from 'react';
import { usePipeline } from '@/lib/pipeline-context';

interface PipelineStats {
  token_estimate: number;
  avg_confidence: number;
  insight_clusters: number;
  total_rows: number;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const { status, pipelineStartTime, pipelineEndTime } = usePipeline();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real stats once pipeline completes
  useEffect(() => {
    if (status === 'completed') {
      fetch('http://localhost:8000/api/stats')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setPipelineStats(data); })
        .catch(() => null);
    }
    if (status === 'idle') {
      setPipelineStats(null);
    }
  }, [status]);

  // Compute wall-clock pipeline duration
  const pipelineDuration =
    pipelineStartTime && pipelineEndTime
      ? `${((pipelineEndTime - pipelineStartTime) / 1000).toFixed(1)}s`
      : status === 'idle' ? '---' : null;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="w-full h-screen bg-black/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Animated background */}
      <AetherBackground />

      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
          {/* Hero section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent">
              AETHER FLOW
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Enterprise AI Data Pipeline with 11-step Synapse Orchestration &amp; Real-time Insights
            </p>
          </div>

          {/* Ingestion zone — full width */}
          <IngestionZone />

          {/* Two-column layout: Pipeline + Execution Intelligence */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PipelineTracker />
            <ExecutionIntelligence />
          </div>

          {/* Rich Dashboard — 7 Key Sections */}
          <RichDashboard />

          {/* Anomaly explorer */}
          <AnomalyExplorer />

          {/* Data grid */}
          <DataGrid />

          {/* Footer stats — dynamic after pipeline completion */}
          <div className="glass-effect rounded-xl p-8 border border-blue-500/20 mt-12 mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400 mb-2">
                  {pipelineStats ? formatTokens(pipelineStats.token_estimate) : '---'}
                </p>
                <p className="text-sm text-gray-400">Total Tokens</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400 mb-2">
                  {pipelineStats ? `${pipelineStats.avg_confidence}%` : '---'}
                </p>
                <p className="text-sm text-gray-400">Model Confidence</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-purple-400 mb-2">
                  {pipelineStats ? pipelineStats.insight_clusters : '---'}
                </p>
                <p className="text-sm text-gray-400">Insight Clusters</p>
              </div>

              <div className="text-center">
                <p className="text-3xl font-bold text-amber-400 mb-2">
                  {pipelineDuration ?? '...'}
                </p>
                <p className="text-sm text-gray-400">Pipeline Duration</p>
              </div>

            </div>
            {status === 'completed' && pipelineStats && (
              <p className="text-center text-[10px] text-gray-600 mt-4">
                Live metrics — {pipelineStats.total_rows.toLocaleString()} rows processed · refreshed from /api/stats
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Floating AI Chatbot */}
      <FloatingChat />
    </div>
  );
}
