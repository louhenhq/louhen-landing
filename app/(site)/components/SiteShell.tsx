import type { ReactNode } from 'react';
import { layout } from '@/app/(site)/_lib/ui';

type SiteShellProps = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  skipToMainLabel?: string;
  showSkipLink?: boolean;
};

export default function SiteShell({
  header,
  footer,
  children,
  skipToMainLabel = 'Skip to main content',
  showSkipLink = false,
}: SiteShellProps) {
  return (
    <div className={layout.shell}>
      {showSkipLink ? (
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-1/2 focus-visible:top-sm focus-visible:-translate-x-1/2 focus-visible:inline-flex focus-visible:items-center focus-visible:rounded-pill focus-visible:border focus-visible:border-border focus-visible:bg-bg focus-visible:px-sm focus-visible:py-xs focus-visible:text-sm focus-visible:text-text focus-visible:shadow-card focus-visible:transition focus-visible:z-header focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {skipToMainLabel}
        </a>
      ) : null}
      {header ?? null}
      <main id="main-content" tabIndex={-1} className={layout.main}>
        {children}
      </main>
      {footer ?? null}
    </div>
  );
}
