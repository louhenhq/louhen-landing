import React from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttons, cn, layout, text } from '@/app/(site)/_lib/ui';

type CTA = {
  href: string;
  label: string;
  kind?: 'primary' | 'secondary';
};

type StateCardProps = {
  icon?: ReactNode;
  title: string;
  body: ReactNode;
  ctas: CTA[];
  align?: 'center' | 'start';
};

export function StateCard({ icon, title, body, ctas, align = 'center' }: StateCardProps) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';
  const bodyClasses = cn(text.body, alignment === 'items-center text-center' ? 'mx-auto max-w-2xl' : 'max-w-2xl text-left');
  const bodyContent = typeof body === 'string' ? (
    <p className={bodyClasses}>{body}</p>
  ) : (
    <div className={bodyClasses}>{body}</div>
  );

  return (
    <section className={cn(layout.section, 'bg-bg')}>
      <div className={cn(layout.container)}>
        <div className={cn(layout.card, 'mx-auto flex max-w-3xl flex-col gap-xl px-gutter py-2xl sm:px-2xl sm:py-3xl')}>
          <div className={cn('flex flex-col gap-md', alignment)}>
            {icon ? <div className="text-4xl" aria-hidden>{icon}</div> : null}
            <h1 className={cn(text.heading, 'text-balance')}>{title}</h1>
            {bodyContent}
          </div>
          <div className={cn('flex flex-col gap-sm sm:flex-row sm:justify-center sm:gap-md', align === 'start' ? 'sm:justify-start' : undefined)}>
            {ctas.map((cta) => {
              const kind = cta.kind ?? 'primary';
              const className = kind === 'primary' ? buttons.primary : buttons.secondary;
              return (
                <Link key={cta.label} href={cta.href} prefetch={false} className={cn(className, 'text-center')}>
                  {cta.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StateCard;
