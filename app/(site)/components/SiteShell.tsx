import type { ReactNode } from 'react';
import { layout } from '@/app/(site)/_lib/ui';

type SiteShellProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
  skipToMainLabel: string;
};

export default function SiteShell({ header, footer, children, skipToMainLabel }: SiteShellProps) {
  return (
    <div className={layout.shell}>
      <a href="#main-content" className="skip-link">
        {skipToMainLabel}
      </a>
      {header}
      <main id="main-content" className={layout.main}>
        {children}
      </main>
      {footer}
    </div>
  );
}
