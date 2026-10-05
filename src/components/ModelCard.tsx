import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Cpu,
  Flame,
  Crown,
  Brain,
  Code2,
  ArrowUpRight,
  Check,
  Scale,
  TrendingUp,
  Info
} from 'lucide-react';
import { AiModel, getModelTrend } from '../data/aiModelsData';
import { LanguageCode, getTranslation } from '../lib/translations';
import { ModelPerformanceGraph } from './ModelPerformanceGraph';

interface ModelCardProps {
  model: AiModel;
  onDeploy: (model: AiModel) => void;
  onOpenDetails: (model: AiModel) => void;
  onToggleCompare: (model: AiModel) => void;
  isCompared: boolean;
  isDarkMode?: boolean;
  currentLang?: LanguageCode;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  onDeploy,
  onOpenDetails,
  onToggleCompare,
  isCompared,
  isDarkMode = true,
  currentLang = 'en',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const trend = getModelTrend(model);

  const renderBadge = () => {
    switch (model.statusBadge) {
      case 'Flagship':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25 whitespace-nowrap">
            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
            Flagship
          </span>
        );
      case 'Hot':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/25 whitespace-nowrap">
            <Flame className="w-3 h-3 text-rose-500 shrink-0" />
            Hot
          </span>
        );
      case 'New':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 whitespace-nowrap">
            <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
            New
          </span>
        );
      case 'Reasoning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/25 whitespace-nowrap">
            <Brain className="w-3 h-3 text-purple-500 shrink-0" />
            Reasoning
          </span>
        );
      case 'Open Source':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25 whitespace-nowrap">
            <Code2 className="w-3 h-3 text-cyan-500 shrink-0" />
            Open
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/25 whitespace-nowrap">
            <Zap className="w-3 h-3 text-indigo-500 shrink-0" />
            Pro
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-xl flex flex-col justify-between transition-all duration-200 border ${
        isDarkMode
          ? 'bg-[#0B0F19]/90 backdrop-blur-xl border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.18)]'
          : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-lg'
      } p-3.5 sm:p-4 overflow-hidden`}
    >
      {/* Subtle neon glow on hover */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none"
        style={{ backgroundColor: model.developerColor || '#06B6D4' }}
      />
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 group-hover:via-cyan-400/80 to-transparent transition-all duration-200" />

      {/* Top Header: Developer + Badges + Compare Button */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Developer name with indicator */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full shrink-0 shadow-sm"
              style={{
                backgroundColor: model.developerColor,
                boxShadow: `0 0 6px ${model.developerColor}`,
              }}
            />
            <span
              className={`text-[11.5px] font-bold tracking-tight truncate ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {model.developer}
            </span>
          </div>

          {/* Badges + Compare Check */}
          <div className="flex items-center gap-1.5 shrink-0">
            {renderBadge()}

            {/* Compare Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(model);
              }}
              title={isCompared ? 'Remove from comparison' : 'Compare model'}
              className={`p-1 rounded text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                isCompared
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {isCompared ? (
                <Check className="w-3 h-3 text-cyan-400 shrink-0" />
              ) : (
                <Scale className="w-3 h-3 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Model Title & Version */}
        <div className="mb-1.5">
          <div className="flex items-baseline justify-between gap-1.5">
            <h3
              onClick={() => onOpenDetails(model)}
              className={`text-base font-bold tracking-tight group-hover:text-cyan-400 transition-colors cursor-pointer truncate ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
              title="Click to view details"
            >
              {model.name}
            </h3>
            <span
              className={`text-[11px] font-mono font-medium shrink-0 px-1.5 py-0.2 rounded ${
                isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}
            >
              v{model.version}
            </span>
          </div>
        </div>

        {/* Short Technical Description */}
        <p
          className={`text-[11.5px] leading-snug mb-2.5 line-clamp-2 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {model.shortDescription}
        </p>

        {/* Guaranteed Animated Performance Graph on Scroll */}
        <ModelPerformanceGraph
          model={model}
          trendData={trend.data}
          growth={trend.growth}
          color={model.developerColor || '#06B6D4'}
          height={46}
          isDarkMode={isDarkMode}
          currentLang={currentLang}
        />

        {/* Key Metrics: Context Window & Latency */}
        <div
          className={`grid grid-cols-2 gap-2 p-2 rounded-lg mb-2.5 text-xs ${
            isDarkMode ? 'bg-[#05070F]/70 border border-white/5' : 'bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="min-w-0">
            <div className="text-[9.5px] uppercase font-mono tracking-wider text-slate-400 mb-0.5 truncate">
              {getTranslation(currentLang, 'contextWindow')}
            </div>
            <div
              className={`font-semibold font-mono text-[11.5px] truncate flex items-center gap-1 ${
                isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
              }`}
            >
              <Cpu className="w-3 h-3 shrink-0 text-cyan-500" />
              <span className="truncate">{model.contextWindow}</span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[9.5px] uppercase font-mono tracking-wider text-slate-400 mb-0.5 truncate">
              {getTranslation(currentLang, 'speedLatency')}
            </div>
            <div
              className={`font-semibold font-mono text-[11.5px] truncate flex items-center gap-1 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
              }`}
            >
              <Zap className="w-3 h-3 shrink-0 text-emerald-500" />
              <span className="truncate">{model.latencyRating}</span>
            </div>
          </div>
        </div>

        {/* Capabilities Tags */}
        <div className="flex flex-wrap items-center gap-1 mb-2.5">
          {model.capabilities.slice(0, 3).map((cap, i) => (
            <span
              key={i}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border whitespace-nowrap ${
                isDarkMode
                  ? 'bg-white/[0.04] border-white/10 text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {cap}
            </span>
          ))}
          {model.capabilities.length > 3 && (
            <span
              className={`text-[10px] font-mono px-1 py-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              +{model.capabilities.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Benchmark + Pricing + Deploy & Details Buttons */}
      <div className="pt-2 border-t border-white/[0.08] mt-auto">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider shrink-0">
            {getTranslation(currentLang, 'benchmark')}
          </span>
          <span
            className={`font-mono text-[11px] font-semibold truncate ml-2 text-right ${
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {model.benchmark}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2.5 text-xs">
          <span className="text-slate-400 shrink-0 text-[11px]">
            {getTranslation(currentLang, 'pricing1M')}
          </span>
          <span
            className={`font-mono font-bold text-xs tabular-nums truncate ml-2 text-right ${
              model.pricing.isFreeOpenWeight
                ? 'text-cyan-400'
                : isDarkMode
                ? 'text-white'
                : 'text-slate-900'
            }`}
          >
            {model.pricing.display}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {/* Details Button */}
          <button
            onClick={() => onOpenDetails(model)}
            className={`col-span-2 py-2 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border whitespace-nowrap ${
              isDarkMode
                ? 'text-slate-200 bg-white/5 hover:bg-white/10 border-white/10 hover:border-cyan-400/40'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>{getTranslation(currentLang, 'details')}</span>
          </button>

          {/* Deploy / Buy Button */}
          <button
            onClick={() => onDeploy(model)}
            id={`btn-deploy-${model.id}`}
            className="col-span-3 py-2 px-2 rounded-lg text-xs font-bold tracking-wide text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-fuchsia-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-1 group/btn whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-200 group-hover/btn:scale-110 transition-transform shrink-0" />
            <span>{getTranslation(currentLang, 'deploy')}</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform shrink-0" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
