'use client';

import { motion } from 'framer-motion';
import { Search, Filter, Download } from 'lucide-react';
import { useState } from 'react';
import { usePipeline } from '@/lib/pipeline-context';

export function DataGrid() {
  const { data } = usePipeline();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter((row: any) => {
    return Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="glass-effect rounded-xl p-8 border border-blue-500/20"
    >
      <h2 className="text-xl font-bold mb-6">Live Data Explorer</h2>

      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search normalized records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/30 border border-blue-500/20 rounded-lg focus:outline-none focus:border-blue-400 transition-colors text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px]">
        {data.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0e1117] z-20">
              <tr className="border-b border-blue-500/20">
                {Object.keys(data[0]).map(key => (
                  <th key={key} className="text-left px-4 py-3 font-medium text-gray-300 capitalize">{key.replace('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(idx * 0.01, 1) }}
                  className="border-b border-blue-500/10 hover:bg-blue-500/5 transition-colors"
                >
                  {Object.values(row).map((val: any, vIdx) => (
                    <td key={vIdx} className="px-4 py-3 text-gray-400 text-xs">
                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-lg">
            No data ingested yet. Drag a file to the Ingestion Zone to begin.
          </div>
        )}
      </div>
    </motion.div>
  );
}
