import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Menu,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  Cloud,
  CheckCircle2,
  Mail,
  Lock,
  Scale,
  Key,
  Bot,
  Copy,
  Check,
  ExternalLink,
  Globe2,
  MessageSquare,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  AppUser,
  getStoredTempUser,
  performTemporaryLogin,
  performSignOut
} from '../lib/tempAuth';
import { generate4CharCaptcha, validateCaptcha } from '../lib/captcha';
import { LanguageCode, SUPPORTED_LANGUAGES, getTranslation } from '../lib/translations';

interface NavigationMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollToModels: () => void;
  onOpenDeployModal: () => void;
  onOpenAiChat: () => void;
  onOpenDirectMessage: () => void;
  isDarkMode?: boolean;
  currentLang?: LanguageCode;
  onSelectLang?: (lang: LanguageCode) => void;
}

export const NavigationMenuDrawer: React.FC<NavigationMenuDrawerProps> = ({
  isOpen,
  onClose,
  onScrollToModels,
  onOpenDeployModal,
  onOpenAiChat,
  onOpenDirectMessage,
  isDarkMode = true,
  currentLang = 'en',
  onSelectLang,
}) => {
  const [currentUser, setCurrentUser] = useState<AppUser | FirebaseUser | null>(() => getStoredTempUser());
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Initialize or reset 4-char captcha code when drawer opens
  useEffect(() => {
    if (isOpen) {
      setCaptchaCode(generate4CharCaptcha());
      setUserCaptcha('');
      setAuthError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // 1. Initial stored user check
    const stored = getStoredTempUser();
    if (stored) {
      setCurrentUser(stored);
    }

    // 2. Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        const temp = getStoredTempUser();
        setCurrentUser(temp);
      }
    });

    // 3. React to temporary login / logout events across the app
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppUser | null>;
      if (customEvent.detail) {
        setCurrentUser(customEvent.detail);
      } else {
        setCurrentUser(auth.currentUser);
      }
    };

    window.addEventListener('frontier_auth_changed', handleAuthChange);

    return () => {
      unsubscribe();
      window.removeEventListener('frontier_auth_changed', handleAuthChange);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthLoading(true);
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
      setAuthSuccess('Signed in with Google!');
      setTimeout(() => setAuthSuccess(null), 2000);
    } catch (err: any) {
      console.warn('Google sign-in notice:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Google sign-in window was closed. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Popup blocked by browser. Please allow popups for this site.');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError('Domain not yet authorized in Firebase Console settings.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Temporary Login (NO OTP, only Name, Gmail, Password, 4-Char Captcha)
  const handleTempLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!name.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please enter a valid Gmail / Email address.');
      return;
    }
    if (!password.trim() || password.length < 3) {
      setAuthError('Please enter a password (minimum 3 characters).');
      return;
    }

    // 4-Character Captcha Verification
    if (!userCaptcha.trim()) {
      setAuthError('Please enter the 4-character captcha code.');
      return;
    }
    if (!validateCaptcha(userCaptcha, captchaCode)) {
      setAuthError('Invalid captcha code. A new code has been generated.');
      setCaptchaCode(generate4CharCaptcha());
      setUserCaptcha('');
      return;
    }

    setIsAuthLoading(true);
    try {
      const res = await performTemporaryLogin(name, email, password);
      setAuthSuccess(`Logged in as ${res.user.displayName}!`);
      setTimeout(() => setAuthSuccess(null), 2500);
    } catch (err: any) {
      console.warn('Temp login error in drawer:', err);
      setAuthError(err.message || 'Login failed.');
      setCaptchaCode(generate4CharCaptcha());
      setUserCaptcha('');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await performSignOut();
      setCurrentUser(null);
      setName('');
      setEmail('');
      setPassword('');
      setUserCaptcha('');
      setAuthSuccess('Signed out successfully.');
      setTimeout(() => setAuthSuccess(null), 2000);
    } catch (err) {
      console.warn('Sign-out error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Sliding Drawer from Right: Fixed max-w-md, clean scroll, no overflow */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className={`relative w-full max-w-md h-full overflow-y-auto ${
            isDarkMode
              ? 'bg-[#0B0F19] border-l border-white/10 text-white'
              : 'bg-white border-l border-slate-200 text-slate-900'
          } shadow-2xl z-10 flex flex-col justify-between`}
        >
          {/* Header: Compact, tight padding */}
          <div
            className={`p-4 border-b shrink-0 flex items-center justify-between ${
              isDarkMode ? 'border-white/[0.08] bg-[#0B0F19]' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Menu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">
                  {getTranslation(currentLang, 'platformMenu')}
                </h3>
                <p className={`text-[11px] font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Google Cloud &amp; Firebase Connected
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content Body: Scrollable, reduced spacing */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Language Selector Strip inside Menu */}
            {onSelectLang && (
              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-[#05070F] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 font-mono">
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>Select Language / भाषा चुनें</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    Default: English
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => onSelectLang(l.code)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        currentLang === l.code
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400 font-bold shadow-sm'
                          : isDarkMode
                          ? 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm">{l.flag}</span>
                      <span className="text-[11px] truncate font-medium">{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Google Cloud & Firebase Authentication Box */}
            <div
              className={`p-3.5 rounded-xl border ${
                isDarkMode ? 'bg-[#05070F] border-cyan-500/30' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-cyan-400">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Google Cloud &amp; Firebase</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono">
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Secure Connection</span>
                  </div>
                  {currentUser && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {getTranslation(currentLang, 'activeSession')}
                    </span>
                  )}
                </div>
              </div>

              {currentUser ? (
                /* Authenticated User Profile */
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white uppercase text-xs shadow-md shrink-0">
                      {currentUser.displayName
                        ? currentUser.displayName[0]
                        : currentUser.email
                        ? currentUser.email[0]
                        : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">
                        {currentUser.displayName || 'Authorized Developer'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {currentUser.email}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-white/10">
                    <div className="text-slate-400">Database Link:</div>
                    <div className="text-right text-cyan-300 truncate">Firestore Live</div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{getTranslation(currentLang, 'signOut')}</span>
                  </button>
                </div>
              ) : (
                /* Login / Sign-up Forms */
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {getTranslation(currentLang, 'accountDesc')}
                  </p>

                  {/* One-Click Google Sign In */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isAuthLoading}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{getTranslation(currentLang, 'continueGoogle')}</span>
                  </button>

                  <div className="flex items-center gap-2 my-1 text-slate-500 text-[10px] uppercase font-mono">
                    <div className="flex-1 h-px bg-white/10" />
                    <span>{getTranslation(currentLang, 'orEmail')}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Temporary Login Form (Name, Gmail, Password, 4-Char Captcha - NO OTP) */}
                  <form onSubmit={handleTempLoginSubmit} className="space-y-2.5">
                    <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Direct Developer Sign In</span>
                    </div>

                    {/* Name */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Harish Singh"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs border outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                        }`}
                      />
                    </div>

                    {/* Gmail */}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="Gmail / Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs border outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                        }`}
                      />
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Password (minimum 3 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={`w-full pl-9 pr-3 py-2 rounded-lg text-xs border outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                        }`}
                      />
                    </div>

                    {/* 4-Character Captcha Code */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          4-Digit Captcha Code
                        </span>
                        <span className="text-[9px] font-mono text-cyan-400">Case-Insensitive</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="relative px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/40 select-none flex items-center justify-center min-w-[85px] shadow-inner overflow-hidden">
                          <span className="font-mono text-sm font-black tracking-[0.25em] text-cyan-300">
                            {captchaCode || '....'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCaptchaCode(generate4CharCaptcha());
                            setUserCaptcha('');
                          }}
                          className="p-2 rounded-lg border border-white/10 hover:border-cyan-400/40 hover:bg-white/5 transition-all text-slate-400 hover:text-cyan-300 cursor-pointer shrink-0"
                          title="Refresh Captcha Code"
                          aria-label="Refresh Captcha"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative flex-1">
                          <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="Enter code"
                            value={userCaptcha}
                            onChange={(e) => setUserCaptcha(e.target.value.toUpperCase())}
                            required
                            className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg text-xs font-mono tracking-widest uppercase font-bold border outline-none transition-colors ${
                              isDarkMode
                                ? 'bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {authError && (
                      <p className="text-[11px] text-rose-400 leading-tight">{authError}</p>
                    )}

                    {authSuccess && (
                      <p className="text-[11px] text-emerald-400 leading-tight">{authSuccess}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-rose-600 hover:from-cyan-500 hover:to-rose-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white shrink-0" />
                      <span>{isAuthLoading ? 'Signing In...' : 'Sign In • Direct Access'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Quick Navigation Directory */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 px-1">
                Fast Shortcuts
              </div>

              <button
                onClick={() => {
                  onClose();
                  onScrollToModels();
                }}
                className="w-full p-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors flex items-center justify-between text-left cursor-pointer border border-transparent hover:border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>160+ Frontier AI Models</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded">
                  160 Active
                </span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenDeployModal();
                }}
                className="w-full p-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors flex items-center justify-between text-left cursor-pointer border border-transparent hover:border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>Instant API Key Provisioning</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                  Instant
                </span>
              </button>
            </div>

            {/* BOTTOM SECTION: AI CHAT SUPPORT & GMAIL SUPPORT (Requested by user) */}
            <div className="pt-2 border-t border-white/[0.08] space-y-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>Support Channels</span>
                <span className="text-emerald-400">Online</span>
              </div>

              {/* 1. AI Chat Support Button */}
              <button
                onClick={() => {
                  onClose();
                  onOpenAiChat();
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/30 border-cyan-500/30 hover:border-cyan-400 shadow-sm'
                    : 'bg-indigo-50/80 border-indigo-200 hover:border-indigo-400 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <span>{getTranslation(currentLang, 'aiChatSupport')}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      24/7 Model &amp; Architecture Questions
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 shrink-0">
                  Open
                </span>
              </button>

              {/* 2. Dedicated Gmail Support Option: Direct Message Option (NO website redirect) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDirectMessage();
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all group ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-rose-950/30 via-[#0B0F19] to-indigo-950/30 border-rose-500/30 hover:border-rose-400 shadow-sm'
                    : 'bg-rose-50/70 border-rose-200 hover:border-rose-400 shadow-sm'
                }`}
                title="Opens direct message compose form"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <span>{getTranslation(currentLang, 'gmailSupport')}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    </div>
                    <div className={`text-[10.5px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Direct message option · No external website
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-white bg-gradient-to-r from-rose-600 to-indigo-600 group-hover:from-rose-500 group-hover:to-indigo-500 px-2.5 py-1.5 rounded-lg shadow-sm shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Direct Message</span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div
            className={`p-3.5 border-t text-[11px] font-mono flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-600'
            }`}
          >
            <span>Frontier AI Platform</span>
            <span>2026 Edition · 99.99% SLA</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
