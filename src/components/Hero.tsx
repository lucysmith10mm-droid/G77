import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Video,
  ShieldCheck,
  Zap,
  Layers,
  CheckCircle,
  Circle,
  ArrowRight,
  Flame,
  Crown,
  Users,
  Star
} from 'lucide-react';
import { PlanConfig, PlanId } from '../types';
import { ThreeBackground3D } from './ThreeBackground3D';

interface HeroProps {
  plans: PlanConfig[];
  selectedPlanId: PlanId;
  onSelectPlan: (id: PlanId) => void;
  onGetAccess: () => void;
  onDirectCheckout?: (id: PlanId) => void;
  isDarkMode?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  plans,
  selectedPlanId,
  onSelectPlan,
  onGetAccess,
  onDirectCheckout,
  isDarkMode = true,
}) => {
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const getPlanCtaLabel = (plan: PlanConfig) => {
    if (plan.id === 'PLAN_7_DAYS') return 'Get 7 Days Unlimited Plan';
    if (plan.id === 'PLAN_30_DAYS') return 'Get 30 Days Unlimited Plan';
    return 'Get Lifetime Unlimited Plan';
  };

  const getPlanSelectLabel = (plan: PlanConfig) => {
    if (plan.id === 'PLAN_7_DAYS') return 'Select 7 Days Unlimited Plan';
    if (plan.id === 'PLAN_30_DAYS') return 'Select 30 Days Unlimited Plan';
    return 'Select Lifetime Unlimited Plan';
  };

  return (
    <section className="relative pt-6 pb-6 md:pt-10 md:pb-8 overflow-hidden">
      {/* High-Performance 3D WebGL Canvas Layer */}
      <ThreeBackground3D />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[750px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-fuchsia-600/15 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-500/10 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Top Unlimited Pack Limited Time Sale Banner - Ultra-VIP Luxury Marquee Strip */}
        <div className="max-w-3xl mx-auto mb-6">
          <div
            onClick={() => onGetAccess()}
            title="Click to unlock VIP unlimited pass"
            className="hero-marquee-bar group relative p-[1.5px] rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 via-fuchsia-500 via-purple-600 to-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3),0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] cursor-pointer transition-all duration-300"
          >
            <div className="relative overflow-hidden rounded-full py-2 sm:py-2.5 px-3 sm:px-5 bg-gradient-to-r from-[#140b2b]/95 via-[#0e071f]/98 to-[#140b2b]/95 [html.light-theme_&]:bg-white backdrop-blur-2xl">
              {/* Subtle edge fade masks */}
              <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#0e071f] [html.light-theme_&]:from-white via-[#0e071f]/70 [html.light-theme_&]:via-white/70 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#0e071f] [html.light-theme_&]:from-white via-[#0e071f]/70 [html.light-theme_&]:via-white/70 to-transparent z-10 pointer-events-none" />

              <div className="animate-marquee-infinite flex items-center select-none">
                {/* Repeated items for continuous right-to-left loop with VIP Styling */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-5 whitespace-nowrap mx-3 sm:mx-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 text-amber-300 [html.light-theme_&]:text-amber-800 border border-amber-400/50 [html.light-theme_&]:border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)] uppercase tracking-wider">
                      <Crown className="w-3 h-3 text-amber-400 [html.light-theme_&]:text-amber-600 fill-amber-400" />
                      PREMIUM PASS
                    </span>
                    <span className="hero-marquee-text font-black text-xs sm:text-sm tracking-wide bg-gradient-to-r from-amber-100 via-white to-amber-200 [html.light-theme_&]:from-slate-900 [html.light-theme_&]:to-slate-800 bg-clip-text text-transparent drop-shadow">
                      UNLIMITED AI VIDEO GENERATION ACCESS
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-cyan-300 [html.light-theme_&]:text-indigo-600 font-mono">
                      <Zap className="w-3 h-3 fill-cyan-400 text-cyan-400 [html.light-theme_&]:text-indigo-600" />
                      SEEDANCE 2.5 + 2.0 DUAL ENGINES
                    </span>
                    <span className="text-amber-400/80 font-black text-xs">✦</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto mb-5 sm:mb-6 px-2">
          {/* Unified, Perfectly Fitted Title - Single Line, Never Wraps Below, Uniform Alignment */}
          <div className="w-full flex items-center justify-center mb-3 sm:mb-4">
            <h1 className="flex items-center justify-center flex-nowrap whitespace-nowrap gap-1.5 min-[380px]:gap-2.5 sm:gap-3.5 select-none font-black tracking-tight leading-tight py-1 drop-shadow-[0_4px_24px_rgba(168,85,247,0.25)] text-[16px] min-[360px]:text-[18px] min-[400px]:text-[21px] min-[480px]:text-2xl sm:text-4xl md:text-5xl lg:text-6xl max-w-full">
              <span className="hero-title-first bg-gradient-to-r from-white via-slate-100 to-purple-200 [html.light-theme_&]:from-slate-900 [html.light-theme_&]:via-slate-800 [html.light-theme_&]:to-purple-900 bg-clip-text text-transparent whitespace-nowrap">
                SEE DANCE 2.5
              </span>
              <span className="text-fuchsia-400 [html.light-theme_&]:text-purple-600 font-light opacity-80 px-0.5 sm:px-1 text-[13px] min-[360px]:text-[15px] min-[400px]:text-[18px] min-[480px]:text-xl sm:text-3xl md:text-4xl lg:text-5xl shrink-0">
                +
              </span>
              <span className="hero-title-second bg-gradient-to-r from-purple-200 via-fuchsia-300 to-cyan-300 [html.light-theme_&]:from-purple-900 [html.light-theme_&]:via-indigo-800 [html.light-theme_&]:to-cyan-700 bg-clip-text text-transparent whitespace-nowrap">
                SEE DANCE 2.0
              </span>
            </h1>
          </div>

          {/* Clean, Neatly Fitted Sponsor & Ecosystem Box with NVIDIA, Google, Microsoft & Copilot */}
          <div className="w-full max-w-xl mx-auto mb-4 px-2">
            <div className="w-full py-2 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-[#0d0c1c]/95 border border-white/10 [html.light-theme_&]:bg-white [html.light-theme_&]:border-slate-300 shadow-lg backdrop-blur-md">
              {/* Top Header Label */}
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08] [html.light-theme_&]:border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] sm:text-[10.5px] font-mono font-black tracking-wider uppercase text-slate-300 [html.light-theme_&]:text-slate-700">
                    POWERED & SUPPORTED BY:
                  </span>
                </div>
                <span className="text-[9px] font-mono font-semibold text-cyan-400 [html.light-theme_&]:text-indigo-600">
                  GPU CLOUD ECOSYSTEM
                </span>
              </div>

              {/* 4 Clean, Clearly Visible Sponsor Badges: NVIDIA, Google, Microsoft, Copilot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                {/* 1. NVIDIA */}
                <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/[0.08] [html.light-theme_&]:border-slate-200 transition-colors">
                  <svg className="w-4 h-3 shrink-0" viewBox="0 0 32 24" fill="none">
                    <path
                      d="M13.6 3.6C8.8 4.2 4.4 7.6 2.4 12c2.2 4.6 6.8 7.8 11.8 8.2v-2.2C10.2 17.6 6.8 15 5.2 12c1.4-2.8 4.4-5.2 8.4-5.8V3.6zm0 5.4c-2.4.4-4.6 2-5.6 4.4 1 2.4 3 4 5.6 4.4v-1.8c-1.6-.4-3-1.4-3.6-2.6.6-1.2 2-2.2 3.6-2.6V9zm0 3.6c-.6.2-1 .8-1.2 1.4.2.6.6 1.2 1.2 1.4V12.6zm3.2-9c3.8 0 7.2 1.8 9.2 4.8-1.4 1.2-2.8 2.2-4.2 3.4-1.2-1.6-3-2.6-5-2.6v-5.6zm0 5.6c1.6 0 3 .8 3.8 2l-3.8 3v-5zm0 5v4.2c-1.4 0-2.6-.6-3.2-1.6l3.2-2.6z"
                      fill="#76B900"
                    />
                  </svg>
                  <span className="font-black text-[10.5px] sm:text-xs text-[#76B900] tracking-tight whitespace-nowrap">
                    NVIDIA
                  </span>
                </div>

                {/* 2. Google */}
                <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/[0.08] [html.light-theme_&]:border-slate-200 transition-colors">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="font-bold text-[10.5px] sm:text-xs text-white [html.light-theme_&]:text-slate-900 tracking-tight whitespace-nowrap">
                    Google
                  </span>
                </div>

                {/* 3. Microsoft */}
                <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/[0.08] [html.light-theme_&]:border-slate-200 transition-colors">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
                    <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
                    <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
                    <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
                  </svg>
                  <span className="font-bold text-[10.5px] sm:text-xs text-white [html.light-theme_&]:text-slate-900 tracking-tight whitespace-nowrap">
                    Microsoft
                  </span>
                </div>

                {/* 4. Copilot */}
                <div className="flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/[0.08] [html.light-theme_&]:border-slate-200 transition-colors">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <linearGradient id="copilotHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0078D4" />
                        <stop offset="50%" stopColor="#8A42F5" />
                        <stop offset="100%" stopColor="#FF69B4" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 13.5l-3-2.5-3 2.5v-7l3 2.5 3-2.5v7z"
                      fill="url(#copilotHeroGrad)"
                    />
                  </svg>
                  <span className="font-bold text-[10.5px] sm:text-xs text-cyan-300 [html.light-theme_&]:text-indigo-600 tracking-tight whitespace-nowrap">
                    Copilot
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact, Perfectly Fitted 50,000+ Happy Users & Rating System */}
          <div className="w-full max-w-xl mx-auto mb-6">
            <div className="hero-ratings-box w-full py-2 px-3 sm:px-4 rounded-xl bg-[#0c0c18]/90 border border-white/10 backdrop-blur-md shadow-md grid grid-cols-3 divide-x divide-white/10 [html.light-theme_&]:divide-slate-200 text-center">
              {/* Stat 1: 5-Star Rating */}
              <div className="flex items-center justify-center gap-1.5 px-1 sm:px-2">
                <div className="flex items-center -space-x-0.5 text-amber-400">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-left leading-none">
                  <span className="text-[11px] sm:text-xs font-bold text-white [html.light-theme_&]:text-slate-900">
                    4.9/5
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium">
                    Rated
                  </span>
                </div>
              </div>

              {/* Stat 2: 50,000+ Happy Users */}
              <div className="flex items-center justify-center gap-1.5 px-1 sm:px-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
                  <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-fuchsia-400" />
                </div>
                <div className="text-left leading-none">
                  <span className="text-[11px] sm:text-xs font-bold text-white [html.light-theme_&]:text-slate-900 whitespace-nowrap">
                    50,000+
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium whitespace-nowrap">
                    Happy Users
                  </span>
                </div>
              </div>

              {/* Stat 3: Satisfaction / Verification */}
              <div className="flex items-center justify-center gap-1.5 px-1 sm:px-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                </div>
                <div className="text-left leading-none">
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-400 whitespace-nowrap">
                    99.8%
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium whitespace-nowrap">
                    Satisfaction
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Pricing Plans Section - Vertically Stacked on Mobile, 3-Columns on Desktop */}
          <div
            id="plans-section"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto mb-6 text-left [perspective:1200px]"
          >
            {plans.map((plan, index) => {
              const isSelected = selectedPlanId === plan.id;
              const isLifetime = plan.id === 'PLAN_LIFETIME';
              const is30Days = plan.id === 'PLAN_30_DAYS';
              const isHovered = hoveredCardId === plan.id;
              const prevPrice = plan.id === 'PLAN_7_DAYS' ? 25 : plan.id === 'PLAN_30_DAYS' ? 49 : 899;
              const discountPercent = plan.id === 'PLAN_7_DAYS' ? '80% OFF' : plan.id === 'PLAN_30_DAYS' ? '76% OFF' : '55% OFF';

              return (
                <motion.div
                  key={plan.id}
                  id={`hero-plan-${plan.id}`}
                  initial={{ opacity: 0, y: 26, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{
                    y: -5,
                    scale: 1.015,
                    transition: { duration: 0.2, ease: 'easeOut' },
                  }}
                  onMouseEnter={() => setHoveredCardId(plan.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => onSelectPlan(plan.id)}
                  className={`hero-plan-card relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-colors duration-300 cursor-pointer flex flex-col justify-between border backdrop-blur-xl w-full ${
                    isSelected
                      ? isDarkMode
                        ? 'hero-plan-selected bg-gradient-to-b from-purple-950/75 via-[#100e24]/90 to-[#0a0a14]/95 border-2 border-fuchsia-400 shadow-xl shadow-fuchsia-500/25 ring-2 ring-fuchsia-500/40 text-white'
                        : 'hero-plan-selected bg-gradient-to-b from-purple-50/90 via-white to-white border-2 border-purple-600 shadow-xl shadow-purple-500/15 ring-2 ring-purple-500/20 text-slate-900'
                      : isDarkMode
                        ? 'bg-[#0c0c18]/85 hover:bg-[#121128]/95 border-white/10 hover:border-fuchsia-500/50 shadow-lg text-white'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-purple-300 shadow-sm text-slate-900'
                  }`}
                >
                  {/* Top Badges */}
                  {isLifetime ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 whitespace-nowrap">
                      <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md shadow-amber-500/30">
                        👑 BEST VALUE
                      </span>
                      <span className="bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md shadow-rose-500/30 animate-pulse">
                        VIP DEAL
                      </span>
                    </div>
                  ) : is30Days ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 whitespace-nowrap">
                      <span className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md shadow-purple-500/30">
                        🔥 MOST POPULAR
                      </span>
                    </div>
                  ) : (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 whitespace-nowrap">
                      <span className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md shadow-cyan-500/30">
                        ⚡ STARTER PASS
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Top Row: Duration & Selection Radio */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9.5px] sm:text-[10.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                              : 'bg-purple-100 text-purple-700 border border-purple-200'
                            : isDarkMode
                              ? 'bg-white/10 text-slate-300 border border-white/10'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {plan.duration}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/40'
                              : 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : isDarkMode
                              ? 'border border-white/20 text-transparent'
                              : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        {isSelected ? (
                          <CheckCircle className="w-3.5 h-3.5 fill-white text-fuchsia-600" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Plan Heading */}
                    <h3 className={`hero-plan-title text-sm sm:text-base md:text-lg font-black tracking-tight mb-0.5 truncate ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {plan.name}
                    </h3>

                    {/* Hero Tagline */}
                    <p className={`text-[10px] sm:text-[11px] font-medium mb-2 leading-tight line-clamp-2 ${
                      isDarkMode ? 'text-fuchsia-300/90' : 'text-purple-700'
                    }`}>
                      {plan.heroTagline || plan.description}
                    </p>

                    {/* Price with Discount */}
                    <div className="mb-2.5 pb-2 border-b border-white/10 dark:border-white/10 [html.light-theme_&]:border-slate-200">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {plan.currency === 'INR' ? '₹' : '$'}{plan.amount}
                        </span>
                        <span className="text-xs line-through text-slate-400 font-mono">
                          ${prevPrice}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 [html.light-theme_&]:bg-rose-100 [html.light-theme_&]:text-rose-700 border border-rose-500/30 [html.light-theme_&]:border-rose-200">
                          {discountPercent}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-500 font-medium">
                        {isLifetime ? 'One-time payment • Lifetime access' : `Billed once • ${plan.duration} access`}
                      </span>
                    </div>

                    {/* Prominent UNLIMITED Badge */}
                    <div className={`w-full py-1 px-2 rounded-lg flex items-center justify-center gap-1 mb-2.5 shadow-inner ${
                      isDarkMode
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold'
                    }`}>
                      <Zap className={`w-3 h-3 ${isDarkMode ? 'text-emerald-400 fill-emerald-400' : 'text-emerald-600 fill-emerald-600'}`} />
                      <span className="text-[9.5px] sm:text-[10.5px] font-black tracking-wider uppercase">
                        100% UNLIMITED GENERATIONS
                      </span>
                    </div>

                    {/* Detailed Specifications / Features List */}
                    <div className="space-y-1.5 mb-3">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[10.5px] sm:text-xs">
                          <CheckCircle className={`w-3 h-3 shrink-0 mt-0.5 ${
                            isSelected
                              ? isDarkMode ? 'text-fuchsia-400' : 'text-purple-600'
                              : isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                          }`} />
                          <span className={`leading-tight ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-700'
                          }`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SELECT PLAN BUTTON (CLICKING SELECTS, IF ALREADY SELECTED OPENS ACCESS) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        onGetAccess();
                      } else {
                        onSelectPlan(plan.id);
                      }
                    }}
                    className={`w-full py-2 sm:py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 mt-1 ${
                      isSelected
                        ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transform hover:scale-[1.01] active:scale-[0.98]'
                        : isDarkMode
                          ? 'bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 hover:text-white border border-white/10'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-200 shrink-0" />
                    <span className="truncate">
                      {isSelected
                        ? `${getPlanCtaLabel(plan)} • ${plan.currency === 'INR' ? '₹' : '$'}${plan.amount}`
                        : getPlanSelectLabel(plan)}
                    </span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Dedicated "Get Access" button below the 3 plan cards */}
          <div className="flex flex-col items-center justify-center gap-3 max-w-xl mx-auto">
            <button
              id="hero-proceed-button"
              onClick={() => onGetAccess()}
              className="w-full py-4 px-8 rounded-2xl text-base sm:text-lg font-black text-white bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-indigo-500 shadow-2xl shadow-fuchsia-500/40 hover:shadow-fuchsia-500/60 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-5 h-5 text-fuchsia-200 shrink-0" />
              <span>
                {getPlanCtaLabel(selectedPlan)} ({selectedPlan.currency === 'INR' ? '₹' : '$'}{selectedPlan.amount})
              </span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>

            {/* Helper Tag under Button */}
            <p className={`text-xs font-medium text-center ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              ⚡ {selectedPlan.duration} Uncapped Access to SEE DANCE 2.5 + 2.0 • Instant Email Activation • No Hidden Fees
            </p>

            {/* Supported Payment Methods Strip - Fixed & Fitted Premium Border */}
            <div className={`payment-methods-strip w-full py-2 px-3 sm:px-4 rounded-xl border flex items-center justify-between text-[11px] sm:text-xs gap-2 ${
              isDarkMode
                ? 'bg-gradient-to-r from-white/[0.04] via-purple-500/[0.05] to-cyan-500/[0.04] border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.3)]'
                : 'bg-gradient-to-r from-slate-50 via-purple-50/40 to-slate-50 border-slate-300 shadow-sm'
            }`}>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className={`font-mono uppercase text-[9.5px] sm:text-[10px] tracking-wider font-bold ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>Accepted Globally:</span>
              </div>
              <div className={`flex items-center gap-2 sm:gap-2.5 font-semibold text-[10.5px] sm:text-[11.5px] shrink-0 ${
                isDarkMode ? 'text-slate-200' : 'text-slate-800'
              }`}>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 [html.light-theme_&]:bg-white [html.light-theme_&]:border-slate-200">Cards</span>
                <span className="text-slate-500">•</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 [html.light-theme_&]:bg-white [html.light-theme_&]:border-slate-200">Apple Pay</span>
                <span className="text-slate-500">•</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 [html.light-theme_&]:bg-white [html.light-theme_&]:border-slate-200">PayPal</span>
                <span className="text-slate-500">•</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 [html.light-theme_&]:bg-white [html.light-theme_&]:border-slate-200 text-amber-400 font-bold">Crypto</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Automated Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>4K 60FPS Video Diffusion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>SEE DANCE 2.5 + 2.0 Engines</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
