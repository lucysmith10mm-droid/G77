import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Search,
  Menu,
  LogIn
} from 'lucide-react';
import { FrontierLogo } from './FrontierLogo';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { AppUser, getStoredTempUser } from '../lib/tempAuth';
import {
  LanguageCode,
  getTranslation
} from '../lib/translations';

interface MarketplaceNavbarProps {
  onOpenAuth: () => void;
  onOpenSearch: () => void;
  onOpenMenuDrawer: () => void;
  onToggleTheme: () => void;
  onDeployAny: () => void;
  isDarkMode?: boolean;
  currentLang?: LanguageCode;
}

export const MarketplaceNavbar: React.FC<MarketplaceNavbarProps> = ({
  onOpenAuth,
  onOpenSearch,
  onOpenMenuDrawer,
  onToggleTheme,
  onDeployAny,
  isDarkMode = true,
  currentLang = 'en',
}) => {
  const [currentUser, setCurrentUser] = useState<AppUser | FirebaseUser | null>(() => getStoredTempUser());

  useEffect(() => {
    // 1. Check stored temp user
    const stored = getStoredTempUser();
    if (stored) {
      setCurrentUser(stored);
    }

    // 2. Firebase auth state listener
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        const temp = getStoredTempUser();
        setCurrentUser(temp);
      }
    });

    // 3. Custom event listener for instant reactive changes
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
      unsub();
      window.removeEventListener('frontier_auth_changed', handleAuthChange);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-colors duration-200 w-full max-w-full ${
        isDarkMode
          ? 'bg-[#05070F]/90 border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.6)] text-white'
          : 'bg-white/95 border-slate-200 shadow-sm text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left Zone: Menu Button (Icon Only) + Modern Horizontal Frontier AI Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={onOpenMenuDrawer}
            id="btn-navbar-menu-drawer"
            className={`p-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center border shrink-0 ${
              isDarkMode
                ? 'text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-500/40 hover:border-cyan-400'
                : 'text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border-cyan-300'
            }`}
            title="Open platform navigation menu"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4 text-cyan-500" />
          </button>

          {/* Horizontal Frontier AI Logo */}
          <a href="#" className="flex items-center gap-2 hover:opacity-95 transition-opacity shrink-0">
            <FrontierLogo size="sm" isDarkMode={isDarkMode} />
          </a>
        </div>

        {/* Center Zone: Quick Links (Desktop only) */}
        <nav
          className={`hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          <a
            href="#models-marketplace"
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            {getTranslation(currentLang, 'catalogNav')}
          </a>
          <a
            href="#models-marketplace"
            onClick={(e) => {
              e.preventDefault();
              onDeployAny();
            }}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            {getTranslation(currentLang, 'instantKeysNav')}
          </a>
          <div className="flex items-center gap-1.5 text-emerald-500 font-mono text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{getTranslation(currentLang, 'modelsOnlineNav')}</span>
          </div>
        </nav>

        {/* Right Zone: Search, Dark/Light Mode, Sign In (Clean, uncluttered, Sign In never shifted) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Search Shortcut */}
          <button
            onClick={onOpenSearch}
            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              isDarkMode
                ? 'text-slate-300 bg-white/[0.05] hover:bg-white/[0.1] border-white/10 hover:border-cyan-400/40'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
            }`}
            title="Search 160+ AI models"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-cyan-500" />
            <span className="hidden xl:inline text-[11px] font-mono text-slate-400">
              {getTranslation(currentLang, 'search')}
            </span>
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            id="btn-theme-toggle"
            onClick={onToggleTheme}
            className={`p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center border shrink-0 shadow-sm ${
              isDarkMode
                ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/10 text-slate-200'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
          </button>

          {/* Dedicated Sign In / Profile Button (Proper position, never pushed aside) */}
          <button
            id="btn-navbar-signin"
            onClick={onOpenAuth}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 shadow-sm whitespace-nowrap ${
              currentUser
                ? isDarkMode
                  ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-900/50'
                  : 'text-emerald-900 bg-emerald-50 border-emerald-300'
                : isDarkMode
                ? 'text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 border-cyan-400/30'
                : 'text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 border-indigo-400/30'
            }`}
            title={currentUser ? `Signed in as ${currentUser.email}` : 'Sign In or Create Account'}
            aria-label="Account sign in"
          >
            {currentUser ? (
              <>
                <div className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0">
                  {currentUser.displayName
                    ? currentUser.displayName[0].toUpperCase()
                    : currentUser.email
                    ? currentUser.email[0].toUpperCase()
                    : 'U'}
                </div>
                <span className="max-w-[70px] sm:max-w-[110px] truncate hidden xs:inline">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="whitespace-nowrap">{getTranslation(currentLang, 'signIn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
