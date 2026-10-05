import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  Crown,
  ArrowRight,
  Infinity,
  Video,
  ShieldCheck,
  Cpu,
  Layers,
  Rocket,
  CreditCard,
  CheckCircle2,
  Lock,
  Headphones,
  LucideIcon
} from 'lucide-react';
import { PlanConfig, PlanId } from '../types';

interface PricingProps {
  plans: PlanConfig[];
  selectedPlanId: PlanId;
  onSelectPlan: (planId: PlanId) => void;
  onGetAccess: () => void;
  onDirectCheckout?: (planId: PlanId) => void;
  isDarkMode?: boolean;
}

// Maps feature texts to meaningful Lucide icons with matching color palettes for visual appeal
const getFeatureIconMeta = (feature: string, isDarkMode: boolean = true): {
  icon: LucideIcon;
  color: string;
  bg: string;
} => {
  const lower = feature.toLowerCase();
  if (lower.includes('see dance') || lower.includes('engine')) {
    return {
      icon: Sparkles,
      color: isDarkMode ? 'text-fuchsia-400' : 'text-purple-600',
      bg: isDarkMode ? 'bg-fuchsia-500/15 border-fuchsia-500/30' : 'bg-purple-100 border-purple-200',
    };
  }
  if (lower.includes('unlimited') || lower.includes('forever') || lower.includes('for life')) {
    return {
      icon: Infinity,
      color: isDarkMode ? 'text-cyan-300' : 'text-blue-600',
      bg: isDarkMode ? 'bg-cyan-500/15 border-cyan-500/30' : 'bg-blue-100 border-blue-200',
    };
  }
  if (lower.includes('4k') || lower.includes('uhd') || lower.includes('60fps') || lower.includes('prompt-to') || lower.includes('video')) {
    return {
      icon: Video,
      color: isDarkMode ? 'text-indigo-300' : 'text-indigo-600',
      bg: isDarkMode ? 'bg-indigo-500/15 border-indigo-500/30' : 'bg-indigo-100 border-indigo-200',
    };
  }
  if (lower.includes('queue') || lower.includes('throttl') || lower.includes('acceleration')) {
    return {
      icon: Zap,
      color: isDarkMode ? 'text-amber-400' : 'text-amber-600',
      bg: isDarkMode ? 'bg-amber-500/15 border-amber-500/30' : 'bg-amber-100 border-amber-200',
    };
  }
  if (lower.includes('gpu') || lower.includes('neural') || lower.includes('cluster') || lower.includes('server')) {
    return {
      icon: Cpu,
      color: isDarkMode ? 'text-purple-300' : 'text-purple-700',
      bg: isDarkMode ? 'bg-purple-500/15 border-purple-500/30' : 'bg-purple-100 border-purple-200',
    };
  }
  if (lower.includes('commercial') || lower.includes('license')) {
    return {
      icon: ShieldCheck,
      color: isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
      bg: isDarkMode ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-100 border-emerald-200',
    };
  }
  if (lower.includes('motion') || lower.includes('trajector') || lower.includes('synthesis')) {
    return {
      icon: Layers,
      color: isDarkMode ? 'text-sky-300' : 'text-sky-600',
      bg: isDarkMode ? 'bg-sky-500/15 border-sky-500/30' : 'bg-sky-100 border-sky-200',
    };
  }
  if (lower.includes('one-time') || lower.includes('recurring') || lower.includes('fee')) {
    return {
      icon: CreditCard,
      color: isDarkMode ? 'text-emerald-400' : 'text-emerald-700',
      bg: isDarkMode ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-100 border-emerald-200',
    };
  }
  if (lower.includes('upgrade') || lower.includes('future') || lower.includes('architecture')) {
    return {
      icon: Rocket,
      color: isDarkMode ? 'text-rose-400' : 'text-rose-600',
      bg: isDarkMode ? 'bg-rose-500/15 border-rose-500/30' : 'bg-rose-100 border-rose-200',
    };
  }
  if (lower.includes('vip') || lower.includes('best') || lower.includes('lifetime')) {
    return {
      icon: Crown,
      color: isDarkMode ? 'text-amber-400' : 'text-amber-600',
      bg: isDarkMode ? 'bg-amber-500/15 border-amber-500/30' : 'bg-amber-100 border-amber-200',
    };
  }
  return {
    icon: CheckCircle2,
    color: isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
    bg: isDarkMode ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-emerald-100 border-emerald-200',
  };
};

