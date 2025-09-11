import { redirect } from 'next/navigation';

export default function RedirectReferral({ params }: { params: { code: string } }) {
  const code = params.code?.toUpperCase();
  const target = code ? `/?ref=${encodeURIComponent(code)}` : '/';
  redirect(target);
}

