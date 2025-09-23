import Header from '@/app/(site)/components/Header';
import Footer from '@/app/(site)/components/Footer';
import { layout } from '@/app/(site)/_lib/ui';
import type { SupportedLocale } from '@/next-intl.locales';
import MethodHero from './_components/MethodHero';
import Pillars from './_components/Pillars';
import HowItWorks from './_components/HowItWorks';
import TrustLayer from './_components/TrustLayer';
import MethodCta from './_components/MethodCta';

export const runtime = 'nodejs';

type MethodPageProps = {
  params: Promise<{ locale: SupportedLocale }>;
};

export default async function MethodPage({ params }: MethodPageProps) {
  const { locale } = await params;

  return (
    <div className={layout.page}>
      <Header />
      <main id="main">
        <MethodHero />
        <Pillars />
        <HowItWorks />
        <TrustLayer />
        <MethodCta locale={locale} />
      </main>
      <Footer />
    </div>
  );
}
