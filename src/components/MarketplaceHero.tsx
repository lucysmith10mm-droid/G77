import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Layers,
  Search,
  Key
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ThreeBackground3D } from './ThreeBackground3D';
import { LanguageCode, getTranslation } from '../lib/translations';

interface MarketplaceHeroProps {
  onSearchClick: () => void;
  onExploreModels: () => void;
  onDeployModelDirect: () => void;
  isDarkMode?: boolean;
  currentLang?: LanguageCode;
}

const HERO_METRIC_GRAPHS = {
  models: [
    { d: '1', v: 75 }, { d: '2', v: 92 }, { d: '3', v: 110 },
    { d: '4', v: 128 }, { d: '5', v: 142 }, { d: '6', v: 154 }, { d: '7', v: 160 }
  ],
  context: [
    { d: '1', v: 128 }, { d: '2', v: 256 }, { d: '3', v: 512 },
    { d: '4', v: 1000 }, { d: '5', v: 1500 }, { d: '6', v: 1800 }, { d: '7', v: 2000 }
  ],
  latency: [
    { d: '1', v: 42 }, { d: '2', v: 34 }, { d: '3', v: 28 },
    { d: '4', v: 21 }, { d: '5', v: 18 }, { d: '6', v: 15 }, { d: '7', v: 13 }
  ],
  uptime: [
    { d: '1', v: 99.94 }, { d: '2', v: 99.96 }, { d: '3', v: 99.98 },
    { d: '4', v: 99.99 }, { d: '5', v: 99.99 }, { d: '6', v: 99.99 }, { d: '7', v: 99.99 }
  ],
};

