import '@testing-library/jest-dom';
import { fetch, Headers, Request, Response } from 'undici';

if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
  // @ts-ignore
  globalThis.Headers = Headers as unknown as typeof globalThis.Headers;
  // @ts-ignore
  globalThis.Request = Request as unknown as typeof globalThis.Request;
  // @ts-ignore
  globalThis.Response = Response as unknown as typeof globalThis.Response;
}
