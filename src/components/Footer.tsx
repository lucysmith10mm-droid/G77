import React, { useRef } from 'react';
import { ShieldCheck, Server, Globe2, Sparkles, Cpu, Layers, ExternalLink } from 'lucide-react';
import { FrontierLogo } from './FrontierLogo';

interface FooterProps {
  onSecretTrigger?: () => void;
  isDarkMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onSecretTrigger, isDarkMode = true }) => {
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<any>(null);

  const handleDiscreetClick = () => {
    clickCountRef.current += 1;
    clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (onSecretTrigger) onSecretTrigger();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1000);
    }
  };

  return (
    <footer className={`border-t transition-colors duration-200 ${
      isDarkMode
        ? 'bg-[#03050B] border-white/[0.08] text-slate-400'
        : 'bg-white border-slate-200 text-slate-600'
    } pt-12 pb-8 w-full max-w-full overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main 4-Column Explore Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Column 1: Brand Info & Mission (Takes 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="cursor-default select-none inline-block" onClick={handleDiscreetClick}>
              <FrontierLogo size="md" isDarkMode={isDarkMode} />
            </div>
            <p className="text-xs sm:text-sm leading-relaxed max-w-sm text-slate-400 [html.light-theme_&]:text-slate-600">
              The premier unified marketplace for 2026 frontier AI intelligence. Access over 160+ live foundation models with sub-15ms edge routing, dedicated GPU clusters, and enterprise security.
            </p>
            <div className="flex items-center gap-3 text-xs font-mono text-emerald-400 [html.light-theme_&]:text-emerald-700">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>160 Live Models Active · Global Edge Mesh</span>
            </div>
          </div>

          {/* Column 2: Frontier Intelligence */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white [html.light-theme_&]:text-slate-900 mb-3.5">
              Frontier Models
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Google Gemini 2.5 Pro (2M)
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  OpenAI o3 & o3-mini
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Anthropic Claude 3.7 Sonnet
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  DeepSeek R1 (Open Weights)
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Meta Llama 4 Preview 400B
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Mistral Large & Pixtral 12B
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Capabilities & Tasks */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white [html.light-theme_&]:text-slate-900 mb-3.5">
              Capabilities
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Advanced Reasoning & Math
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Full-Stack Code Generation
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Multimodal Video & Vision
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Real-Time Voice Streaming
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Long-Context Synthesis (2M)
                </a>
              </li>
              <li>
                <a href="#models-marketplace" className="hover:text-cyan-400 transition-colors">
                  Autonomous Agent Tooling
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Infrastructure & Security */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white [html.light-theme_&]:text-slate-900 mb-3.5">
              Infrastructure
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Google Cloud Platform</span>
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Firebase Authentication</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Sub-15ms Edge Latency</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>99.99% Enterprise SLA</span>
              </li>
              <li className="text-[11px] text-slate-500 pt-1">
                Zero Cold Start Architecture
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip: Copyright & Trust Badges */}
        <div className="pt-6 border-t border-white/[0.06] [html.light-theme_&]:border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="text-slate-500 [html.light-theme_&]:text-slate-600">
            © 2026 Frontier AI Marketplace. Unified Intelligence Architecture. All rights reserved.
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 [html.light-theme_&]:text-slate-600">
            <span className="flex items-center gap-1 text-emerald-400 [html.light-theme_&]:text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>256-Bit SSL Encrypted</span>
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span>REST & gRPC APIs</span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span>Live Firestore Link</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
