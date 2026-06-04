'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  Brain,
  Zap,
  Target,
} from 'lucide-react';
import { usePipeline } from '@/lib/pipeline-context';

type CardColor = 'emerald' | 'blue' | 'red' | 'purple' | 'amber';

interface InsightCard {
  id: number;
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  color: CardColor;
  trend?: string;
}

const DEFAULT_INSIGHTS: InsightCard[] = [
  {
    id: 1,
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Data Quality',
    value: '---',
    description: 'Awaiting ingestion...',
    color: 'emerald',
  },
  {
    id: 2,
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Anomalies',
    value: '---',
    description: 'Scanning dataset...',
    color: 'red',
  },
];

const colorMap: Record<CardColor, { bg: string; border: string; glow: string; text: string; icon: string }> = {
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-400/5',
    border: 'border-emerald-500/30',
    glow: 'glow-emerald',
    text: 'text-emerald-400',
    icon: 'text-emerald-400',
  },
  blue: {
    bg: 'from-blue-500/10 to-blue-400/5',
    border: 'border-blue-500/30',
    glow: 'glow-blue',
    text: 'text-blue-400',
    icon: 'text-blue-400',
  },
  red: {
    bg: 'from-red-500/10 to-red-400/5',
    border: 'border-red-500/30',
    glow: 'glow-red',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
  purple: {
    bg: 'from-purple-500/10 to-purple-400/5',
    border: 'border-purple-500/30',
    glow: 'glow-purple',
    text: 'text-purple-400',
    icon: 'text-purple-400',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-400/5',
    border: 'border-amber-500/30',
    glow: 'glow-amber',
    text: 'text-amber-400',
    icon: 'text-amber-400',
  },
};

export function InsightCards() {
  const { insights } = usePipeline();

  const insightsArray = Array.isArray(insights)
    ? insights
    : (typeof insights === 'string' ? insights.split('\n').filter(l => l.trim().length > 0) : []);

  const cardColors: CardColor[] = ['blue', 'emerald', 'purple', 'amber'];

  const activeInsights: InsightCard[] = insightsArray.length > 0 ? insightsArray.map((text, i) => ({
    id: i + 100,
    icon: <Brain className="w-5 h-5" />,
    title: `AI Insight #${i + 1}`,
    value: 'Analysis',
    description: text,
    color: cardColors[i % cardColors.length],
    trend: 'Live'
  })) : DEFAULT_INSIGHTS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {activeInsights.map((insight, idx) => {
        const colors = colorMap[insight.color];

        return (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`glass-effect rounded-lg p-4 border bg-gradient-to-br ${colors.bg} ${colors.border} ${colors.glow} transition-all cursor-pointer`}
          >
            <div className="flex items-start justify-between mb-3">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className={colors.icon}
              >
                {insight.icon}
              </motion.div>
              {insight.trend && (
                <span className={`text-xs font-medium ${colors.text}`}>
                  {insight.trend}
                </span>
              )}
            </div>

            <h3 className="text-xs font-medium text-gray-400 mb-1">
              {insight.title}
            </h3>
            <p className={`text-xl font-bold ${colors.text} mb-2`}>
              {insight.value}
            </p>
            <p className="text-[10px] text-gray-500 leading-tight">{insight.description}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
