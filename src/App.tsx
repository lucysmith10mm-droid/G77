import React, { useState, useEffect } from 'react';
import { MarketplaceNavbar } from './components/MarketplaceNavbar';
import { MarketplaceHero } from './components/MarketplaceHero';
import { AiModelMarketplace } from './components/AiModelMarketplace';
import { DeployModal } from './components/DeployModal';
import { ModelCompareDrawer } from './components/ModelCompareDrawer';
import { ModelDetailsModal } from './components/ModelDetailsModal';
import { NavigationMenuDrawer } from './components/NavigationMenuDrawer';
import { AuthModal } from './components/AuthModal';
import { AI_MODELS, AiModel } from './data/aiModelsData';
import { ExpandableInfo } from './components/ExpandableInfo';
import { Footer } from './components/Footer';
import { AiSupportModal } from './components/AiSupportModal';
import { DirectMessageModal } from './components/DirectMessageModal';
import { TopPromoBanner } from './components/TopPromoBanner';
import { SeeDance30DaysModal } from './components/SeeDance30DaysModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { testConnection } from './lib/firebase';
import { LanguageCode } from './lib/translations';

type AppRoute = 'CUSTOMER' | 'OWNER_LOGIN' | 'OWNER_DASHBOARD';

export default function App() {
  const [route, setRoute] = useState<AppRoute>('CUSTOMER');
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [selectedDeployModel, setSelectedDeployModel] = useState<AiModel | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedDetailsModel, setSelectedDetailsModel] = useState<AiModel | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [comparedModelIds, setComparedModelIds] = useState<string[]>([]);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('sd_lang');
    return (saved as LanguageCode) || 'en';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sd_theme');
    return saved !== 'light';
  });

  const handleSelectLang = (lang: LanguageCode) => {
    setCurrentLang(lang);
    localStorage.setItem('sd_lang', lang);
  };

  const handleDeployModel = (model: AiModel) => {
    setSelectedDeployModel(model);
    setIsDeployModalOpen(true);
  };

  const handleOpenDetails = (model: AiModel) => {
    setSelectedDetailsModel(model);
    setIsDetailsModalOpen(true);
  };

  const handleToggleCompare = (model: AiModel) => {
    setComparedModelIds((prev) => {
      if (prev.includes(model.id)) {
        return prev.filter((id) => id !== model.id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), model.id];
      }
      return [...prev, model.id];
    });
  };

  const handleRemoveCompare = (id: string) => {
    setComparedModelIds((prev) => prev.filter((mId) => mId !== id));
  };

  const handleClearCompare = () => {
    setComparedModelIds([]);
  };

  const handleScrollToMarketplace = () => {
    const el = document.getElementById('models-marketplace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    const input = document.getElementById('input-marketplace-search');
    if (input) {
      setTimeout(() => input.focus(), 400);
    }
  };

  const comparedModels = AI_MODELS.filter((m) => comparedModelIds.includes(m.id));

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
      localStorage.setItem('sd_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('sd_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Initialize and route based on private URL pathname, query, hash, and owner hotkey
  useEffect(() => {
    testConnection().catch((err) => console.log('Firebase connection initialized:', err));

    const checkRoute = async () => {
      const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      const isOwnerLoginTarget =
        pathname === '/owner-admin/login' ||
        pathname === '/admin/login' ||
        search.includes('owner-admin/login') ||
        search.includes('owner=login') ||
        hash.includes('owner-admin/login');

      const isOwnerDashboardTarget =
        pathname === '/owner-admin' ||
        pathname === '/admin' ||
        search.includes('owner-admin') ||
        search.includes('admin=true') ||
        hash.includes('owner-admin') ||
        hash.includes('#admin');

      // 1. Private Owner Admin Login Entry Point
      if (isOwnerLoginTarget) {
        if (window.location.pathname !== '/owner-admin/login') {
          window.history.replaceState({}, '', '/owner-admin/login');
        }
        const savedToken = localStorage.getItem('see_dance_admin_token');
        if (savedToken) {
          const isValid = await verifyAdminSession(savedToken);
          if (isValid) {
            setAdminToken(savedToken);
            window.history.replaceState({}, '', '/owner-admin');
            setRoute('OWNER_DASHBOARD');
            return;
          }
        }
        setRoute('OWNER_LOGIN');
        return;
      }

      // 2. Private Owner Admin Dashboard Entry Point
      if (isOwnerDashboardTarget) {
        const savedToken = localStorage.getItem('see_dance_admin_token');
        if (savedToken) {
          setIsVerifying(true);
          const isValid = await verifyAdminSession(savedToken);
          setIsVerifying(false);
          if (isValid) {
            if (window.location.pathname !== '/owner-admin') {
              window.history.replaceState({}, '', '/owner-admin');
            }
            setAdminToken(savedToken);
            setRoute('OWNER_DASHBOARD');
            return;
          }
        }
        window.history.replaceState({}, '', '/owner-admin/login');
        setRoute('OWNER_LOGIN');
        return;
      }

      // 3. Default Public Customer Website
      setRoute('CUSTOMER');
    };

    checkRoute();

    // Private owner keyboard shortcut: Ctrl+Shift+O (or Cmd+Shift+O)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        window.history.pushState({}, '', '/owner-admin/login');
        setRoute('OWNER_LOGIN');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const verifyAdminSession = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return !!data.valid;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    window.history.pushState({}, '', '/owner-admin');
    setRoute('OWNER_DASHBOARD');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('see_dance_admin_token');
    setAdminToken(null);
    window.history.replaceState({}, '', '/owner-admin/login');
    setRoute('OWNER_LOGIN');
  };

  const handleExitToSite = () => {
    window.location.href = '/';
  };

  // Route 1: Private Owner Admin Login Screen (/owner-admin/login)
  if (route === 'OWNER_LOGIN') {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToSite={handleExitToSite}
      />
    );
  }

  // Route 2: Private Owner Admin Dashboard (/owner-admin)
  if (route === 'OWNER_DASHBOARD') {
    if (isVerifying) {
      return (
        <div className="min-h-screen bg-[#07070e] flex items-center justify-center p-4 text-slate-100">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-slate-400">Verifying credentials...</span>
          </div>
        </div>
      );
    }

    if (adminToken) {
      return (
        <AdminDashboard
          token={adminToken}
          onLogout={handleAdminLogout}
          onExitToSite={handleExitToSite}
        />
      );
    }
  }

  // Route 3: Pure Public Customer Website ("/")
  // ABSOLUTELY NO ADMIN ACCESS, BUTTONS, COMPONENT OR RENDERED ADMIN ELEMENTS
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#05070F] text-slate-100' : 'bg-[#f4f6fb] text-slate-900'} flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-200 overflow-x-hidden w-full max-w-full relative`}>
      {/* Animated Top Flash Offer Banner: SEE DANCE 2.5 for 30 Days ($5) */}
      <TopPromoBanner
        onOpenOffer={() => setIsPromoModalOpen(true)}
        isDarkMode={isDarkMode}
      />

      {/* Modern Top Header (Horizontal Logo, Icon-Only Menu Button, Search, Theme Toggle, Language Selector, Sign In) */}
      <MarketplaceNavbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSearch={handleScrollToMarketplace}
        onOpenMenuDrawer={() => setIsMenuDrawerOpen(true)}
        onToggleTheme={toggleTheme}
        onDeployAny={() => {
          setSelectedDeployModel(AI_MODELS[0]);
          setIsDeployModalOpen(true);
        }}
        isDarkMode={isDarkMode}
        currentLang={currentLang}
      />

      {/* Main Page Sections */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {/* Compact Hero with 4 Quantitative Metrics & Mini Sparklines */}
        <MarketplaceHero
          onSearchClick={handleScrollToMarketplace}
          onExploreModels={handleScrollToMarketplace}
          onDeployModelDirect={() => {
            setSelectedDeployModel(AI_MODELS[0]);
            setIsDeployModalOpen(true);
          }}
          isDarkMode={isDarkMode}
          currentLang={currentLang}
        />

        {/* 160+ AI Models Dynamic Product Grid & Auto-Scroll Infinite Catalog */}
        <AiModelMarketplace
          onDeployModel={handleDeployModel}
          onOpenDetails={handleOpenDetails}
          onToggleCompare={handleToggleCompare}
          comparedModelIds={comparedModelIds}
          isDarkMode={isDarkMode}
          currentLang={currentLang}
        />

        {/* Technical FAQ & Specifications */}
        <ExpandableInfo isDarkMode={isDarkMode} />
      </main>

      {/* Customer Footer */}
      <Footer
        isDarkMode={isDarkMode}
        onSecretTrigger={() => {
          window.history.pushState({}, '', '/owner-admin/login');
          setRoute('OWNER_LOGIN');
        }}
      />

      {/* Deploy & API Key Provisioning Modal */}
      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        model={selectedDeployModel}
        isDarkMode={isDarkMode}
      />

      {/* Full Deep-Dive Model Details & Explanations Modal */}
      <ModelDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        model={selectedDetailsModel}
        onDeploy={(model) => {
          setIsDetailsModalOpen(false);
          handleDeployModel(model);
        }}
        isDarkMode={isDarkMode}
      />

      {/* Platform Navigation Drawer */}
      <NavigationMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onScrollToModels={handleScrollToMarketplace}
        onOpenDeployModal={() => {
          setSelectedDeployModel(AI_MODELS[0]);
          setIsDeployModalOpen(true);
        }}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenDirectMessage={() => setIsDirectMessageOpen(true)}
        isDarkMode={isDarkMode}
        currentLang={currentLang}
        onSelectLang={handleSelectLang}
      />

      {/* Dedicated Google Cloud & Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Model Compare Dock */}
      <ModelCompareDrawer
        comparedModels={comparedModels}
        onRemoveModel={handleRemoveCompare}
        onClearAll={handleClearCompare}
        onDeployModel={(model) => {
          handleDeployModel(model);
        }}
        isDarkMode={isDarkMode}
      />

      {/* 24/7 AI Chat Support Modal */}
      <AiSupportModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        isDarkMode={isDarkMode}
        currentLang={currentLang}
      />

      {/* Direct In-App Message Support Modal (NO website redirect) */}
      <DirectMessageModal
        isOpen={isDirectMessageOpen}
        onClose={() => setIsDirectMessageOpen(false)}
        isDarkMode={isDarkMode}
        currentLang={currentLang}
      />

      {/* SEE DANCE 2.5 30-Day Pass $5 Flash Offer Modal (PhonePe & UPI Payment) */}
      <SeeDance30DaysModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
