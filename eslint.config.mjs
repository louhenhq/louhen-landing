import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const restrictedSyntaxBase = [
  {
    selector: "Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
    message: 'Use design tokens (Tailwind classes or CSS variables) instead of hex colors.',
  },
  {
    selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
    message: 'Use design tokens (Tailwind classes or CSS variables) instead of hex colors.',
  },
  {
    selector: "CallExpression[callee.name='fetch'] Literal[value='/api/track']",
    message: "Use clientAnalytics.track instead of fetch('/api/track').",
  },
  {
    selector:
      "CallExpression[callee.name='fetch'] TemplateLiteral[quasis.length=1][quasis.0.value.raw='/api/track']",
    message: "Use clientAnalytics.track instead of fetch('/api/track').",
  },
];

const arbitraryTailwindUtilitySelectors = [
  {
    selector: "Literal[value=/(?:(?:bg|text|shadow)-\\[[^\\]]*(?:#|rgb|hsl))/]",
    message: 'Avoid arbitrary Tailwind color/shadow utilities; use token-backed classes.',
  },
  {
    selector: "TemplateElement[value.raw=/(?:(?:bg|text|shadow)-\\[[^\\]]*(?:#|rgb|hsl))/]",
    message: 'Avoid arbitrary Tailwind color/shadow utilities; use token-backed classes.',
  },
];

const clientRestrictedImportPatterns = [
  {
    group: [
      '**/*.server',
      '**/*.server.*',
      '@server/*',
      '@/lib/server/**',
      '@/lib/**/nonce-context.server',
      '@/lib/**/nonce-context.server.*',
      '@/lib/security/tokens',
      '@/lib/email/tokens',
      '@/lib/email/suppress',
      '@/lib/rate/limiter',
      '@/lib/firestore/waitlist',
      '@/lib/status/auth',
    ],
    message: 'Do not import server-only modules into client bundles.',
  },
];

const requireUseClientDirective = {
  selector: "Program:not(:has(ExpressionStatement[directive='use client']))",
  message: "Client modules must include the 'use client' directive.",
};

const serverOnlyReexportSelectors = [
  {
    selector: "ExportAllDeclaration[source.value=/\\.server(\\.|$)/]",
    message: 'Do not re-export server-only modules from client/shared namespaces.',
  },
  {
    selector: "ExportNamedDeclaration[source.value=/\\.server(\\.|$)/]",
    message: 'Do not re-export server-only modules from client/shared namespaces.',
  },
  {
    selector: "ExportAllDeclaration[source.value^='@server/']",
    message: 'Do not re-export server-only modules from client/shared namespaces.',
  },
  {
    selector: "ExportNamedDeclaration[source.value^='@server/']",
    message: 'Do not re-export server-only modules from client/shared namespaces.',
  },
  {
    selector: "ExportAllDeclaration[source.value^='@/lib/server/']",
    message: 'Do not re-export server-only modules from client/shared namespaces.',
  },
  {
    selector: "ExportNamedDeclaration[source.value^='@/lib/server/']",
    message: 'Do not re-export server-only modules from client/shared namespaces.',
  },
  ...[
    '@/lib/security/tokens',
    '@/lib/email/tokens',
    '@/lib/email/suppress',
    '@/lib/rate/limiter',
    '@/lib/firestore/waitlist',
    '@/lib/status/auth',
    '@/lib/csp/nonce-context.server',
  ].flatMap((source) => [
    {
      selector: `ExportAllDeclaration[source.value='${source}']`,
      message: 'Do not re-export server-only modules from client/shared namespaces.',
    },
    {
      selector: `ExportNamedDeclaration[source.value='${source}']`,
      message: 'Do not re-export server-only modules from client/shared namespaces.',
    },
  ]),
];

const serverOnlyImportGuard = {
  selector: "Program > :first-child:not(ImportDeclaration[source.value='server-only'])",
  message: "Server modules under lib/server must begin with `import 'server-only';`.",
};

const eslintConfig = [
  {
    ignores: [
      "artifacts/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      ".next/**",
      "dist/**",
      "**/html/trace/**",
      "**/*.bundle.js",
      "**/*.min.js",
      "public/tokens/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@next/next/no-head-element": "warn",
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
    },
  },
  {
    ignores: [
      "node_modules/**",
      "out/**",
      "build/**",
      "packages/**",
      "next-env.d.ts",
    ],
  },
  // Discourage raw hex colors in client TS/TSX; exclude server-only files
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ['lib/clientAnalytics.ts', 'emails/**', 'tests/**'],
    rules: {
      'no-restricted-syntax': ['error', ...restrictedSyntaxBase],
    },
  },
  {
    files: ['app/**/*.{ts,tsx}'],
    ignores: ['emails/**', 'tests/**'],
    rules: {
      'no-restricted-syntax': ['error', ...restrictedSyntaxBase, ...arbitraryTailwindUtilitySelectors],
    },
  },
  {
    files: ['components/**/*.{tsx}', 'app/**/components/**/*.{tsx}', 'lib/client/**/*.{tsx}', '**/*.client.tsx'],
    ignores: ['emails/**', 'tests/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...restrictedSyntaxBase,
        ...arbitraryTailwindUtilitySelectors,
        ...serverOnlyReexportSelectors,
        requireUseClientDirective,
      ],
    },
  },
  {
    files: ['components/**/*.{ts}', 'app/**/components/**/*.{ts}', 'lib/client/**/*.{ts}', '**/*.client.ts'],
    ignores: ['emails/**', 'tests/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...restrictedSyntaxBase,
        ...arbitraryTailwindUtilitySelectors,
        ...serverOnlyReexportSelectors,
      ],
    },
  },
  {
    files: ['lib/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...restrictedSyntaxBase,
        ...serverOnlyReexportSelectors,
      ],
    },
  },
  {
    files: [
      'components/**/*.{ts,tsx}',
      'app/**/components/**/*.{ts,tsx}',
      'lib/client/**/*.{ts,tsx}',
      '**/*.client.{ts,tsx}',
      'lib/shared/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: clientRestrictedImportPatterns,
        },
      ],
    },
  },
  {
    files: ['lib/server/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...restrictedSyntaxBase,
        serverOnlyImportGuard,
      ],
    },
  },
  {
    files: ['lib/clientAnalytics.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
          message:
            'Use design tokens (Tailwind classes or CSS variables) instead of hex colors.',
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            'Use design tokens (Tailwind classes or CSS variables) instead of hex colors.',
        },
      ],
    },
  },
  // Disable the hex rule for server-only files where fallbacks are intentional
  {
    files: [
      'app/manifest.ts',
      'app/opengraph-image.tsx',
      'components/ThemeInit.tsx',
      'app/api/**/*.{ts,tsx}',
      'app/layout.tsx',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // Generated email palette – allowed to contain raw hex
  {
    files: ['lib/email/colors.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['emails/**/*.tsx'],
    rules: {
      '@next/next/no-head-element': 'off',
    },
  },
  // API routes: allow explicit any (pragmatic typing at edges)
  {
    files: ["app/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["tests/**/*", "playwright.config.*"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["lighthouserc.cjs", "scripts/util/read-locales.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
