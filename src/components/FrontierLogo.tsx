import React from 'react';

interface FrontierLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isDarkMode?: boolean;
}

export const FrontierLogo: React.FC<FrontierLogoProps> = ({
  className = '',
  size = 'md',
  isDarkMode = true,
}) => {
  const iconSize = size === 'sm' ? 'w-6 h-6 sm:w-7 sm:h-7' : size === 'lg' ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-7 h-7 sm:w-8 sm:h-8';
  const textTitleSize = size === 'sm' ? 'text-xs sm:text-sm' : size === 'lg' ? 'text-base sm:text-lg' : 'text-sm sm:text-base';

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none ${className}`}>
      {/* Sleek Neural Hexagon Aperture Emblem */}
      <div className={`relative ${iconSize} shrink-0 group`}>
        {/* Ambient Neon Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-xl blur-[4px] opacity-70 group-hover:opacity-100 transition-opacity" />

        <div className={`relative w-full h-full rounded-xl p-[1.5px] border shadow-md flex items-center justify-center overflow-hidden ${
          isDarkMode
            ? 'bg-[#090D1A] border-cyan-400/40'
            : 'bg-white border-cyan-500/50'
        }`}>
          <svg
            className="w-[80%] h-[80%] relative z-10"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="frontierGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#D946EF" />
              </linearGradient>
            </defs>

            {/* Futuristic Hexagonal Neural Core */}
            <path
              d="M20 4L34 12V28L20 36L6 28V12L20 4Z"
              stroke="url(#frontierGrad1)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner Neural Node Links */}
            <path
              d="M20 4V20M34 12L20 20M34 28L20 20M20 36V20M6 28L20 20M6 12L20 20"
              stroke="url(#frontierGrad1)"
              strokeWidth="1.8"
              strokeOpacity="0.8"
              strokeLinecap="round"
            />
            {/* Center Quantum Pulse Point */}
            <circle cx="20" cy="20" r="3.2" fill="#06B6D4" />
            <circle cx="20" cy="20" r="1.5" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Horizontal Wordmark Typography */}
      <div className="flex flex-col leading-none min-w-0">
        <span className={`font-black ${textTitleSize} tracking-tight font-display flex items-center gap-1.5`}>
          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
            FRONTIER
          </span>
          <span className="text-cyan-500 font-extrabold">AI</span>
        </span>
        <span className={`text-[8.5px] sm:text-[9.5px] font-mono tracking-wider uppercase font-semibold mt-0.5 truncate hidden xs:inline ${
          isDarkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          MODEL MARKETPLACE
        </span>
      </div>
    </div>
  );
};
