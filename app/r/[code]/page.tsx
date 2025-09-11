import { redirect } from 'next/navigation';

export default function RedirectReferral({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const code = params.code?.toUpperCase();
  // Start with incoming query params
  const qp = new URLSearchParams();
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (Array.isArray(v)) {
        for (const item of v) qp.append(k, String(item));
      } else if (typeof v !== 'undefined') {
        qp.set(k, String(v));
      }
    }
  }
  if (code) qp.set('ref', code);
  const target = `/?${qp.toString()}`;
  redirect(target);
}
