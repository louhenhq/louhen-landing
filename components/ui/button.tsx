"use client";

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cn, focusRing, motion } from '@/app/(site)/_lib/ui';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type BaseButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  disabled?: boolean;
};

type ButtonAsButton = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    as?: 'button';
  };

type ButtonAsAnchor = BaseButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
    as: 'a';
    prefetch?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--semantic-color-button-primary-bg)] text-[var(--semantic-color-button-primary-fg)] motion-safe:hover:shadow-elevated',
  secondary:
    'border border-border bg-[var(--semantic-color-button-secondary-bg)] text-[var(--semantic-color-button-secondary-fg)] shadow-none hover:border-border-strong hover:bg-bg-card motion-safe:hover:shadow-card',
  ghost:
    'border border-transparent bg-transparent text-text shadow-none hover:bg-border/10',
  destructive:
    'bg-feedback-error text-brand-onPrimary motion-safe:hover:shadow-elevated',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-md text-body-sm font-medium',
  md: 'h-11 px-lg text-label font-semibold',
  lg: 'h-12 px-xl text-label font-semibold',
};

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(
  {
    as = 'button',
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingLabel,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    ...rest
  },
  forwardedRef
) {
  const Component = (as ?? 'button') as 'button' | 'a';
  const isAnchor = Component === 'a';
  const isDisabled = disabled || loading;

  const baseClasses = cn(
    'inline-flex items-center justify-center gap-sm rounded-2xl',
    'shadow-card',
    motion.interactive,
    focusRing,
    'disabled:pointer-events-none disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    loading && 'pointer-events-none',
    className
  );

  const content = (
    <span className="inline-flex items-center justify-center gap-sm">
      {loading ? <Spinner /> : leftIcon}
      <span className={loading ? 'opacity-70 transition-opacity duration-200 ease-out' : undefined}>{children}</span>
      {loading && loadingLabel ? <span className="sr-only">{loadingLabel}</span> : null}
      {!loading && rightIcon ? rightIcon : null}
    </span>
  );

  if (isAnchor) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
      prefetch?: boolean;
    };
    const { onClick, role, tabIndex, prefetch, ...anchorRest } = anchorProps;
    void prefetch;
    const anchorDisabled = isDisabled || !anchorProps.href;

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (anchorDisabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onClick?.(event);
    };

    return (
      <Component
        ref={forwardedRef as React.Ref<HTMLAnchorElement>}
        className={baseClasses}
        aria-busy={loading || undefined}
        aria-disabled={anchorDisabled || undefined}
        data-loading={loading ? 'true' : undefined}
        role={role ?? (anchorProps.href ? undefined : 'button')}
        tabIndex={anchorDisabled ? -1 : tabIndex}
        onClick={handleClick}
        {...anchorRest}
      >
        {content}
      </Component>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  const { type, ...buttonRest } = buttonProps;
  return (
    <button
      ref={forwardedRef as React.Ref<HTMLButtonElement>}
      className={baseClasses}
      type={type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      data-loading={loading ? 'true' : undefined}
      {...buttonRest}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';
