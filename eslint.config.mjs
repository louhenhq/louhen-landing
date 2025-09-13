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
    rules: {
      'no-restricted-syntax': [
        'warn',
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
  // API routes: allow explicit any (pragmatic typing at edges)
  {
    files: ["app/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
