import '@testing-library/jest-dom';
import { fetch, Headers, Request, Response } from 'undici';

type GlobalPolyfill = typeof globalThis & {
  fetch?: typeof globalThis.fetch;
  Headers?: typeof globalThis.Headers;
  Request?: typeof globalThis.Request;
  Response?: typeof globalThis.Response;
};

const globalsWithPolyfill = globalThis as GlobalPolyfill;

if (!globalsWithPolyfill.fetch) {
  globalsWithPolyfill.fetch = fetch as unknown as typeof globalThis.fetch;
  globalsWithPolyfill.Headers = Headers as unknown as typeof globalThis.Headers;
  globalsWithPolyfill.Request = Request as unknown as typeof globalThis.Request;
  globalsWithPolyfill.Response = Response as unknown as typeof globalThis.Response;
}
