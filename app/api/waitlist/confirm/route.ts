import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { processConfirmationToken } from '@/lib/waitlist/confirm';
import { setWaitlistSessionCookie, clearWaitlistSessionCookie } from '@/lib/waitlist/session';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const outcome = await processConfirmationToken(token);

  let destination: string;
  switch (outcome.status) {
    case 'confirmed':
      destination = '/waitlist/success';
      break;
    case 'already':
      destination = '/waitlist/already-confirmed';
      break;
    default:
      destination = '/waitlist/expired';
      break;
  }

  const response = NextResponse.redirect(new URL(destination, request.nextUrl.origin));

  if (outcome.status === 'confirmed' && outcome.docId) {
    setWaitlistSessionCookie(response, outcome.docId);
  } else {
    clearWaitlistSessionCookie(response);
  }

  return response;
}
