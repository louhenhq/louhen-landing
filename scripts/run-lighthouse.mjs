import { execSync } from 'node:child_process';

const baseUrl = process.env.BASE_URL || 'http://localhost:4311';
const targetUrl = new URL('/waitlist', baseUrl).toString();

console.log(`Running Lighthouse for ${targetUrl}`);

execSync(
  `npx lhci autorun --collect.url=${targetUrl} --assert.assertions.category-performance>=0.9 --assert.assertions.category-accessibility>=0.9 --assert.assertions.category-best-practices>=0.9 --assert.assertions.category-seo>=0.9`,
  { stdio: 'inherit' }
);
