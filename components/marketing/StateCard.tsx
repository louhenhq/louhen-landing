import React from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn, layout, text } from '@/app/(site)/_lib/ui';
import { Button, Card } from '@/components/ui';

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
        <Card className="mx-auto flex max-w-3xl flex-col gap-xl px-gutter py-2xl sm:px-2xl sm:py-3xl">
          <div className={cn('flex flex-col gap-md', alignment)}>
            {icon ? <div className="text-display-lg" aria-hidden>{icon}</div> : null}
            <h1 className={cn(text.heading, 'text-balance')}>{title}</h1>
            {bodyContent}
          </div>
          <div className={cn('flex flex-col gap-sm sm:flex-row sm:justify-center sm:gap-md', align === 'start' ? 'sm:justify-start' : undefined)}>
            {ctas.map((cta) => {
              const kind = cta.kind ?? 'primary';
              return (
                <Link key={cta.label} href={cta.href} prefetch={false} passHref legacyBehavior>
                  <Button as="a" variant={kind === 'primary' ? 'primary' : 'secondary'} className="text-center">
                    {cta.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </section>
  );
}

export default StateCard;
