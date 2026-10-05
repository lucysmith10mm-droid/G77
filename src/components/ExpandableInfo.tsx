import React, { useState } from 'react';
import { ChevronDown, FileText, HelpCircle, Shield, Layers, Cpu, Server, Zap } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  isDarkMode?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  icon,
  children,
  isOpen,
  onToggle,
  isDarkMode = true,
}) => {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 ${
        isDarkMode
          ? 'border-white/[0.08] bg-[#0A0D18]/70 hover:border-cyan-500/30'
          : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
              isDarkMode
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : 'bg-cyan-50 text-cyan-800 border-cyan-200'
            }`}
          >
            {icon}
          </div>
          <span
            className={`text-xs sm:text-sm font-semibold tracking-tight ${
              isDarkMode ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {title}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen
              ? isDarkMode
                ? 'rotate-180 text-cyan-400'
                : 'rotate-180 text-indigo-600'
              : 'text-slate-400'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`px-4 pb-4 text-xs leading-relaxed border-t pt-3 ${
            isDarkMode
              ? 'text-slate-300 border-white/[0.06]'
              : 'text-slate-700 border-slate-100'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface ExpandableInfoProps {
  isDarkMode?: boolean;
}

export const ExpandableInfo: React.FC<ExpandableInfoProps> = ({ isDarkMode = true }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <section className={`py-8 sm:py-12 border-t relative ${
      isDarkMode ? 'border-white/[0.08] bg-[#05070F]/50' : 'border-slate-200 bg-slate-50/60'
    }`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-2">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>Developer Documentation & Architecture</span>
          </div>
          <h3
            className={`text-base sm:text-xl font-bold tracking-tight mb-1.5 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Frontier AI Gateway Specifications &amp; FAQs
          </h3>
          <p
            className={`text-xs max-w-xl mx-auto ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Sub-15ms edge routing, verified international benchmarks, instant token provisioning, and enterprise 99.99% uptime guarantees.
          </p>
        </div>

        <div className="space-y-2">
          {/* 1. Architecture */}
          <AccordionItem
            title="Unified Multi-Model Gateway Architecture"
            icon={<Layers className="w-3.5 h-3.5" />}
            isOpen={openSection === 'architecture'}
            onToggle={() => toggle('architecture')}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-2">
              <p>
                The Frontier AI Gateway provides a standard, unified OpenAI-compatible REST and gRPC API endpoint for over 160+ state-of-the-art foundation models.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 [html.light-theme_&]:text-slate-600">
                <li><strong className="text-slate-200 [html.light-theme_&]:text-slate-900">Google Gemini 2.5 Pro & Flash:</strong> Up to 2,000,000 context tokens with multi-modal audio, video, code, and reasoning grounding.</li>
                <li><strong className="text-slate-200 [html.light-theme_&]:text-slate-900">OpenAI o3 & GPT-4o:</strong> Deep autonomous chain-of-thought mathematical reasoning and real-time multimodal intelligence.</li>
                <li><strong className="text-slate-200 [html.light-theme_&]:text-slate-900">Anthropic Claude 3.7 Sonnet:</strong> Hybrid reasoning with customizable reasoning token budgets and exceptional coding precision.</li>
                <li><strong className="text-slate-200 [html.light-theme_&]:text-slate-900">Open Weights Clusters:</strong> DeepSeek R1, Meta Llama 4, and Mistral Large with isolated zero-queue inference.</li>
              </ul>
            </div>
          </AccordionItem>

          {/* 2. How Deployment & API Keys Work */}
          <AccordionItem
            title="How Instant API Provisioning Works"
            icon={<HelpCircle className="w-3.5 h-3.5" />}
            isOpen={openSection === 'how-it-works'}
            onToggle={() => toggle('how-it-works')}
            isDarkMode={isDarkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className={`p-3 rounded-lg border ${
                isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[11px] flex items-center justify-center font-bold mb-2">
                  1
                </span>
                <p className={`font-semibold mb-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Select AI Model
                </p>
                <p className="text-slate-400 [html.light-theme_&]:text-slate-600">
                  Choose from 160+ models filtered by task, context size, latency, benchmark score, or developer.
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[11px] flex items-center justify-center font-bold mb-2">
                  2
                </span>
                <p className={`font-semibold mb-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Instant Provisioning or Cluster
                </p>
                <p className="text-slate-400 [html.light-theme_&]:text-slate-600">
                  Provision an instant developer test key or launch a high-throughput production GPU cluster in 1 click.
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[11px] flex items-center justify-center font-bold mb-2">
                  3
                </span>
                <p className={`font-semibold mb-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Sub-15ms Edge Routing
                </p>
                <p className="text-slate-400 [html.light-theme_&]:text-slate-600">
                  Requests route through our global CDN edge mesh to the geographically closest GPU cluster with zero queuing delay.
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${
                isDarkMode ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="w-5 h-5 rounded-md bg-fuchsia-500/20 text-fuchsia-300 font-mono text-[11px] flex items-center justify-center font-bold mb-2">
                  4
                </span>
                <p className={`font-semibold mb-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Drop-in Code Quickstart
                </p>
                <p className="text-slate-400 [html.light-theme_&]:text-slate-600">
                  Ready-to-run code snippets in Python, TypeScript, and cURL with streaming response support.
                </p>
              </div>
            </div>
          </AccordionItem>

          {/* 3. Security & SLA */}
          <AccordionItem
            title="Enterprise Security & SLA Guarantees"
            icon={<Shield className="w-3.5 h-3.5" />}
            isOpen={openSection === 'security'}
            onToggle={() => toggle('security')}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-2">
              <p>
                All data transmission is encrypted in-transit using TLS 1.3 and at-rest using AES-256. Customer prompts and completions are strictly confidential and never used to train or fine-tune public foundation models.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 [html.light-theme_&]:text-slate-600">
                <li><strong className="text-slate-200 [html.light-theme_&]:text-slate-900">Zero Retention Option:</strong> Enterprise customers can enforce zero-data logging policies.</li>
                <li><strong className="text-slate-200 [html.light-theme_&]:text-slate-900">99.99% Guaranteed SLA:</strong> Multi-region automatic failover ensures continuous uptime for mission-critical applications.</li>
                <li><strong className="text-slate-200 [html.light-theme_&]:text-slate-900">Firebase & Google Cloud:</strong> Backed by Google Cloud Platform infrastructure and secure Firebase Authentication.</li>
              </ul>
            </div>
          </AccordionItem>
        </div>
      </div>
    </section>
  );
};
