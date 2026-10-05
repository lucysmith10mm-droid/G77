import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Send,
  Zap,
  Sparkles,
  Languages,
  Headphones
} from 'lucide-react';

interface VoiceSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const VoiceSupportModal: React.FC<VoiceSupportModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [languageMode, setLanguageMode] = useState<'hi' | 'en'>('hi');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'assistant'; text: string; time: string }[]
  >([
    {
      sender: 'assistant',
      text: 'नमस्ते! मैं आपका AI वॉयस सपोर्ट असिस्टेंट हूँ। आप बोलकर या लिखकर किसी भी AI मॉडल, कीमत ($5 / $400), या API डिप्लॉयमेंट के बारे में पूछ सकते हैं। Hello! Speak or type any query regarding 160+ live models or passes.',
      time: 'अभी',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = languageMode === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          handleUserQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [transcript, languageMode]);

  // Answer resolution logic in Hindi and English
  const resolveAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('deploy') || q.includes('api key') || q.includes('खरीद') || q.includes('buy') || q.includes('शुरू')) {
      return languageMode === 'hi'
        ? 'किसी भी AI मॉडल को डिप्लॉय करने के लिए मॉडल कार्ड पर "Deploy" बटन दबाएं। आपको तुरंत पायथन, टाइपस्क्रिप्ट या cURL कोड स्निपेट और लाइव API Key मिल जाएगी। आप $5 के स्टार्टर या $400 के लाइफटाइम पास से भी अनलिमिटेड एक्सेस पा सकते हैं।'
        : 'To deploy any model, click "Deploy" on its card. You will instantly get Python, TypeScript, and cURL snippets along with your API Key provisioning. You can also get uncapped generations via the $5 Starter or $400 Lifetime Pass.';
    }
    if (q.includes('gemini') || q.includes('google')) {
      return languageMode === 'hi'
        ? 'Google Gemini 2.5 Pro में 20 लाख (2 Million) टोकन का सबसे बड़ा कॉन्टेक्स्ट विंडो है, जो वीडियो, ऑडियो और लंबे दस्तावेज़ों को आसानी से समझता है। वहीं Gemini 2.5 Flash सिर्फ $0.15 प्रति 1M टोकन पर सुपरफास्ट स्पीड देता है।'
        : 'Google Gemini 2.5 Pro offers an unmatched 2,000,000 token context window with native multimodal video processing, while Gemini 2.5 Flash delivers ultra-fast throughput at just $0.15 per 1M tokens.';
    }
    if (q.includes('code') || q.includes('coding') || q.includes('प्रोग्रामिंग') || q.includes('कोड')) {
      return languageMode === 'hi'
        ? 'कोडिंग के लिए Claude 3.5 Sonnet और Qwen 2.5 Coder 32B सबसे बेहतरीन हैं। Claude फुल-स्टैक कोड और आर्किटेक्चर में लीडर है, जबकि Qwen 2.5 Coder ओपन-सोर्स में सबसे किफायती और तेज़ है।'
        : 'For programming, Claude 3.5 Sonnet and Qwen 2.5 Coder 32B are global leaders. Claude excels at full-stack app architecture, while Qwen 2.5 Coder provides open-weights speed with zero licensing hurdles.';
    }
    if (q.includes('lifetime') || q.includes('400') || q.includes('लाइफटाइम') || q.includes('पास') || q.includes('price') || q.includes('pricing')) {
      return languageMode === 'hi'
        ? 'हमारा $400 का Lifetime Unlimited Pass एक बार के भुगतान में हमेशा के लिए वैध है। इसमें कोई मंथली सब्सक्रिप्शन नहीं है और SEE DANCE 2.5 4K 60FPS वीडियो डिफ्यूजन और भविष्य के सभी AI मॉडल्स का अनलिमिटेड एक्सेस शामिल है।'
        : 'Our Lifetime Unlimited Plan is a one-time payment of $400 with zero monthly recurring charges. You get permanent, uncapped generations for SEE DANCE 2.5 4K 60FPS video models and future AI updates!';
    }
    if (q.includes('deepseek') || q.includes('r1') || q.includes('reasoning') || q.includes('रीज़निंग')) {
      return languageMode === 'hi'
        ? 'DeepSeek R1 दुनिया का सबसे शक्तिशाली ओपन-सोर्स रीज़निंग मॉडल है। यह गणित और पीएचडी-लेवल लॉजिक में OpenAI o3 के बराबर 97.3% स्कोर करता है और इसका लाइसेंस MIT ओपन-सोर्स है।'
        : 'DeepSeek R1 and OpenAI o3 are our top frontier reasoning models. DeepSeek R1 provides open-weights reinforcement learning cognitive chains with 97.3% accuracy on MATH-500.';
    }
    if (q.includes('video') || q.includes('dance') || q.includes('4k') || q.includes('सीडांस') || q.includes('वीडियो')) {
      return languageMode === 'hi'
        ? 'SEE DANCE 2.5 Ultra 4K UHD (3840×2160) रेजोल्यूशन में 60 FPS की फ्लूइड वीडियो बनाता है। आप हमारे वीडियो वर्कफ़्लो सेक्शन में इसका लाइव 3D आर्किटेक्चर देख सकते हैं।'
        : 'SEE DANCE 2.5 generates photorealistic 4K UHD 60FPS cinematic video with zero temporal distortion. You can test it via our Video Diffusion section.';
    }

    return languageMode === 'hi'
      ? `मैंने आपका प्रश्न समझा: "${query}"। आप 160+ लाइव मॉडल्स में से किसी को भी तुरंत टेस्ट व डिप्लॉय कर सकते हैं। क्या आप किसी विशिष्ट मॉडल की तुलना या कीमत जानना चाहते हैं?`
      : `I received your question: "${query}". You can deploy any of our 160+ models directly with instant API keys, or explore the side-by-side comparison matrix. How else can I assist your workflow today?`;
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = languageMode === 'hi' ? 'hi-IN' : 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUserQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: queryText,
      time: 'अभी',
    };

    const answer = resolveAnswer(queryText);

    const botMsg = {
      sender: 'assistant' as const,
      text: answer,
      time: 'अभी',
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setTranscript('');
    setInputText('');
    speakText(answer);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Speech start error:', e);
      }
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            stopSpeaking();
            onClose();
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-xl rounded-2xl ${
            isDarkMode
              ? 'bg-[#0B0F19] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.3)] text-white'
              : 'bg-white border border-slate-300 shadow-2xl text-slate-900'
          } overflow-hidden z-10 flex flex-col max-h-[85vh]`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#0B0F19]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0B0F19] animate-ping" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <span>AI Voice Support Assistant</span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                    Live Audio
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  बोलकर या लिखकर समाधान पाएं · Speak or listen in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Switch */}
              <button
                onClick={() => setLanguageMode(languageMode === 'hi' ? 'en' : 'hi')}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-cyan-300 border border-cyan-500/30 cursor-pointer flex items-center gap-1"
                title="Change Voice Language"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{languageMode === 'hi' ? 'हिंदी' : 'EN'}</span>
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  title="Mute voice output"
                  className="p-2 rounded-xl text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 cursor-pointer transition-colors"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => {
                  stopSpeaking();
                  onClose();
                }}
                className={`p-2 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer ${
                  isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3.5 scrollbar-thin">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}
                <div
                  className={`max-w-[84%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                      : isDarkMode
                      ? 'bg-[#05070F] text-slate-200 border border-white/10 rounded-tl-none shadow-sm'
                      : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Listening Visualizer */}
            {isListening && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>सुन रहा हूँ... {transcript ? `"${transcript}"` : 'कृपया बोलें...'}</span>
              </div>
            )}
          </div>

          {/* Quick Preset Questions */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#05070F]/50 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <span className="text-slate-500 font-mono shrink-0">सुझाव:</span>
            <button
              onClick={() => handleUserQuery('मॉडल को कैसे डिप्लॉय करें?')}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              डिप्लॉय कैसे करें?
            </button>
            <button
              onClick={() => handleUserQuery('कोडिंग के लिए कौन सा मॉडल बेस्ट है?')}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              कोडिंग के लिए बेस्ट?
            </button>
            <button
              onClick={() => handleUserQuery('$400 के Lifetime Plan की जानकारी')}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              $400 लाइफटाइम पास?
            </button>
            <button
              onClick={() => handleUserQuery('Gemini 2.5 vs DeepSeek R1')}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              Gemini vs DeepSeek
            </button>
          </div>

          {/* Input Controls: Microphone and Text Entry */}
          <div className="p-4 border-t border-white/[0.08] bg-[#0B0F19] flex items-center gap-2.5">
            {/* Primary Microphone Trigger Button */}
            <button
              onClick={toggleListening}
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-lg ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/40 ring-4 ring-rose-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/25'
              }`}
              title={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Fallback */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserQuery(inputText);
              }}
              className="flex-1 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={isListening ? 'आवाज़ रिकॉर्ड हो रही है...' : 'बोलें या यहाँ टाइप करें...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 py-2.5 px-3.5 rounded-xl text-xs bg-[#05070F] border border-white/10 text-white outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="py-2.5 px-3.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
