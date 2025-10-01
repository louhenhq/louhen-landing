'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';

const DEFAULT_IMAGE_SRC = '/images/founder-and-twins.jpg';
const ALT_TEXT = 'Martin Weis with his twin sons Louis and Henry';

type FounderPhotoProps = {
  className?: string;
};

export default function FounderPhoto({ className }: FounderPhotoProps) {
  const [isFallback, setIsFallback] = useState(false);

  const handleError = useCallback(() => {
    setIsFallback(true);
  }, []);

  if (isFallback) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-xs rounded-2xl bg-gradient-to-br from-brand-mint/20 via-brand-teal/10 to-brand-secondary/20 px-md text-center text-body text-text-muted ${
          className ? className : ''
        }`}
        role="presentation"
      >
        <span className="text-label text-text">Founder & Twins</span>
        <span className="text-body-sm text-text-muted/80">(placeholder)</span>
      </div>
    );
  }

  return (
    <Image
      src={DEFAULT_IMAGE_SRC}
      alt={ALT_TEXT}
      width={1200}
      height={1400}
      sizes="(min-width: 1024px) 50vw, 100vw"
      className={`h-full w-full rounded-2xl object-cover ${className ?? ''}`.trim()}
      onError={handleError}
      loading="lazy"
    />
  );
}
