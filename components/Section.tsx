import type { HTMLAttributes } from 'react';
import { cn } from '@/app/(site)/_lib/ui';

type SectionProps = HTMLAttributes<HTMLElement> & {
  pad?: 'md' | 'lg' | 'xl';
};

const PAD_CLASSES: Record<NonNullable<SectionProps['pad']>, string> = {
  md: 'py-lg',
  lg: 'py-xl',
  xl: 'py-2xl',
};

export default function Section({ className, pad = 'lg', children, ...rest }: SectionProps) {
  return (
    <section
      {...rest}
      className={cn('mx-auto w-full max-w-7xl px-gutter', PAD_CLASSES[pad], className)}
    >
      {children}
    </section>
  );
}
