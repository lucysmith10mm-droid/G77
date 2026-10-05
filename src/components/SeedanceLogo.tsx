import React from 'react';

interface SeedanceLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  isDarkMode?: boolean;
}

export const SeedanceLogo: React.FC<SeedanceLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  isDarkMode = true,
}) => {
  // Dimensions based on size
  const iconSizeMap = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-10 h-10 sm:w-12 sm:h-12',
    xl: 'w-14 h-14 sm:w-16 sm:h-16',
  };

  const textSizeMap = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-xl sm:text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official Seedance AI Geometric Kinetic Wave / Aperture Emblem */}
      <div className={`relative ${iconSizeMap[size]} shrink-0 group`}>
        {/* Ambient Neon Back-Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500 via-indigo-500 to-cyan-400 rounded-xl blur-[6px] opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Outer Frame with Precision Border */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-b from-[#181135] to-[#0a0718] p-[1.5px] shadow-[0_2px_12px_rgba(168,85,247,0.35)] flex items-center justify-center overflow-hidden">
          {/* Internal Cyber Grid & Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-600/20 via-transparent to-cyan-400/20" />

          {/* Official Seedance AI Vector Emblem */}
          <svg
            className="w-[82%] h-[82%] relative z-10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Seedance Signature Primary Gradient (Cyan to Fuchsia) */}
              <linearGradient id="sdPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="35%" stopColor="#7000FF" />
                <stop offset="70%" stopColor="#FF007A" />
                <stop offset="100%" stopColor="#FF7A00" />
              </linearGradient>

              {/* Seedance Secondary Gradient (Neon Violet to Cyan) */}
              <linearGradient id="sdSecondary" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#818CF8" />
                <stop offset="100%" stopColor="#C084FC" />
              </linearGradient>

              {/* Core Glow Filter */}
              <filter id="sdGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Kinetic Outer Orbital Wave 1 (Top-Right Sweeping Arc) */}
            <path
              d="M 50 12 C 72 12 88 28 88 50 C 88 64 80 76 68 83 C 65 79 66 73 70 69 C 78 61 78 47 70 39 C 63 32 53 30 43 35 C 38 23 44 14 50 12 Z"
              fill="url(#sdPrimary)"
            />

            {/* Kinetic Outer Orbital Wave 2 (Bottom-Left Counter Arc forming dynamic 'S') */}
            <path
              d="M 50 88 C 28 88 12 72 12 50 C 12 36 20 24 32 17 C 35 21 34 27 30 31 C 22 39 22 53 30 61 C 37 68 47 70 57 65 C 62 77 56 86 50 88 Z"
              fill="url(#sdSecondary)"
            />

            {/* Central Neural Flow Loop (Interlocking Seedance 'S' Kinetic Ribbon) */}
            <path
              d="M 33 34 C 42 24 60 25 67 36 C 73 45 68 56 57 60 C 47 64 43 72 48 80 C 41 80 34 76 31 70 C 26 59 34 49 44 44 C 54 39 55 33 49 28 C 43 23 35 27 33 34 Z"
              fill="url(#sdPrimary)"
              opacity="0.95"
            />

            {/* Central AI Aperture Core Node */}
            <circle
              cx="50"
              cy="50"
              r="7.5"
              fill="#FFFFFF"
              filter="url(#sdGlow)"
            />
            <circle
              cx="50"
              cy="50"
              r="4.5"
              fill="#00F0FF"
            />

            {/* Ambient High-Tech Spark Accents */}
            <circle cx="78" cy="24" r="2.2" fill="#00F0FF" opacity="0.9" />
            <circle cx="22" cy="76" r="2.2" fill="#FF007A" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* Official Typography (if showText is true) */}
      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`font-black ${textSizeMap[size]} tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}>
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-200 [html.light-theme_&]:from-slate-950 [html.light-theme_&]:to-slate-800 bg-clip-text text-transparent">
                SEEDANCE
              </span>
              <span className="text-[9px] sm:text-[11px] font-mono font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 text-white shadow-xs whitespace-nowrap">
                2.5 + 2.0
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-cyan-400 [html.light-theme_&]:text-indigo-600 tracking-wider uppercase font-semibold">
            <span>OFFICIAL AI DIFFUSION</span>
          </div>
        </div>
      )}
    </div>
  );
};
