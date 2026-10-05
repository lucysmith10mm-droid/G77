import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, ArrowRight, Zap, Check, ChevronDown, ChevronUp, Cpu, Trash2 } from 'lucide-react';
import { AiModel } from '../data/aiModelsData';

interface ModelCompareDrawerProps {
  comparedModels: AiModel[];
  onRemoveModel: (id: string) => void;
  onClearAll: () => void;
  onDeployModel: (model: AiModel) => void;
  isDarkMode?: boolean;
}

export const ModelCompareDrawer: React.FC<ModelCompareDrawerProps> = ({
  comparedModels,
  onRemoveModel,
  onClearAll,
  onDeployModel,
  isDarkMode = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (comparedModels.length === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-6 z-40 max-w-5xl mx-auto">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className={`rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 overflow-hidden ${
          isDarkMode
            ? 'bg-[#0B0F19]/95 border-cyan-500/40 shadow-[0_10px_40px_rgba(6,182,212,0.25)] text-white'
            : 'bg-white/95 border-slate-300 shadow-2xl text-slate-900'
        }`}
      >
        {/* Dock Bar (Always visible) */}
        <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Model Comparison Matrix</span>
                <span className="font-mono text-[10px] bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 rounded-full">
                  {comparedModels.length} / 4
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Compare context length, benchmarks, latency, and cost per 1M tokens.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{isExpanded ? 'Collapse Table' : 'Compare Side-by-Side'}</span>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClearAll}
              title="Clear comparison list"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mini Model Chips in Bar when Collapsed */}
        {!isExpanded && (
          <div className="px-3 sm:px-4 pb-3 flex items-center gap-2 overflow-x-auto">
            {comparedModels.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs shrink-0"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: m.developerColor }}
                />
                <span className="font-medium">{m.name}</span>
                <button
                  onClick={() => onRemoveModel(m.id)}
                  className="text-slate-400 hover:text-white cursor-pointer ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Side-by-Side Comparison Matrix */}
        {isExpanded && (
          <div className="p-4 sm:p-5 pt-0 border-t border-white/[0.08] overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="py-2.5 pr-4 text-slate-400 font-mono text-[11px] uppercase w-28">
                    Metric
                  </th>
                  {comparedModels.map((m) => (
                    <th key={m.id} className="py-2.5 px-3 min-w-[200px]">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: m.developerColor }}
                        />
                        <button
                          onClick={() => onRemoveModel(m.id)}
                          className="text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="font-bold text-sm">{m.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{m.developer}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono">
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400">Context Window</td>
                  {comparedModels.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-cyan-300 font-bold">
                      {m.contextWindow}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400">Pricing / 1M</td>
                  {comparedModels.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-slate-200">
                      {m.pricing.display}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400">Benchmark</td>
                  {comparedModels.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-emerald-400">
                      {m.benchmark}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400">Latency / Speed</td>
                  {comparedModels.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-slate-300">
                      {m.latencyRating}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400">License</td>
                  {comparedModels.map((m) => (
                    <td key={m.id} className="py-2.5 px-3 text-slate-400">
                      {m.license}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 text-slate-400">Deploy Action</td>
                  {comparedModels.map((m) => (
                    <td key={m.id} className="py-2.5 px-3">
                      <button
                        onClick={() => onDeployModel(m)}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Deploy Model</span>
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};
