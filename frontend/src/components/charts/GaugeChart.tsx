"use client";

import { useEffect, useState } from "react";

interface GaugeChartProps {
  value: number; // 0-100
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "auto" | "success" | "warning" | "danger" | "brand" | "gradient";
  showTicks?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 140, height: 90, strokeWidth: 10, fontSize: "text-xl" },
  md: { width: 180, height: 110, strokeWidth: 12, fontSize: "text-2xl" },
  lg: { width: 240, height: 140, strokeWidth: 14, fontSize: "text-3xl" },
};

const variantColors = {
  success: { start: "#10b981", end: "#059669" },
  warning: { start: "#f59e0b", end: "#d97706" },
  danger: { start: "#ef4444", end: "#dc2626" },
  brand: { start: "var(--brand)", end: "var(--brand)" },
  gradient: { start: "#8b5cf6", end: "#ec4899" },
};

function getAutoColors(value: number) {
  if (value >= 70) return variantColors.success;
  if (value >= 40) return variantColors.warning;
  return variantColors.danger;
}

export function GaugeChart({
  value,
  label,
  size = "md",
  variant = "auto",
  showTicks = true,
  animated = true,
  className = "",
}: GaugeChartProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);
  const config = sizeConfig[size];
  const colors = variant === "auto" ? getAutoColors(value) : variantColors[variant];

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated]);

  const centerX = config.width / 2;
  const centerY = config.height - 10;
  const radius = config.width / 2 - config.strokeWidth - 5;

  const startAngle = Math.PI;
  const endAngle = 0;
  const angleRange = startAngle - endAngle;
  const valueAngle = startAngle - (displayValue / 100) * angleRange;

  const createArc = (start: number, end: number, r: number) => {
    const startX = centerX + r * Math.cos(start);
    const startY = centerY - r * Math.sin(start);
    const endX = centerX + r * Math.cos(end);
    const endY = centerY - r * Math.sin(end);
    const largeArc = Math.abs(start - end) > Math.PI ? 1 : 0;
    return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
  };

  const ticks = [];
  if (showTicks) {
    for (let i = 0; i <= 10; i++) {
      const tickAngle = startAngle - (i / 10) * angleRange;
      const innerRadius = radius - 8;
      const outerRadius = radius + 4;
      const x1 = centerX + innerRadius * Math.cos(tickAngle);
      const y1 = centerY - innerRadius * Math.sin(tickAngle);
      const x2 = centerX + outerRadius * Math.cos(tickAngle);
      const y2 = centerY - outerRadius * Math.sin(tickAngle);
      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#cbd5e1"
          strokeWidth={i % 5 === 0 ? 2 : 1}
        />
      );
    }
  }

  const gradientId = `gauge-${(label || "default").replace(/\s+/g, "-")}-${size}`;
  const needleLength = radius - 15;
  const needleX = centerX + needleLength * Math.cos(valueAngle);
  const needleY = centerY - needleLength * Math.sin(valueAngle);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="overflow-visible"
        role="img"
        aria-label={`${label || "Score"}: ${value}%`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
          <filter id={`shadow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
          <filter id={`glow-${gradientId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={createArc(startAngle, endAngle, radius)}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={createArc(startAngle, valueAngle, radius)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          filter={`url(#shadow-${gradientId})`}
        />

        {/* Tick marks */}
        {ticks}

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={8}
          fill="white"
          stroke="#e2e8f0"
          strokeWidth={2}
        />

        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke={colors.end}
          strokeWidth={3}
          strokeLinecap="round"
          filter={`url(#glow-${gradientId})`}
        />

        {/* Needle center dot */}
        <circle cx={centerX} cy={centerY} r={4} fill={colors.end} />
      </svg>

      {/* Value */}
      <div className="mt-1 text-center">
        <span className={`font-bold tabular-nums text-slate-900 ${config.fontSize}`}>
          {displayValue}%
        </span>
      </div>
    </div>
  );
}
