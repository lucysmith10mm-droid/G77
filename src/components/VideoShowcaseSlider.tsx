import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  Film,
  X,
  CheckCircle,
  AlertCircle,
  Zap,
  Layers,
  Database,
  ShieldCheck
} from 'lucide-react';
import { ShowcaseVideo } from '../types';
import {
  subscribeToShowcaseVideos,
  saveShowcaseVideoToFirestore,
  seedInitialVideosToFirestore
} from '../lib/firebase';

export const VideoShowcaseSlider: React.FC = () => {
  const [videos, setVideos] = useState<ShowcaseVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Playback states per video id
  const [playingMap, setPlayingMap] = useState<Record<string, boolean>>({});
  const [mutedMap, setMutedMap] = useState<Record<string, boolean>>({});
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [firestoreSynced, setFirestoreSynced] = useState<boolean>(false);
  const [fullscreenVideo, setFullscreenVideo] = useState<ShowcaseVideo | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Upload modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubtitle, setUploadSubtitle] = useState('');
  const [uploadBadge, setUploadBadge] = useState<'SEEDANCE 2.5' | 'SEEDANCE 2.0'>('SEEDANCE 2.5');
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Fetch videos from backend API and sync with Firestore
  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(data.videos);

          // Seed default videos to Firestore data service if not present
          seedInitialVideosToFirestore(data.videos).then(() => {
            setFirestoreSynced(true);
          }).catch(() => {});

          // STRICT: All videos start completely PAUSED and MUTED. Zero autoplay!
          const initialMuted: Record<string, boolean> = {};
          const initialPlaying: Record<string, boolean> = {};
          data.videos.forEach((v: ShowcaseVideo) => {
            initialMuted[v.id] = true;
            initialPlaying[v.id] = false;
          });
          setMutedMap(initialMuted);
          setPlayingMap(initialPlaying);
          setActivePlayingId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load showcase videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    // Subscribe to Firestore data service for real-time video updates
    const unsubscribeFirestore = subscribeToShowcaseVideos(
      (firestoreVideos) => {
        if (firestoreVideos && firestoreVideos.length > 0) {
          setVideos(firestoreVideos);
          setFirestoreSynced(true);
        }
      },
      (err) => {
        console.warn('Firestore live video sync note:', err);
      }
    );

    // SSE listener for new videos added in real-time from backend
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/admin/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'VIDEO_ADDED' || payload.type === 'VIDEO_DELETED') {
            fetchVideos();
          }
        } catch {}
      };
    } catch {}

    return () => {
      unsubscribeFirestore();
      if (eventSource) eventSource.close();
    };
  }, []);

  // Responsive navigation (scroll by 1 screen of 3 videos)
  const handleNext = () => {
    if (sliderTrackRef.current) {
      const scrollDist = sliderTrackRef.current.clientWidth;
      sliderTrackRef.current.scrollBy({ left: scrollDist, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (sliderTrackRef.current) {
      const scrollDist = sliderTrackRef.current.clientWidth;
      sliderTrackRef.current.scrollBy({ left: -scrollDist, behavior: 'smooth' });
    }
  };

  const handleTrackScroll = () => {
    if (sliderTrackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderTrackRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
      } else {
        setScrollProgress(0);
      }
      if (clientWidth > 0) {
        setCurrentPage(Math.round(scrollLeft / clientWidth));
      }
    }
  };

  // Toggle play for an individual video
  // CRITICAL RULE: No video autoplays.
  // When user clicks a video, ONLY that clicked video plays, and ONLY that video has audio.
  // All other videos are immediately paused and muted so there is zero overlap.
  const togglePlay = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const vid = videoRefs.current[id];
    if (!vid) return;

    if (activePlayingId === id && !vid.paused) {
      // If clicked while playing, pause and mute it
      vid.pause();
      vid.muted = true;
      setActivePlayingId(null);
      setPlayingMap({});
      setMutedMap((prev) => ({ ...prev, [id]: true }));
      return;
    }

    // 1. Immediately pause and mute ALL other videos on the page
    Object.entries(videoRefs.current).forEach(([otherId, el]) => {
      const otherVid = el as HTMLVideoElement | null;
      if (otherVid) {
        otherVid.pause();
        otherVid.muted = true;
      }
    });

    // 2. Play and unmute ONLY this clicked video
    vid.muted = false;
    try {
      vid.volume = 1.0;
    } catch {}

    const playPromise = vid.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setActivePlayingId(id);
          const nextPlaying: Record<string, boolean> = { [id]: true };
          const nextMuted: Record<string, boolean> = { [id]: false };
          videos.forEach((v) => {
            if (v.id !== id) {
              nextPlaying[v.id] = false;
              nextMuted[v.id] = true;
            }
          });
          setPlayingMap(nextPlaying);
          setMutedMap(nextMuted);
        })
        .catch(() => {
          // If browser policy requires initial muted start, retry muted then allow manual unmute
          vid.muted = true;
          vid.play().then(() => {
            setActivePlayingId(id);
            const nextPlaying: Record<string, boolean> = { [id]: true };
            const nextMuted: Record<string, boolean> = { [id]: true };
            videos.forEach((v) => {
              if (v.id !== id) {
                nextPlaying[v.id] = false;
                nextMuted[v.id] = true;
              }
            });
            setPlayingMap(nextPlaying);
            setMutedMap(nextMuted);
          }).catch((err) => {
            console.warn('Play error:', err);
            setActivePlayingId(null);
            setPlayingMap({});
          });
        });
    }
  };

  // Toggle Mute for the active or clicked video
  const toggleMute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRefs.current[id];
    if (!vid) return;

    if (vid.muted) {
      // Unmute this video: ensure all other videos are muted
      Object.entries(videoRefs.current).forEach(([otherId, el]) => {
        const otherVid = el as HTMLVideoElement | null;
        if (otherId !== id && otherVid) {
          otherVid.muted = true;
        }
      });
      vid.muted = false;
      const updatedMuted: Record<string, boolean> = {};
      videos.forEach((v) => {
        updatedMuted[v.id] = v.id !== id;
      });
      setMutedMap(updatedMuted);
    } else {
      vid.muted = true;
      setMutedMap((prev) => ({ ...prev, [id]: true }));
    }
  };

  const handleOpenFullscreen = (vid: ShowcaseVideo) => {
    // Pause and mute all background slider videos
    Object.values(videoRefs.current).forEach((el) => {
      const v = el as HTMLVideoElement | null;
      if (v) {
        v.pause();
        v.muted = true;
      }
    });
    setActivePlayingId(null);
    setPlayingMap({});
    setFullscreenVideo(vid);
  };

  const toggleFullscreen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRefs.current[id];
    if (!vid) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      vid.requestFullscreen().catch(() => {});
    }
  };

  const handleTimeUpdate = (id: string) => {
    const vid = videoRefs.current[id];
    if (!vid || !vid.duration) return;
    const progress = (vid.currentTime / vid.duration) * 100;
    setProgressMap((prev) => ({ ...prev, [id]: progress }));
  };

  // Upload video handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      if (selectedFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const res = await fetch('/api/videos/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileData: base64Data,
                fileName: selectedFile.name,
                title: uploadTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, ''),
                subtitle: uploadSubtitle.trim() || `${uploadBadge} Cinematic Reel`,
                badge: uploadBadge,
                prompt: uploadPrompt.trim() || 'Uploaded video generation',
              }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
              setUploadSuccess('Video uploaded and saved to data service!');
              // Also sync video directly to Firestore
              if (data.video) {
                saveShowcaseVideoToFirestore(data.video).catch(() => {});
              }
              resetUploadForm();
              await fetchVideos();
              setTimeout(() => {
                setIsUploadModalOpen(false);
                setUploadSuccess(null);
              }, 1200);
            } else {
              setUploadError(data.error || 'Failed to upload video.');
            }
          } catch (err: any) {
            setUploadError('Network error uploading video.');
          } finally {
            setIsUploading(false);
          }
        };
        reader.onerror = () => {
          setUploadError('Failed to read file from disk.');
          setIsUploading(false);
        };
        reader.readAsDataURL(selectedFile);
      } else if (videoUrlInput.trim()) {
        const res = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: videoUrlInput.trim(),
            title: uploadTitle.trim() || 'New AI Generation',
            subtitle: uploadSubtitle.trim() || `${uploadBadge} Generation Reel`,
            badge: uploadBadge,
            prompt: uploadPrompt.trim() || 'Custom AI Video link',
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setUploadSuccess('Video added and synced to data service!');
          if (data.video) {
            saveShowcaseVideoToFirestore(data.video).catch(() => {});
          }
          resetUploadForm();
          await fetchVideos();
          setTimeout(() => {
            setIsUploadModalOpen(false);
            setUploadSuccess(null);
          }, 1200);
        } else {
          setUploadError(data.error || 'Failed to add video.');
        }
        setIsUploading(false);
      } else {
        setUploadError('Please choose a video file or enter a video URL.');
        setIsUploading(false);
      }
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred.');
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadSubtitle('');
    setUploadPrompt('');
    setVideoUrlInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section id="showcase-videos" className="pt-1 pb-4 sm:pt-2 sm:pb-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Prominent Official Payment Logos Trust Strip (PayPal, Stripe, Wise, Crypto) - Clearly Visible & Screen Fitted */}
        <div className="w-full max-w-5xl mx-auto mb-3 sm:mb-4 px-1">
          <div className="rounded-2xl bg-[#0f0b24]/90 [html.light-theme_&]:bg-white border border-white/10 [html.light-theme_&]:border-slate-200 p-2.5 sm:p-3.5 shadow-lg backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-slate-300 [html.light-theme_&]:text-slate-700">
                  Official Instant Payment Methods
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-mono text-emerald-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>256-Bit SSL Encrypted</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-cyan-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Instant Auto-Dispatch</span>
                </span>
              </div>
            </div>

            {/* 4 Large, Clear Payment Brand Badges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* 1. PayPal */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/10 [html.light-theme_&]:border-slate-200 transition-all shadow-sm group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#003087]/20 [html.light-theme_&]:bg-sky-50 border border-sky-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.784.784 0 0 1 .773-.646h6.732c3.784 0 6.47 1.838 5.753 5.922-.647 3.684-3.13 5.617-6.52 5.617H9.288a.785.785 0 0 0-.773.646l-1.439 6.078z" fill="#003087"/>
                    <path d="M9.288 14.613h2.394c3.39 0 5.873-1.933 6.52-5.617.717-4.084-1.969-5.922-5.753-5.922H5.717a.784.784 0 0 0-.773.646L2.835 16.924a.64.64 0 0 0 .633.739h3.766l.827-3.488a.785.785 0 0 1 .773-.646l.454.084z" fill="#0079C1" opacity="0.9"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white [html.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>PayPal</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hidden min-[380px]:inline">Fast</span>
                  </div>
                  <p className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-600 truncate">1-Click Checkout</p>
                </div>
              </div>

              {/* 2. Stripe */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/10 [html.light-theme_&]:border-slate-200 transition-all shadow-sm group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#635BFF]/20 [html.light-theme_&]:bg-indigo-50 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="6" fill="#635BFF"/>
                    <path d="M14.6 13.8c0-.9.8-1.3 2-1.3 1.8 0 3.7.6 5.1 1.4v-4.1c-1.6-.7-3.4-1-5.1-1-4.4 0-7.3 2.3-7.3 6.2 0 6 8.3 5.1 8.3 7.7 0 1.1-1 1.5-2.3 1.5-2 0-4.3-.8-6-1.9v4.2c1.9.9 4 1.3 6 1.3 4.6 0 7.7-2.3 7.7-6.3 0-6.4-8.4-5.3-8.4-7.7z" fill="#fff"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white [html.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Stripe</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden min-[380px]:inline">Cards</span>
                  </div>
                  <p className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-600 truncate">Visa / Mastercard</p>
                </div>
              </div>

              {/* 3. Wise */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/10 [html.light-theme_&]:border-slate-200 transition-all shadow-sm group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#9FE870]/20 [html.light-theme_&]:bg-emerald-50 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="5" fill="#9FE870"/>
                    <path d="M5.5 16.5l3.5-9h4l-2.2 4.5h4.2l-5.5 8h-2l1.5-3.5H5.5z" fill="#163300"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white [html.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Wise</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden min-[380px]:inline">Bank</span>
                  </div>
                  <p className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-600 truncate">Global Transfer</p>
                </div>
              </div>

              {/* 4. Crypto */}
              <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] [html.light-theme_&]:bg-slate-50 [html.light-theme_&]:hover:bg-slate-100 border border-white/10 [html.light-theme_&]:border-slate-200 transition-all shadow-sm group">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/20 [html.light-theme_&]:bg-amber-50 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                  ₿
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-xs sm:text-sm text-white [html.light-theme_&]:text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Crypto</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden min-[380px]:inline">Web3</span>
                  </div>
                  <p className="text-[10px] text-slate-400 [html.light-theme_&]:text-slate-600 truncate">BTC & Tether USDT</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Static Fitted Premium Border Banner (No Marquee / No Scrolling - 100% Screen Fitted & Visible) */}
        <div className="w-full max-w-2xl mx-auto mb-3 px-1">
          <div className="relative p-[1.5px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 via-cyan-400 to-fuchsia-500 shadow-[0_2px_16px_rgba(168,85,247,0.22)]">
            <div className="rounded-[11px] sm:rounded-[15px] bg-gradient-to-r from-[#150e2e]/98 via-[#0e0a22]/98 to-[#150e2e]/98 [html.light-theme_&]:from-purple-50/95 [html.light-theme_&]:via-white [html.light-theme_&]:to-purple-50/95 py-2 px-3 sm:px-5 backdrop-blur-xl flex items-center justify-center text-center">
              
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-cyan-500 p-[1px] shrink-0 shadow-xs">
                  <div className="w-full h-full rounded-[6px] bg-[#0d091e] flex items-center justify-center text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xs min-[380px]:text-sm sm:text-base font-black tracking-tight text-white [html.light-theme_&]:text-slate-900 leading-none">
                  <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-200 [html.light-theme_&]:from-slate-900 [html.light-theme_&]:to-purple-900 bg-clip-text text-transparent">
                    Seedance 2.5 + 2.0
                  </span>{' '}
                  <span className="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-400 [html.light-theme_&]:from-purple-600 [html.light-theme_&]:to-indigo-600 bg-clip-text text-transparent">
                    Unlimited Without Limit
                  </span>
                </h3>
              </div>

            </div>
          </div>
        </div>

        {/* Videos Container: ONLY Reels Carousel Slider */}
        {loading ? (
          <div className="flex gap-2 sm:gap-3 py-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-[9/16] w-[70vw] max-w-[260px] sm:w-[260px] shrink-0 rounded-2xl bg-white/[0.03] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <Film className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
            <p className="text-slate-300 font-medium text-xs">No showcase videos loaded.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal Scrollable Track */}
            <div
              ref={sliderTrackRef}
              onScroll={handleTrackScroll}
              className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory py-2 no-scrollbar scroll-smooth w-full"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {videos.map((vid, idx) => {
                const isPlaying = playingMap[vid.id] ?? false;
                const isMuted = mutedMap[vid.id] ?? true;
                const isSeedance25 = vid.badge.includes('2.5');

                return (
                  <div
                    key={vid.id}
                    className="video-showcase-card shrink-0 w-[72vw] max-w-[270px] sm:w-[260px] md:w-[calc(33.333%-11px)] snap-center sm:snap-start group relative rounded-2xl overflow-hidden bg-[#0a0a16] border border-white/10 hover:border-fuchsia-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between"
                  >
                    {/* Native HTML5 Video Player in Perfect 9:16 Vertical Reel Ratio */}
                    <div 
                      className="relative w-full aspect-[9/16] bg-black flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => togglePlay(vid.id)}
                    >
                      <video
                        ref={(el) => {
                          if (el) {
                            el.muted = isMuted;
                            el.defaultMuted = isMuted;
                            el.playsInline = true;
                            el.setAttribute('playsinline', '');
                            el.setAttribute('webkit-playsinline', '');
                          }
                          videoRefs.current[vid.id] = el;
                        }}
                        width="100%"
                        poster={vid.thumbnailUrl || `/videos/thumb${(idx % 6) + 1}.jpg`}
                        preload="metadata"
                        autoPlay={false}
                        playsInline
                        loop
                        muted={isMuted}
                        src={`/api/videos/stream/${vid.id}`}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallbackTried) {
                            target.dataset.fallbackTried = 'true';
                            target.src = vid.videoUrl || `/videos/myvideo${(idx % 6) + 1}.mp4`;
                            target.load();
                          }
                        }}
                        onEnded={() => {
                          setActivePlayingId(null);
                          setPlayingMap((p) => ({ ...p, [vid.id]: false }));
                          setMutedMap((m) => ({ ...m, [vid.id]: true }));
                        }}
                        onPlay={() => {
                          setPlayingMap((p) => ({ ...p, [vid.id]: true }));
                        }}
                        onPause={() => {
                          if (activePlayingId === vid.id) {
                            setActivePlayingId(null);
                          }
                          setPlayingMap((p) => ({ ...p, [vid.id]: false }));
                        }}
                        className="w-full h-full object-cover bg-black"
                      />

                      {/* Top Floating Glass Header: Model Badge & 9:16 Tag */}
                      <div className="absolute top-0 inset-x-0 p-2.5 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
                        <div
                          className={`inline-flex items-center gap-1 h-5 px-2 rounded-full text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase border leading-none backdrop-blur-md shadow-sm ${
                            isSeedance25
                              ? 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/50'
                              : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                          }`}
                        >
                          {isSeedance25 ? (
                            <Zap className="w-2.5 h-2.5 text-fuchsia-400 shrink-0" />
                          ) : (
                            <Layers className="w-2.5 h-2.5 text-cyan-300 shrink-0" />
                          )}
                          <span>{vid.badge}</span>
                        </div>

                        <div className="flex items-center gap-1 pointer-events-auto">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black text-white/90 bg-black/60 border border-white/20 backdrop-blur-md">
                            9:16 REEL
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMute(vid.id, e);
                            }}
                            title={isMuted ? 'Unmute sound' : 'Mute sound'}
                            className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all cursor-pointer"
                          >
                            {isMuted ? (
                              <VolumeX className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Volume2 className="w-3 h-3 text-emerald-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFullscreen(vid);
                            }}
                            title="Watch fullscreen"
                            className="w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 backdrop-blur-md transition-all cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3 text-slate-300 hover:text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Center Play Indicator Overlay (Visible when paused) */}
                      {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[0.5px] transition-all group-hover:bg-black/20 select-none pointer-events-none">
                          <div className="relative flex items-center justify-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-fuchsia-950 border border-fuchsia-300/60 transform group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-white translate-x-0.5" />
                            </div>
                            <span className="animate-ping absolute inline-flex h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-fuchsia-400 opacity-30" />
                          </div>
                        </div>
                      )}

                      {/* Bottom Gradient Scrim Overlay with Title & Play Button */}
                      <div className="absolute bottom-0 inset-x-0 p-3 pt-8 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-10 flex items-end justify-between gap-2 pointer-events-auto">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-[9px] font-mono text-emerald-300 font-bold uppercase">
                              4K 60FPS CINEMATIC
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-black text-white truncate drop-shadow-sm" title={vid.title}>
                            {vid.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => togglePlay(vid.id, e)}
                          title={isPlaying ? 'Pause video' : 'Play video'}
                          className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md shadow-fuchsia-950 border border-fuchsia-400/40 transition-transform cursor-pointer shrink-0"
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Horizontal Scroll Indicator & Navigation Bar */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-2.5 sm:mt-3 select-none">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous videos"
                className="video-nav-arrow w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Sleek Horizontal Scroll Progress Track */}
              <div 
                className="video-scroll-track w-36 sm:w-56 h-1.5 bg-white/15 rounded-full overflow-hidden relative cursor-pointer"
                title="Click or drag to scroll through videos"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const pct = Math.max(0, Math.min(1, clickX / rect.width));
                  if (sliderTrackRef.current) {
                    const maxScroll = sliderTrackRef.current.scrollWidth - sliderTrackRef.current.clientWidth;
                    sliderTrackRef.current.scrollTo({
                      left: pct * maxScroll,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-full transition-all duration-150"
                  style={{
                    width: '33.333%',
                    transform: `translateX(${(scrollProgress * 2)}%)`,
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next videos"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Video Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0d0d1a] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-purple-950/50">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-lg font-bold text-white">Upload Showcase Video</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Add your video reel to the live side-by-side gallery and sync to your Firestore database service.
            </p>

            {uploadError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              {/* File Upload Drop Zone (Supports Video or Reference Image) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Upload Video File or Reference Image
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-fuchsia-500/50 rounded-xl p-3.5 text-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!uploadTitle) {
                          setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-300 text-xs font-medium">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <div className="flex flex-col items-start truncate">
                        <span className="truncate max-w-xs font-semibold">{selectedFile.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {selectedFile.type.startsWith('image/')
                            ? 'Reference Image (Will be animated into 9:16 reel by Seedance AI)'
                            : 'Direct Video Clip'} • {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Film className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">Select Video (.mp4, .mov) or Reference Image (.jpg, .png)</p>
                      <p className="text-[10px] text-slate-500">Connected to backend storage &amp; Firestore sync • Zero frontend freeze</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Or Video URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Or Paste Video URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /videos/filename.mp4 or https://..."
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              {/* Model Badge Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Model Engine</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadBadge('SEEDANCE 2.5')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      uploadBadge === 'SEEDANCE 2.5'
                        ? 'bg-fuchsia-600/30 text-fuchsia-200 border-fuchsia-500/60 shadow-sm'
                        : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-fuchsia-400" />
                    <span>SEEDANCE 2.5</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadBadge('SEEDANCE 2.0')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      uploadBadge === 'SEEDANCE 2.0'
                        ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500/60 shadow-sm'
                        : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3 h-3 text-cyan-300" />
                    <span>SEEDANCE 2.0</span>
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Cinema Screen Tsunami Wave"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              {/* Generative Prompt Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Generative Prompt Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe scene motion, depth, or camera rotation prompt..."
                  value={uploadPrompt}
                  onChange={(e) => setUploadPrompt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-transparent border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 shadow-md shadow-fuchsia-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Video...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Publish &amp; Sync</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Cinematic Video Player Modal */}
      {fullscreenVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn"
          onClick={() => setFullscreenVideo(null)}
        >
          <div 
            className="relative w-full max-w-md bg-[#0a0a14] border border-white/20 rounded-3xl overflow-hidden shadow-2xl shadow-purple-950/80 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-[#0e0e1d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                  fullscreenVideo.badge.includes('2.5')
                    ? 'bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/40'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                }`}>
                  {fullscreenVideo.badge}
                </span>
                <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PREVIEW</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenVideo(null)}
                aria-label="Close modal"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative aspect-[9/16] w-full max-h-[65vh] bg-black flex items-center justify-center overflow-hidden">
              <video
                src={`/api/videos/stream/${fullscreenVideo.id}`}
                poster={fullscreenVideo.thumbnailUrl || '/videos/thumb1.jpg'}
                controls
                autoPlay
                playsInline
                loop
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallbackTried) {
                    target.dataset.fallbackTried = 'true';
                    target.src = fullscreenVideo.videoUrl;
                    target.load();
                  }
                }}
                className="w-full h-full object-contain bg-black"
              />
            </div>

            {/* Modal Info */}
            <div className="p-4 bg-[#0e0e1a] border-t border-white/10 flex flex-col gap-1.5">
              <h4 className="text-sm font-bold text-white leading-tight">{fullscreenVideo.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{fullscreenVideo.prompt}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
