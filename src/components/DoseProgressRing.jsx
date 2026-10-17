import React from 'react';

/**
 * Circular "0/3 doses taken" indicator from the reference design.
 */
export default function DoseProgressRing({
  taken = 0,
  total = 0,
  label = 'doses taken',
  className = ''
}) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const safeTaken = Math.min(safeTotal, Math.max(0, Number(taken) || 0));
  const size = 72;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = safeTotal > 0 ? Math.min(1, Math.max(0, safeTaken / safeTotal)) : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${safeTaken} of ${safeTotal} ${label}`}
        className="flex-shrink-0 -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#d3ecdf"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#3bd979"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="font-headline-2 text-headline-2 text-on-surface font-bold">
          {safeTaken}/{safeTotal}
        </span>
        <span className="font-caption text-caption text-muted-text">{label}</span>
      </div>
    </div>
  );
}
