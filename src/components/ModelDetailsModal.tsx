import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Cpu,
  ShieldCheck,
  Brain,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Layers,
  Award
} from 'lucide-react';
import { AiModel, getModelExplanation } from '../data/aiModelsData';

interface ModelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: AiModel | null;
  onDeploy: (model: AiModel) => void;
  isDarkMode?: boolean;
}

export const ModelDetailsModal: React.FC<ModelDetailsModalProps> = ({
  isOpen,
  onClose,
  model,
  onDeploy,
  isDarkMode = true,
}) => {
  const [langTab, setLangTab] = useState<'hi' | 'en'>('hi');

  if (!isOpen || !model) return null;

  const explanation = getModelExplanation(model);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 -z-10"
        />

        {/* Modal Window: Constrained within viewport, flex-col, internal scroll, beautiful in light & dark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl z-10 border ${
            isDarkMode
              ? 'bg-[#0B0F19] border-cyan-500/35 shadow-[0_0_60px_rgba(6,182,212,0.22)] text-white'
              : 'bg-white border-slate-300 shadow-2xl text-slate-900'
          }`}
        >
          {/* Top Decorative Neon Accent Bar */}
          <div
            className="h-1.5 w-full shrink-0"
            style={{
              background: `linear-gradient(90deg, ${model.developerColor || '#06B6D4'}, #6366F1, #C026D3)`,
            }}
          />

          {/* Modal Header: Fixed at top */}
          <div
            className={`p-4 sm:p-5 pb-3 border-b shrink-0 flex items-start justify-between gap-3 ${
              isDarkMode ? 'border-white/[0.08] bg-[#0B0F19]' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: model.developerColor }}
                />
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider truncate ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {model.developer} · {model.category}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded shrink-0 ${
                    isDarkMode ? 'bg-white/10 text-cyan-300' : 'bg-slate-100 text-slate-700 font-semibold'
                  }`}
                >
                  v{model.version}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight truncate">{model.name}</h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Language Switcher */}
              <div
                className={`flex items-center rounded-lg p-0.5 text-xs font-mono border ${
                  isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-300'
                }`}
              >
                <button
                  onClick={() => setLangTab('hi')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    langTab === 'hi'
                      ? isDarkMode
                        ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                        : 'bg-white text-indigo-700 font-bold shadow-sm'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => setLangTab('en')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    langTab === 'en'
                      ? isDarkMode
                        ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                        : 'bg-white text-indigo-700 font-bold shadow-sm'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  isDarkMode
                    ? 'text-slate-400 hover:text-white hover:bg-white/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title="Close window"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Scrollable, easily readable structured boxes */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-4">
            {/* Primary Summary Box */}
            <div
              className={`p-4 rounded-xl border ${
                isDarkMode
                  ? 'bg-[#05070F] border-cyan-500/20 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-cyan-500 mb-2">
                <Brain className="w-4 h-4 text-cyan-500" />
                <span>{langTab === 'hi' ? 'मॉडल की मुख्य पहचान व कार्य' : 'Core Objective & Model Mission'}</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                {langTab === 'hi' ? explanation.overviewHindi : explanation.overviewEnglish}
              </p>
            </div>

            {/* 4 Quantitative Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-[#05070F] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-0.5">
                  Context Window
                </div>
                <div className="text-xs sm:text-sm font-bold font-mono text-cyan-400 truncate">
                  {model.contextWindow}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Tokens capacity
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-[#05070F] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-0.5">
                  Edge Latency
                </div>
                <div className="text-xs sm:text-sm font-bold font-mono text-emerald-400 truncate">
                  {model.latencyRating}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Global CDN mesh
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-[#05070F] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-0.5">
                  Top Benchmark
                </div>
                <div className="text-xs sm:text-sm font-bold font-mono text-indigo-400 truncate">
                  {model.benchmark}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Verified SOTA score
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-[#05070F] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-0.5">
                  Pricing (1M)
                </div>
                <div className="text-xs sm:text-sm font-bold font-mono text-fuchsia-400 truncate">
                  {model.pricing.display}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Pay-as-you-go
                </div>
              </div>
            </div>

            {/* Deep Neural Architecture */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#05070F] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono mb-1.5 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deep Neural Architecture</span>
              </div>
              <p
                className={`text-xs sm:text-sm font-mono leading-relaxed ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {explanation.architecture}
              </p>
            </div>

            {/* Real-World Use Cases */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#05070F] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{langTab === 'hi' ? 'प्रमुख व्यावहारिक उपयोग (Use Cases)' : 'Recommended Applications'}</span>
              </div>
              <ul
                className={`space-y-1.5 text-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {explanation.useCases.map((uc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 shrink-0 font-bold">•</span>
                    <span>{uc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Competitive Strengths */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#05070F] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-amber-500 font-mono mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{langTab === 'hi' ? 'विशेष खूबियाँ और क्षमताएं (Strengths)' : 'Competitive Advantages'}</span>
              </div>
              <ul
                className={`space-y-1.5 text-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {explanation.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 shrink-0 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Licensing & Terms */}
            <div
              className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                isDarkMode ? 'bg-white/[0.02] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="font-mono text-slate-400">Commercial Licensing Terms:</span>
              <span className="font-bold font-mono text-cyan-400">{explanation.licenseTerms}</span>
            </div>
          </div>

          {/* Modal Footer: Fixed at bottom */}
          <div
            className={`p-4 sm:p-5 pt-3 border-t shrink-0 flex items-center justify-between gap-3 ${
              isDarkMode ? 'border-white/[0.08] bg-[#0B0F19]' : 'border-slate-200 bg-white'
            }`}
          >
            <button
              onClick={onClose}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Back to Catalog
            </button>

            <button
              onClick={() => {
                onClose();
                onDeploy(model);
              }}
              className="py-2.5 px-5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 shadow-md shadow-cyan-500/25 transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>Deploy {model.name} / Buy API Key</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
