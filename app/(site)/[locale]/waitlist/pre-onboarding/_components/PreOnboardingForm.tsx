'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { track } from '@/lib/clientAnalytics';
import { buttons, cn, inputs, text } from '@/app/(site)/_lib/ui';

const MAX_CHILDREN = 5;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export type PreOnboardingChildInput = {
  name: string;
  birthday: string;
  weight: string;
  shoeSize: string;
};

export type PreOnboardingDraft = {
  parentFirstName?: string | null;
  children: Array<{
    name: string;
    birthday: string;
    weight?: number | null;
    shoeSize?: string | null;
  }>;
};

export type PreOnboardingFormProps = {
  canSubmit: boolean;
  initialDraft?: PreOnboardingDraft;
};

type SubmitState = 'idle' | 'saving' | 'success' | 'error' | 'session-missing';

type FieldErrors = {
  parentFirstName?: string;
  children: Array<{
    name?: string;
    birthday?: string;
    weight?: string;
  }>;
  general?: string;
};

function createEmptyChild(): PreOnboardingChildInput {
  return {
    name: '',
    birthday: '',
    weight: '',
    shoeSize: '',
  };
}

export default function PreOnboardingForm({ canSubmit, initialDraft }: PreOnboardingFormProps) {
  const t = useTranslations('preonboarding');
  const errorsT = useTranslations('errors');
  const locale = useLocale();
  const [parentFirstName, setParentFirstName] = useState(() => initialDraft?.parentFirstName?.toString() ?? '');
  const [children, setChildren] = useState<PreOnboardingChildInput[]>(() => {
    if (initialDraft?.children?.length) {
      return initialDraft.children.map((child) => ({
        name: child.name,
        birthday: child.birthday,
        weight: typeof child.weight === 'number' && Number.isFinite(child.weight) ? String(child.weight) : '',
        shoeSize: child.shoeSize ?? '',
      }));
    }
    return [createEmptyChild()];
  });
  const [status, setStatus] = useState<SubmitState>(canSubmit ? 'idle' : 'session-missing');
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ children: [] });

  const disableSubmit = useMemo(() => {
    if (!canSubmit) return true;
    if (status === 'saving') return true;
    return false;
  }, [canSubmit, status]);

  function updateChild(index: number, updates: Partial<PreOnboardingChildInput>) {
    setChildren((prev) =>
      prev.map((child, idx) => (idx === index ? { ...child, ...updates } : child))
    );
  }

  function removeChild(index: number) {
    setChildren((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((_, idx) => idx !== index);
    });
  }

  function appendChild() {
    setChildren((prev) => {
      if (prev.length >= MAX_CHILDREN) {
        return prev;
      }
      return [...prev, createEmptyChild()];
    });
  }

  function validate(): { valid: boolean; payload?: { parentFirstName?: string; children: Array<{ name: string; birthday: string; weight?: number; shoeSize?: string }> } } {
    const nextErrors: FieldErrors = { children: [] };
    const sanitizedParent = parentFirstName.trim();

    const normalizedChildren = children.map((child) => ({
      name: child.name.trim(),
      birthday: child.birthday.trim(),
      weight: child.weight.trim(),
      shoeSize: child.shoeSize.trim(),
    }));

    normalizedChildren.forEach((child, index) => {
      const childError: FieldErrors['children'][number] = {};
      if (!child.name) {
        childError.name = errorsT('required');
      }
      if (!child.birthday) {
        childError.birthday = errorsT('required');
      } else if (!DATE_PATTERN.test(child.birthday)) {
        childError.birthday = t('errors.date');
      }
      if (child.weight) {
        const weightValue = Number.parseFloat(child.weight);
        if (!Number.isFinite(weightValue) || weightValue <= 0 || weightValue > 100) {
          childError.weight = t('errors.weight');
        }
      }
      nextErrors.children[index] = childError;
    });

    const hasChildErrors = nextErrors.children.some((childError) =>
      Boolean(childError && (childError.name || childError.birthday || childError.weight))
    );

    if (normalizedChildren.length === 0) {
      nextErrors.general = t('errors.childRequired');
    }

    if (hasChildErrors || nextErrors.general) {
      setFieldErrors(nextErrors);
      return { valid: false };
    }

    setFieldErrors({ children: [] });

    const payload = {
      parentFirstName: sanitizedParent || undefined,
      children: normalizedChildren.map((child) => {
        const entry: Record<string, unknown> = {
          name: child.name,
          birthday: child.birthday,
        };
        if (child.weight) {
          entry.weight = Number.parseFloat(child.weight);
        }
        if (child.shoeSize) {
          entry.shoeSize = child.shoeSize;
        }
        return entry as { name: string; birthday: string; weight?: number; shoeSize?: string };
      }),
    };

    return { valid: true, payload };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disableSubmit) return;

    const validation = validate();
    if (!validation.valid || !validation.payload) {
      setStatus('error');
      setMessage(errorsT('invalid'));
      return;
    }

    try {
      setStatus('saving');
      setMessage(null);
      const response = await fetch('/api/waitlist/pre-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validation.payload),
      });

      if (response.status === 401) {
        setStatus('session-missing');
        setMessage(t('errors.session'));
        return;
      }

      if (!response.ok) {
        setStatus('error');
        const payload = await response.json().catch(() => ({}));
        const details = Array.isArray(payload?.details) ? payload.details : [];
        if (details.includes('children')) {
          setMessage(t('errors.invalidChildren'));
        } else {
          setMessage(errorsT('generic'));
        }
        return;
      }

      setStatus('success');
      setMessage(t('success.saved'));
      const hadChildData = validation.payload.children.length > 0;
      void track({ name: 'preonboarding_completed', hadChildData, locale });
    } catch (error) {
      console.error('[pre-onboarding:submit]', error);
      setStatus('error');
      setMessage(errorsT('network'));
    } finally {
      setStatus((prev) => (prev === 'saving' ? 'idle' : prev));
    }
  }

  return (
    <form
      className="grid gap-lg"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={message ? 'preonboarding-feedback' : undefined}
    >
      <div className="grid gap-xs">
        <label htmlFor="parent-first-name" className={text.label}>
          {t('parent.firstName.label')}
        </label>
        <input
          id="parent-first-name"
          type="text"
          value={parentFirstName}
          onChange={(event) => setParentFirstName(event.target.value)}
          placeholder={t('parent.firstName.placeholder')}
          className={cn(inputs, 'px-md py-sm')}
        />
        {fieldErrors.parentFirstName ? (
          <p className="text-body-sm text-feedback-error" role="alert">
            {fieldErrors.parentFirstName}
          </p>
        ) : null}
      </div>

      <div className="grid gap-sm">
        <div className="flex items-center justify-between">
          <h2 className={cn(text.meta, 'text-text-muted uppercase tracking-[0.24em]')}>
            {t('child.section')}
          </h2>
          <button
            type="button"
            onClick={appendChild}
            className="text-label font-medium text-feedback-success hover:text-feedback-success disabled:text-text-muted"
            disabled={children.length >= MAX_CHILDREN}
          >
            {t('child.add')}
          </button>
        </div>

        {children.map((child, index) => {
          const errors = fieldErrors.children[index] ?? {};
          return (
            <fieldset key={index} className="rounded-2xl border border-border p-md">
              <legend className="text-label font-semibold text-text">{t('child.legend', { index: index + 1 })}</legend>
              <div className="mt-sm grid gap-sm md:grid-cols-2">
                <label className="grid gap-xs text-label text-text" htmlFor={`child-name-${index}`}>
                  {t('child.name.label')}
                  <input
                    id={`child-name-${index}`}
                    type="text"
                    value={child.name}
                    onChange={(event) => updateChild(index, { name: event.target.value })}
                    aria-invalid={Boolean(errors.name)}
                    className={cn(inputs, 'px-md py-sm')}
                  />
                  {errors.name ? (
                    <span className="text-body-sm text-feedback-error" role="alert">
                      {errors.name}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-xs text-label text-text" htmlFor={`child-birthday-${index}`}>
                  {t('child.birthday.label')}
                  <input
                    id={`child-birthday-${index}`}
                    type="date"
                    value={child.birthday}
                    onChange={(event) => updateChild(index, { birthday: event.target.value })}
                    aria-invalid={Boolean(errors.birthday)}
                    className={cn(inputs, 'px-md py-sm')}
                  />
                  {errors.birthday ? (
                    <span className="text-body-sm text-feedback-error" role="alert">
                      {errors.birthday}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-xs text-label text-text" htmlFor={`child-weight-${index}`}>
                  {t('child.weight.label')}
                  <input
                    id={`child-weight-${index}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={child.weight}
                    onChange={(event) => updateChild(index, { weight: event.target.value })}
                    aria-invalid={Boolean(errors.weight)}
                    placeholder={t('child.weight.placeholder')}
                    className={cn(inputs, 'px-md py-sm')}
                  />
                  {errors.weight ? (
                    <span className="text-body-sm text-feedback-error" role="alert">
                      {errors.weight}
                    </span>
                  ) : null}
                </label>

                <label className="grid gap-xs text-label text-text" htmlFor={`child-shoesize-${index}`}>
                  {t('child.shoeSize.label')}
                  <input
                    id={`child-shoesize-${index}`}
                    type="text"
                    value={child.shoeSize}
                    onChange={(event) => updateChild(index, { shoeSize: event.target.value })}
                    placeholder={t('child.shoeSize.placeholder')}
                    className={cn(inputs, 'px-md py-sm')}
                  />
                </label>
              </div>
              {children.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeChild(index)}
                  className="mt-sm text-label font-medium text-feedback-error hover:text-feedback-error"
                >
                  {t('child.remove', { index: index + 1 })}
                </button>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      <div className="grid gap-xs">
        <button
          type="submit"
          disabled={disableSubmit}
          className={cn(buttons.primary, 'w-fit rounded-2xl px-lg py-sm')}
        >
          {status === 'saving' ? `${t('save.cta')}…` : t('save.cta')}
        </button>
        {message ? (
          <p
            id="preonboarding-feedback"
            className={`text-body-sm ${status === 'success' ? 'text-feedback-success' : 'text-feedback-error'}`}
            role="status"
          >
            {message}
          </p>
        ) : null}
        {!canSubmit ? (
          <p className="text-body-sm text-text-muted" role="alert">
            {t('errors.session')}
          </p>
        ) : null}
      </div>
    </form>
  );
}
