import React, { useEffect, useRef, useState, useId } from 'react';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';
import { AiModel } from '../data/aiModelsData';
import { LanguageCode, getTranslation } from '../lib/translations';

interface DataPoint {
  day?: string;
  value?: number;
}

interface ModelPerformanceGraphProps {
  model: AiModel;
  trendData: { day: string; value: number }[];
  growth: string;
  color?: string;
  height?: number;
  isDarkMode?: boolean;
  currentLang?: LanguageCode;
}

export const ModelPerformanceGraph: React.FC<ModelPerformanceGraphProps> = ({
  model,
  trendData,
  growth,
  color = '#06B6D4',
  height = 48,
  isDarkMode = true,
  currentLang = 'en',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: number; x: number; y: number } | null>(null);
  const uniqueId = useId().replace(/:/g, '');

  // Parse numerical score for the benchmark bar
  const parseScore = (str: string): number => {
    const match = str.match(/(\d+(\.\d+)?)/);
    if (!match) return 88;
    const num = parseFloat(match[1]);
    if (num <= 100) return num;
    if (num > 100 && num <= 1500) return Math.min(99, Math.round((num / 1400) * 100));
    return 92;
  };

  const benchmarkPercent = parseScore(model.benchmark);

  // Reliable IntersectionObserver directly on the DOM node
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '40px 0px 40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!trendData || trendData.length < 2) return null;

  const values = trendData.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 240;
  const paddingY = 6;
  const paddingX = 8;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  // Compute smooth curve points
  const points = values.map((val, idx) => {
    const x = paddingX + (idx / (values.length - 1)) * usableWidth;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y, day: trendData[idx].day, value: val };
  });

  // Generate cubic bezier SVG path
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    linePath += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  // Area path closing at the bottom
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const lastPoint = points[points.length - 1];

  // Total path length estimation for stroke-dashoffset animation
  const estimatedPathLength = 320;

  return (
    <div
      ref={containerRef}
      className={`rounded-xl p-2.5 mb-2.5 border transition-all duration-300 relative select-none ${
        isDarkMode
          ? 'bg-[#050711]/90 border-white/[0.08] hover:border-cyan-500/30'
          : 'bg-slate-50/90 border-slate-200 hover:border-indigo-300'
      }`}
    >
      {/* Top Header: Trend Label + Growth + Benchmark Indicator */}
      <div className="flex items-center justify-between text-[10.5px] font-mono mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'} font-semibold flex items-center gap-1`}>
            <TrendingUp className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>{getTranslation(currentLang, 'performanceTrend')}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.2 rounded font-mono shadow-sm"
            style={{
              backgroundColor: `${color}18`,
              color: color,
              border: `1px solid ${color}35`,
            }}
          >
            {growth}
          </span>
        </div>
      </div>

      {/* Main Vector Graph Canvas */}
      <div className="relative w-full overflow-hidden rounded-lg" style={{ height }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id={`grad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="50%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>

            <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background horizontal grid guides */}
          <line
            x1={paddingX}
            y1={height * 0.25}
            x2={width - paddingX}
            y2={height * 0.25}
            stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height * 0.75}
            x2={width - paddingX}
            y2={height * 0.75}
            stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
            strokeDasharray="3 3"
          />

          {/* 1. Animated Gradient Area: Unrolls from left to right */}
          <path
            d={areaPath}
            fill={`url(#grad-${uniqueId})`}
            style={{
              clipPath: isInView
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                : 'polygon(0 0, 0 0, 0 100%, 0 100%)',
              opacity: isInView ? 1 : 0,
              transition: 'clip-path 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out',
            }}
          />

          {/* 2. Animated Line Path: Draws dynamically from 0 to full length on scroll */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${uniqueId})`}
            style={{
              strokeDasharray: estimatedPathLength,
              strokeDashoffset: isInView ? 0 : estimatedPathLength,
              transition: 'stroke-dashoffset 1.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* 3. Interactive Data Points along the curve */}
          {points.map((pt, idx) => (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(pt)}
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? 'scale(1)' : 'scale(0)',
                transformOrigin: `${pt.x}px ${pt.y}px`,
                transition: `all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${0.3 + idx * 0.1}s`,
              }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill={isDarkMode ? '#050711' : '#FFFFFF'}
                stroke={color}
                strokeWidth="2"
                className="hover:r-4 transition-all"
              />
            </g>
          ))}

          {/* 4. Glowing Beacon on the Latest Point */}
          <g
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'scale(1)' : 'scale(0)',
              transformOrigin: `${lastPoint.x}px ${lastPoint.y}px`,
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.95s',
            }}
          >
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="7"
              fill="none"
              stroke={color}
              strokeWidth="1.2"
              className="animate-ping opacity-60"
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="3.5"
              fill={color}
            />
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r="1.5"
              fill="#FFFFFF"
            />
          </g>
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className={`absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full px-2 py-1 rounded text-[10px] font-mono shadow-xl border whitespace-nowrap ${
              isDarkMode
                ? 'bg-slate-900/95 text-white border-cyan-500/40'
                : 'bg-white/95 text-slate-900 border-indigo-300'
            }`}
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${Math.max(4, (hoveredPoint.y / height) * 100 - 8)}%`,
            }}
          >
            <span className="font-bold text-cyan-400">{hoveredPoint.day}</span>:{' '}
            <span>{hoveredPoint.value} pts</span>
          </div>
        )}
      </div>

      {/* Benchmark Progress Track (Animates width in sync with scroll) */}
      <div className="mt-2 pt-1.5 border-t border-white/[0.06]">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
          <span className="text-slate-400 flex items-center gap-1 truncate">
            <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">Verified Intelligence Score</span>
          </span>
          <span className="font-bold tabular-nums" style={{ color }}>
            {model.benchmark}
          </span>
        </div>

        <div
          className={`h-1.5 w-full rounded-full overflow-hidden ${
            isDarkMode ? 'bg-white/[0.07]' : 'bg-slate-200'
          }`}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: isInView ? `${benchmarkPercent}%` : '0%',
              backgroundColor: color,
              boxShadow: isInView ? `0 0 8px ${color}80` : 'none',
              transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
            }}
          />
        </div>
      </div>
    </div>
  );
};
