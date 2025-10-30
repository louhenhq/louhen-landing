"use client";

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ForwardedRef,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn, focusRing, motion } from '@/app/(site)/_lib/ui';

type CardVariant = 'surface' | 'outline' | 'ghost';

type BaseCardProps = {
  variant?: CardVariant;
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
  testId?: string;
};

type CardAsDiv = BaseCardProps & Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  as?: 'div';
};

type CardAsButton = BaseCardProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  as: 'button';
};

type CardAsAnchor = BaseCardProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
  as: 'a';
};

type CardAsForm = BaseCardProps & Omit<FormHTMLAttributes<HTMLFormElement>, 'className'> & {
  as: 'form';
};

export type CardProps = CardAsDiv | CardAsButton | CardAsAnchor | CardAsForm;

const variantClasses: Record<CardVariant, string> = {
  surface: 'border border-border bg-bg-card shadow-card',
  outline: 'border border-border-strong bg-bg shadow-none',
  ghost: 'border border-transparent bg-transparent shadow-none',
};

export const Card = forwardRef<
  HTMLDivElement | HTMLButtonElement | HTMLAnchorElement,
  CardProps
>(function Card({ as = 'div', variant = 'surface', interactive = false, className, children, testId, ...rest }, ref) {
  const Component = (as ?? 'div') as 'div' | 'button' | 'a' | 'form';
  const isInteractive =
    interactive || Component === 'button' || Component === 'a';

  const cardClasses = cn(
    'rounded-2xl transition-[box-shadow,transform,background-color,border-color] duration-200 ease-out motion-reduce:duration-150',
    variantClasses[variant],
    isInteractive
      ? cn(
          motion.cardLift,
          'focus-within:shadow-elevated',
          'hover:border-border-strong focus-within:border-border-strong'
        )
      : null,
    isInteractive ? focusRing : null,
    className
  );

  if (Component === 'button') {
    const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    const { type, ...buttonRest } = buttonProps;
    return (
      <button
        ref={ref as ForwardedRef<HTMLButtonElement>}
        className={cardClasses}
        type={type ?? 'button'}
        data-testid={testId}
        {...buttonRest}
      >
        {children}
      </button>
    );
  }

  if (Component === 'a') {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        ref={ref as ForwardedRef<HTMLAnchorElement>}
        className={cardClasses}
        data-testid={testId}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  if (Component === 'form') {
    const formProps = rest as FormHTMLAttributes<HTMLFormElement>;
    return (
      <form ref={ref as ForwardedRef<HTMLFormElement>} className={cardClasses} data-testid={testId} {...formProps}>
        {children}
      </form>
    );
  }

  const divProps = rest as HTMLAttributes<HTMLDivElement>;
  return (
    <div ref={ref as ForwardedRef<HTMLDivElement>} className={cardClasses} data-testid={testId} {...divProps}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-xs px-lg pt-lg', className)} {...props} />
);

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-md px-lg', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between gap-sm px-lg pb-lg', className)} {...props} />
);
