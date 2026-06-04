'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { usePipeline } from '@/lib/pipeline-context';

interface PipelineStep {
  id: number;
  name: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: 1, name: 'File Upload & Land' },
  { id: 2, name: 'Format Detection' },
  { id: 3, name: 'Universal Normalization' },
  { id: 4, name: 'Synapse Delta Storage' },
  { id: 5, name: 'Statistical Digest' },
  { id: 6, name: 'LLM Execution Planning' },
  { id: 7, name: 'Spark Cleaning Execution' },
  { id: 8, name: 'AI Language Enrichment' },
  { id: 9, name: 'Cross-Field Pattern Recovery' },
  { id: 10, name: 'Actionable Insight Synthesis' },
  { id: 11, name: 'SQL Query Layer Activation' },
];

export function PipelineTracker() {
  const { currentStep, status } = usePipeline();

  const getStatusIcon = (id: number) => {
    if (id < currentStep) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    if (id === currentStep && status === 'processing') {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Clock className="w-5 h-5 text-blue-400" />
        </motion.div>
      );
    }
    if (status === 'error' && id === currentStep) {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    return <div className="w-5 h-5 rounded-full border border-gray-500" />;
  };

  const getStatusColor = (id: number) => {
    if (id < currentStep) return 'from-green-500/20 to-green-400/20 border-green-500/30';
    if (id === currentStep && status === 'processing')
      return 'from-blue-500/20 to-blue-400/20 border-blue-500/30 glow-blue';
    if (status === 'error' && id === currentStep) return 'from-red-500/20 to-red-400/20 border-red-500/30';
    return 'from-gray-500/10 to-gray-400/10 border-gray-500/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="glass-effect rounded-xl p-8 border border-emerald-500/20 h-full"
    >
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="w-3 h-3 bg-emerald-500 rounded-full" />
        Enterprise Execution Trace (11 Steps)
      </h2>

      <div className="space-y-2">
        {PIPELINE_STEPS.map((step, idx) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-4 p-2 rounded-lg border bg-gradient-to-r ${getStatusColor(
              step.id
            )} transition-all`}
          >
            {getStatusIcon(step.id)}
            <div className="flex-1">
              <p className="font-medium text-xs">{step.name}</p>
            </div>
            {step.id < currentStep && (
              <span className="text-[10px] text-green-400 uppercase font-bold">Verified</span>
            )}
            {step.id === currentStep && status === 'processing' && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-blue-400 rounded-full"
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
