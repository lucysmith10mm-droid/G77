import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Zap,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Receipt,
  FileCheck2,
  Mail,
  Phone,
  ArrowRight,
  Globe,
  ShieldAlert
} from 'lucide-react';
import { Order, PaymentStatus } from '../types';
import {
  getCustomerSavedOrderIds,
  getCustomerSavedInfo,
  saveCustomerOrderId,
  getCachedOrders,
  saveCachedOrders,
  updateCachedOrder
} from '../lib/customerOrders';
import { safeFetchJson, fetchOrderStatusResilient, queryCustomerOrdersResilient } from '../lib/api';

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout?: () => void;
}

export const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  onClose,
  onOpenCheckout,
}) => {
  const [orders, setOrders] = useState<Order[]>(() => getCachedOrders());
  const [isLoading, setIsLoading] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DEVICE' | 'LOOKUP'>('DEVICE');

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Fetch orders saved on this device
  const fetchDeviceOrders = useCallback(async (quiet = false) => {
    const savedIds = getCustomerSavedOrderIds();
    const savedInfo = getCustomerSavedInfo();

    if (savedIds.length === 0 && !savedInfo.email && !savedInfo.phone) {
      return;
    }

    if (!quiet && orders.length === 0) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (savedIds.length > 0) {
        params.append('ids', savedIds.join(','));
      }
      if (savedInfo.email) {
        params.append('email', savedInfo.email);
      }
      if (savedInfo.phone) {
        params.append('phone', savedInfo.phone);
      }

      const res = await safeFetchJson<{ orders: Order[] }>(`/api/customer/orders?${params.toString()}`);
      if (res.ok && res.data?.orders) {
        setOrders(res.data.orders);
        saveCachedOrders(res.data.orders);
      } else if (savedInfo.email || savedInfo.phone || savedIds.length > 0) {
        // Fallback to direct Firestore lookup
        const firestoreOrders = await queryCustomerOrdersResilient(savedInfo.email || savedInfo.phone || savedIds[0]);
        if (firestoreOrders.length > 0) {
          setOrders(firestoreOrders);
          saveCachedOrders(firestoreOrders);
        }
      }
    } catch (err) {
      console.warn('Could not fetch device orders:', err);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [orders.length]);

  // Lookup orders by user query (email, phone, or order ID)
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = lookupQuery.trim();
    if (!q) return;

    setIsLoading(true);
    setLookupError(null);

    try {
      const params = new URLSearchParams();

      if (q.includes('@')) {
        params.append('email', q.toLowerCase());
      } else if (/^SD-[0-9A-Za-z]+$/i.test(q) || /^order_/i.test(q)) {
        params.append('ids', q);
      } else {
        params.append('phone', q);
        params.append('ids', q);
      }

      const res = await safeFetchJson<{ orders: Order[] }>(`/api/customer/orders?${params.toString()}`);
      let foundOrders: Order[] = (res.ok && res.data?.orders) ? res.data.orders : [];

      // If backend was unproxied / static HTML on protectapk.com, query Firestore directly
      if (foundOrders.length === 0) {
        foundOrders = await queryCustomerOrdersResilient(q);
      }

      if (foundOrders.length === 0) {
        setLookupError('No matching orders found. Please verify your Email, Phone, or Order ID.');
      } else {
        // Save retrieved order IDs to device storage so they persist
        foundOrders.forEach((ord: Order) => {
          saveCustomerOrderId(ord.orderId, {
            name: ord.customerName,
            email: ord.customerEmail,
            phone: ord.customerPhone,
          });
        });
        setOrders(foundOrders);
        setActiveTab('DEVICE');
      }
    } catch (err: any) {
      setLookupError(err.message || 'Error occurred while looking up orders.');
    } finally {
      setIsLoading(false);
    }
  };

  // Recheck a single order status
  const recheckOrderStatus = async (orderId: string) => {
    try {
      const updated = await fetchOrderStatusResilient(orderId);
      if (!updated) return;

      setOrders((prev) =>
        prev.map((o) => {
          if (o.orderId === orderId) {
            const nextOrd = {
              ...o,
              paymentStatus: updated.paymentStatus,
              accessLink: updated.accessLink || o.accessLink,
              paymentReference: updated.paymentReference || o.paymentReference,
              approvedAt: updated.approvedAt,
              rejectedAt: updated.rejectedAt,
            };
            updateCachedOrder(nextOrd);
            return nextOrd;
          }
          return o;
        })
      );
    } catch (err) {
      console.warn('Recheck error:', err);
    }
  };

  // Auto-refresh periodically when open
  useEffect(() => {
    if (!isOpen) return;

    fetchDeviceOrders();

    // Auto-refresh every 6 seconds to track real-time owner approvals
    const interval = setInterval(() => {
      fetchDeviceOrders(true);
    }, 6000);

    const onOrderChanged = () => fetchDeviceOrders(true);
    window.addEventListener('customer_orders_changed', onOrderChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener('customer_orders_changed', onOrderChanged);
    };
  }, [isOpen, fetchDeviceOrders]);

  if (!isOpen) return null;

  const copyText = (text: string, id: string, isLink = false) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLinkId(id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } else {
      setCopiedOrderId(id);
      setTimeout(() => setCopiedOrderId(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="customer-history-modal"
        className="relative w-full max-w-2xl bg-[#0d0c18] border border-white/10 rounded-3xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  My Orders &amp; Access Passes
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track your real-time payment approval, order proof &amp; official access links.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDeviceOrders(false)}
              disabled={isLoading}
              title="Refresh order statuses"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-fuchsia-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-4 pb-2 border-b border-white/[0.06] flex items-center gap-2 bg-[#090812]">
          <button
            onClick={() => setActiveTab('DEVICE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DEVICE'
                ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>This Device Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('LOOKUP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'LOOKUP'
                ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Look Up by Email / Phone</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* LOOKUP TAB */}
          {activeTab === 'LOOKUP' && (
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-fuchsia-400" />
                  <span>Retrieve Previous Orders</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Did you place an order on another phone, PC, or clear your browser cache? Enter your Email, Phone number, or Order ID (e.g. SD-123456) to load all your active passes.
                </p>
              </div>

              <form onSubmit={handleLookup} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      placeholder="Enter your Email, Phone (+91...) or Order ID"
                      value={lookupQuery}
                      onChange={(e) => setLookupQuery(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 focus:border-fuchsia-400 focus:outline-none text-xs sm:text-sm text-white font-mono placeholder:text-slate-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Search</span>
                  </button>
                </div>

                {lookupError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {lookupError}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ORDERS LIST */}
          {orders.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 mx-auto flex items-center justify-center text-slate-500">
                <Receipt className="w-8 h-8 text-slate-600" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-white">No Orders Found on This Device</h3>
                <p className="text-xs text-slate-400">
                  If you recently placed an order, enter your Email or Phone in the Look Up tab above to fetch it instantly.
                </p>
              </div>
              {onOpenCheckout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCheckout();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/25 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Choose an Unlimited Pass</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isApproved = order.paymentStatus === 'APPROVED';
                const isPending = order.paymentStatus === 'PENDING';
                const isRejected = order.paymentStatus === 'REJECTED';

                return (
                  <div
                    key={order.id || order.orderId}
                    className={`rounded-2xl p-5 border transition-all duration-200 ${
                      isApproved
                        ? 'bg-gradient-to-b from-[#0d1a15] to-[#0a110e] border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : isPending
                        ? 'bg-gradient-to-b from-[#181309] to-[#0e0c06] border-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-gradient-to-b from-[#1a0c0e] to-[#12080a] border-rose-500/40'
                    }`}
                  >
                    {/* Top Row: Product Name, Duration, Price, & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            SEE DANCE 2.5 + 2.0
                          </span>
                          <span className="text-xs font-mono font-bold text-fuchsia-400">
                            {order.duration} Pass
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-white tracking-tight">
                          {order.planName}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-left sm:text-right">
                          <span className="text-lg font-black text-white font-mono">
                            ₹{order.amount}
                          </span>
                        </div>

                        {/* Status Badges */}
                        {isApproved && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>APPROVED</span>
                          </div>
                        )}
                        {isPending && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>UNDER REVIEW</span>
                          </div>
                        )}
                        {isRejected && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>VERIFICATION FAILED</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Details: Order ID, Date, Proof / UTR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 text-xs text-slate-300">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Order ID:</span>
                          <span className="font-mono font-bold text-white">{order.orderId}</span>
                          <button
                            type="button"
                            onClick={() => copyText(order.orderId, order.orderId)}
                            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy Order ID"
                          >
                            {copiedOrderId === order.orderId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Created:</span>
                          <span className="text-slate-300 font-mono text-[11px]">
                            {new Date(order.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Payment Proof / UTR Submission */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                          <span className="text-slate-400">Payment Proof (UTR):</span>
                        </div>
                        {order.paymentReference ? (
                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 block truncate">
                            {order.paymentReference}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">
                            Submitted via UPI Single-Scan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status Actions / Access Delivery */}
                    {isApproved ? (
                      <div className="mt-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="font-bold text-xs text-emerald-200">
                              Official Model Access Unlocked
                            </span>
                          </div>
                          {order.approvedAt && (
                            <span className="text-[10px] font-mono text-emerald-400/80">
                              Approved {new Date(order.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {/* Netherlands VPN Required Notice (English) */}
                        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200">
                          <div className="flex items-start gap-2.5">
                            <Globe className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                              <div className="font-bold text-amber-300 flex flex-wrap items-center gap-1.5">
                                <span>Please use a Netherlands VPN before using this service</span>
                                <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-400/30 uppercase">
                                  Netherlands VPN
                                </span>
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed">
                                Connect to a Netherlands VPN server before opening your access link to activate and use the SEE DANCE AI video models smoothly.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Access Link Box */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex-1 p-2.5 rounded-lg bg-black/50 border border-emerald-500/20 font-mono text-xs text-emerald-300 truncate">
                            {order.accessLink || 'https://www.dola.com/chat'}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  order.accessLink || 'https://www.dola.com/chat',
                                  order.orderId,
                                  true
                                )
                              }
                              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              {copiedLinkId === order.orderId ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>

                            <a
                              href={order.accessLink || 'https://www.dola.com/chat'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <span>Open Access Link</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        <p className="text-[11px] text-emerald-400/90 leading-relaxed">
                          Click <strong>Open Access Link</strong> to launch the official SEE DANCE 2.5 + SEE DANCE 2.0 dual engine AI studio directly.
                        </p>
                      </div>
                    ) : isPending ? (
                      <div className="mt-3 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Manual verification in progress</span>
                          </p>
                          <p className="text-[11px] text-slate-400">
                            The owner verifies your UTR/screenshot within 2 to 5 minutes.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => recheckOrderStatus(order.orderId)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Check Live Status</span>
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3 p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-rose-200">
                            Verification Unsuccessful
                          </p>
                          <p className="text-[11px] text-slate-400">
                            The submitted reference could not be matched with bank statements.
                          </p>
                        </div>
                        <a
                          href={`mailto:lucysmith10mm@gmail.com?subject=Payment%20Verification%20Assistance%20-%20Order%20${encodeURIComponent(order.orderId)}`}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                          title="Contact support at lucysmith10mm@gmail.com"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Contact Support</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#090812] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center flex-wrap gap-2 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Encrypted Order History</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Support Desk:</span>
              <a
                href="mailto:lucysmith10mm@gmail.com?subject=SEE%20DANCE%20Support%20Inquiry"
                className="text-fuchsia-400 hover:text-fuchsia-300 underline font-medium"
              >
                lucysmith10mm@gmail.com
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-colors cursor-pointer text-xs self-end sm:self-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