export const MarketplaceHero: React.FC<MarketplaceHeroProps> = ({
  onSearchClick,
  onExploreModels,
  onDeployModelDirect,
  isDarkMode = true,
  currentLang = 'en',
}) => {
  return (
    <section className="relative pt-3 pb-5 sm:pt-4 sm:pb-6 overflow-hidden w-full max-w-full">
      {/* 3D WebGL Neural Background Layer */}
      <ThreeBackground3D />

      {/* Clamped Ambient Neon Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[550px] h-[220px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/15 to-fuchsia-600/10 blur-[90px] pointer-events-none -z-10 rounded-full" />

      {/* Strict Fixed-Width Container with Compact Padding */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 relative z-10 w-full">
        {/* Compact Top Tagline */}
        <div className="text-center mb-2.5">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-mono font-medium backdrop-blur-md border ${
              isDarkMode
                ? 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30'
                : 'text-indigo-900 bg-indigo-50 border-indigo-200 shadow-sm'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span>{getTranslation(currentLang, 'heroTag')}</span>
            <span className="text-slate-400">·</span>
            <span className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {getTranslation(currentLang, 'liveModels')}
            </span>
          </motion.div>
        </div>

        {/* Compact, High-Contrast Headline */}
        <div className="text-center max-w-3xl mx-auto mb-2.5 sm:mb-3.5">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight mb-2"
          >
            <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
              {getTranslation(currentLang, 'heroTitle1')}{' '}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-600 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              {getTranslation(currentLang, 'heroTitle2')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-medium ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            {getTranslation(currentLang, 'heroDesc')}
          </motion.p>
        </div>

        {/* Compact Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="flex flex-wrap items-center justify-center gap-2 mb-4 sm:mb-5"
        >
          <button
            onClick={onExploreModels}
            id="btn-hero-explore-models"
            className="py-2 px-3.5 sm:px-4.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-fuchsia-500 shadow-md shadow-cyan-500/20 transition-all duration-200 cursor-pointer flex items-center gap-1.5 group shrink-0"
          >
            <span>{getTranslation(currentLang, 'exploreModelsBtn')}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onSearchClick}
            id="btn-hero-quick-search"
            className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              isDarkMode
                ? 'bg-[#0B0F19]/90 hover:bg-white/10 text-slate-200 border-white/10 hover:border-cyan-400/40'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-cyan-500" />
            <span>{getTranslation(currentLang, 'searchCatalogBtn')}</span>
          </button>

          <button
            onClick={onDeployModelDirect}
            id="btn-hero-provision-key"
            className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              isDarkMode
                ? 'bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 border-cyan-500/30'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300 shadow-sm'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-cyan-500" />
            <span>{getTranslation(currentLang, 'deployKeyBtn')}</span>
          </button>
        </motion.div>

        {/* 4 Quantitative Proof Metrics: Strict 4-Column Grid, Reduced Spacing */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className={`grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-2xl border backdrop-blur-xl ${
            isDarkMode
              ? 'bg-[#0B0F19]/85 border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
              : 'bg-white/95 border-slate-300 shadow-md'
          }`}
        >
          {/* 1. Models Online */}
          <div
            className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono mb-0.5">
              <span className={`flex items-center gap-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Cpu className="w-3 h-3 text-cyan-500 shrink-0" />
                <span className="truncate">{getTranslation(currentLang, 'modelsOnline')}</span>
              </span>
              <span className="font-extrabold text-cyan-500 tabular-nums shrink-0">160+</span>
            </div>
            <div className="h-6 w-full my-0.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HERO_METRIC_GRAPHS.models} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hero-models-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#06B6D4"
                    strokeWidth={1.8}
                    fill="url(#hero-models-grad)"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${
              isDarkMode ? 'text-slate-400 border-white/5' : 'text-slate-600 border-slate-200'
            }`}>
              <span className="truncate">{getTranslation(currentLang, 'allFrontiers')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+28% 30d</span>
            </div>
          </div>

          {/* 2. Max Context Window */}
          <div
            className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono mb-0.5">
              <span className={`flex items-center gap-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Layers className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="truncate">{getTranslation(currentLang, 'maxContext')}</span>
              </span>
              <span className="font-extrabold text-indigo-600 dark:text-indigo-300 tabular-nums shrink-0">2,000,000</span>
            </div>
            <div className="h-6 w-full my-0.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HERO_METRIC_GRAPHS.context} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hero-context-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#6366F1"
                    strokeWidth={1.8}
                    fill="url(#hero-context-grad)"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${
              isDarkMode ? 'text-slate-400 border-white/5' : 'text-slate-600 border-slate-200'
            }`}>
              <span className="truncate">{getTranslation(currentLang, 'tokensQuery')}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold shrink-0">Gemini 2.5</span>
            </div>
          </div>

          {/* 3. Routing Latency */}
          <div
            className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono mb-0.5">
              <span className={`flex items-center gap-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <Zap className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate">{getTranslation(currentLang, 'edgeLatency')}</span>
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">&lt; 15ms</span>
            </div>
            <div className="h-6 w-full my-0.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HERO_METRIC_GRAPHS.latency} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hero-latency-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#10B981"
                    strokeWidth={1.8}
                    fill="url(#hero-latency-grad)"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${
              isDarkMode ? 'text-slate-400 border-white/5' : 'text-slate-600 border-slate-200'
            }`}>
              <span className="truncate">{getTranslation(currentLang, 'globalMesh')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">Ultra-Low</span>
            </div>
          </div>

          {/* 4. Enterprise SLA */}
          <div
            className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-mono mb-0.5">
              <span className={`flex items-center gap-1 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <ShieldCheck className="w-3 h-3 text-fuchsia-500 shrink-0" />
                <span className="truncate">{getTranslation(currentLang, 'enterpriseSla')}</span>
              </span>
              <span className="font-extrabold text-fuchsia-600 dark:text-fuchsia-300 tabular-nums shrink-0">99.99%</span>
            </div>
            <div className="h-6 w-full my-0.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HERO_METRIC_GRAPHS.uptime} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hero-uptime-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D946EF" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#D946EF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#D946EF"
                    strokeWidth={1.8}
                    fill="url(#hero-uptime-grad)"
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={`flex items-center justify-between text-[10px] font-mono pt-1 border-t ${
              isDarkMode ? 'text-slate-400 border-white/5' : 'text-slate-600 border-slate-200'
            }`}>
              <span className="truncate">{getTranslation(currentLang, 'zeroDowntime')}</span>
              <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold shrink-0">
                {getTranslation(currentLang, 'verified')}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
