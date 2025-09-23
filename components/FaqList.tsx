'use client';

import * as React from 'react';

export type FaqEntry = {
  q: string;
  a: string;
};

type FaqListProps = {
  faqs: FaqEntry[];
};

export function FaqList({ faqs }: FaqListProps) {
  const [openIndexes, setOpenIndexes] = React.useState<Set<number>>(() => new Set());

  const toggleIndex = React.useCallback((index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  return (
    <div className="divide-y divide-slate-200">
      {faqs.map((faq, index) => {
        const isOpen = openIndexes.has(index);
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div key={faq.q} className="py-4">
            <h2>
              <button
                id={buttonId}
                type="button"
                className="flex w-full items-center justify-between text-left text-lg font-medium text-slate-900 focus:outline-none focus-visible:ring"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleIndex(index)}
              >
                <span>{faq.q}</span>
                <span className="ml-2 text-sm text-slate-500">{isOpen ? '-' : '+'}</span>
              </button>
            </h2>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="mt-3 text-base text-slate-600"
            >
              {faq.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
