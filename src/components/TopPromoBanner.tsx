import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Flame } from 'lucide-react';

interface TopPromoBannerProps {
  onOpenOffer: () => void;
  isDarkMode?: boolean;
}

export const TopPromoBanner: React.FC<TopPromoBannerProps> = ({
  onOpenOffer,
  isDarkMode = true,
}) => {
  return (
    <div
      onClick={onOpenOffer}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpenOffer();
        }
      }}
      className="relative overflow-hidden cursor-pointer select-none bg-gradient-to-r from-violet-950 via-indigo-900 to-rose-950 border-b border-rose-500/30 text-white z-40 transition-all hover:brightness-110 group"
    >
      {/* Animated shimmer light effect sliding across the banner */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />

      {/* Subtle background glow */}
      <div className="absolute -top-10 left-1/4 w-40 h-20 bg-rose-500/20 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-40 h-20 bg-cyan-500/20 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 text-xs">
        {/* Left Side: Pulsing Flame/Flash Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-400/50 shadow-sm animate-pulse">
            <Flame className="w-3 h-3 text-rose-400 fill-rose-400 shrink-0" />
            <span>FLASH OFFER</span>
          </span>
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
        </div>

        {/* Center: Main Animated Offer Headline */}
        <div className="flex-1 text-center min-w-0">
          <div className="flex items-center justify-center gap-2 sm:gap-3 truncate">
            <span className="font-extrabold tracking-tight text-white sm:text-sm truncate">
              Get <span className="text-cyan-300 underline decoration-cyan-400 decoration-2 underline-offset-2">SEE DANCE 2.5</span> for 30 Days
            </span>
            <span className="inline-flex items-center font-mono font-black text-[11px] sm:text-xs text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-400/40 shrink-0 shadow-inner">
              ONLY $5 (₹420)
            </span>
            <span className="text-slate-300 text-xs hidden lg:inline font-medium truncate">
              • Unlimited 4K AI Video Diffusion • Zero Queue Access
            </span>
          </div>
        </div>

        {/* Right Side: CTA Button with arrow */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-rose-600 to-indigo-600 group-hover:from-rose-500 group-hover:to-indigo-500 shadow-sm flex items-center gap-1 border border-white/20 transition-all group-hover:scale-105">
            <Zap className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />
            <span className="whitespace-nowrap">Claim Pass</span>
            <ArrowRight className="w-3 h-3 text-cyan-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};
