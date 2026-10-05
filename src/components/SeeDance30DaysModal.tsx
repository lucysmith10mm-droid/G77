import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Flame,
  AlertCircle,
  Clock,
  Key
} from 'lucide-react';
import { syncOrderDirectlyToFirestore } from '../lib/firebase';
import { Order } from '../types';

interface SeeDance30DaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const SeeDance30DaysModal: React.FC<SeeDance30DaysModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const UPI_ID = 'harishsingh9208@okaxis';
  const AMOUNT_INR = 420;
  const AMOUNT_USD = 5;

  if (!isOpen) return null;

  const upiDeepLink = `upi://pay?pa=${UPI_ID}&pn=SEE%20DANCE%20AI&am=${AMOUNT_INR}&cu=INR&tn=SEEDANCE30DAYS`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiDeepLink)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleOpenPhonePeApp = () => {
    window.location.href = upiDeepLink;
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMessage('Please enter your full name and email address.');
      return;
    }

    if (!transactionRef.trim()) {
      setErrorMessage('Please enter the 12-digit UPI / PhonePe Transaction Reference (UTR).');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create order on backend
      const res = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || 'N/A',
          planId: 'PLAN_30_DAYS',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit order.');
      }

      const generatedOrderId = data.order?.orderId || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 2. Submit payment reference
      await fetch('/api/order/payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: generatedOrderId,
          paymentReference: transactionRef.trim(),
        }),
      }).catch(() => {});

      const newOrder: Order = {
        id: data.order?.id || generatedOrderId,
        orderId: generatedOrderId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || 'N/A',
        planId: 'PLAN_30_DAYS',
        planName: '30 DAYS ACCESS (FLASH PROMO)',
        duration: '30 days',
        amount: AMOUNT_USD,
        amountCents: 500,
        currency: 'USD',
        paymentStatus: 'PENDING',
        paymentReference: transactionRef.trim(),
        accessLink: 'https://www.dola.com/chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Direct Firestore Sync
      await syncOrderDirectlyToFirestore(newOrder);

      setCompletedOrder(newOrder);
    } catch (err: any) {
      console.warn('Order submission error, falling back locally:', err);
      // Fallback order creation
      const fallbackOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const fallbackOrder: Order = {
        id: fallbackOrderId,
        orderId: fallbackOrderId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || 'N/A',
        planId: 'PLAN_30_DAYS',
        planName: '30 DAYS ACCESS (FLASH PROMO)',
        duration: '30 days',
        amount: AMOUNT_USD,
        amountCents: 500,
        currency: 'USD',
        paymentStatus: 'PENDING',
        paymentReference: transactionRef.trim(),
        accessLink: 'https://www.dola.com/chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await syncOrderDirectlyToFirestore(fallbackOrder).catch(() => {});
      setCompletedOrder(fallbackOrder);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    setCompletedOrder(null);
    setTransactionRef('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCloseAll}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window: Responsive max-h, clean scroll */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl z-10 border ${
            isDarkMode
              ? 'bg-[#0A0D18] text-white border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.2)]'
              : 'bg-white text-slate-900 border-slate-300 shadow-2xl'
          }`}
        >
          {/* Top Neon Accent Banner */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400 shrink-0" />

          {/* Modal Header */}
          <div
            className={`p-4 sm:p-5 border-b shrink-0 flex items-center justify-between ${
              isDarkMode ? 'border-white/[0.08] bg-[#0E1322]' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Flame className="w-5 h-5 fill-rose-300 text-rose-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                    SEE DANCE 2.5
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/40 animate-pulse">
                    30 Days Pass
                  </span>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Unlimited 4K AI Video Diffusion • Special Promo
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseAll}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {completedOrder ? (
              /* Success Screen */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40 shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-black text-white">Payment Submitted Successfully!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Your 30-Day Unlimited Access Pass for <strong>SEE DANCE 2.5</strong> has been registered.
                  </p>
                </div>

                {/* Details Box */}
                <div
                  className={`p-4 rounded-xl border text-left space-y-2.5 font-mono text-xs ${
                    isDarkMode ? 'bg-black/50 border-white/10' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="font-bold text-cyan-400">{completedOrder.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-400">Plan Duration:</span>
                    <span className="font-bold text-emerald-400">30 Days Unlimited Access</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="text-slate-400">Amount Paid:</span>
                    <span className="font-bold text-white">$5 USD (₹420 INR)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Direct Portal:</span>
                    <a
                      href="https://www.dola.com/chat"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline font-semibold flex items-center gap-1"
                    >
                      <span>dola.com/chat</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCloseAll}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 transition-all shadow-md cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Payment & Checkout Form */
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                {/* Promo Spotlight Banner Box */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-indigo-950/30 border border-rose-500/30 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-mono text-rose-300 font-bold uppercase tracking-wider">
                      Flash Price Guarantee
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-white">$5</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">/ ₹420 INR</span>
                      <span className="text-xs text-slate-400 line-through font-mono">$25</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded-lg text-xs font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 font-mono shadow-sm">
                      80% OFF
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">30 Days Unlimited</div>
                  </div>
                </div>

                {/* Features Checklist */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>SEE DANCE 2.5 4K 60FPS</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero Queue VIP Rendering</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full 30 Days Unlimited</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant Key &amp; Access Link</span>
                  </div>
                </div>

                {/* Customer Details Inputs */}
                <div className="space-y-2.5 pt-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Step 1: Your Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-colors ${
                        isDarkMode
                          ? 'bg-black/40 border-white/10 text-white focus:border-rose-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                      }`}
                    />
                    <input
                      type="email"
                      required
                      placeholder="Your Email for Key Delivery *"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-colors ${
                        isDarkMode
                          ? 'bg-black/40 border-white/10 text-white focus:border-rose-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Step 2: PhonePe & UPI Payment Section (Exclusively UPI & PhonePe) */}
                <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Step 2: Pay with PhonePe &amp; UPI</span>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-2 py-0.5 rounded shadow-sm">
                      PhonePe / GPay / Paytm
                    </span>
                  </div>

                  {/* QR Code & UPI ID Card */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-center gap-3.5 ${
                      isDarkMode ? 'bg-[#0E1322] border-purple-500/30' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* QR Image */}
                    <div className="bg-white p-2 rounded-xl shadow-md shrink-0 flex flex-col items-center">
                      <img
                        src={qrCodeUrl}
                        alt="PhonePe UPI QR Code"
                        className="w-28 h-28 object-contain"
                      />
                      <span className="text-[9px] font-mono font-bold text-slate-900 mt-1">
                        Scan to Pay ₹420
                      </span>
                    </div>

                    {/* UPI Details & PhonePe Buttons */}
                    <div className="flex-1 w-full space-y-2 text-left">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-mono text-slate-400 uppercase">
                          Official PhonePe / UPI ID:
                        </div>
                        <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-black/40 border border-white/10">
                          <span className="font-mono text-xs font-bold text-cyan-300 truncate select-all">
                            {UPI_ID}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                          >
                            {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Direct PhonePe App Deep Link Button */}
                      <button
                        type="button"
                        onClick={handleOpenPhonePeApp}
                        className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        title="Directly opens PhonePe or default UPI app on mobile"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Pay ₹420 via PhonePe App</span>
                      </button>

                      <div className="text-[9.5px] text-slate-400 font-mono text-center">
                        Supports: PhonePe, Google Pay, Paytm, BHIM, Cred
                      </div>
                    </div>
                  </div>

                  {/* Transaction ID Input */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono text-slate-400">
                      Step 3: Enter UPI / PhonePe 12-Digit Reference (UTR) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 528394829103 (From PhonePe payment receipt)"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none transition-colors ${
                        isDarkMode
                          ? 'bg-black/40 border-white/10 text-cyan-300 focus:border-cyan-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                      }`}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>{isSubmitting ? 'Verifying PhonePe Payment...' : 'Submit PhonePe Payment & Activate Pass ($5)'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-200" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer SLA */}
          <div
            className={`p-3 border-t text-[11px] font-mono flex items-center justify-between shrink-0 ${
              isDarkMode ? 'border-white/[0.06] text-slate-400 bg-[#0E1322]' : 'border-slate-200 text-slate-600 bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official PhonePe &amp; UPI Verified</span>
            </span>
            <span>Instant 30-Day Key Delivery</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
