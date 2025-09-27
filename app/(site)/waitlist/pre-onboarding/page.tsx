'use client';

import { useTranslations } from 'next-intl';

export default function WaitlistPreOnboardingPage() {
  const t = useTranslations('preonboarding');

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 text-slate-800">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('title')}</h1>
        <p className="mt-2 text-base text-slate-600">{t('subtitle')}</p>
      </header>

      <form className="grid gap-6 rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-lg">
        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('parent.firstName.label')}
          </legend>
          <input
            type="text"
            disabled
            placeholder={t('parent.firstName.label')}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-500"
          />
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('child.section')}
          </legend>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-900">
              {t('child.name.label')}
              <input
                type="text"
                disabled
                placeholder={t('child.name.label')}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-500"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-900">
              {t('child.birthday.label')}
              <input
                type="date"
                disabled
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-500"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-900">
              {t('child.weight.label')}
              <input
                type="text"
                disabled
                placeholder="kg"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-500"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-900">
              {t('child.shoeSize.label')}
              <input
                type="text"
                disabled
                placeholder="EU"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base text-slate-500"
              />
            </label>
          </div>
        </fieldset>

        <button
          type="button"
          disabled
          className="inline-flex w-fit items-center justify-center rounded-2xl bg-slate-400 px-5 py-3 text-sm font-semibold text-white"
        >
          {t('save.cta')}
        </button>
      </form>

      <p className="text-sm text-slate-500">{t('comingSoon')}</p>
    </main>
  );
}
