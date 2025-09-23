import type { InlineFaqEntry } from '@/lib/help/inlineFaq';
import { cn } from '@/app/(site)/_lib/ui';

type InlineFaqProps = {
  items: InlineFaqEntry[];
  variant?: 'inline' | 'card';
  className?: string;
};

export function InlineFaq({ items, variant = 'inline', className }: InlineFaqProps) {
  if (!items.length) return null;

  const base = variant === 'card'
    ? 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
    : '';

  return (
    <dl className={cn('space-y-4', base, className)}>
      {items.map((item) => (
        <div key={item.q} className="space-y-1">
          <dt className="font-medium text-slate-900">{item.q}</dt>
          <dd className="text-sm text-slate-600">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}
