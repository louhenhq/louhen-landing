import { execSync } from 'node:child_process';

if (process.env.SKIP_LHCI === '1') {
  console.log('Skipping Lighthouse run because SKIP_LHCI=1');
  process.exit(0);
}

const defaultTarget = 'http://127.0.0.1:4311/waitlist';
const overrideUrl = process.env.LHCI_URL;

const args = ['npx', 'lhci', 'autorun', '--config=.lighthouserc.json'];

if (overrideUrl && overrideUrl.length > 0) {
  args.push(`--collect.url=${overrideUrl}`);
  console.log(`Running Lighthouse for ${overrideUrl} (override)`);
} else {
  console.log(`Running Lighthouse using config default ${defaultTarget}`);
}

execSync(args.join(' '), { stdio: 'inherit' });
