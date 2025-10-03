"use client";

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn, focusRing } from '@/app/(site)/_lib/ui';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, invalid = false, disabled, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      disabled={disabled}
      data-invalid={invalid ? 'true' : undefined}
      aria-invalid={invalid || undefined}
      className={cn(
        'relative h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-border bg-bg transition-[background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:duration-150',
        focusRing,
        'checked:border-brand-primary checked:bg-brand-primary',
        'before:pointer-events-none before:absolute before:inset-[3px] before:rounded-sm before:bg-brand-onPrimary before:opacity-0 before:transition-opacity before:duration-150 checked:before:opacity-100',
        'disabled:cursor-not-allowed disabled:opacity-60',
        invalid && 'border-feedback-error focus-visible:outline-feedback-error',
        className
      )}
      {...rest}
    />
  );
});

Checkbox.displayName = 'Checkbox';
