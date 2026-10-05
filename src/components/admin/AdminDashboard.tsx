import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LogOut,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Search,
  Filter,
  QrCode,
  Upload,
  Trash2,
  Mail,
  Shield,
  MessageSquare,
  Send,
  ExternalLink,
  Edit,
  RefreshCw,
  AlertCircle,
  FileText,
  Database,
  Server,
  Phone,
  MessageCircle,
  Radio,
  RotateCcw,
  CheckSquare,
  Square,
  Lock,
  Download,
  Globe,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  CreditCard,
  Wallet,
  Coins,
  DollarSign,
  Film,
  Video,
  UploadCloud,
  Play,
  Pause,
  FolderUp
} from 'lucide-react';
import { AuditLog, CustomerMessage, EmailLog, Order, PaymentStatus, QRData, ShowcaseVideo } from '../../types';
import {
  subscribeToLiveOrders,
  deleteOrderDirectlyFromFirestore,
  deleteShowcaseVideoFromFirestore,
  saveShowcaseVideoToFirestore,
  OWNER_EMAIL
} from '../../lib/firebase';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
  onExitToSite?: () => void;
}

type TabType = 'ORDERS' | 'GATEWAYS' | 'VIDEOS' | 'TRASH' | 'QR' | 'MESSAGES' | 'EMAILS' | 'AUDIT' | 'DATABASE';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onLogout, onExitToSite }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ORDERS');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    paidOrders: 0,
    refundedOrders: 0,
    totalRevenue: 0,
    totalRevenueUSD: 0,
    paymentHealth: undefined as any,
  });
  const [paymentHealth, setPaymentHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Orders State
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Deleted Orders (Trash) State & Persistent Live Blacklist
  const getStoredDeletedIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem('seedance_deleted_ids');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {}
    return new Set();
  };
  const saveDeletedIdsToStorage = (s: Set<string>) => {
    try {
      localStorage.setItem('seedance_deleted_ids', JSON.stringify(Array.from(s)));
    } catch {}
  };

  const [deletedOrders, setDeletedOrders] = useState<(Order & { deletedAt: string; deletedBy: string })[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [deletedSearchQuery, setDeletedSearchQuery] = useState('');
  const deletedIdsSetRef = useRef<Set<string>>(getStoredDeletedIds());
  const [deletedCount, setDeletedCount] = useState(() => deletedIdsSetRef.current.size);

  // Sound Alerts & Live Stream Connectivity
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('seedance_admin_sound') !== 'false';
    } catch {
      return true;
    }
  });
  const [liveConnected, setLiveConnected] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Save sound setting
  useEffect(() => {
    try {
      localStorage.setItem('seedance_admin_sound', String(soundEnabled));
    } catch {}
  }, [soundEnabled]);

  // Audio payment chime (Web Audio API synth - instant, zero external asset dependencies)
  const playPaymentChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.35); // D6

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Browser audio policy handling
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard?.writeText(text);
      setCopiedText(text);
      showFeedback('success', `${label} copied to clipboard!`);
      setTimeout(() => setCopiedText(null), 2500);
    } catch {
      showFeedback('error', 'Failed to copy to clipboard.');
    }
  };

  // Bulk Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Password Confirmation Modal State
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionType: 'DELETE_SINGLE' | 'DELETE_BULK' | 'PERMANENT_PURGE' | 'EMPTY_TRASH' | 'PURGE_ALL_HISTORY';
    targetId?: string;
    targetCode?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionType: 'DELETE_SINGLE',
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // QR State
  const [activeQR, setActiveQR] = useState<QRData | null>(null);
  const [qrUpiId, setQrUpiId] = useState('');
  const [qrNote, setQrNote] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Messages, Emails, Audit, Database Status
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Action Modals
  const [approvingOrder, setApprovingOrder] = useState<Order | null>(null);
  const [customAccessLink, setCustomAccessLink] = useState('https://www.dola.com/chat');
  const [inlineAccessLinks, setInlineAccessLinks] = useState<Record<string, string>>({});
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment could not be verified on UPI statement');
  const [messagingOrder, setMessagingOrder] = useState<Order | null>(null);
  const [customerMessageText, setCustomerMessageText] = useState('');
  const [notingOrder, setNotingOrder] = useState<Order | null>(null);
  const [adminNoteText, setAdminNoteText] = useState('');
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('Customer requested refund / order cancellation');
  const [actionLoading, setActionLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString());
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Video Showcase Reels Management State
  const [showcaseVideos, setShowcaseVideos] = useState<ShowcaseVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [videoUploadMode, setVideoUploadMode] = useState<'GALLERY' | 'LINK'>('GALLERY');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoSubtitle, setNewVideoSubtitle] = useState('');
  const [newVideoBadge, setNewVideoBadge] = useState<'SEEDANCE 2.5' | 'SEEDANCE 2.0'>('SEEDANCE 2.5');
  const [newVideoPrompt, setNewVideoPrompt] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.videos)) {
          setShowcaseVideos(data.videos);
        }
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Delete this showcase video from the live site carousel?')) return;
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showFeedback('success', 'Showcase video removed successfully.');
        try {
          deleteShowcaseVideoFromFirestore(id);
        } catch {}
        fetchVideos();
      } else {
        showFeedback('error', 'Failed to delete video.');
      }
    } catch {
      showFeedback('error', 'Network error deleting video.');
    }
  };

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      showFeedback('error', 'Video file is too large. Maximum supported size is 100MB.');
      return;
    }
    setNewVideoFile(file);
    if (!newVideoTitle.trim()) {
      setNewVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    try {
      if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
      const blobUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(blobUrl);
    } catch (e) {
      console.error('Error generating preview:', e);
    }
  };

  const handleClearPreview = () => {
    if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoPreviewUrl(null);
    setNewVideoFile(null);
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUploadMode === 'GALLERY' && !newVideoFile) {
      showFeedback('error', 'Please select a video file from your phone/computer gallery.');
      return;
    }
    if (videoUploadMode === 'LINK' && !newVideoUrl.trim()) {
      showFeedback('error', 'Please enter or paste a valid video URL link.');
      return;
    }

    setIsAddingVideo(true);
    try {
      if (videoUploadMode === 'GALLERY' && newVideoFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const res = await fetch('/api/videos/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                fileData: base64Data,
                fileName: newVideoFile.name,
                title: newVideoTitle.trim() || newVideoFile.name.replace(/\.[^/.]+$/, ''),
                subtitle: newVideoSubtitle.trim() || `${newVideoBadge} Official Generation`,
                badge: newVideoBadge,
                prompt: newVideoPrompt.trim() || 'Official SEE DANCE showcase reel'
              })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              showFeedback('success', '🎉 Reel uploaded & published live to website slider!');
              if (data.video) {
                try {
                  saveShowcaseVideoToFirestore(data.video);
                } catch {}
              }
              setNewVideoTitle('');
              setNewVideoSubtitle('');
              setNewVideoPrompt('');
              setNewVideoUrl('');
              handleClearPreview();
              fetchVideos();
            } else {
              showFeedback('error', data.error || 'Failed to upload video');
            }
          } catch {
            showFeedback('error', 'Failed to upload video');
          } finally {
            setIsAddingVideo(false);
          }
        };
        reader.readAsDataURL(newVideoFile);
      } else {
        const res = await fetch('/api/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            videoUrl: newVideoUrl.trim(),
            title: newVideoTitle.trim() || 'New AI Reel',
            subtitle: newVideoSubtitle.trim() || `${newVideoBadge} Showcase Generation`,
            badge: newVideoBadge,
            prompt: newVideoPrompt.trim() || 'SEE DANCE Generation Reel'
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showFeedback('success', '🎉 Video link published live to website slider!');
          if (data.video) {
            try {
              saveShowcaseVideoToFirestore(data.video);
            } catch {}
          }
          setNewVideoTitle('');
          setNewVideoSubtitle('');
          setNewVideoPrompt('');
          setNewVideoUrl('');
          handleClearPreview();
          fetchVideos();
        } else {
          showFeedback('error', data.error || 'Failed to add video');
        }
        setIsAddingVideo(false);
      }
    } catch {
      showFeedback('error', 'Network error adding video');
      setIsAddingVideo(false);
    }
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Initial data fetch - sequential so deleted orders are cached BEFORE active orders load
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchDeletedOrders(true);
      await fetchOrders(false);
      fetchStats();
      fetchQR();
      fetchMessages();
      fetchEmails();
      fetchAuditLogs();
      fetchDatabaseStatus();
      fetchPaymentHealth();
      fetchVideos();
    };
    loadInitialData();
  }, [token]);

  // Real-Time Server-Sent Events (SSE) Stream
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectStream = () => {
      try {
        const streamUrl = `/api/admin/live-stream?token=${encodeURIComponent(token)}`;
        es = new EventSource(streamUrl);

        es.onopen = () => {
          setLiveConnected(true);
        };

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'VIDEO_ADDED' || data.type === 'VIDEO_DELETED' || data.type === 'VIDEO_UPDATED') {
              fetchVideos();
            } else if (data.type === 'CONNECTED') {
              setLiveConnected(true);
              setLastRefreshedAt(new Date().toLocaleTimeString());
            } else if (data.type === 'PAYMENT_SUBMITTED' && data.order) {
              const incoming = data.order;
              if (!deletedIdsSetRef.current.has(incoming.id) && !deletedIdsSetRef.current.has(incoming.orderId)) {
                setAllOrders((prev) => {
                  const idx = prev.findIndex((o) => o.id === incoming.id || o.orderId === incoming.orderId);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = incoming;
                    return copy;
                  }
                  return [incoming, ...prev];
                });
                playPaymentChime();
                showFeedback('success', `🔔 New Payment for #${incoming.orderId} (₹${incoming.amount}) by ${incoming.customerName}`);
                fetchStats();
              }
            } else if (data.type === 'ORDER_CREATED' && data.order) {
              const incoming = data.order;
              if (!deletedIdsSetRef.current.has(incoming.id) && !deletedIdsSetRef.current.has(incoming.orderId)) {
                setAllOrders((prev) => {
                  const idx = prev.findIndex((o) => o.id === incoming.id || o.orderId === incoming.orderId);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = incoming;
                    return copy;
                  }
                  return [incoming, ...prev];
                });
                fetchStats();
              }
            } else if ((data.type === 'ORDER_APPROVED' || data.type === 'ORDER_REJECTED' || data.type === 'ORDER_UPDATED' || data.type === 'ORDER_PAID' || data.type === 'ORDER_REFUNDED') && data.order) {
              const incoming = data.order;
              setAllOrders((prev) =>
                prev.map((o) => (o.id === incoming.id || o.orderId === incoming.orderId ? incoming : o))
              );
              if (data.type === 'ORDER_PAID') {
                playPaymentChime();
                showFeedback('success', `⚡ Instant Paid Order #${incoming.orderId} via ${incoming.paymentProvider?.toUpperCase() || 'Card'}!`);
              }
              fetchStats();
            } else if (data.type === 'ORDER_DELETED') {
              const ids = Array.isArray(data.orderIds) ? data.orderIds : [data.orderId];
              ids.forEach((id: string) => {
                if (id) deletedIdsSetRef.current.add(id);
              });
              setDeletedCount((c) => c + ids.length);
              setAllOrders((prev) => prev.filter((o) => !ids.includes(o.id) && !ids.includes(o.orderId)));
              fetchStats();
              fetchDeletedOrders(true);
            } else if (data.type === 'ORDERS_DELETED') {
              if (Array.isArray(data.orderIds)) {
                data.orderIds.forEach((id: string) => {
                  if (id) deletedIdsSetRef.current.add(id);
                });
                setDeletedCount((c) => c + data.orderIds.length);
                setAllOrders((prev) => prev.filter((o) => !data.orderIds.includes(o.id) && !data.orderIds.includes(o.orderId)));
              } else {
                fetchOrders(true);
              }
              fetchStats();
              fetchDeletedOrders(true);
            } else if (data.type === 'ORDER_RESTORED' && data.order) {
              deletedIdsSetRef.current.delete(data.order.id);
              deletedIdsSetRef.current.delete(data.order.orderId);
              setDeletedCount((c) => Math.max(0, c - 1));
              setAllOrders((prev) => [data.order, ...prev.filter((o) => o.id !== data.order.id && o.orderId !== data.order.orderId)]);
              fetchStats();
              fetchDeletedOrders(true);
            } else if (data.type === 'TRASH_EMPTIED') {
              fetchDeletedOrders(true);
              fetchStats();
            }
          } catch {
            // Heartbeat or ping
          }
        };

        es.onerror = () => {
          setLiveConnected(false);
          es?.close();
          reconnectTimeout = setTimeout(connectStream, 5000);
        };
      } catch {
        setLiveConnected(false);
      }
    };

    connectStream();

    return () => {
      if (es) es.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [token]);

  // Real-time Firestore Listener (Single long-lived subscription, never re-subscribed on tab click!)
  useEffect(() => {
    try {
      const unsubscribe = subscribeToLiveOrders((liveOrders) => {
        if (liveOrders && Array.isArray(liveOrders)) {
          const clean = liveOrders.filter(
            (o) => !deletedIdsSetRef.current.has(o.id) && !deletedIdsSetRef.current.has(o.orderId)
          );
          setAllOrders(clean);
          setLastRefreshedAt(new Date().toLocaleTimeString());
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Live subscription notice:', e);
    }
  }, [token]);

  // Gentle 45-second background health-sync (zero flickering, non-blocking)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
      fetchStats();
    }, 45000);
    return () => clearInterval(interval);
  }, [token]);

  // Active clean orders with deleted items guaranteed permanently filtered out
  const activeCleanOrders = useMemo(() => {
    const deleted = deletedIdsSetRef.current;
    return allOrders.filter((o) => !deleted.has(o.id) && !deleted.has(o.orderId));
  }, [allOrders, deletedCount]);

  // Computed displayed orders (zero lag, zero flash, deleted orders permanently filtered out)
  const orders = useMemo(() => {
    let res = activeCleanOrders;
    if (orderFilter !== 'ALL') {
      res = res.filter((o) => o.paymentStatus === orderFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      res = res.filter(
        (o) =>
          o.orderId.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerEmail.toLowerCase().includes(q) ||
          o.customerPhone.toLowerCase().includes(q) ||
          (o.paymentReference && o.paymentReference.toLowerCase().includes(q))
      );
    }
    return res;
  }, [activeCleanOrders, orderFilter, searchQuery]);

  const exportOrdersToCSV = () => {
    if (orders.length === 0 && allOrders.length === 0) {
      showFeedback('error', 'No orders available to export.');
      return;
    }
    const targetList = orders.length > 0 ? orders : allOrders;
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Plan Name',
      'Duration',
      'Amount (INR)',
      'Payment Status',
      'Payment Ref / UTR',
      'Order Date',
      'Access Link',
      'Admin Note'
    ];
    const rows = targetList.map((o) => [
      `"${o.orderId}"`,
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${(o.customerEmail || '').replace(/"/g, '""')}"`,
      `"${(o.customerPhone || '').replace(/"/g, '""')}"`,
      `"${(o.planName || '').replace(/"/g, '""')}"`,
      `"${(o.duration || '').replace(/"/g, '""')}"`,
      o.amount,
      o.paymentStatus,
      `"${(o.paymentReference || '').replace(/"/g, '""')}"`,
      `"${o.createdAt}"`,
      `"${(o.accessLink || '').replace(/"/g, '""')}"`,
      `"${(o.adminNote || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seedance_orders_${orderFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('success', `Exported ${targetList.length} orders to CSV successfully.`);
  };

  const handleFreshSync = async () => {
    setActionLoading(true);
    try {
      await fetchDeletedOrders(true);
      await fetchOrders(false);
      await fetchStats();
      await fetchQR();
      await fetchMessages();
      await fetchEmails();
      await fetchAuditLogs();
      await fetchDatabaseStatus();
      showFeedback('success', 'Admin panel refreshed with 100% fresh database state.');
    } catch {
      showFeedback('error', 'Failed to refresh admin panel.');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchDatabaseStatus = async () => {
    try {
      const res = await fetch('/api/admin/database-status', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (e) {
      console.error('Failed to load database status', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoadingOrders(true);
    try {
      // Fetch full order list from real database
      const res = await fetch('/api/admin/orders', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        const fullList: Order[] = data.orders || [];
        const cleanList = fullList.filter(
          (o) => !deletedIdsSetRef.current.has(o.id) && !deletedIdsSetRef.current.has(o.orderId)
        );
        setAllOrders(cleanList);
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  const fetchQR = async () => {
    try {
      const res = await fetch('/api/admin/qr', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setActiveQR(data.qr);
        if (data.qr?.upiId) setQrUpiId(data.qr.upiId);
        if (data.qr?.note) setQrNote(data.qr.note);
      }
    } catch (e) {
      console.error('Failed to load QR', e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/messages', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {}
  };

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/admin/emails', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (e) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {}
  };

  const fetchPaymentHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/admin/payment-health', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setPaymentHealth(data);
      }
    } catch (e) {
      console.error('Failed to load payment health', e);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleRefundOrder = async () => {
    if (!refundingOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${refundingOrder.id}/refund`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason: refundReason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('success', `Order #${refundingOrder.orderId} marked as REFUNDED.`);
        setAllOrders((prev) =>
          prev.map((o) => (o.id === refundingOrder.id ? data.order : o))
        );
        fetchStats();
        setRefundingOrder(null);
      } else {
        showFeedback('error', data.error || 'Failed to refund order.');
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error processing refund');
    } finally {
      setActionLoading(false);
    }
  };

  // Order Actions
  const handleApproveOrder = async (order?: Order, targetLink?: string) => {
    const targetOrder = order || approvingOrder;
    if (!targetOrder) return;
    setActionLoading(true);

    const linkToSend = targetLink?.trim() || customAccessLink.trim() || targetOrder.accessLink || 'https://www.dola.com/chat';

    try {
      const res = await fetch(`/api/admin/orders/${targetOrder.id}/approve`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ accessLink: linkToSend }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve order');

      showFeedback('success', `Order #${targetOrder.orderId} approved and access email dispatched!`);
      setApprovingOrder(null);
      setReviewingOrder(null);
      fetchOrders();
      fetchStats();
      fetchEmails();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error approving order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: Order['paymentStatus'],
    reason?: string,
    customLink?: string
  ) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ status, reason, accessLink: customLink }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');
      showFeedback('success', `Order status successfully updated to ${status}`);
      if (reviewingOrder && reviewingOrder.id === orderId) {
        setReviewingOrder(data.order);
      }
      fetchOrders();
      fetchStats();
      fetchEmails();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error updating order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (order: Order) => {
    setRejectingOrder(order);
    setRejectionReason('Payment could not be verified on UPI statement');
  };

  const handleConfirmRejectOrder = async () => {
    if (!rejectingOrder) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${rejectingOrder.id}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject order');

      showFeedback('success', `Order #${rejectingOrder.orderId} marked as REJECTED.`);
      setRejectingOrder(null);
      setReviewingOrder(null);
      fetchOrders();
      fetchStats();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error rejecting order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!notingOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${notingOrder.id}/note`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ note: adminNoteText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update note');

      showFeedback('success', 'Admin note saved.');
      setNotingOrder(null);
      fetchOrders();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendCustomerMessage = async () => {
    if (!messagingOrder || !customerMessageText.trim()) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${messagingOrder.id}/message`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ message: customerMessageText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch message');

      showFeedback('success', `Message dispatched to ${messagingOrder.customerEmail}`);
      setMessagingOrder(null);
      setCustomerMessageText('');
      fetchMessages();
      fetchEmails();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error sending message');
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch Deleted Orders (Trash) & populate persistent live blacklist
  const fetchDeletedOrders = async (silent = false) => {
    if (!silent) setLoadingDeleted(true);
    try {
      const res = await fetch('/api/admin/deleted-orders', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        const list = data.deletedOrders || [];
        setDeletedOrders(list);

        // Populate permanent memory blacklist of deleted items
        const newSet = new Set<string>();
        list.forEach((item: any) => {
          if (item.id) newSet.add(item.id);
          if (item.orderId) newSet.add(item.orderId);
          // Scrub lingering docs from Firestore asynchronously
          if (item.orderId) deleteOrderDirectlyFromFirestore(item.orderId).catch(() => {});
          if (item.id) deleteOrderDirectlyFromFirestore(item.id).catch(() => {});
        });
        deletedIdsSetRef.current = newSet;
        saveDeletedIdsToStorage(newSet);
        setDeletedCount(newSet.size);

        // Immediately eliminate from allOrders in memory
        setAllOrders((prev) => prev.filter((o) => !newSet.has(o.id) && !newSet.has(o.orderId)));
      }
    } catch (e) {
      console.error('Failed to load deleted orders', e);
    } finally {
      if (!silent) setLoadingDeleted(false);
    }
  };

  // Bulk Selection Handlers
  const toggleSelectAllOrders = () => {
    if (selectedOrderIds.length === orders.length && orders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Password Prompt Triggers
  const handleRequestDeleteSingle = (orderId: string, orderCode: string) => {
    setPasswordError(null);
    setAdminPasswordInput('');
    setPasswordModal({
      isOpen: true,
      title: `Delete Order #${orderCode}`,
      description: `Move this order to Deleted History (Trash). Your admin master password is required to confirm.`,
      actionType: 'DELETE_SINGLE',
      targetId: orderId,
      targetCode: orderCode,
    });
  };

  const handleRequestBulkDelete = () => {
    if (selectedOrderIds.length === 0) {
      showFeedback('error', 'Please select at least one order to delete.');
      return;
    }
    setPasswordError(null);
    setAdminPasswordInput('');
    setPasswordModal({
      isOpen: true,
      title: `Bulk Delete ${selectedOrderIds.length} Order(s)`,
      description: `Move ${selectedOrderIds.length} selected order(s) to Deleted History. Master password required.`,
      actionType: 'DELETE_BULK',
    });
  };

  const handleRequestPermanentPurge = (orderId: string, orderCode: string) => {
    setPasswordError(null);
    setAdminPasswordInput('');
    setPasswordModal({
      isOpen: true,
      title: `Permanently Purge #${orderCode}`,
      description: `Irreversibly delete this order from the database. This action cannot be undone.`,
      actionType: 'PERMANENT_PURGE',
      targetId: orderId,
      targetCode: orderCode,
    });
  };

  const handleRequestEmptyTrash = () => {
    if (deletedOrders.length === 0) {
      showFeedback('error', 'Deleted History is already empty.');
      return;
    }
    setPasswordError(null);
    setAdminPasswordInput('');
    setPasswordModal({
      isOpen: true,
      title: 'Empty All Deleted History',
      description: `Permanently delete all ${deletedOrders.length} archived order(s) from the database. Master password required.`,
      actionType: 'EMPTY_TRASH',
    });
  };

  // Execute Password-Protected Action
  const handleConfirmPasswordAction = async () => {
    if (!adminPasswordInput.trim()) {
      setPasswordError('Please enter your admin master password.');
      return;
    }

    setActionLoading(true);
    setPasswordError(null);

    try {
      if (passwordModal.actionType === 'DELETE_SINGLE') {
        if (!passwordModal.targetId) return;
        const targetId = passwordModal.targetId;
        const targetCode = passwordModal.targetCode;

        // Instant optimistic removal from UI & live blacklist
        if (targetId) deletedIdsSetRef.current.add(targetId);
        if (targetCode) deletedIdsSetRef.current.add(targetCode);
        setDeletedCount((c) => c + 1);
        setAllOrders((prev) => prev.filter((o) => o.id !== targetId && o.orderId !== targetCode));

        // Scrub Firestore immediately
        if (targetCode) deleteOrderDirectlyFromFirestore(targetCode).catch(() => {});
        if (targetId) deleteOrderDirectlyFromFirestore(targetId).catch(() => {});

        const res = await fetch(`/api/admin/orders/${targetId}`, {
          method: 'DELETE',
          headers: authHeaders,
          body: JSON.stringify({ password: adminPasswordInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete order');
        showFeedback('success', `Order #${targetCode} moved to Deleted History.`);
      } else if (passwordModal.actionType === 'DELETE_BULK') {
        if (selectedOrderIds.length === 0) return;
        const targets = [...selectedOrderIds];

        // Instant optimistic removal from UI & live blacklist
        targets.forEach((id) => {
          deletedIdsSetRef.current.add(id);
          deleteOrderDirectlyFromFirestore(id).catch(() => {});
        });
        setDeletedCount((c) => c + targets.length);
        setAllOrders((prev) => prev.filter((o) => !targets.includes(o.id) && !targets.includes(o.orderId)));

        const res = await fetch('/api/admin/orders/bulk-delete', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            orderIds: targets,
            password: adminPasswordInput.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to bulk delete orders');
        showFeedback('success', `${data.count || targets.length} order(s) moved to Deleted History.`);
        setSelectedOrderIds([]);
      } else if (passwordModal.actionType === 'PERMANENT_PURGE') {
        if (!passwordModal.targetId) return;
        const res = await fetch(`/api/admin/deleted-orders/${passwordModal.targetId}/permanent`, {
          method: 'DELETE',
          headers: authHeaders,
          body: JSON.stringify({ password: adminPasswordInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to purge order');
        showFeedback('success', `Order #${passwordModal.targetCode} permanently purged.`);
      } else if (passwordModal.actionType === 'EMPTY_TRASH') {
        const res = await fetch('/api/admin/deleted-orders/empty-trash', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ password: adminPasswordInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to empty trash');
        showFeedback('success', `Deleted history cleared (${data.count} items purged).`);
      } else if (passwordModal.actionType === 'PURGE_ALL_HISTORY') {
        const res = await fetch('/api/admin/history/purge-all', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ password: adminPasswordInput.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to purge all history');
        setAllOrders([]);
        setDeletedOrders([]);
        deletedIdsSetRef.current.clear();
        saveDeletedIdsToStorage(new Set());
        setDeletedCount(0);
        showFeedback('success', '✨ All old history and past logs completely wiped! Database is 100% fresh.');
      }

      setPasswordModal({ isOpen: false, title: '', description: '', actionType: 'DELETE_SINGLE' });
      setAdminPasswordInput('');
      fetchOrders();
      fetchDeletedOrders();
      fetchStats();
      fetchAuditLogs();
    } catch (err: any) {
      setPasswordError(err.message || 'Password authorization failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPurgeAllHistory = () => {
    setPasswordError(null);
    setAdminPasswordInput('');
    setPasswordModal({
      isOpen: true,
      title: 'Wipe All Old Test History (Fresh Start)',
      description: 'Permanently erase all old test orders, deleted history, customer messages, and previous test logs from SQLite, JSON, and Firestore. Your admin master password is required.',
      actionType: 'PURGE_ALL_HISTORY',
    });
  };

  // Restore Order from Trash
  const handleRestoreOrder = async (orderId: string, orderCode: string) => {
    setActionLoading(true);
    try {
      if (orderId) deletedIdsSetRef.current.delete(orderId);
      if (orderCode) deletedIdsSetRef.current.delete(orderCode);
      setDeletedCount((c) => Math.max(0, c - 1));

      const res = await fetch(`/api/admin/deleted-orders/${orderId}/restore`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore order');
      showFeedback('success', `Order #${orderCode} successfully restored to active list.`);
      fetchOrders();
      fetchDeletedOrders();
      fetchStats();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error restoring order');
    } finally {
      setActionLoading(false);
    }
  };

  // Download Full Database Backup
  const handleDownloadBackup = () => {
    window.open('/api/admin/backup/download', '_blank');
  };

  // QR Management Actions
  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showFeedback('error', 'Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback('error', 'Image size must not exceed 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setQrPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadQR = async () => {
    if (!qrPreview && !activeQR?.imageUrl) {
      showFeedback('error', 'Please select a QR code image to upload.');
      return;
    }

    setQrUploading(true);
    try {
      const res = await fetch('/api/admin/qr/upload', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          imageData: qrPreview || activeQR?.imageUrl,
          fileName: 'owner_payment_qr.png',
          upiId: qrUpiId.trim() || 'harishsingh9208@okaxis',
          note: qrNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update QR');

      showFeedback('success', 'Active Payment QR successfully updated for customers.');
      setQrPreview(null);
      fetchQR();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error uploading QR');
    } finally {
      setQrUploading(false);
    }
  };

  const handleRemoveQR = async () => {
    if (!window.confirm('Are you sure you want to deactivate the current payment QR? Customers will see an update message.')) return;

    try {
      const res = await fetch('/api/admin/qr/remove', {
        method: 'POST',
        headers: authHeaders,
      });

      if (!res.ok) throw new Error('Failed to remove QR');
      showFeedback('success', 'Payment QR deactivated.');
      fetchQR();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error removing QR');
    }
  };

  return (
    <div className="min-h-screen bg-[#07070e] text-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* Top Admin Header */}
      <header className="border-b border-white/10 bg-[#0c0c16]/90 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-300 shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 whitespace-nowrap min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide whitespace-nowrap">
              OWNER CONTROL PORTAL
            </h1>
            <span className="text-slate-600 text-xs hidden sm:inline select-none">•</span>
            <span className="text-[10px] sm:text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 whitespace-nowrap hidden sm:inline-flex">
              harishsingh9208@gmail.com
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time status indicator */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono ${
              liveConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
            title={liveConnected ? 'Real-time SSE push connected (<5ms)' : 'Reconnecting stream...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                liveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="font-semibold">{liveConnected ? 'LIVE STREAM' : 'SYNCING'}</span>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Payment audio chime ON (Click to mute)' : 'Payment audio chime MUTED (Click to unmute)'}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-white/[0.04] border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Quick Upload Video Reel button */}
          <button
            onClick={() => {
              setActiveTab('VIDEOS');
              fetchVideos();
            }}
            title="Upload videos from gallery or paste video link to show on website slider"
            className="px-2.5 py-1.5 rounded-lg bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Film className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="hidden sm:inline">Upload Reel</span>
          </button>

          {/* Fresh Force Sync */}
          <button
            onClick={handleFreshSync}
            disabled={actionLoading}
            title="Purge memory cache and reload 100% fresh state from database"
            className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Fresh Sync</span>
          </button>

          <button
            onClick={() => {
              if (onExitToSite) {
                onExitToSite();
              } else {
                window.location.href = '/';
              }
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-slate-300 border border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>← Exit to Website</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Floating Feedback Alert */}
      {feedbackMsg && (
        <div className="fixed top-16 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
            }`}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-xl bg-[#0d0c18] border border-white/10">
            <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
              <span>TOTAL ORDERS</span>
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white">{stats.totalOrders}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0a1a15] border border-emerald-500/40">
            <div className="text-[11px] font-mono text-emerald-300 mb-1 flex items-center justify-between">
              <span>PAID (INSTANT)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300">{stats.paidOrders || 0}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#14101e] border border-amber-500/30">
            <div className="text-[11px] font-mono text-amber-300 mb-1 flex items-center justify-between">
              <span>PENDING REVIEW</span>
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">{stats.pendingOrders}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1614] border border-emerald-500/30">
            <div className="text-[11px] font-mono text-emerald-300 mb-1 flex items-center justify-between">
              <span>APPROVED</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{stats.approvedOrders}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#1a0f1d] border border-purple-500/30">
            <div className="text-[11px] font-mono text-purple-300 mb-1 flex items-center justify-between">
              <span>REFUNDED</span>
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300">{stats.refundedOrders || 0}</div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-gradient-to-br from-[#120f26] to-[#1a1130] border border-purple-500/40">
            <div className="text-[11px] font-mono text-fuchsia-300 mb-1 flex items-center justify-between">
              <span>GLOBAL REVENUE</span>
              <DollarSign className="w-3.5 h-3.5 text-fuchsia-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-fuchsia-300">
              ${stats.totalRevenueUSD ?? 0}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              + ₹{stats.totalRevenue} INR
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ORDERS'
                ? 'bg-purple-600 text-white'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Orders Management ({stats.totalOrders})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('GATEWAYS');
              fetchPaymentHealth();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'GATEWAYS'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
            <span>Global Gateways &amp; Webhooks</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => {
              setActiveTab('VIDEOS');
              fetchVideos();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'VIDEOS'
                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/30'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-fuchsia-300" />
            <span>Showcase Videos &amp; Reels ({showcaseVideos.length})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
          </button>

          <button
            onClick={() => {
              setActiveTab('TRASH');
              fetchDeletedOrders();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'TRASH'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-300" />
            <span>Deleted History ({deletedOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('QR')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'QR'
                ? 'bg-purple-600 text-white'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Owner Payment QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('MESSAGES')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'MESSAGES'
                ? 'bg-purple-600 text-white'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Customer Messages ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EMAILS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'EMAILS'
                ? 'bg-purple-600 text-white'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Outbox Logs ({emails.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-purple-600 text-white'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Security Audit Trail</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('DATABASE');
              fetchDatabaseStatus();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'DATABASE'
                ? 'bg-purple-600 text-white'
                : 'bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Relational SQL &amp; Firebase</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: ORDERS MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            {/* ========================================================= */}
            {/* PROMINENT PENDING PAYMENTS SECTION (Requirements 4, 5, 6, 7) */}
            {/* ========================================================= */}
            {(() => {
              const pendingOrders = activeCleanOrders.filter((o) => o.paymentStatus === 'PENDING');
              return (
                <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-[#14101e] to-[#0c0c18] p-5 shadow-2xl backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                            PENDING PAYMENTS
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500 text-black shadow-lg">
                            PENDING: {pendingOrders.length}
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/70 mt-0.5">
                          Payments submitted via &quot;I HAVE PAID&quot;. Verify customer transaction on your UPI statement, then click Approve to dispatch access credentials.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                        Auto-sync 5s • Last: {lastRefreshedAt}
                      </span>
                      <button
                        onClick={() => {
                          fetchOrders();
                          fetchStats();
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer transition-all shadow-sm"
                        title="Reload latest orders from database"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                        <span>REFRESH ORDERS</span>
                      </button>
                    </div>
                  </div>

                  {/* Pending Orders Priority Cards */}
                  {pendingOrders.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-slate-300 font-medium">All payments processed</span>
                      <span className="text-[11px] text-slate-500">
                        When a customer clicks &quot;I HAVE PAID&quot;, their pending order will appear here immediately.
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3.5">
                      {pendingOrders.map((order) => {
                        const currentLink =
                          inlineAccessLinks[order.id] !== undefined
                            ? inlineAccessLinks[order.id]
                            : order.accessLink || 'https://www.dola.com/chat';

                        return (
                          <div
                            key={order.id}
                            className="p-4 rounded-xl bg-[#0e0d1d] border border-amber-500/30 hover:border-amber-400/50 transition-all shadow-lg space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  PENDING
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  #{order.orderId}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                  • {new Date(order.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-xs text-slate-400 mr-2">Amount:</span>
                                <span className="font-mono font-extrabold text-fuchsia-300 text-base">
                                  ₹{order.amount}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs p-3 rounded-lg bg-white/[0.02] border border-white/5">
                              <div>
                                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                                  Customer Details &amp; Mobile
                                </span>
                                <div className="font-semibold text-white">{order.customerName}</div>
                                <div className="text-slate-300 text-[11px] truncate max-w-[200px]">{order.customerEmail}</div>
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold shadow-sm">
                                    <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                    <span>{order.customerPhone}</span>
                                  </span>
                                  <a
                                    href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-colors"
                                    title="Open WhatsApp chat with customer"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`tel:${order.customerPhone}`}
                                    className="p-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 transition-colors"
                                    title="Call customer directly"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                                  Product &amp; Plan
                                </span>
                                <div className="font-semibold text-purple-300">
                                  SEE DANCE 2.5 + SEE DANCE 2.0
                                </div>
                                <div className="text-white">
                                  {order.planName} • <span className="text-slate-400">{order.duration}</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                                  Payment Reference (UTR)
                                </span>
                                {order.paymentReference ? (
                                  <span className="font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded block w-fit">
                                    {order.paymentReference}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">
                                    Customer submitted via &quot;I HAVE PAID&quot;
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Access Link and Action Buttons */}
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-white/5">
                              <div className="flex-1 flex items-center gap-2">
                                <label className="text-[11px] text-slate-400 shrink-0 font-medium">
                                  Access Link:
                                </label>
                                <input
                                  type="text"
                                  value={currentLink}
                                  onChange={(e) => {
                                    setInlineAccessLinks((prev) => ({
                                      ...prev,
                                      [order.id]: e.target.value,
                                    }));
                                  }}
                                  placeholder="https://www.dola.com/chat"
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
                                />
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setReviewingOrder(order)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                                >
                                  Review Details
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(order)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 cursor-pointer transition-colors disabled:opacity-50"
                                >
                                  REJECT PAYMENT
                                </button>
                                <button
                                  onClick={() => handleApproveOrder(order, currentLink)}
                                  disabled={actionLoading}
                                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>APPROVE PAYMENT</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Filter, Search & Export Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0d0c18] p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="flex gap-1.5 overflow-x-auto">
                  {[
                    { id: 'ALL', label: 'ALL', count: activeCleanOrders.length, color: 'purple' },
                    { id: 'PAID', label: 'PAID (VERIFIED)', count: activeCleanOrders.filter(o => o.paymentStatus === 'PAID').length, color: 'emerald' },
                    { id: 'PENDING', label: 'PENDING', count: activeCleanOrders.filter(o => o.paymentStatus === 'PENDING').length, color: 'amber' },
                    { id: 'APPROVED', label: 'APPROVED', count: activeCleanOrders.filter(o => o.paymentStatus === 'APPROVED').length, color: 'emerald' },
                    { id: 'REFUNDED', label: 'REFUNDED', count: activeCleanOrders.filter(o => o.paymentStatus === 'REFUNDED').length, color: 'purple' },
                    { id: 'REJECTED', label: 'REJECTED', count: activeCleanOrders.filter(o => o.paymentStatus === 'REJECTED').length, color: 'rose' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setOrderFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        orderFilter === tab.id
                          ? tab.id === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-sm'
                            : tab.id === 'APPROVED' || tab.id === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-sm'
                            : tab.id === 'REFUNDED'
                            ? 'bg-purple-500/20 text-purple-200 border border-purple-500/50 shadow-sm'
                            : tab.id === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-200 border border-rose-500/50 shadow-sm'
                            : 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                        tab.count > 0
                          ? tab.id === 'PENDING' ? 'bg-amber-500/30 text-amber-300' :
                            tab.id === 'APPROVED' || tab.id === 'PAID' ? 'bg-emerald-500/30 text-emerald-300' :
                            tab.id === 'REFUNDED' ? 'bg-purple-500/30 text-purple-300' :
                            tab.id === 'REJECTED' ? 'bg-rose-500/30 text-rose-300' :
                            'bg-purple-500/30 text-purple-300'
                          : 'bg-white/5 text-slate-500'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 whitespace-nowrap">
                  Showing {orders.length} of {activeCleanOrders.length}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by ID, email, name, phone, UTR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchOrders();
                    }}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  onClick={exportOrdersToCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                  title="Download orders as CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  onClick={() => fetchOrders()}
                  className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                  title="Refresh orders from database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedOrderIds.length > 0 && (
              <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-rose-500/15 border border-rose-500/30 shadow-md">
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-200">
                  <CheckSquare className="w-4 h-4 text-rose-400" />
                  <span>{selectedOrderIds.length} order(s) selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleRequestBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedOrderIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Orders Table */}
            <div className="rounded-2xl border border-white/10 bg-[#0c0c18] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.03] text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                    <tr>
                      <th className="w-10 px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={toggleSelectAllOrders}
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Select / Deselect all"
                        >
                          {orders.length > 0 && selectedOrderIds.length === orders.length ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3">Order ID &amp; Date</th>
                      <th className="px-4 py-3">Customer Details</th>
                      <th className="px-4 py-3">Plan &amp; Amount</th>
                      <th className="px-4 py-3">Payment Ref (UTR)</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          {loadingOrders ? (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                              <span className="text-xs text-slate-400">Loading orders...</span>
                            </div>
                          ) : (
                            <div className="max-w-md mx-auto space-y-2">
                              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400 mb-3">
                                <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <h3 className="text-sm font-bold text-white">
                                {searchQuery ? 'No matching orders found' : orderFilter !== 'ALL' ? `No ${orderFilter} orders` : 'Fresh Database Ready — No Active Orders'}
                              </h3>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {searchQuery
                                  ? 'Try searching with a different order ID, phone number, or customer name.'
                                  : orderFilter !== 'ALL'
                                  ? `There are currently 0 orders with status "${orderFilter}". Select "ALL" to view the full list.`
                                  : 'All old test history has been cleared. When new customer transactions arrive, they will appear here in real time with audio alerts.'}
                              </p>
                              <div className="pt-2 flex justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setOrderFilter('ALL');
                                    setSearchQuery('');
                                    fetchOrders();
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-white border border-white/10 transition-colors cursor-pointer"
                                >
                                  Reset Filters &amp; Refresh
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const isPending = order.paymentStatus === 'PENDING';
                        const isApproved = order.paymentStatus === 'APPROVED';
                        const isRejected = order.paymentStatus === 'REJECTED';
                        const isPaid = order.paymentStatus === 'PAID';
                        const isRefunded = order.paymentStatus === 'REFUNDED';
                        const isSelected = selectedOrderIds.includes(order.id);

                        return (
                          <tr key={order.id} className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-purple-500/10' : ''}`}>
                            {/* Checkbox */}
                            <td className="w-10 px-3 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectOrder(order.id)}
                                className="rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                              />
                            </td>
                            {/* Order ID & Date */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-white block">
                                  #{order.orderId}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(order.orderId, 'Order ID')}
                                  className="text-slate-500 hover:text-purple-300 p-0.5 rounded cursor-pointer transition-colors"
                                  title="Copy Order ID"
                                >
                                  {copiedText === order.orderId ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {new Date(order.createdAt).toLocaleString()}
                              </span>
                            </td>

                            {/* Customer Details */}
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-white">{order.customerName}</div>
                              <div className="text-slate-400 text-xs truncate max-w-[180px]">{order.customerEmail}</div>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-mono text-[11px] font-bold">
                                  <Phone className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                  <span>{order.customerPhone}</span>
                                </span>
                                <a
                                  href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                                  title="WhatsApp customer"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                                <a
                                  href={`tel:${order.customerPhone}`}
                                  className="p-1 rounded bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors"
                                  title="Call customer"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              </div>
                            </td>

                            {/* Plan & Amount */}
                            <td className="px-4 py-3.5">
                              <div className="text-white font-medium flex items-center gap-1.5 flex-wrap">
                                <span>{order.planName}</span>
                                {order.paymentProvider && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                                    {order.paymentProvider}
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-emerald-400 font-bold">
                                {order.currency === 'INR' ? `₹${order.amount}` : `$${order.amount} USD`}
                              </div>
                            </td>

                            {/* Payment Ref */}
                            <td className="px-4 py-3.5">
                              {order.paymentReference ? (
                                <button
                                  onClick={() => copyToClipboard(order.paymentReference || '', 'UTR Reference')}
                                  className="group flex items-center gap-1.5 font-mono text-[11px] bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded text-cyan-300 transition-colors cursor-pointer"
                                  title="Click to copy UTR"
                                >
                                  <span>{order.paymentReference}</span>
                                  {copiedText === order.paymentReference ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-600 italic text-xs">Not provided</span>
                              )}
                              {order.adminNote && (
                                <div className="mt-1 text-[10px] text-amber-300/80 bg-amber-500/10 px-1.5 py-0.5 rounded truncate max-w-[160px]">
                                  Note: {order.adminNote}
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5">
                              {isPaid && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit shadow-sm shadow-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  PAID (VERIFIED)
                                </span>
                              )}
                              {isApproved && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                  <CheckCircle2 className="w-3 h-3" />
                                  APPROVED
                                </span>
                              )}
                              {isPending && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  PENDING
                                </span>
                              )}
                              {isRefunded && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 w-fit">
                                  <RotateCcw className="w-3 h-3 text-purple-400" />
                                  REFUNDED
                                </span>
                              )}
                              {isRejected && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3" />
                                  REJECTED
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setReviewingOrder(order)}
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-slate-300 cursor-pointer transition-colors"
                                  title="Review full order details"
                                >
                                  Details
                                </button>

                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setApprovingOrder(order);
                                        setCustomAccessLink(order.accessLink || 'https://www.dola.com/chat');
                                      }}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer transition-colors"
                                      title="Verify payment and send access"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleOpenRejectModal(order)}
                                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 cursor-pointer transition-colors"
                                      title="Reject payment"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {(isPaid || isApproved) && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setApprovingOrder(order);
                                        setCustomAccessLink(order.accessLink || 'https://www.dola.com/chat');
                                      }}
                                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 cursor-pointer transition-colors"
                                      title="Resend access email / Re-approve"
                                    >
                                      Re-send
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRefundingOrder(order);
                                        setRefundReason('Customer requested refund / order cancellation');
                                      }}
                                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 cursor-pointer transition-colors"
                                      title="Mark order as Refunded"
                                    >
                                      Refund
                                    </button>
                                    <button
                                      onClick={() => handleOpenRejectModal(order)}
                                      className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 cursor-pointer transition-colors"
                                      title="Change status to Rejected"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {isRejected && (
                                  <button
                                    onClick={() => {
                                      setApprovingOrder(order);
                                      setCustomAccessLink(order.accessLink || 'https://www.dola.com/chat');
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer transition-colors"
                                    title="Approve previously rejected order"
                                  >
                                    Approve
                                  </button>
                                )}

                                {isRefunded && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'PENDING')}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 cursor-pointer transition-colors"
                                    title="Reopen order as Pending"
                                  >
                                    Reopen
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setMessagingOrder(order);
                                    setCustomerMessageText('');
                                  }}
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 cursor-pointer"
                                  title="Send customer message"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setNotingOrder(order);
                                    setAdminNoteText(order.adminNote || '');
                                  }}
                                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 cursor-pointer"
                                  title="Edit note"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleRequestDeleteSingle(order.id, order.orderId)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                                  title="Delete order (Authorizes with master admin password)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: DELETED HISTORY (TRASH) */}
        {/* ========================================================= */}
        {activeTab === 'TRASH' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c0c18] border border-rose-500/25 shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-rose-400" />
                    <span>DELETED HISTORY ARCHIVE</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {deletedOrders.length} ARCHIVED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Orders deleted from the active list are safely archived here. Search by customer or order, restore anytime, or authorize permanent purge with your master password.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleDownloadBackup}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-slate-200 border border-white/10 transition-colors cursor-pointer"
                  title="Download complete database snapshot as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Backup</span>
                </button>

                <button
                  onClick={handleRequestPurgeAllHistory}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600/30 to-amber-600/30 hover:from-rose-600/40 hover:to-amber-600/40 text-rose-200 border border-rose-500/40 transition-all cursor-pointer shadow-sm"
                  title="Permanently erase all old test history and reset databases 100% fresh"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Wipe All Old Test History</span>
                </button>

                <button
                  onClick={handleRequestEmptyTrash}
                  disabled={deletedOrders.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-40"
                  title="Permanently remove all deleted orders"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Empty All Trash</span>
                </button>

                <button
                  onClick={() => fetchDeletedOrders()}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                  title="Refresh deleted orders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDeleted ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Trash Search Bar */}
            <div className="flex items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search deleted orders by ID, name, email, UTR..."
                  value={deletedSearchQuery}
                  onChange={(e) => setDeletedSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              {deletedSearchQuery && (
                <button
                  onClick={() => setDeletedSearchQuery('')}
                  className="px-2.5 py-2 rounded-xl bg-white/[0.06] text-slate-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Trash Orders Table */}
            <div className="rounded-2xl border border-white/10 bg-[#0c0c18] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.03] text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Order ID &amp; Dates</th>
                      <th className="px-4 py-3">Customer Info</th>
                      <th className="px-4 py-3">Plan &amp; Amount</th>
                      <th className="px-4 py-3">Payment Details</th>
                      <th className="px-4 py-3">Deleted Record</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {(() => {
                      const filtered = deletedOrders.filter(o => {
                        if (!deletedSearchQuery.trim()) return true;
                        const q = deletedSearchQuery.toLowerCase();
                        return (
                          o.orderId.toLowerCase().includes(q) ||
                          o.customerName.toLowerCase().includes(q) ||
                          o.customerEmail.toLowerCase().includes(q) ||
                          o.customerPhone.toLowerCase().includes(q) ||
                          (o.paymentReference && o.paymentReference.toLowerCase().includes(q))
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                              <Trash2 className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                              <div className="text-slate-300 font-medium">
                                {deletedSearchQuery ? 'No matching deleted orders found.' : 'Deleted History is empty'}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                {deletedSearchQuery ? 'Try a different search term.' : 'When you delete orders from the active list, they will be archived here.'}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((order) => (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Order ID & Date */}
                          <td className="px-4 py-3.5">
                            <span className="font-mono font-bold text-white block">
                              #{order.orderId}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Ordered: {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </td>

                          {/* Customer Info */}
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-white">{order.customerName}</div>
                            <div className="text-slate-400 text-xs truncate max-w-[180px]">{order.customerEmail}</div>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-mono text-[11px]">
                                <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{order.customerPhone}</span>
                              </span>
                            </div>
                          </td>

                          {/* Plan & Amount */}
                          <td className="px-4 py-3.5">
                            <div className="text-white font-medium">{order.planName}</div>
                            <div className="font-mono text-fuchsia-300 font-bold">₹{order.amount}</div>
                          </td>

                          {/* Payment Details */}
                          <td className="px-4 py-3.5">
                            {order.paymentReference ? (
                              <span className="font-mono text-[11px] bg-white/[0.05] px-2 py-0.5 rounded text-cyan-300">
                                {order.paymentReference}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">No UTR</span>
                            )}
                            <div className="mt-1">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                                order.paymentStatus === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                                order.paymentStatus === 'PENDING' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                                'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </td>

                          {/* Deleted Record */}
                          <td className="px-4 py-3.5">
                            <div className="text-rose-300 font-medium text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3 text-rose-400" />
                              <span>{order.deletedAt ? new Date(order.deletedAt).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              By: {order.deletedBy || OWNER_EMAIL}
                            </div>
                          </td>

                          {/* Actions: Restore & Permanent Purge */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRestoreOrder(order.id, order.orderId)}
                                disabled={actionLoading}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer disabled:opacity-50"
                                title="Restore order back to active orders"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>

                              <button
                                onClick={() => handleRequestPermanentPurge(order.id, order.orderId)}
                                disabled={actionLoading}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                                title="Permanently delete from database (Master password required)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: OWNER QR MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'QR' && (
          <div className="max-w-3xl space-y-6">
            <div className="p-6 rounded-2xl bg-[#0c0c18] border border-white/10">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-400" />
                <span>Active Payment QR Code Settings</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                This is the exact payment QR displayed to all customers at checkout. Customers can NEVER upload their own QR. You hold total administrative authority over this image.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* QR Preview Box */}
                <div className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="text-xs text-slate-400 mb-2 font-mono">CUSTOMER-VISIBLE QR</div>
                  <div className="w-56 h-56 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                    {qrPreview ? (
                      <img src={qrPreview} alt="New QR Preview" className="w-full h-full object-contain" />
                    ) : activeQR?.active && activeQR.imageUrl ? (
                      <img src={activeQR.imageUrl} alt="Active QR" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-slate-500 text-xs">No active QR uploaded</div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 justify-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{activeQR?.active ? 'Replace QR' : 'Upload QR'}</span>
                    </button>

                    {activeQR?.active && (
                      <button
                        onClick={handleRemoveQR}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleQrFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Configuration Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      UPI ID (Displayed with 1-click copy button)
                    </label>
                    <input
                      type="text"
                      value={qrUpiId}
                      onChange={(e) => setQrUpiId(e.target.value)}
                      placeholder="e.g. harishsingh9208@okaxis"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white font-mono focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Internal Admin Note
                    </label>
                    <textarea
                      rows={2}
                      value={qrNote}
                      onChange={(e) => setQrNote(e.target.value)}
                      placeholder="e.g. Main Axis Bank UPI QR linked to Harish"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  {activeQR && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 space-y-1">
                      <div>Status: <span className={activeQR.active ? 'text-emerald-400 font-bold' : 'text-rose-400'}>{activeQR.active ? 'ACTIVE' : 'INACTIVE'}</span></div>
                      <div>Last Updated: {new Date(activeQR.uploadedAt).toLocaleString()}</div>
                      <div>Uploaded By: {activeQR.uploadedBy}</div>
                    </div>
                  )}

                  <button
                    onClick={handleUploadQR}
                    disabled={qrUploading}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {qrUploading ? 'Saving QR Configuration...' : 'Save & Publish QR'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CUSTOMER MESSAGES */}
        {/* ========================================================= */}
        {activeTab === 'MESSAGES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Customer Communications</h2>
              <span className="text-xs text-slate-400 font-mono">
                {messages.length} total messages dispatched
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c0c18] overflow-hidden">
              <div className="divide-y divide-white/[0.06]">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No customer messages sent yet. Use the message icon on any order to communicate with a buyer.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Order #{msg.orderId}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-purple-300 font-mono">{msg.customerEmail}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(msg.sentAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 bg-white/[0.03] p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: EMAIL OUTBOX LOGS */}
        {/* ========================================================= */}
        {activeTab === 'EMAILS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">System Email Outbox</h2>
                <p className="text-xs text-slate-400">
                  Track all automated owner payment alerts and customer access link dispatches.
                </p>
              </div>
              <button
                onClick={fetchEmails}
                className="p-2 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0c0c18] overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.03] text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {emails.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No emails in dispatch history.
                      </td>
                    </tr>
                  ) : (
                    emails.map((em) => (
                      <tr key={em.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                          {new Date(em.sentAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            em.type === 'CUSTOMER_ACCESS_LINK'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {em.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-200">{em.to}</td>
                        <td className="px-4 py-3 text-white font-medium">{em.subject}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-mono">
                            {em.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AUDIT LOGS */}
        {/* ========================================================= */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Security &amp; Activity Audit Log</h2>
            <div className="rounded-2xl border border-white/10 bg-[#0c0c18] overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.03] text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-purple-300">{log.adminUser}</td>
                      <td className="px-4 py-3 font-mono text-white">{log.action}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {log.orderId ? `#${log.orderId}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: RELATIONAL SQL & FIREBASE FIRESTORE STATUS */}
        {/* ========================================================= */}
        {activeTab === 'DATABASE' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0d0c18] p-4 rounded-2xl border border-white/10">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Dual Backend Engine Status</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronized persistence across SQLite Relational SQL and Firebase Firestore Cloud DB.
                </p>
              </div>

              <button
                onClick={fetchDatabaseStatus}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/10 text-white border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Refresh Status</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* SQLite Relational SQL Card */}
              <div className="p-6 rounded-2xl bg-[#0b0c16] border border-cyan-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Relational SQL Database</h3>
                      <span className="text-[11px] font-mono text-cyan-300">SQLite3 Relational Engine</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE &amp; ACTIVE
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Database Engine:</span>
                    <span className="font-mono text-white font-semibold">SQLite 3.x (ACID Compliant)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Storage Location:</span>
                    <span className="font-mono text-slate-300 text-[11px]">/data/seedance.sqlite</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Relational Tables:</span>
                    <span className="font-mono text-cyan-300">
                      {dbStatus?.sql?.tables ? dbStatus.sql.tables.join(', ') : 'orders, qr_config, audit_logs, messages, emails'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Total Orders in SQL:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {dbStatus?.sql?.totalOrdersInSql ?? stats.totalOrders}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Sync Pipeline:</span>
                    <span className="font-mono text-slate-300">Auto-commit on every order/action</span>
                  </div>
                </div>
              </div>

              {/* Firebase Firestore Card */}
              <div className="p-6 rounded-2xl bg-[#0b0c16] border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Firebase Firestore Cloud</h3>
                      <span className="text-[11px] font-mono text-amber-300">Google Cloud Platform</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CLOUD SYNCED
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Project ID:</span>
                    <span className="font-mono text-white font-semibold">citric-variety-vghtt</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Collections:</span>
                    <span className="font-mono text-amber-300">/orders, /system, /messages, /audit_logs</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Security Rules:</span>
                    <span className="font-mono text-emerald-400">Deployed &amp; Owner Protected</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-slate-400">Authorized Owner:</span>
                    <span className="font-mono text-purple-300">harishsingh9208@gmail.com</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">High Availability:</span>
                    <span className="font-mono text-emerald-400">Multi-region cloud replica</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: SHOWCASE VIDEOS & REELS */}
        {/* ========================================================= */}
        {activeTab === 'VIDEOS' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-fuchsia-950/40 via-[#140e1a] to-[#0c0c18] border border-fuchsia-500/30">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    <Film className="w-5 h-5" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                    SHOWCASE VIDEOS &amp; REELS MANAGEMENT
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Upload, delete, and organize 4K generation reels displayed on the customer-facing side-by-side slider.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchVideos}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingVideos ? 'animate-spin text-fuchsia-400' : ''}`} />
                  <span>Refresh ({showcaseVideos.length})</span>
                </button>
              </div>
            </div>

            {/* Upload / Add Video Form Card */}
            <div className="rounded-2xl bg-[#0a0a14] border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-fuchsia-400" />
                    <span>Upload &amp; Publish Video Reel to Screen</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a video directly from your device gallery or paste a video link. Published reels play live on the website slider.
                  </p>
                </div>

                {/* Upload Mode Selector: Gallery vs Link */}
                <div className="flex items-center bg-white/[0.05] p-1 rounded-xl border border-white/10 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUploadMode('GALLERY');
                      handleClearPreview();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      videoUploadMode === 'GALLERY'
                        ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FolderUp className="w-3.5 h-3.5" />
                    <span>Device Gallery / Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUploadMode('LINK');
                      handleClearPreview();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      videoUploadMode === 'LINK'
                        ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Link / URL</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateVideo} className="space-y-4">
                {/* MODE 1: Device Gallery File Upload */}
                {videoUploadMode === 'GALLERY' && (
                  <div className="space-y-3">
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/*,video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                    />

                    {!newVideoFile ? (
                      <div
                        onClick={() => videoFileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 hover:border-fuchsia-500/60 rounded-2xl p-6 text-center bg-white/[0.02] hover:bg-fuchsia-950/10 cursor-pointer transition-all group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                          <FolderUp className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">
                          Tap / Click to Choose Video from Phone Gallery or PC
                        </p>
                        <p className="text-xs text-slate-400 mb-3">
                          Select any video from your phone storage, photos app, or computer
                        </p>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/30">
                          Supports MP4, MOV, WEBM (Up to 100MB)
                        </span>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-[#0e0e1d] border border-fuchsia-500/30 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{newVideoFile.name}</p>
                              <p className="text-[11px] font-mono text-emerald-400">
                                Size: {(newVideoFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => videoFileInputRef.current?.click()}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors cursor-pointer"
                            >
                              Change Video
                            </button>
                            <button
                              type="button"
                              onClick={handleClearPreview}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        {/* Interactive Live Video Preview */}
                        {videoPreviewUrl && (
                          <div className="rounded-xl overflow-hidden bg-black/80 border border-white/10 p-2 flex flex-col items-center">
                            <p className="text-[11px] font-semibold text-slate-400 mb-2 self-start flex items-center gap-1.5">
                              <Play className="w-3 h-3 text-fuchsia-400" />
                              <span>Live Device Preview (Test video playback before uploading):</span>
                            </p>
                            <video
                              src={videoPreviewUrl}
                              controls
                              playsInline
                              className="max-h-56 max-w-full rounded-lg bg-black shadow-lg"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: Video Link / URL */}
                {videoUploadMode === 'LINK' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Paste Video Link / URL (MP4, WEBM, or hosted video stream)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. /videos/video_1_motion_ref.mp4 or https://..."
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                        />
                        {newVideoUrl.trim() && (
                          <button
                            type="button"
                            onClick={() => setVideoPreviewUrl(newVideoUrl.trim())}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-fuchsia-200 border border-fuchsia-500/40 transition-colors cursor-pointer shrink-0"
                          >
                            Preview Link
                          </button>
                        )}
                      </div>
                    </div>

                    {videoPreviewUrl && videoUploadMode === 'LINK' && (
                      <div className="rounded-xl overflow-hidden bg-black/80 border border-white/10 p-2 flex flex-col items-center">
                        <p className="text-[11px] font-semibold text-slate-400 mb-2 self-start flex items-center gap-1.5">
                          <Play className="w-3 h-3 text-cyan-400" />
                          <span>Link Stream Preview:</span>
                        </p>
                        <video
                          src={videoPreviewUrl}
                          controls
                          playsInline
                          className="max-h-56 max-w-full rounded-lg bg-black shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Video Metadata Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Cinema Screen Tsunami"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle</label>
                    <input
                      type="text"
                      placeholder="e.g. High-Impact Wave Physics"
                      value={newVideoSubtitle}
                      onChange={(e) => setNewVideoSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Model Engine</label>
                    <select
                      value={newVideoBadge}
                      onChange={(e) => setNewVideoBadge(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#141422] border border-white/10 text-white text-xs focus:outline-none focus:border-fuchsia-500"
                    >
                      <option value="SEEDANCE 2.5">SEE DANCE 2.5 Flagship</option>
                      <option value="SEEDANCE 2.0">SEE DANCE 2.0 Temporal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prompt / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Enter prompt or description used for this video..."
                    value={newVideoPrompt}
                    onChange={(e) => setNewVideoPrompt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Reels publish automatically to the public video showcase slider on the home screen.</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingVideo}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 shadow-md shadow-fuchsia-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    {isAddingVideo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing to Main Screen Slider...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload &amp; Publish Live to Screen</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Videos Grid */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Showcase Reels ({showcaseVideos.length} Active in Screen Slider)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ● Auto-Published Live
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fetchVideos();
                    showFeedback('success', 'Showcase reels synced live to website screen slider!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3 h-3 text-fuchsia-400" />
                  <span>Sync to Screen Slider</span>
                </button>
              </div>

              {loadingVideos ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-64 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
                  ))}
                </div>
              ) : showcaseVideos.length === 0 ? (
                <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-white/10">
                  <p className="text-slate-400 text-xs">No videos in showcase. Upload one using the form above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {showcaseVideos.map((video) => (
                    <div
                      key={video.id}
                      className="rounded-2xl bg-[#0e0e1a] border border-white/10 overflow-hidden flex flex-col justify-between hover:border-fuchsia-500/30 transition-all"
                    >
                      {/* Video Player */}
                      <div className="relative aspect-[9/16] bg-black">
                        <video
                          width="100%"
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover"
                        >
                          <source src={video.videoUrl} type="video/mp4" />
                          {video.videoUrl.startsWith('/') && (
                            <source src={video.videoUrl.replace(/^\//, '')} type="video/mp4" />
                          )}
                          Your browser does not support the video tag.
                        </video>
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md border ${
                              video.badge.includes('2.5')
                                ? 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/40'
                                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                            }`}
                          >
                            {video.badge}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase backdrop-blur-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                            ● LIVE ON SCREEN
                          </span>
                        </div>
                      </div>

                      {/* Video Info & Controls */}
                      <div className="p-3.5 space-y-2">
                        <div>
                          <h4 className="text-xs font-bold text-white truncate">{video.title}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{video.subtitle}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 italic font-mono">
                          &quot;{video.prompt}&quot;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5 font-mono">
                          <span>{video.resolution}</span>
                          <span>{video.fps} FPS</span>
                        </div>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(video.id)}
                            className="w-full py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Video</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: GLOBAL GATEWAYS & WEBHOOKS */}
        {/* ========================================================= */}
        {activeTab === 'GATEWAYS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0e161a] to-[#0c0c18] border border-emerald-500/30">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                    GLOBAL PAYMENT GATEWAYS &amp; WEBHOOKS
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Real-time multi-provider checkout for US, UK, Canada, Europe, UAE, Australia &amp; worldwide customers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchPaymentHealth}
                  disabled={loadingHealth}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
                  <span>Check Gateways Ping</span>
                </button>
              </div>
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stripe Card */}
              <div className="p-5 rounded-2xl bg-[#0d0c18] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm">
                      S
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Stripe Checkout</h3>
                      <span className="text-[11px] text-slate-400">Cards, Apple Pay, Google Pay</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    paymentHealth?.stripe?.configured
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {paymentHealth?.stripe?.configured ? 'ACTIVE' : 'READY'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Target Currency:</span>
                    <span className="font-mono text-emerald-400 font-bold">USD ($)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Plans Supported:</span>
                    <span className="font-mono text-white">$5 / $12 / $400</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Webhook Status:</span>
                    <span className="font-mono text-cyan-300">
                      {paymentHealth?.stripe?.webhookConfigured ? 'Signing Verified' : 'Standard Webhook'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Production Webhook Endpoint:</span>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-slate-300">
                    <span className="truncate flex-1">/api/webhooks/stripe</span>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/api/webhooks/stripe`, 'Stripe Webhook URL')}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                      title="Copy full Webhook URL"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* PayPal Card */}
              <div className="p-5 rounded-2xl bg-[#0d0c18] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-sm">
                      P
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">PayPal Global</h3>
                      <span className="text-[11px] text-slate-400">PayPal balance &amp; bank accounts</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    paymentHealth?.paypal?.configured
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {paymentHealth?.paypal?.configured ? 'ACTIVE' : 'READY'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Target Currency:</span>
                    <span className="font-mono text-blue-400 font-bold">USD ($)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Environment:</span>
                    <span className="font-mono text-white">{paymentHealth?.paypal?.mode || 'live'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Capture Endpoint:</span>
                    <span className="font-mono text-cyan-300">/api/payments/paypal/capture</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Production Webhook Endpoint:</span>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-slate-300">
                    <span className="truncate flex-1">/api/webhooks/paypal</span>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/api/webhooks/paypal`, 'PayPal Webhook URL')}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                      title="Copy full Webhook URL"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Crypto / Manual Card */}
              <div className="p-5 rounded-2xl bg-[#0d0c18] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Crypto &amp; UPI Hybrid</h3>
                      <span className="text-[11px] text-slate-400">USDT (TRC20), UPI QR</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ENABLED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Crypto Currency:</span>
                    <span className="font-mono text-amber-300 font-bold">USDT / BTC</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Domestic UPI QR:</span>
                    <span className="font-mono text-emerald-400">Integrated</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Auto Verification:</span>
                    <span className="font-mono text-slate-300">Tx Hash / UTR submission</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Protected Domain:</span>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-[11px] text-slate-300">
                    <span className="truncate flex-1">https://protectapk.com</span>
                    <button
                      onClick={() => copyToClipboard('https://protectapk.com', 'Domain')}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Configuration Guide */}
            <div className="p-5 rounded-2xl bg-[#090b14] border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Production Environment Configuration (.env)</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When ready to bind your live Stripe &amp; PayPal accounts on <code className="text-purple-300 font-mono">protectapk.com</code>, provide your keys in environment variables:
              </p>
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                <div><span className="text-purple-400">STRIPE_SECRET_KEY</span>=sk_live_...</div>
                <div><span className="text-purple-400">STRIPE_WEBHOOK_SECRET</span>=whsec_...</div>
                <div><span className="text-purple-400">PAYPAL_CLIENT_ID</span>=...</div>
                <div><span className="text-purple-400">PAYPAL_CLIENT_SECRET</span>=...</div>
              </div>
              <p className="text-[11px] text-emerald-400/80">
                ✓ The application gracefully handles test/demo sessions while waiting for API keys.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: APPROVE PAYMENT & DISPATCH ACCESS LINK */}
      {approvingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e0d1a] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Approve Payment &amp; Send Access
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Order #{approvingOrder.orderId} • {approvingOrder.customerName} ({approvingOrder.customerEmail})
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Selected Plan:</span>
                  <span className="text-white font-semibold">{approvingOrder.planName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Amount to Verify:</span>
                  <span className="text-emerald-400 font-mono font-bold">₹{approvingOrder.amount}</span>
                </div>
                {approvingOrder.paymentReference && (
                  <div className="flex justify-between text-slate-400 mt-1 pt-1 border-t border-white/5">
                    <span>Customer Reference:</span>
                    <span className="font-mono text-cyan-300">{approvingOrder.paymentReference}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Access Link to deliver to customer
                </label>
                <input
                  type="text"
                  value={customAccessLink}
                  onChange={(e) => setCustomAccessLink(e.target.value)}
                  placeholder="https://www.dola.com/chat"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Defaults to official access URL: https://www.dola.com/chat
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setApprovingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveOrder}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Approving & Sending...' : 'Approve & Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOMER MESSAGE */}
      {messagingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e0d1a] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Message Customer</h3>
            <p className="text-xs text-slate-400 mb-4">
              To: {messagingOrder.customerName} &lt;{messagingOrder.customerEmail}&gt;
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Message Content
              </label>
              <textarea
                rows={4}
                value={customerMessageText}
                onChange={(e) => setCustomerMessageText(e.target.value)}
                placeholder="Type your message regarding this order..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setMessagingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustomerMessage}
                disabled={actionLoading || !customerMessageText.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ADMIN NOTE */}
      {notingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e0d1a] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Admin Internal Note</h3>
            <p className="text-xs text-slate-400 mb-4">Order #{notingOrder.orderId}</p>

            <div className="mb-4">
              <textarea
                rows={3}
                value={adminNoteText}
                onChange={(e) => setAdminNoteText(e.target.value)}
                placeholder="Add internal remarks about this customer or transaction..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setNotingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REFUND ORDER */}
      {refundingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e0d1a] border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              Refund Order #{refundingOrder.orderId}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Customer: {refundingOrder.customerName} ({refundingOrder.customerEmail})
            </p>

            <div className="space-y-4 mb-6">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Plan:</span>
                  <span className="text-white font-semibold">{refundingOrder.planName}</span>
                </div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Amount:</span>
                  <span className="text-fuchsia-300 font-mono font-bold">
                    {refundingOrder.currency === 'INR' ? `₹${refundingOrder.amount}` : `$${refundingOrder.amount} USD`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Provider:</span>
                  <span className="font-mono text-cyan-300">{refundingOrder.paymentProvider?.toUpperCase() || 'DIRECT'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Refund Reason / Internal Remark
                </label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRefundingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundOrder}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
      {reviewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0c0c18] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Order Details: #{reviewingOrder.orderId}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        reviewingOrder.paymentStatus === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : reviewingOrder.paymentStatus === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {reviewingOrder.paymentStatus}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive order verification record from shared database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewingOrder(null)}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 12 Required Owner Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Customer Information */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 block font-bold">
                  Customer Information
                </span>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Customer Name:</span>
                  <span className="font-semibold text-white">{reviewingOrder.customerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-mono text-cyan-300">{reviewingOrder.customerEmail}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Phone / Mobile:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-emerald-300 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                      {reviewingOrder.customerPhone}
                    </span>
                    <a
                      href={`https://wa.me/${reviewingOrder.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-colors"
                      title="WhatsApp Customer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`tel:${reviewingOrder.customerPhone}`}
                      className="p-1 rounded bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 transition-colors"
                      title="Call Customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Product & Plan Information */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 block font-bold">
                  Plan &amp; Amount
                </span>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Selected Product:</span>
                  <span className="font-semibold text-purple-200">SEE DANCE 2.5 + SEE DANCE 2.0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Selected Plan:</span>
                  <span className="font-semibold text-white">{reviewingOrder.planName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-mono text-slate-300">{reviewingOrder.duration}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Official Price:</span>
                  <span className="font-mono font-extrabold text-fuchsia-300 text-sm">
                    ₹{reviewingOrder.amount}
                  </span>
                </div>
              </div>

              {/* Transaction Timestamps & Verification */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 block font-bold">
                  Submission &amp; Payment Ref
                </span>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Submission Date:</span>
                  <span className="font-mono text-white">
                    {new Date(reviewingOrder.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Submission Time:</span>
                  <span className="font-mono text-white">
                    {new Date(reviewingOrder.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Payment Reference (UTR):</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {reviewingOrder.paymentReference || 'Customer clicked "I HAVE PAID"'}
                  </span>
                </div>
              </div>

              {/* Internal Admin Remarks */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 block font-bold">
                  Admin Internal Note
                </span>
                <div className="text-slate-300 italic min-h-[48px] bg-white/[0.02] p-2 rounded-xl border border-white/5">
                  {reviewingOrder.adminNote || 'No internal note recorded yet.'}
                </div>
                <button
                  onClick={() => {
                    setNotingOrder(reviewingOrder);
                    setAdminNoteText(reviewingOrder.adminNote || '');
                  }}
                  className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                >
                  Edit internal note →
                </button>
              </div>
            </div>

            {/* Access/Delivery Link Field (Requirement 6 & 7) */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/20 via-black to-slate-950 border border-purple-500/30 space-y-2">
              <label className="block text-xs font-bold text-purple-200">
                Access / Delivery Link for Customer
              </label>
              <input
                type="text"
                value={
                  inlineAccessLinks[reviewingOrder.id] !== undefined
                    ? inlineAccessLinks[reviewingOrder.id]
                    : reviewingOrder.accessLink || 'https://www.dola.com/chat'
                }
                onChange={(e) => {
                  setInlineAccessLinks((prev) => ({
                    ...prev,
                    [reviewingOrder.id]: e.target.value,
                  }));
                }}
                placeholder="https://www.dola.com/chat"
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono text-white focus:border-emerald-400 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400 block">
                Official default: <code className="text-cyan-300">https://www.dola.com/chat</code>. The owner can replace this URL before approving.
              </span>
            </div>

            {/* Decision Actions */}
            <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">
                  Override Status:{' '}
                  <span className="text-white font-bold">{reviewingOrder.paymentStatus}</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {reviewingOrder.paymentStatus !== 'PENDING' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(reviewingOrder.id, 'PENDING')}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
                    >
                      Set Pending
                    </button>
                  )}
                  {reviewingOrder.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(reviewingOrder.id, 'PAID')}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors"
                    >
                      Set Paid
                    </button>
                  )}
                  {reviewingOrder.paymentStatus !== 'REFUNDED' && (
                    <button
                      onClick={() => {
                        setRefundingOrder(reviewingOrder);
                        setRefundReason('Customer requested refund / order cancellation');
                      }}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors"
                    >
                      Refund
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                <button
                  onClick={() => setReviewingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Close Details
                </button>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => {
                      handleOpenRejectModal(reviewingOrder);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    REJECT PAYMENT
                  </button>
                  <button
                    onClick={() => {
                      const linkToSend =
                        inlineAccessLinks[reviewingOrder.id] ||
                        reviewingOrder.accessLink ||
                        'https://www.dola.com/chat';
                      handleApproveOrder(reviewingOrder, linkToSend);
                    }}
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors shadow-lg disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {reviewingOrder.paymentStatus === 'APPROVED' ? 'RE-SEND ACCESS EMAIL' : 'APPROVE PAYMENT'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REJECT ORDER (Non-blocking in-UI Modal) */}
      {/* ========================================================= */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e0d1a] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Reject Payment #{rejectingOrder.orderId}
                </h3>
                <p className="text-xs text-slate-400">
                  {rejectingOrder.customerName} ({rejectingOrder.customerEmail})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Reason for Rejection
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs text-white focus:border-rose-400 focus:outline-none mb-2"
              >
                <option value="Payment could not be verified on UPI statement" className="bg-[#121124]">
                  Payment could not be verified on UPI statement
                </option>
                <option value="Incorrect amount transferred" className="bg-[#121124]">
                  Incorrect amount transferred
                </option>
                <option value="Invalid or duplicate transaction reference" className="bg-[#121124]">
                  Invalid or duplicate transaction reference
                </option>
                <option value="Customer requested cancellation" className="bg-[#121124]">
                  Customer requested cancellation
                </option>
                <option value="Other" className="bg-[#121124]">
                  Other custom reason...
                </option>
              </select>

              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Specify rejection reason..."
                className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectOrder}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Reject Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADMIN MASTER PASSWORD CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e0d1d] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{passwordModal.title}</h3>
                <p className="text-xs text-rose-200/80">{passwordModal.description}</p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Admin Master Password
              </label>
              <input
                type="password"
                autoFocus
                placeholder="Enter admin password to authorize..."
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmPasswordAction();
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-sm focus:border-rose-400 focus:outline-none placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-500">
                Authorized for owner administrator ({OWNER_EMAIL})
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setPasswordModal({ isOpen: false, title: '', description: '', actionType: 'DELETE_SINGLE' });
                  setAdminPasswordInput('');
                  setPasswordError(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPasswordAction}
                disabled={actionLoading || !adminPasswordInput.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Verifying...' : 'Authorize Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
