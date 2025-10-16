/**
 * Dependency rules for server/client boundaries.
 * See https://github.com/sverweij/dependency-cruiser for schema details.
 */

const clientMatcher = '(?:^components/|^app/.*/components/|^lib/client/|\\.client\\.(?:ts|tsx|js|jsx)$)';
const serverMatcher = '(?:^lib/server/|\\.server\\.(?:ts|tsx|js|jsx)$)';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'client-to-server',
      severity: 'error',
      comment: 'Client bundles must not import @server modules or *.server files.',
      from: {
        path: clientMatcher,
      },
      to: {
        path: serverMatcher,
      },
    },
    {
      name: 'client-to-node-crypto',
      severity: 'error',
      comment: 'Client bundles must not depend on Node crypto primitives.',
      from: {
        path: clientMatcher,
      },
      to: {
        dependencyTypes: ['core'],
        path: '^(?:node:)?crypto$',
      },
    },
    {
      name: 'shared-to-server',
      severity: 'error',
      comment: 'Shared modules remain isomorphic and must not import server-only code.',
      from: {
        path: '^lib/shared/',
      },
      to: {
        path: serverMatcher,
      },
    },
  ],
  options: {
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    tsPreCompilationDeps: true,
    includeOnly: ['^app', '^components', '^lib', '^src'],
    doNotFollow: {
      path: 'node_modules',
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