export const Pricing: React.FC<PricingProps> = ({
  plans,
  selectedPlanId,
  onSelectPlan,
  onGetAccess,
  onDirectCheckout,
  isDarkMode = true,
}) => {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const getExpandedFeatures = (plan: PlanConfig): string[] => {
    if (plan.id === 'PLAN_7_DAYS') {
      return [
        'Dual Model Engine: SEE DANCE 2.5 Ultra + 2.0 Turbo',
        '100% UNLIMITED Video Generations for 7 Full Days',
        'Native 4K UHD (3840×2160) @ 60 FPS Fluid Output',
        '100% Zero-Watermark Uncompressed MP4 Downloads',
        'Full Commercial & Social Monetization License Included',
        'Text-to-Video & Image Reference Dynamic Guidance',
        'Dedicated VIP H100 GPU Cluster (Zero Throttling)',
        'Instant Activation Token Delivered via Email',
        'One-Time Payment — No Automatic Renewals',
      ];
    }
    if (plan.id === 'PLAN_30_DAYS') {
      return [
        'Full Dual Access: SEE DANCE 2.5 Ultra + 2.0 Turbo',
        '100% UNLIMITED Video Generations for 30 Full Days',
        'Native 4K UHD (3840×2160) @ 60 FPS Fluid Motion',
        'Priority GPU Queue Routing (Faster Render Speeds)',
        '100% Zero-Watermark High-Bitrate Master Exports',
        'Worldwide Commercial & Agency Resell Rights',
        'Text-to-Video, Image-to-Video & Motion Prompts',
        'Guaranteed Access to all 2.5 Engine Micro-Updates',
        'Instant Portal Key Delivery via Email',
        'Fixed One-Time Fee — Zero Recurring Billing',
      ];
    }
    return [
      'Permanent Lifetime Unlimited Access (Pay Once, Own Forever)',
      'Dual Flagship Models: SEE DANCE 2.5 Ultra + 2.0 Turbo Forever',
      'Native 4K UHD @ 60 FPS Liquid Fluid Output',
      'Top Tier VIP H100 GPU Allocation (Fastest Priority Queue)',
      '100% Zero-Watermark Studio Master Downloads',
      'Perpetual Commercial, Broadcasting & Resale Rights',
      'Free Access to All Future SEE DANCE Model Upgrades',
      'Multi-Modal Conditioning: Text, Image & Motion Seeds',
      'Direct Founder / VIP Priority Developer Support Line',
      'One-Time Payment Only — Never Pay Another Subscription',
    ];
  };

  const getPlanSpecs = (planId: PlanId) => {
    if (planId === 'PLAN_7_DAYS') {
      return [
        { label: 'Engine Matrix', val: '2.5 Ultra + 2.0 Turbo' },
        { label: 'Resolution', val: '4K UHD (3840×2160)' },
        { label: 'Framerate', val: '60 FPS Native Fluid' },
        { label: 'License Type', val: 'Commercial & Resell' },
      ];
    }
    if (planId === 'PLAN_30_DAYS') {
      return [
        { label: 'Engine Matrix', val: '2.5 Ultra + 2.0 Turbo' },
        { label: 'Render Queue', val: 'Priority VIP H100' },
        { label: 'Framerate', val: '60 FPS Native Fluid' },
        { label: 'License Type', val: 'Agency & Commercial' },
      ];
    }
    return [
      { label: 'Engine Matrix', val: 'Dual Flagship Suite' },
      { label: 'Render Queue', val: 'Top-Tier Dedicated VIP' },
      { label: 'Future Models', val: 'All Upgrades Free' },
      { label: 'License Type', val: 'Perpetual Commercial' },
    ];
  };

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

  const handleAction = (planId: PlanId) => {
    onSelectPlan(planId);
    if (onDirectCheckout) {
      onDirectCheckout(planId);
    } else {
      onGetAccess();
    }
  };

  return (
    <section id="pricing" className="py-10 md:py-14 relative border-t border-white/[0.06] w-full max-w-full overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto mb-7"
        >
          {/* Fixed Premium Border Header Capsule */}
          <div className="inline-block p-[1.5px] rounded-2xl bg-gradient-to-r from-purple-500/80 via-fuchsia-500/80 to-cyan-400/80 shadow-[0_2px_18px_rgba(168,85,247,0.22)] mb-3">
            <div className="py-2 px-4 sm:px-6 rounded-[14.5px] bg-[#0c081e]/95 [html.light-theme_&]:bg-white backdrop-blur-md flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Shield className="w-3 h-3 text-emerald-400" />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white [html.light-theme_&]:text-slate-900 tracking-tight leading-none">
                Choose Your Unlimited Access Pass
              </h2>
            </div>
          </div>

          <p className="text-slate-400 [html.light-theme_&]:text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto">
            Unlock instant access to <strong>SEE DANCE 2.5 + 2.0</strong> with zero generation caps, commercial licensing, and instant delivery.
          </p>
        </motion.div>

        {/* 3 Pricing Cards - Responsive Grid Layout (Stacked on Mobile, 3 Columns on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch mb-8 [perspective:1200px]">
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
                initial={{ opacity: 0, y: 32, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{
                  y: -5,
                  scale: 1.015,
                  transition: { duration: 0.22, ease: 'easeOut' },
                }}
                onMouseEnter={() => setHoveredCardId(plan.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                onClick={() => onSelectPlan(plan.id)}
                className={`pricing-card relative rounded-2xl sm:rounded-3xl p-5 flex flex-col justify-between transition-colors duration-300 cursor-pointer backdrop-blur-xl w-full ${
                  isSelected
                    ? isDarkMode
                      ? 'pricing-card-selected bg-[#100e24]/95 border-2 border-fuchsia-400 shadow-xl shadow-purple-600/30 text-white'
                      : 'pricing-card-selected bg-gradient-to-b from-purple-50/90 via-white to-white border-2 border-purple-600 shadow-xl shadow-purple-500/15 ring-2 ring-purple-500/20 text-slate-900'
                    : isDarkMode
                      ? 'bg-[#0b0a16]/90 border border-white/10 hover:border-fuchsia-500/40 hover:bg-[#0e0d1e] text-white'
                      : 'bg-white border border-slate-200 hover:border-purple-300 shadow-sm text-slate-900'
                }`}
              >
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    {isLifetime ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black shadow-sm tracking-wider">
                        👑 BEST VALUE
                      </span>
                    ) : is30Days ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white shadow-sm tracking-wider">
                        🔥 MOST POPULAR
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm tracking-wider">
                        ⚡ STARTER PASS
                      </span>
                    )}
                    {plan.isLimitedSale && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] sm:text-[9.5px] font-bold uppercase ${
                        isDarkMode
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}>
                        LIMITED VIP
                      </span>
                    )}
                  </div>

                  {/* Radio Selection Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/40'
                          : 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : isDarkMode
                          ? 'border border-slate-600 text-transparent'
                          : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                {/* Plan Header */}
                <div className="mb-3">
                  <h3 className={`text-sm sm:text-base lg:text-lg font-black mb-0.5 flex items-center gap-1 truncate ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {plan.name}
                    {isLifetime && <Crown className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />}
                  </h3>
                  
                  {/* Tagline */}
                  <p className={`text-[10px] sm:text-xs font-semibold mb-1.5 line-clamp-1 sm:line-clamp-2 ${
                    isDarkMode ? 'text-fuchsia-300' : 'text-purple-700'
                  }`}>
                    {plan.heroTagline || plan.duration + ' Unthrottled AI Suite'}
                  </p>

                  <div className={`inline-block text-[9.5px] sm:text-[10.5px] font-mono uppercase font-bold px-2 py-0.5 rounded-lg tracking-wider mb-2.5 ${
                    isDarkMode
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  }`}>
                    ⚡ 100% UNLIMITED ACCESS
                  </div>

                  {/* Pricing and Discount Tag */}
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs text-slate-400 line-through font-mono">
                        ${prevPrice}
                      </span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 [html.light-theme_&]:bg-rose-100 [html.light-theme_&]:text-rose-700 border border-rose-500/30 [html.light-theme_&]:border-rose-200">
                        {discountPercent}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {plan.currency === 'INR' ? '₹' : '$'}{plan.amount}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {plan.currency || 'USD'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isLifetime ? '• one-time' : `• ${plan.duration}`}
                      </span>
                    </div>
                  </div>

                  <p className={`text-[10.5px] sm:text-xs leading-relaxed line-clamp-2 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {plan.description}
                  </p>
                </div>

                {/* Compact Technical Specs Grid (Boosts Trust & Transparency) */}
                <div className={`grid grid-cols-2 gap-1.5 p-2 rounded-xl border mb-3 text-[10px] font-mono transition-colors ${
                  isDarkMode
                    ? 'bg-white/[0.03] border-white/[0.08]'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  {getPlanSpecs(plan.id).map((spec, sIdx) => (
                    <div key={sIdx} className="leading-tight">
                      <span className={`block text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {spec.label}:
                      </span>
                      <span className={`font-bold truncate block ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {spec.val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Comprehensive Features List with Contextual Lucide Icons */}
                <div className="space-y-2 pt-2.5 border-t border-white/[0.08] [html.light-theme_&]:border-slate-200 text-[10.5px] sm:text-xs mb-4 flex-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 [html.light-theme_&]:text-slate-500 mb-1.5">
                    Included Capabilities ({getExpandedFeatures(plan).length})
                  </div>
                  {getExpandedFeatures(plan).map((feat, idx) => {
                    const { icon: FeatureIcon, color, bg } = getFeatureIconMeta(feat, isDarkMode);
                    const isHighlight = feat.includes('SEE DANCE') || feat.includes('UNLIMITED') || feat.includes('Permanent') || feat.includes('4K');
                    return (
                      <div key={idx} className="flex items-start gap-2 group/feat">
                        <div
                          className={`w-4 h-4 rounded-md ${bg} flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 group-hover/feat:scale-110 shadow-sm`}
                        >
                          <FeatureIcon className={`w-2.5 h-2.5 ${color}`} />
                        </div>
                        <span
                          className={`leading-snug transition-colors duration-200 ${
                            isHighlight
                              ? isDarkMode
                                ? 'font-semibold text-white group-hover/feat:text-fuchsia-200'
                                : 'font-semibold text-slate-900 group-hover/feat:text-purple-700'
                              : isDarkMode
                                ? 'text-slate-300 group-hover/feat:text-white'
                                : 'text-slate-600 group-hover/feat:text-slate-900'
                          }`}
                        >
                          {feat}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Instant Delivery & Trust Guarantee Strip */}
                <div className={`mb-3 py-1.5 px-2.5 rounded-lg border flex items-center justify-between text-[9.5px] font-mono ${
                  isDarkMode
                    ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Instant Key Delivery</span>
                  </span>
                  <span className="font-bold">No Subscriptions</span>
                </div>

                {/* DIRECT GET UNLIMITED [DURATION] ACCESS BUTTON */}
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
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transform hover:scale-[1.01] active:scale-[0.98]"
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

        {/* Slim Security & Trust Guarantee Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: 0.45, delay: 0.25, ease: 'easeOut' }}
          className="mt-4 pt-3.5 sm:mt-5 sm:pt-4 border-t border-white/[0.07] [html.light-theme_&]:border-slate-200 max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {/* 1. Encrypted Payments */}
            <div className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all shadow-sm ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/[0.06] hover:border-emerald-500/30'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                <Lock className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between gap-1 text-[11px] sm:text-xs">
                <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  256-bit SSL Encrypted
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">Verified Gateways</span>
              </div>
            </div>

            {/* 2. Instant Access */}
            <div className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all shadow-sm ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/[0.06] hover:border-cyan-500/30'
                : 'bg-white border-slate-200 hover:border-cyan-300'
            }`}>
              <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center shrink-0">
                <Zap className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between gap-1 text-[11px] sm:text-xs">
                <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  Instant Automated Delivery
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">Real-time</span>
              </div>
            </div>

            {/* 3. 24/7 Support */}
            <div className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all shadow-sm ${
              isDarkMode
                ? 'bg-white/[0.02] border-white/[0.06] hover:border-fuchsia-500/30'
                : 'bg-white border-slate-200 hover:border-purple-300'
            }`}>
              <div className="w-6 h-6 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/25 flex items-center justify-center shrink-0">
                <Headphones className="w-3 h-3 text-fuchsia-400" />
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between gap-1 text-[11px] sm:text-xs">
                <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  24/7 Priority Support
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">AI Help Desk</span>
              </div>
            </div>
          </div>

          {/* Sponsored By Section Directly Below 24/7 Priority Support with Premium Fitted Border */}
          <div className="mt-3 sm:mt-4 p-[1.5px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-500/40 via-fuchsia-500/40 to-emerald-500/40 shadow-sm">
            <div className={`py-2 px-3 sm:px-4 rounded-[11px] sm:rounded-[15px] flex flex-col sm:flex-row items-center justify-between gap-2 ${
              isDarkMode ? 'bg-[#0d091e]/90' : 'bg-white'
            }`}>
              <div className="flex items-center gap-2 shrink-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <span className={`text-[10px] sm:text-xs font-mono font-black tracking-wider uppercase ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  SPONSORED BY:
                </span>
              </div>

              {/* Sponsor Badges: Hugging Face, ChatGPT, Astra (and NVIDIA) */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                {/* 1. Hugging Face */}
                <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/[0.05] border border-white/10 [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:border-slate-200">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 120 120" fill="none">
                    <circle cx="60" cy="60" r="54" fill="#FFD21E" />
                    <ellipse cx="44" cy="48" rx="6" ry="7" fill="#1F2937" />
                    <ellipse cx="76" cy="48" rx="6" ry="7" fill="#1F2937" />
                    <path d="M40 68c5 14 35 14 40 0" stroke="#1F2937" strokeWidth="6" strokeLinecap="round" fill="#E02424" />
                    <ellipse cx="32" cy="62" rx="6" ry="3.5" fill="#FF8A4C" opacity="0.8" />
                    <ellipse cx="88" cy="62" rx="6" ry="3.5" fill="#FF8A4C" opacity="0.8" />
                    <path d="M14 74c6-8 14-8 18-2s-2 16-8 16c-6 0-14-6-10-14z" fill="#FFA114" />
                    <path d="M106 74c-6-8-14-8-18-2s2 16 8 16c6 0 14-6 10-14z" fill="#FFA114" />
                  </svg>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Hugging Face
                  </span>
                </div>

                {/* 2. ChatGPT / OpenAI */}
                <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/[0.05] border border-white/10 [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:border-slate-200">
                  <svg className="w-3.5 h-3.5 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.66-4.1354a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1402-1.6564zm-1.0709-9.529a4.4755 4.4755 0 0 1 2.3465-1.9729V12.44a.7901.7901 0 0 0 .388.686l5.8144 3.3543-2.02 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7913a4.4944 4.4944 0 0 1-1.6276-6.0792zm16.597 3.8558L13.2838 9.2514l2.02-1.1636a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6768 8.1042v-5.6773a.79.79 0 0 0-.3975-.685zM8.334 11.2066l2.02-1.1636a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6768 8.1042v-5.6773a.79.79 0 0 0-.3975-.685zM12 14.7303l-3.0044-1.7342 3.0044-1.7343 3.0044 1.7343z"/>
                  </svg>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    ChatGPT
                  </span>
                </div>

                {/* 3. Astra (DataStax Astra AI / Astra) */}
                <div className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/[0.05] border border-white/10 [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:border-slate-200">
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-[8px] font-black text-white">
                    ✦
                  </div>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Astra
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
