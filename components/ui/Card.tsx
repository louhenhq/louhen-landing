import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '@/app/(site)/_lib/ui';

type CardProps = HTMLAttributes<HTMLDivElement>;

const baseShadow = '0 calc(var(--elevation-level1, 1) * 1px) calc(var(--elevation-level1, 1) * 8px) rgba(0, 0, 0, var(--overlay-hover, 0.08))';
const hoverShadow = '0 calc(var(--elevation-level2, 3) * 1px) calc(var(--elevation-level2, 3) * 12px) rgba(0, 0, 0, var(--overlay-pressed, 0.12))';
const hoverTranslate = 'calc(var(--spacing-xs, 4px) * 0.5)';

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, style, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'relative rounded-lg border border-border bg-[var(--semantic-color-surface-card,var(--semantic-color-bg-card))] p-lg shadow-[var(--card-shadow)] outline-none transition-transform duration-base focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[color:var(--semantic-color-focus-ring,var(--semantic-color-border-focus))] motion-safe:hover:-translate-y-[var(--card-hover-translate)] motion-safe:hover:shadow-[var(--card-shadow-hover)]',
        className,
      )}
      style={
        {
          '--card-shadow': baseShadow,
          '--card-shadow-hover': hoverShadow,
          '--card-hover-translate': hoverTranslate,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
});
