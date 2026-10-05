import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  ShieldCheck,
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import confetti from 'canvas-confetti';

interface PaymentPendingTimerViewProps {
  orderId: string;
  customerEmail: string;
  customerName?: string;
  amount: string | number;
  currency?: string;
  referenceId?: string;
  title?: string;
  onApproved: (orderData?: any) => void;
  onClose?: () => void;
  isDarkMode?: boolean;
}

export const PaymentPendingTimerView: React.FC<PaymentPendingTimerViewProps> = ({
  orderId,
  customerEmail,
  customerName,
  amount,
  currency = 'USD',
  referenceId,
  title = 'Payment Verification in Progress',
  onApproved,
  onClose,
  isDarkMode = true,
}) => {
  // 2 Minutes = 120 Seconds countdown timer
  const [secondsLeft, setSecondsLeft] = useState<number>(120);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  // Countdown timer effect (120s down to 0)
  useEffect(() => {
    if (secondsLeft <= 0 || isApproved) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isApproved]);

  // Real-time Firestore snapshot listener for Admin approval
  useEffect(() => {
    if (!orderId || isApproved) return;

    try {
      const unsub = onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data?.paymentStatus === 'PAID' || data?.paymentStatus === 'APPROVED') {
            setIsApproved(true);
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch {}
            setTimeout(() => {
              onApproved(data);
            }, 800);
          }
        }
      });

      return () => unsub();
    } catch (err) {
      console.warn('Firestore real-time order listener notice:', err);
    }
  }, [orderId, isApproved, onApproved]);

  // Secondary API polling fallback every 3 seconds
  useEffect(() => {
    if (!orderId || isApproved) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/order/status?orderId=${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.order?.paymentStatus === 'PAID' || data?.order?.paymentStatus === 'APPROVED') {
            setIsApproved(true);
            clearInterval(pollInterval);
            try {
              confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
            } catch {}
            setTimeout(() => onApproved(data.order), 800);
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [orderId, isApproved, onApproved]);

  // Manual re-check handler
  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/order/status?orderId=${encodeURIComponent(orderId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.order?.paymentStatus === 'PAID' || data?.order?.paymentStatus === 'APPROVED') {
          setIsApproved(true);
          onApproved(data.order);
        }
      }
    } catch {}
    setTimeout(() => setIsChecking(false), 800);
  };

  // Format MM:SS
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((120 - secondsLeft) / 120) * 100;

  return (
    <div className="py-6 sm:py-8 px-2 sm:px-4 text-center space-y-5">
      {/* Animated Glowing Clock Icon */}
      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-cyan-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
        <div className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center shadow-lg ${
          isApproved
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
            : secondsLeft > 0
            ? 'bg-amber-500/10 border-amber-400 text-amber-400'
            : 'bg-indigo-500/10 border-indigo-400 text-indigo-400'
        }`}>
          {isApproved ? (
            <CheckCircle2 className="w-8 h-8 animate-bounce text-emerald-400" />
          ) : (
            <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
          )}
        </div>
      </div>

      {/* Title & Status Badge */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Status: Payment Pending Verification</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          {title}
        </h3>

        <p className={`text-xs max-w-md mx-auto leading-relaxed ${
          isDarkMode ? 'text-slate-300' : 'text-slate-600'
        }`}>
          Payment details submitted for <strong className="text-cyan-400">{customerEmail}</strong>. Our admin is verifying your transaction. Your key and access will activate automatically!
        </p>
      </div>

      {/* 2-Minute Live Countdown Timer Box */}
      <div className={`p-4 rounded-2xl border max-w-sm mx-auto shadow-inner space-y-3 ${
        isDarkMode ? 'bg-[#060913] border-cyan-500/30' : 'bg-slate-50 border-slate-300'
      }`}>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verification Timer:</span>
          </span>
          <span className="font-bold text-base text-cyan-300 font-mono tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            {formattedTime}
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400"
            style={{ width: `${progressPercent}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
          <span>02:00 Total</span>
          <span>{secondsLeft > 0 ? `${secondsLeft}s remaining` : 'Reviewing Queue'}</span>
        </div>
      </div>

      {/* Payment Information Summary Card */}
      <div className={`p-3.5 rounded-xl border text-left max-w-sm mx-auto space-y-2 text-xs font-mono ${
        isDarkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
          <span className="text-slate-400">Customer Gmail:</span>
          <span className="text-cyan-300 font-bold truncate max-w-[180px]">{customerEmail}</span>
        </div>

        {customerName && (
          <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
            <span className="text-slate-400">Name:</span>
            <span className="text-slate-200 font-semibold truncate max-w-[180px]">{customerName}</span>
          </div>
        )}

        <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
          <span className="text-slate-400">Order ID:</span>
          <span className="text-slate-300">{orderId}</span>
        </div>

        {referenceId && (
          <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
            <span className="text-slate-400">UTR / Ref:</span>
            <span className="text-emerald-400 font-bold">{referenceId}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-0.5">
          <span className="text-slate-400">Amount:</span>
          <span className="text-emerald-400 font-black text-sm">
            {currency === 'INR' ? `₹${amount}` : `$${amount} ${currency}`}
          </span>
        </div>
      </div>

      {/* Actions & Status Updates */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
        <button
          type="button"
          onClick={handleManualCheck}
          disabled={isChecking}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking...' : 'Check Status Now'}</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            Keep Running in Background
          </button>
        )}
      </div>

      <div className="text-[11px] font-mono text-slate-500">
        Live Firestore Listener Active · Auto-updates instantly on Admin approval
      </div>
    </div>
  );
};
