'use client';

import { useMemo } from 'react';
import tokens from '@louhen/design-tokens/build/web/tokens.json' assert { type: 'json' };
import { cn } from '@/app/(site)/_lib/ui';

const numericTokens = tokens as Record<string, string>;
const WIDTH = Number(numericTokens['--spacing-xxxl']) * 4;
const HEIGHT = Number(numericTokens['--spacing-xl']) * 2;
const STROKE_WIDTH = Number(numericTokens['--spacing-xs']) / 2;

if (Number.isNaN(WIDTH) || Number.isNaN(HEIGHT) || Number.isNaN(STROKE_WIDTH)) {
  throw new Error('Sparkline dimension tokens are not defined or numeric.');
}

type SparklineProps = {
  values: number[];
  className?: string;
  'aria-label'?: string;
};

export default function Sparkline({ values, className, 'aria-label': ariaLabel }: SparklineProps) {
  const { path, min, max } = useMemo(() => {
    if (!values.length) {
      return { path: '', min: 0, max: 0 };
    }
    const localMin = Math.min(...values);
    const localMax = Math.max(...values);
    const range = localMax - localMin || 1;
    const instructions = values.map((value, index) => {
      const x = values.length === 1 ? WIDTH / 2 : (index / (values.length - 1)) * WIDTH;
      const yRatio = (value - localMin) / range;
      const y = HEIGHT - yRatio * HEIGHT;
      const command = index === 0 ? 'M' : 'L';
      return `${command}${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return { path: instructions.join(' '), min: localMin, max: localMax };
  }, [values]);

  if (!path) {
    return (
      <div className={cn('text-xs text-text-muted', className)} aria-hidden>
        —
      </div>
    );
  }

  const description = ariaLabel ?? `values between ${min} and ${max}`;

  return (
    <svg
      className={cn('w-full', className)}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={description}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <title>{description}</title>
    </svg>
  );
}
