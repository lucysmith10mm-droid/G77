import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  day?: string;
  d?: string;
  value?: number;
  v?: number;
}

interface AnimatedSparklineProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  className?: string;
  isDarkMode?: boolean;
}

export const AnimatedSparkline: React.FC<AnimatedSparklineProps> = ({
  data,
  color = '#06B6D4',
  height = 36,
  className = '',
  isDarkMode = true,
}) => {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => (typeof d.value === 'number' ? d.value : typeof d.v === 'number' ? d.v : 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 200;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  // Calculate coordinates
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  // Build smooth cubic bezier curve
  let linePath = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    linePath += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  // Area path by closing down to the bottom
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const lastPoint = points[points.length - 1];
  const uniqueId = `sparkline-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full relative overflow-hidden select-none ${className}`} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Animated Gradient Area Fill */}
        <motion.path
          d={areaPath}
          fill={`url(#grad-${uniqueId})`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.9, delay: 0.2 }}
        />

        {/* Animated Line Drawing from Left to Right */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Animated Leading End Beacon */}
        <motion.circle
          cx={lastPoint.x - 1}
          cy={lastPoint.y}
          r="3"
          fill={color}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.9, duration: 0.3 }}
        />
        <motion.circle
          cx={lastPoint.x - 1}
          cy={lastPoint.y}
          r="5.5"
          fill="none"
          stroke={color}
          strokeWidth="1.2"
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 1.1, duration: 2, repeat: Infinity }}
        />
      </svg>
    </div>
  );
};
