'use client';

import { motion } from 'framer-motion';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { usePipeline } from '@/lib/pipeline-context';

export function IngestionZone() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { startPipeline, status } = usePipeline();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
    if (droppedFiles[0]) startPipeline(droppedFiles[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
      if (selectedFiles[0]) startPipeline(selectedFiles[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-effect rounded-xl p-8 border border-blue-500/20 relative overflow-hidden"
    >
      {/* Radar scan animation */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
        <div
          className="absolute inset-0 rounded-full border border-blue-400"
          style={{ animation: 'radar-spin 8s linear infinite' }}
        />
        <div
          className="absolute inset-2 rounded-full border border-blue-400/60"
          style={{ animation: 'radar-spin 12s linear infinite reverse' }}
        />
        <div className="absolute inset-4 rounded-full border border-blue-400/30" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${isDragOver
              ? 'border-blue-400 bg-blue-400/5'
              : 'border-blue-400/30 hover:border-blue-400/50'
            }`}
        >
          <motion.div
            animate={{ scale: isDragOver ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {status === 'processing' ? (
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-spin" />
            ) : (
              <UploadCloud className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            )}
          </motion.div>

          <h3 className="text-lg font-semibold mb-2">Ingestion Zone</h3>
          <p className="text-sm text-gray-400 mb-4">
            {status === 'processing' ? 'Processing your data through the 11-step pipeline...' : 'Drag files here or click to select'}
          </p>

          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
            accept=".csv,.json,.parquet,.xlsx"
          />
          <label htmlFor="file-input">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={status === 'processing'}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
              {status === 'processing' ? 'Pipeline Active' : 'Select Files'}
            </motion.button>
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <h4 className="text-sm font-medium mb-3">Ingested Files:</h4>
            <div className="space-y-2">
              {files.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded text-sm text-green-400"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {file.name}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
