import { redirect } from 'next/navigation';
import { buildLocalePath, X_DEFAULT_LOCALE } from '@/next-intl.locales';

export default function LandingPage() {
  redirect(buildLocalePath(X_DEFAULT_LOCALE));
}
