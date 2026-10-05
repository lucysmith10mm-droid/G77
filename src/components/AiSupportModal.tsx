import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Cpu
} from 'lucide-react';
import { LanguageCode, getTranslation } from '../lib/translations';

interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  currentLang?: LanguageCode;
}

export const AiSupportModal: React.FC<AiSupportModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  currentLang = 'en',
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'assistant',
      text: 'Hello! I am your 24/7 Frontier AI Assistant. Ask me anything about our 160+ foundation models (Gemini 2.5, OpenAI o3, Claude 3.7), sub-15ms edge routing, API tokens, or cluster deployments.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const copyEmail = () => {
    navigator.clipboard.writeText('support@frontier-ai.net');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getSmartReply = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('gemini') || q.includes('google')) {
      return 'Google Gemini 2.5 Pro offers an industry-leading 2,000,000 token context window with native multimodal reasoning (video, audio, text, and code) at $1.25 / 1M tokens with sub-15ms edge latency.';
    }
    if (q.includes('o3') || q.includes('openai') || q.includes('gpt')) {
      return 'OpenAI o3 & o3-mini are frontier autonomous reasoning models trained with reinforcement learning for complex multi-step coding, mathematics, and autonomous agent workflows.';
    }
    if (q.includes('claude') || q.includes('anthropic')) {
      return 'Anthropic Claude 3.7 Sonnet introduces hybrid thinking mode, allowing you to fine-tune the reasoning budget per request for maximum precision in software engineering.';
    }
    if (q.includes('deepseek') || q.includes('llama') || q.includes('open')) {
      return 'We host DeepSeek R1 and Meta Llama 4 Preview across dedicated GPU clusters with zero queueing latency and full open-weights transparency.';
    }
    if (q.includes('price') || q.includes('cost') || q.includes('rate') || q.includes('token')) {
      return 'Inference pricing is billed transparently per 1M tokens with zero hidden fees. You can generate a free Sandbox API Key or deploy production keys starting at $10 Starter, $50 Pro, or $200 Dedicated GPU cluster.';
    }
    if (q.includes('harish') || q.includes('email') || q.includes('contact') || q.includes('support') || q.includes('help')) {
      return 'You can contact our Engineering Team directly at support@frontier-ai.net for custom enterprise billing, dedicated GPU clusters, or direct technical support.';
    }
    if (q.includes('hindi') || q.includes('kaise') || q.includes('kya')) {
      return 'Frontier AI मार्केटप्लेस में आप 160 से अधिक AI मॉडल्स को सीधे टेस्ट कर सकते हैं और API key प्राप्त कर सकते हैं। किसी भी सहायता या एंटरप्राइज क्लस्टर के लिए support@frontier-ai.net पर संपर्क करें।';
    }

    return `Thank you for asking! Frontier AI provides a unified OpenAI-compatible endpoint across 160+ live models. You can test any model in the catalog or reach our lead team at support@frontier-ai.net.`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMessage: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      // First attempt local smart inference
      await new Promise((resolve) => setTimeout(resolve, 600));
      const reply = getSmartReply(text);

      const assistantMessage: AiChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const fallbackMsg: AiChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Direct assistance is always available. Please email our Engineering Team at support@frontier-ai.net.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    'Gemini 2.5 Pro vs OpenAI o3?',
    'How does edge latency work?',
    'What are the API tier prices?',
    'Contact Engineering Support (support@frontier-ai.net)',
  ];

  if (!isOpen) return null;

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

        {/* Chat Window Container: Constrained to screen, clean internal scrolling */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl z-10 border ${
            isDarkMode
              ? 'bg-[#0B0F19] border-cyan-500/35 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-white'
              : 'bg-white border-slate-300 shadow-2xl text-slate-900'
          }`}
        >
          {/* Top Neon Accent Stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 shrink-0" />

          {/* Modal Header */}
          <div
            className={`p-3.5 sm:p-4 border-b shrink-0 flex items-center justify-between gap-3 ${
              isDarkMode ? 'border-white/[0.08] bg-[#0B0F19]' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight truncate">
                    Frontier AI Assistant
                  </h3>
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className={`text-[11px] truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  24/7 Model &amp; API Architecture Support
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body: Scrollable */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${
            isDarkMode ? 'bg-[#070A14]' : 'bg-slate-50/70'
          }`}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 text-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                      : isDarkMode
                      ? 'bg-[#0E1322] border border-white/10 text-slate-200 rounded-tl-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9.5px] mt-1 font-mono ${
                      m.sender === 'user'
                        ? 'text-cyan-100 text-right'
                        : isDarkMode
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs flex items-center gap-1.5 ${
                    isDarkMode ? 'bg-[#0E1322] text-slate-300' : 'bg-white text-slate-700 shadow-sm'
                  }`}
                >
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div
            className={`p-2.5 border-t shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
              isDarkMode ? 'border-white/[0.06] bg-[#0B0F19]' : 'border-slate-200 bg-white'
            }`}
          >
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className={`text-[10.5px] px-2.5 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Direct Gmail Support Card strip */}
          <div
            className={`px-3 py-2 border-t shrink-0 flex items-center justify-between gap-2 text-xs ${
              isDarkMode ? 'bg-cyan-950/20 border-cyan-500/20' : 'bg-indigo-50/70 border-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className={`text-[11px] truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Need human assistance? <strong className="text-cyan-400 font-semibold">Official Gmail Support</strong>
              </span>
            </div>

            <a
              href="mailto:support@frontier-ai.net?subject=Frontier%20AI%20Support%20Request"
              className="p-1 px-2.5 rounded text-[10.5px] font-semibold bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white flex items-center gap-1 cursor-pointer shadow-sm shrink-0"
              title="Open in native mail app"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Direct Message</span>
            </a>
          </div>

          {/* Chat Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`p-3 border-t shrink-0 flex items-center gap-2 ${
              isDarkMode ? 'border-white/[0.08] bg-[#0B0F19]' : 'border-slate-200 bg-white'
            }`}
          >
            <input
              type="text"
              placeholder="Ask anything about 160+ models or API..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none transition-colors ${
                isDarkMode
                  ? 'bg-[#05070F] border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
              }`}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 px-3.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 cursor-pointer disabled:opacity-40 transition-opacity flex items-center gap-1.5 shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
