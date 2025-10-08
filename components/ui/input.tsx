"use client";

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn, focusRing } from '@/app/(site)/_lib/ui';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, disabled, type = 'text', ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      data-invalid={invalid ? 'true' : undefined}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full rounded-2xl border border-border bg-bg px-md py-sm text-body text-text placeholder:text-text-muted/80',
        'transition-[border-color,box-shadow,background-color,color] duration-200 ease-out motion-reduce:duration-150 motion-reduce:transition-[border-color,background-color,color]',
        focusRing,
        'disabled:cursor-not-allowed disabled:opacity-60',
        invalid && 'border-feedback-error focus-visible:outline-feedback-error',
        className
      )}
      {...rest}
    />
  );
});

Input.displayName = 'Input';
