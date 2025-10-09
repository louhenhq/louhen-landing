import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "packages/**",
      "next-env.d.ts",
    ],
  },
  // Discourage raw hex colors in client TS/TSX; exclude server-only files
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ['lib/clientAnalytics.ts'],
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
        {
          selector: "CallExpression[callee.name='fetch'] Literal[value='/api/track']",
          message: "Use clientAnalytics.track instead of fetch('/api/track').",
        },
        {
          selector:
            "CallExpression[callee.name='fetch'] TemplateLiteral[quasis.length=1][quasis.0.value.raw='/api/track']",
          message: "Use clientAnalytics.track instead of fetch('/api/track').",
        },
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
      'app/opengraph-image/route.ts',
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
  // API routes: allow explicit any (pragmatic typing at edges)
  {
    files: ["app/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
