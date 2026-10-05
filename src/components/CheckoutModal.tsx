import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  CreditCard,
  Lock,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Mail,
  User,
  Phone,
  AlertCircle,
  RefreshCw,
  Zap,
  Globe,
  Coins,
  Check,
  Building2,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, PaymentProviderStatus, PlanConfig } from '../types';
import {
  createCheckoutSessionApi,
  getPaymentConfig,
  fetchOrderStatusResilient
} from '../lib/api';
import { saveCustomerOrderId } from '../lib/customerOrders';
import { PaymentPendingTimerView } from './PaymentPendingTimerView';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanConfig;
  isDarkMode?: boolean;
}

type PaymentMethodType = 'stripe' | 'paypal' | 'crypto';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  isDarkMode = true,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<PaymentMethodType>('stripe');

  const [providerConfig, setProviderConfig] = useState<PaymentProviderStatus | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  // Active verified order state
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orderStatus, setOrderStatus] = useState<'IDLE' | 'PROCESSING' | 'PAID' | 'FAILED'>('IDLE');
  const [pollingActive, setPollingActive] = useState(false);

  const pollIntervalRef = useRef<any>(null);

  // Fetch gateway configuration on open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingConfig(true);
      setErrorMsg(null);
      setConfigNotice(null);
      getPaymentConfig()
        .then((res) => {
          if (res.ok && res.data) {
            setProviderConfig(res.data);
            // Default to configured provider if available
            if (!res.data.stripe.configured && res.data.paypal.configured) {
              setSelectedProvider('paypal');
            }
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingConfig(false));

      // Check if URL has payment success callback
      const params = new URLSearchParams(window.location.search);
      const urlOrderId = params.get('orderId');
      const paymentFlag = params.get('payment');
      if (urlOrderId && (paymentFlag === 'success' || paymentFlag === 'complete')) {
        startPollingOrder(urlOrderId);
      }
    } else {
      clearInterval(pollIntervalRef.current);
      setPollingActive(false);
      setIsSubmitting(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      clearInterval(pollIntervalRef.current);
    };
  }, []);

  const startPollingOrder = (orderId: string) => {
    setOrderStatus('PROCESSING');
    setPollingActive(true);

    let attempts = 0;
    clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const order = await fetchOrderStatusResilient(orderId);
        if (order) {
          setActiveOrder(order);
          if (order.paymentStatus === 'PAID' || order.paymentStatus === 'APPROVED') {
            setOrderStatus('PAID');
            setPollingActive(false);
            clearInterval(pollIntervalRef.current);
            triggerConfetti();
          } else if (order.paymentStatus === 'FAILED' || order.paymentStatus === 'REJECTED') {
            setOrderStatus('FAILED');
            setPollingActive(false);
            clearInterval(pollIntervalRef.current);
          }
        }
      } catch (err) {
        console.warn('Order polling error:', err);
      }

      if (attempts > 60) {
        // Stop after ~2 minutes of polling
        clearInterval(pollIntervalRef.current);
        setPollingActive(false);
      }
    }, 2500);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#3B82F6', '#6366F1', '#EC4899', '#F59E0B'],
      });
    } catch {}
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setConfigNotice(null);

    const cleanName = customerName.trim();
    const cleanEmail = customerEmail.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address for instant access delivery.');
      return;
    }

    setIsSubmitting(true);

    try {
      const returnUrl = `${window.location.origin}/?payment=success`;
      const cancelUrl = `${window.location.origin}/?payment=cancelled`;

      const res = await createCheckoutSessionApi({
        planId: selectedPlan.id,
        customerName: cleanName,
        customerEmail: cleanEmail,
        customerPhone: customerPhone.trim() || undefined,
        paymentProvider: selectedProvider,
        returnUrl,
        cancelUrl,
        sourceDomain: window.location.hostname,
      });

      if (!res.ok || !res.data) {
        if (res.data?.requiresConfig) {
          setConfigNotice(
            res.data.error ||
              'Payment gateway setup in progress. Please contact support@frontier-ai.net for priority manual activation.'
          );
        } else {
          setErrorMsg(res.data?.error || res.error || 'Failed to initialize payment gateway.');
        }
        setIsSubmitting(false);
        return;
      }

      const { orderId, checkoutUrl, requiresConfig } = res.data;

      // Save order ID to local storage so user can track it
      if (orderId) {
        saveCustomerOrderId(orderId);
      }

      if (requiresConfig) {
        setConfigNotice(
          res.data.error ||
            'Payment Gateway is awaiting API keys. Please contact support@frontier-ai.net.'
        );
        setIsSubmitting(false);
        return;
      }

      // If gateway returned a direct checkout URL (Stripe or PayPal Hosted Checkout)
      if (checkoutUrl) {
        // Start background polling in case user completes in new tab or popup
        startPollingOrder(orderId);

        // Open checkout URL in same tab or redirect
        window.location.href = checkoutUrl;
        return;
      }

      // If no immediate redirect URL, begin verification polling
      startPollingOrder(orderId);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err?.message || 'An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="checkout_modal_backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && orderStatus !== 'PROCESSING') {
          onClose();
        }
      }}
    >
      <div
        id="checkout_modal_container"
        className="relative w-full max-w-xl my-6 bg-slate-950 border border-slate-800/80 rounded-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden text-slate-100"
      >
        {/* Top Header Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white tracking-wide">
                  Global Checkout
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  Instant Delivery
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SEE DANCE 2.5 + SEE DANCE 2.0 Unlimited Dual Pass
              </p>
            </div>
          </div>

          <button
            id="close_checkout_modal_btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* SUCCESS STATE */}
          {orderStatus === 'PAID' && (
            <div id="payment_success_view" className="py-4 text-center space-y-5 animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Payment Verified
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  Access License Activated!
                </h2>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Thank you for your purchase. Your unlimited SEE DANCE 2.5 + 2.0 video generation portal is ready for immediate access.
                </p>
              </div>

              {/* Order Verification Details */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left space-y-2 text-sm">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Order Reference:</span>
                  <span className="font-mono text-cyan-400 font-semibold">{activeOrder?.orderId || 'SD-CONFIRMED'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Plan:</span>
                  <span className="text-white font-medium">{selectedPlan.name} ({selectedPlan.duration})</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-400 font-bold">${selectedPlan.amount} USD</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Receipt Emailed To:</span>
                  <span className="text-slate-200">{customerEmail || activeOrder?.customerEmail || 'Customer Email'}</span>
                </div>
              </div>

              {/* Direct Access Action */}
              <div className="pt-2 space-y-3">
                <a
                  id="direct_access_portal_btn"
                  href={activeOrder?.accessLink || 'https://www.dola.com/chat'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Launch SEE DANCE Studio Portal</span>
                  <ExternalLink className="w-5 h-5" />
                </a>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 text-left">
                  <Globe className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Regional Notice:</strong> For optimal GPU rendering, please ensure your VPN is connected to Netherlands if prompted upon portal launch.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2-MINUTE LIVE TIMER PROCESSING / VERIFYING STATE */}
          {orderStatus === 'PROCESSING' && (
            <PaymentPendingTimerView
              orderId={activeOrder?.orderId || 'ORD-PENDING'}
              customerEmail={customerEmail}
              customerName={customerName}
              amount={selectedPlan.amount}
              currency="USD"
              referenceId={activeOrder?.paymentReference}
              title={`${selectedPlan.name} - Payment Pending Verification`}
              onApproved={(approvedData) => {
                setActiveOrder(approvedData || activeOrder);
                setOrderStatus('PAID');
                setPollingActive(false);
                triggerConfetti();
              }}
              onClose={() => setOrderStatus('IDLE')}
            />
          )}

          {/* STANDARD CHECKOUT FORM */}
          {orderStatus === 'IDLE' && (
            <form onSubmit={handleSubmitCheckout} className="space-y-6">
              {/* Order Summary Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                      Selected Plan
                    </span>
                    <h4 className="font-bold text-white text-base">
                      {selectedPlan.name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Unlimited SEE DANCE 2.5 & 2.0 AI Video Generation
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400">
                      ${selectedPlan.amount}
                    </div>
                    <div className="text-xs text-slate-400">USD • One-Time</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> 4K Ultra-HD 60FPS
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Zero GPU Wait Queue
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Instant Email Access
                  </span>
                </div>
              </div>

              {/* Customer Information Form */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Customer & Delivery Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Name</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="checkout_customer_name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Harish Singh"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Customer Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      id="checkout_customer_email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Optional Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone / WhatsApp</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Optional</span>
                  </label>
                  <input
                    id="checkout_customer_phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector (Requirement 5) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Select Payment Method
                  </h4>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" /> 256-Bit Encrypted
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* STRIPE / CARDS */}
                  <button
                    type="button"
                    id="select_provider_stripe"
                    onClick={() => setSelectedProvider('stripe')}
                    className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      selectedProvider === 'stripe'
                        ? 'bg-cyan-500/15 border-cyan-400 text-white ring-1 ring-cyan-400/50 shadow-sm shadow-cyan-950/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/90 flex items-center justify-center text-cyan-400 shrink-0">
                        <CreditCard className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-white leading-tight">Card Payment</div>
                        <div className="text-[10px] text-slate-400 truncate">Visa, MC, Apple Pay</div>
                      </div>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedProvider === 'stripe' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                    }`}>
                      {selectedProvider === 'stripe' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </button>

                  {/* PAYPAL */}
                  <button
                    type="button"
                    id="select_provider_paypal"
                    onClick={() => setSelectedProvider('paypal')}
                    className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      selectedProvider === 'paypal'
                        ? 'bg-blue-500/15 border-blue-400 text-white ring-1 ring-blue-400/50 shadow-sm shadow-blue-950/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/90 flex items-center justify-center text-blue-400 shrink-0">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-white leading-tight">PayPal</div>
                        <div className="text-[10px] text-slate-400 truncate">Account & Cards</div>
                      </div>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedProvider === 'paypal' ? 'border-blue-400 bg-blue-400' : 'border-slate-600'
                    }`}>
                      {selectedProvider === 'paypal' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </button>

                  {/* CRYPTO */}
                  <button
                    type="button"
                    id="select_provider_crypto"
                    onClick={() => setSelectedProvider('crypto')}
                    className={`px-3 py-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      selectedProvider === 'crypto'
                        ? 'bg-amber-500/15 border-amber-400 text-white ring-1 ring-amber-400/50 shadow-sm shadow-amber-950/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/90 flex items-center justify-center text-amber-400 shrink-0">
                        <Coins className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-white leading-tight">Crypto</div>
                        <div className="text-[10px] text-slate-400 truncate">USDT, BTC, ETH</div>
                      </div>
                    </div>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedProvider === 'crypto' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'
                    }`}>
                      {selectedProvider === 'crypto' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Configuration Notice (Safe guidance when owner hasn't set keys yet) */}
              {configNotice && (
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Gateway Ready Notice
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {configNotice}
                  </p>
                </div>
              )}

              {/* Checkout Action Button */}
              <button
                type="submit"
                id="submit_checkout_button"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Connecting Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      Pay ${selectedPlan.amount} USD & Get {selectedPlan.id === 'PLAN_LIFETIME' ? 'Lifetime Unlimited VIP Access' : `${selectedPlan.duration} Unlimited Plan`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Trust Badges & Guarantee */}
              <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Verified Delivery
                </span>
                <span>Automated Email Receipt</span>
                <span>No Recurring Charges</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
