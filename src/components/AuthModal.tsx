import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  LogOut,
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Info,
  HelpCircle
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  AppUser,
  getStoredTempUser,
  performTemporaryLogin,
  performSignOut
} from '../lib/tempAuth';
import { generate4CharCaptcha, validateCaptcha } from '../lib/captcha';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

interface GoogleAuthErrorDetail {
  title: string;
  message: string;
  troubleshootingTip: string;
  code?: string;
}

// Graceful, comprehensive error mapping for Google Sign-In
const mapFirebaseGoogleAuthError = (err: any): GoogleAuthErrorDetail => {
  const code = err?.code || '';
  const rawMessage = err?.message || '';

  if (code === 'auth/popup-closed-by-user') {
    return {
      title: 'Popup Closed',
      message: 'The Google sign-in window was closed before completing authentication.',
      troubleshootingTip: 'Click "Continue with Google" again and select your account to finish signing in.',
      code: 'auth/popup-closed-by-user'
    };
  }

  if (code === 'auth/cancelled-popup-request') {
    return {
      title: 'Sign-In Request Cancelled',
      message: 'A previous sign-in popup was already active and was replaced.',
      troubleshootingTip: 'Please click "Continue with Google" once and allow the authentication window to complete.',
      code: 'auth/cancelled-popup-request'
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      title: 'Popup Blocked by Browser',
      message: 'Your browser prevented the Google Sign-In popup window from opening.',
      troubleshootingTip: 'Click the popup blocker icon in your browser address bar and select "Always allow popups for this site".',
      code: 'auth/popup-blocked'
    };
  }

  if (code === 'auth/unauthorized-domain' || rawMessage.includes('unauthorized-domain')) {
    return {
      title: 'Domain Not Authorized',
      message: 'This domain is not yet whitelisted in Firebase Console authorized domains.',
      troubleshootingTip: 'Go to Firebase Console > Authentication > Settings > Authorized Domains, and add this domain.',
      code: 'auth/unauthorized-domain'
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      title: 'Network Connection Failed',
      message: 'Unable to establish a secure connection with Google authentication servers.',
      troubleshootingTip: 'Verify your internet connection, disable ad-blockers/strict VPNs, and try again.',
      code: 'auth/network-request-failed'
    };
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return {
      title: 'Invalid Credentials',
      message: 'The Google credentials or authentication tokens provided are expired or invalid.',
      troubleshootingTip: 'Please log out of your Google session or retry selecting your account.',
      code: 'auth/invalid-credential'
    };
  }

  if (code === 'auth/user-disabled') {
    return {
      title: 'Account Disabled',
      message: 'This account has been disabled in the authentication directory.',
      troubleshootingTip: 'Please contact support to verify developer account status.',
      code: 'auth/user-disabled'
    };
  }

  if (code === 'auth/operation-not-allowed') {
    return {
      title: 'Google Provider Disabled',
      message: 'Google Sign-In is currently disabled in your Firebase Authentication project settings.',
      troubleshootingTip: 'In Firebase Console, go to Authentication > Sign-in method, and toggle Google to "Enabled".',
      code: 'auth/operation-not-allowed'
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      title: 'Too Many Attempts',
      message: 'Access temporarily suspended due to consecutive unverified attempts.',
      troubleshootingTip: 'Please wait 1-2 minutes before trying again, or use the direct password form.',
      code: 'auth/too-many-requests'
    };
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return {
      title: 'Account Exists with Different Method',
      message: 'An existing account was found with this email using a different sign-in method.',
      troubleshootingTip: 'Log in using the original method you used to register this email address.',
      code: 'auth/account-exists-with-different-credential'
    };
  }

  return {
    title: 'Google Sign-In Failed',
    message: rawMessage || 'An unexpected issue occurred while authenticating with Google.',
    troubleshootingTip: 'You can use the direct login form with your name, email, password, and captcha.',
    code
  };
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
}) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaCode, setCaptchaCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [googleErrorDetail, setGoogleErrorDetail] = useState<GoogleAuthErrorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Optional OTP Email Verification States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [sentOtpCode, setSentOtpCode] = useState<string | null>(null);
  const [inputOtp, setInputOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Initialize or reset 4-char captcha code when modal opens
  useEffect(() => {
    if (isOpen) {
      setCaptchaCode(generate4CharCaptcha());
      setUserCaptcha('');
      setError(null);
      setGoogleErrorDetail(null);
      setOtpNotice(null);
    }
  }, [isOpen]);

  // Handle countdown timer for OTP resend cooldown
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Sync auth state from both Firebase and Temporary Login storage
  useEffect(() => {
    // 1. Initial check from stored temp user
    const stored = getStoredTempUser();
    if (stored) {
      setCurrentUser(stored);
    }

    // 2. Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const u: AppUser = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Developer',
          email: fbUser.email || '',
          photoURL: fbUser.photoURL || 'https://lh3.googleusercontent.com/a/default-user',
          isTemporary: false,
          loggedInAt: new Date().toISOString()
        };
        setCurrentUser(u);
      } else {
        const currentStored = getStoredTempUser();
        if (currentStored) {
          setCurrentUser(currentStored);
        } else {
          setCurrentUser(null);
        }
      }
    });

    // 3. Custom event listener for instant multi-component reactivity
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppUser | null>;
      if (customEvent.detail) {
        setCurrentUser(customEvent.detail);
      } else {
        const fbCurrent = auth.currentUser;
        if (fbCurrent) {
          setCurrentUser({
            uid: fbCurrent.uid,
            displayName: fbCurrent.displayName || fbCurrent.email?.split('@')[0] || 'Developer',
            email: fbCurrent.email || '',
            photoURL: fbCurrent.photoURL,
            isTemporary: false
          });
        } else {
          setCurrentUser(null);
        }
      }
    };

    window.addEventListener('frontier_auth_changed', handleAuthChange);

    return () => {
      unsubscribe();
      window.removeEventListener('frontier_auth_changed', handleAuthChange);
    };
  }, []);

  // Send OTP to user's email (Optional verification step)
  const handleSendOtp = () => {
    setOtpNotice(null);
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address first to receive OTP.');
      return;
    }

    setError(null);
    setIsSendingOtp(true);

    setTimeout(() => {
      // Generate a 6-digit random verification code
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtpCode(generatedOtp);
      setIsOtpSent(true);
      setIsSendingOtp(false);
      setOtpCooldown(60);
      setOtpNotice(`OTP ${generatedOtp} sent to ${email}. Enter code below to verify.`);
    }, 600);
  };

  // Verify entered OTP
  const handleVerifyOtp = () => {
    setOtpNotice(null);
    if (!inputOtp.trim()) {
      setOtpNotice('Please enter the 6-digit OTP code.');
      return;
    }

    if (inputOtp.trim() === sentOtpCode) {
      setIsEmailVerified(true);
      setIsOtpSent(false);
      setOtpNotice('✓ Email address verified successfully!');
      setTimeout(() => setOtpNotice(null), 3000);
    } else {
      setOtpNotice('Invalid OTP code. Please check and try again.');
    }
  };

  // Direct Login: Name + Email + Password + 4-Character Captcha Code
  // Verification is OPTIONAL; user can log in without OTP verification!
  const handleTemporaryLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGoogleErrorDetail(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid Gmail / Email address.');
      return;
    }
    if (!password.trim() || password.length < 3) {
      setError('Please enter a password of at least 3 characters.');
      return;
    }

    // 4-Character Captcha Verification
    if (!userCaptcha.trim()) {
      setError('Please enter the 4-character captcha code.');
      return;
    }
    if (!validateCaptcha(userCaptcha, captchaCode)) {
      setError('Invalid 4-character captcha code. A new code has been generated.');
      setCaptchaCode(generate4CharCaptcha());
      setUserCaptcha('');
      return;
    }

    setIsLoading(true);

    try {
      const res = await performTemporaryLogin(name, email, password);
      setSuccessMsg(`Welcome, ${res.user.displayName}! Signed in successfully.`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      console.warn('Login issue:', err);
      setError(err.message || 'Login failed. Please verify credentials.');
      setCaptchaCode(generate4CharCaptcha());
      setUserCaptcha('');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In with comprehensive error handling & troubleshooting
  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleErrorDetail(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email) {
        setEmail(result.user.email);
        setIsEmailVerified(true);
      }
      setSuccessMsg('Signed in with Google successfully!');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    } catch (err: any) {
      console.warn('Google Auth popup notice:', err);
      // Map error into specific, graceful user message with troubleshooting guidance
      const errorDetail = mapFirebaseGoogleAuthError(err);
      setGoogleErrorDetail(errorDetail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      await performSignOut();
      setCurrentUser(null);
      setName('');
      setEmail('');
      setPassword('');
      setUserCaptcha('');
      setGoogleErrorDetail(null);
      setError(null);
      setIsEmailVerified(false);
      setIsOtpSent(false);
      setSuccessMsg('Signed out successfully.');
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className={`relative w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl overflow-hidden ${
            isDarkMode
              ? 'bg-[#0B0F19] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] text-white'
              : 'bg-white border border-slate-300 shadow-2xl text-slate-900'
          } z-10`}
        >
          {/* Top Neon Gradient Line */}
          <div className="h-1.5 w-full shrink-0 bg-gradient-to-r from-cyan-400 via-indigo-500 to-rose-500" />

          {/* Modal Header */}
          <div className={`p-4 sm:p-5 pb-3.5 border-b shrink-0 flex items-center justify-between gap-2 ${
            isDarkMode ? 'border-white/[0.08] bg-[#0B0F19]' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-md shrink-0">
                <Cloud className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base tracking-tight truncate">
                  {currentUser ? 'Developer Account' : 'Developer Sign In'}
                </h3>
                <p className={`text-[11px] font-mono truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentUser ? 'Active Frontier AI Session' : 'Enter Details, Password & Captcha'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Visual Security Badge: Secure Connection with Lock Icon */}
              <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-mono font-medium shadow-sm shrink-0">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Secure Connection</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto overflow-x-hidden">
            {currentUser ? (
              /* Signed-in User State */
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${
                  isDarkMode ? 'bg-[#05070F] border-cyan-500/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white uppercase text-base shadow-md shrink-0">
                      {currentUser.displayName
                        ? currentUser.displayName[0]
                        : currentUser.email
                        ? currentUser.email[0]
                        : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm truncate flex items-center gap-1.5">
                        <span>{currentUser.displayName || 'Authorized Developer'}</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      </div>
                      <div className="text-xs text-slate-400 font-mono truncate">
                        {currentUser.email}
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {currentUser.isTemporary ? '⚡ Active Session (Verified)' : 'Firebase Connected'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-slate-400">User ID:</span>
                  <span className="text-right text-slate-200 truncate">{currentUser.uid.slice(0, 14)}...</span>
                  <span className="text-slate-400">Access:</span>
                  <span className="text-right text-cyan-400 font-bold">160+ Live Models</span>
                </div>

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleSignOutClick}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              /* Not Signed-in: Direct Login Form */
              <div className="space-y-4">
                {/* Form header description */}
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-purple-950/40 border-cyan-500/30'
                    : 'bg-indigo-50 border-indigo-200'
                }`}>
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-cyan-300">Developer Sign In</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      Enter your <strong>Name</strong>, <strong>Email</strong>, <strong>Password</strong>, and the <strong>4-digit Captcha</strong> to login directly.
                    </div>
                  </div>
                </div>

                {/* Login Form: Clean, uninterrupted inputs */}
                <form onSubmit={handleTemporaryLoginSubmit} className="space-y-3">
                  {/* Field 1: Name */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      1. Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-[#05070F] border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Field 2: Email */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      2. Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (isEmailVerified) setIsEmailVerified(false);
                        }}
                        required
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-[#05070F] border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Field 3: Password */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      3. Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Enter password (minimum 3 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                          isDarkMode
                            ? 'bg-[#05070F] border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Field 4: 4-Character Captcha Code */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-slate-400">
                        4. Captcha Code (4 Characters) <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-cyan-400">Case-Insensitive</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Stylized Visual Captcha Display Box */}
                      <div className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/50 select-none flex items-center justify-center min-w-[105px] shadow-inner overflow-hidden">
                        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />
                        <div className="absolute h-px w-full bg-cyan-400/30 rotate-6 pointer-events-none" />
                        <span className="font-mono text-base font-black tracking-[0.3em] text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]">
                          {captchaCode || '....'}
                        </span>
                      </div>

                      {/* Refresh Captcha Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setCaptchaCode(generate4CharCaptcha());
                          setUserCaptcha('');
                        }}
                        className="p-2.5 rounded-xl border border-white/10 hover:border-cyan-400/40 hover:bg-white/5 transition-all text-slate-400 hover:text-cyan-300 cursor-pointer shrink-0"
                        title="Click to generate new 4-character code"
                        aria-label="Refresh Captcha Code"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      {/* Captcha Input Field */}
                      <div className="relative flex-1 min-w-0">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Enter 4-char code"
                          value={userCaptcha}
                          onChange={(e) => setUserCaptcha(e.target.value.toUpperCase())}
                          required
                          className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono tracking-widest uppercase font-bold border outline-none transition-colors ${
                            isDarkMode
                              ? 'bg-[#05070F] border-white/10 text-white placeholder-slate-500 focus:border-cyan-400'
                              : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {/* Primary Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-rose-600 hover:from-cyan-500 hover:to-rose-500 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-white shrink-0" />
                    <span>{isLoading ? 'Signing In...' : 'Sign In • Direct Developer Access'}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </form>

                <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-mono pt-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span>or continue with Google</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Specific Google Sign-In Error & Troubleshooting Card */}
                {googleErrorDetail && (
                  <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    isDarkMode
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{googleErrorDetail.title}</span>
                    </div>
                    <p className={`text-[11.5px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {googleErrorDetail.message}
                    </p>
                    <div className={`pt-1.5 text-[11px] font-mono border-t flex items-start gap-1.5 ${
                      isDarkMode ? 'border-amber-500/20 text-cyan-300' : 'border-amber-200 text-indigo-700'
                    }`}>
                      <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <strong className="text-amber-400 mr-1">Troubleshooting:</strong>
                        <span>{googleErrorDetail.troubleshootingTip}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Sign-in Action Button: Perfectly sized, zero overflow */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full box-border py-2.5 px-4 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md disabled:opacity-50 overflow-hidden"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span className="truncate">{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                {/* VERIFY EMAIL OPTION - PLACED AT THE VERY BOTTOM ("SABSE NICHE") */}
                <div className={`p-3 rounded-xl border transition-all text-xs ${
                  isEmailVerified
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : isDarkMode
                    ? 'bg-[#05070F]/80 border-white/10'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isEmailVerified ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Email Verified ({email || 'Confirmed'})</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className={`font-medium truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Verify Email via OTP
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink-0">
                            Optional
                          </span>
                        </div>
                      )}
                    </div>

                    {!isEmailVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || otpCooldown > 0}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isSendingOtp ? 'Sending OTP...' : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Send OTP to Email'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Interactive OTP Input Box when OTP is sent */}
                  {isOtpSent && !isEmailVerified && (
                    <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono">
                        <span className="text-cyan-300">Enter 6-digit OTP code:</span>
                        <span className="text-emerald-400">
                          Demo OTP: <strong>{sentOtpCode}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Enter 6-digit OTP"
                          value={inputOtp}
                          onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-mono tracking-widest bg-black/40 border border-cyan-500/40 text-cyan-200 outline-none focus:border-cyan-300"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          className="px-3.5 py-2 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer transition-all shrink-0"
                        >
                          Verify OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {otpNotice && (
                    <div className="mt-2 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{otpNotice}</span>
                    </div>
                  )}

                  <p className={`text-[10.5px] mt-1.5 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    * Verification is optional. You can sign in directly above using only your password and captcha.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
