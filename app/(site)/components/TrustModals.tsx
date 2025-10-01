'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/app/(site)/_lib/ui';

type TrustModalProps = {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
  id: string;
};

function TrustModal({ open, title, body, onClose, id }: TrustModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previous = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>('button');
    first?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-bg/70 px-gutter" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className={cn('w-full max-w-lg rounded-2xl border border-border bg-bg-card px-gutter py-xl shadow-card')}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
      >
        <div className="flex flex-col gap-md">
          <div className="flex items-start justify-between gap-sm">
            <h2 id={`${id}-title`} className="text-h3 text-text">{title}</h2>
            <button type="button" className="text-label text-text-muted" aria-label="Close" onClick={onClose}>
              ×
            </button>
          </div>
          <p className="text-body text-text-muted leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

export default TrustModal;

export { TrustModal };
