export { runtime, size, contentType } from '@/app/opengraph-image/route';

import { GET as resolveOgImage } from '@/app/opengraph-image/route';

export async function GET(request: Request) {
  return resolveOgImage(request);
}
