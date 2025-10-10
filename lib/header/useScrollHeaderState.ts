'use client';

import { useEffect, useRef, useState } from 'react';

type ScrollDirection = 'up' | 'down';

export type HeaderMotionPhase = 'default' | 'shrink' | 'hidden';

export type ScrollHeaderState = {
  y: number;
  direction: ScrollDirection;
  isShrunk: boolean;
  isHidden: boolean;
  state: HeaderMotionPhase;
};

type UseScrollHeaderStateOptions = {
  disabled?: boolean;
  lockVisibility?: boolean;
  shrinkOffset?: number;
  hideOffset?: number;
};

const DEFAULT_STATE: ScrollHeaderState = {
  y: 0,
  direction: 'up',
  isShrunk: false,
  isHidden: false,
  state: 'default',
};

const MIN_SCROLL_DELTA = 4;

function readCssVarPx(name: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeThresholds(shrinkOffset?: number, hideOffset?: number) {
  const baseSpacing = readCssVarPx('--spacing-xxxl', 32);
  const complementarySpacing = readCssVarPx('--spacing-xxl', 24);

  const shrink = typeof shrinkOffset === 'number' ? shrinkOffset : baseSpacing * 2;
  const hide = typeof hideOffset === 'number' ? hideOffset : shrink + complementarySpacing;

  return { shrink, hide };
}

export function useScrollHeaderState(options: UseScrollHeaderStateOptions = {}): ScrollHeaderState {
  const { disabled = false, lockVisibility = false, shrinkOffset, hideOffset } = options;
  const [state, setState] = useState<ScrollHeaderState>(DEFAULT_STATE);
  const lockRef = useRef(lockVisibility);
  lockRef.current = lockVisibility;

  useEffect(() => {
    if (disabled) {
      setState(DEFAULT_STATE);
      return;
    }

    const { shrink, hide } = computeThresholds(shrinkOffset, hideOffset);
    let lastY = Math.max(window.scrollY, 0);
    let lastDirection: ScrollDirection = 'up';
    let frame = 0;

    const update = () => {
      frame = 0;
      const currentY = Math.max(window.scrollY, 0);
      const delta = currentY - lastY;
      if (Math.abs(delta) > MIN_SCROLL_DELTA) {
        lastDirection = delta > 0 ? 'down' : 'up';
      }
      lastY = currentY;

      setState((previous) => {
        const isShrunk = currentY > shrink;
        let isHidden = previous.isHidden;

        if (lockRef.current) {
          isHidden = false;
        } else if (lastDirection === 'down' && currentY > hide) {
          isHidden = true;
        } else if (lastDirection === 'up' || currentY <= shrink) {
          isHidden = false;
        }

        const nextState: ScrollHeaderState = {
          y: currentY,
          direction: lastDirection,
          isShrunk,
          isHidden,
          state: isHidden ? 'hidden' : isShrunk ? 'shrink' : 'default',
        };

        if (
          previous.y === nextState.y &&
          previous.direction === nextState.direction &&
          previous.isShrunk === nextState.isShrunk &&
          previous.isHidden === nextState.isHidden &&
          previous.state === nextState.state
        ) {
          return previous;
        }

        return nextState;
      });
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    update();

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [disabled, hideOffset, shrinkOffset]);

  useEffect(() => {
    if (disabled || !lockVisibility) {
      return;
    }

    setState((previous) => {
      if (!previous.isHidden) {
        return previous;
      }

      const nextState: ScrollHeaderState = {
        ...previous,
        isHidden: false,
        state: previous.isShrunk ? 'shrink' : 'default',
      };

      return nextState;
    });
  }, [disabled, lockVisibility]);

  return state;
}

export default useScrollHeaderState;
