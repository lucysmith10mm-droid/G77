import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { AiWorkflow3DCanvas } from './AiWorkflow3DCanvas';

export const AiWorkflowDiagram: React.FC = () => {
  return (
    <section id="ai-workflow" className="pt-2 pb-8 sm:pb-12 relative w-full max-w-full overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Prominent Official Payment Logos Trust Strip (PayPal, Stripe, Wise, Crypto) - Screen Fitted */}
        <div className="w-full max-w-5xl mx-auto mb-4 sm:mb-6 px-1">
          <div className="rounded-2xl bg-[#0f0b24]/90 [html.light-theme_&]:bg-white border border-white/10 [html.light-theme_&]:border-slate-200 p-2.5 sm:p-3.5 shadow-lg backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-slate-300 [html.light-theme_&]:text-slate-700">
                  Official Instant Payment Methods
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-mono text-emerald-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>256-Bit SSL Encrypted</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-cyan-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Instant Auto-Dispatch</span>
                </span>
              </div>
            </div>

            {/* 4 Large, Clear Payment Brand Badges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* 1. PayPal */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/10 [html.light-theme_&]:border-slate-200 transition-all shadow-sm group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#003087]/20 [html.light-theme_&]:bg-sky-50 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.784.784 0 0 1 .773-.646h6.732c3.784 0 6.47 1.838 5.753 5.922-.647 3.684-3.13 5.617-6.52 5.617H9.288a.785.785 0 0 0-.773.646l-1.439 6.078z" fill="#003087"/>
                    <path d="M9.288 14.613h2.394c3.39 0 5.873-1.933 6.52-5.617.717-4.084-1.969-5.922-5.753-5.922H5.717a.784.784 0 0 0-.773.646L2.835 16.924a.64.64 0 0 0 .633.739h3.766l.827-3.488a.785.785 0 0 1 .773-.646l.454.084z" fill="#0079C1" opacity="0.9"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white [html.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>PayPal</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hidden min-[380px]:inline">Fast</span>
                  </div>
                  <p className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-600 truncate">1-Click Checkout</p>
                </div>
              </div>

              {/* 2. Stripe */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/10 [html.light-theme_&]:border-slate-200 transition-all shadow-sm group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#635BFF]/20 [html.light-theme_&]:bg-indigo-50 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="6" fill="#635BFF"/>
                    <path d="M14.6 13.8c0-.9.8-1.3 2-1.3 1.8 0 3.7.6 5.1 1.4v-4.1c-1.6-.7-3.4-1-5.1-1-4.4 0-7.3 2.3-7.3 6.2 0 6 8.3 5.1 8.3 7.7 0 1.1-1 1.5-2.3 1.5-2 0-4.3-.8-6-1.9v4.2c1.9.9 4 1.3 6 1.3 4.6 0 7.7-2.3 7.7-6.3 0-6.4-8.4-5.3-8.4-7.7z" fill="#fff"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white [html.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Stripe</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden min-[380px]:inline">Cards</span>
                  </div>
                  <p className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-600 truncate">Visa / Mastercard</p>
                </div>
              </div>

              {/* 3. Wise */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/10 [html.light-theme_&]:border-slate-200 transition-all shadow-sm group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#9FE870]/20 [html.light-theme_&]:bg-emerald-50 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="5" fill="#9FE870"/>
                    <path d="M5.5 16.5l3.5-9h4l-2.2 4.5h4.2l-5.5 8h-2l1.5-3.5H5.5z" fill="#163300"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white [html.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Wise</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden min-[380px]:inline">Bank</span>
                  </div>
                  <p className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-600 truncate">Global Transfer</p>
                </div>
              </div>

              {/* 4. Crypto */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/10 [html.light-theme_&]:border-slate-200 transition-all shadow-sm group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 [html.light-theme_&]:bg-amber-50 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                  ₿
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white [html.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Crypto</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden min-[380px]:inline">Web3</span>
                  </div>
                  <p className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-600 truncate">BTC & Tether USDT</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Official AI Workflow 3D Engine Header */}
        <div className="w-full max-w-5xl mx-auto mb-3 sm:mb-4 px-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-fuchsia-500" />
            </span>
            <span className="text-xs sm:text-sm font-mono font-extrabold uppercase tracking-wider text-slate-100 [html.light-theme_&]:text-slate-900 flex items-center gap-1.5">
              <span>AI Workflow 3D Engine</span>
              <span className="text-slate-500 [html.light-theme_&]:text-slate-400 hidden min-[480px]:inline">&bull;</span>
              <span className="text-cyan-400 font-semibold hidden min-[480px]:inline">Holographic Particle Lab</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 rounded-full shadow-sm">
              18K Particle Morphing
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-fuchsia-300 bg-fuchsia-500/15 border border-fuchsia-500/30 px-2.5 py-1 rounded-full hidden sm:inline shadow-sm">
              Interactive 3D
            </span>
          </div>
        </div>

        {/* Upgraded Interactive 3D Glowing Particle Creative Sculptures */}
        <div className="w-full max-w-5xl mx-auto">
          <AiWorkflow3DCanvas />
        </div>

      </div>
    </section>
  );
};
