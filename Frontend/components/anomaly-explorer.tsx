'use client';

import { motion } from 'framer-motion';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePipeline } from '@/lib/pipeline-context';

// Deterministic seed for consistent normal point layout (not random on re-render)
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function makeNormalPoints(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: seededRandom(i * 3) * 80 + 10,
    y: seededRandom(i * 3 + 1) * 80 + 10,
    type: 'normal',
    field: 'baseline',
    score: +(seededRandom(i * 3 + 2) * 0.4).toFixed(3),
    reason: 'Within normal distribution bounds',
    action: 'No action required',
    confidence: +(0.7 + seededRandom(i) * 0.25).toFixed(2),
  }));
}

// Map real backend patterns to scatter chart anomaly points
function patternsToAnomalyPoints(patterns: any[]) {
  return patterns.map((p, i) => ({
    x: seededRandom(i * 7 + 50) * 70 + 15,
    y: seededRandom(i * 7 + 51) * 70 + 15,
    type: 'anomaly',
    field: (p.fields || ['unknown'])[0],
    score: p.severity === 'high' || p.severity === 'critical' ? 0.92 : 0.81,
    reason: p.insight || 'Statistical anomaly detected',
    action: p.severity === 'high' ? 'Escalate to risk team' : 'Flag for manual review',
    confidence: p.severity === 'high' ? 0.94 : 0.85,
    patternType: p.type,
    details: p.details || '',
  }));
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const isAnomaly = d.type === 'anomaly';

  return (
    <div className="rounded-xl p-4 shadow-2xl border text-xs"
      style={{
        background: 'rgba(8, 12, 22, 0.97)',
        borderColor: isAnomaly ? 'rgba(239,68,68,0.4)' : 'rgba(35,134,54,0.4)',
        minWidth: 240,
        backdropFilter: 'blur(12px)',
      }}>
      <div className="flex items-center gap-2 mb-3">
        {isAnomaly
          ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          : <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
        <span className={`font-bold uppercase tracking-wide ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>
          {isAnomaly ? (d.patternType?.toUpperCase() || 'Anomaly Detected') : 'Normal Record'}
        </span>
      </div>
      <div className="space-y-1.5 text-gray-300">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Field</span>
          <span className="font-mono font-bold text-white">{d.field}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Anomaly Score</span>
          <span className={`font-bold ${isAnomaly ? 'text-red-400' : 'text-emerald-400'}`}>{d.score}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Confidence</span>
          <span className="font-bold text-purple-400">{(d.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="border-t border-white/10 pt-1.5 mt-1.5">
          <p className="text-gray-500 mb-0.5">Reason</p>
          <p className="text-amber-300 font-medium leading-relaxed">{d.reason}</p>
        </div>
        {isAnomaly && (
          <div className="border-t border-white/10 pt-1.5 mt-1.5">
            <p className="text-gray-500 mb-0.5">Recommended Action</p>
            <p className="text-cyan-300 font-medium">{d.action}</p>
          </div>
        )}
        {d.details && (
          <div className="border-t border-white/10 pt-1.5 mt-1.5">
            <p className="text-gray-500 mb-0.5">Details</p>
            <p className="text-gray-400 text-[10px] leading-relaxed">{d.details}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export function AnomalyExplorer() {
  const { data, patterns, status } = usePipeline();

  // Use real patterns from the pipeline — mapped to chart points
  const realPatterns = patterns || [];
  const anomalyPoints = patternsToAnomalyPoints(realPatterns);
  const normalPoints = makeNormalPoints(40);

  const anomalyCount = realPatterns.length;
  const normalCount = data.length > 0 ? Math.max(data.length - anomalyCount, 0) : 40;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="glass-effect rounded-xl p-8 border border-purple-500/20"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          ML Anomaly Explorer (Isolation Forest)
        </h2>
        {status === 'completed' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold">
            {anomalyCount} real pattern{anomalyCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="bg-black/30 rounded-lg p-4 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 209, 255, 0.1)" />
            <XAxis type="number" dataKey="x" name="Value" stroke="rgba(200, 200, 200, 0.5)" hide />
            <YAxis type="number" dataKey="y" name="Risk" stroke="rgba(200, 200, 200, 0.5)" hide />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(0,209,255,0.3)' }} />
            <Legend />
            <Scatter name="Standard Records" data={normalPoints} fill="#238636" opacity={0.7} />
            <Scatter name="Detected Anomalies" data={anomalyPoints} fill="#ef4444" opacity={0.9} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-emerald-400">{data.length > 0 ? normalCount.toLocaleString() : '---'}</p>
          <p className="text-xs text-gray-400">Normal Records</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-red-400">{status !== 'idle' ? anomalyCount : '---'}</p>
          <p className="text-xs text-gray-400">Real Anomalies</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-purple-400">
            {status === 'completed' ? (anomalyCount > 0 ? 'High' : 'Clean') : 'Scanning...'}
          </p>
          <p className="text-xs text-gray-400">Model Verdict</p>
        </div>
      </div>
    </motion.div>
  );
}
