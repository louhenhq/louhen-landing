import StyleDictionary from 'style-dictionary';

// Emit a JSON file mapping CSS variable names to values
StyleDictionary.registerFormat({
  name: 'custom/json-css-variables',
  format: ({ dictionary }) => {
    const entries = dictionary.allTokens.map((t) => {
      const name = `--${t.path.join('-')}`;
      return [name, String(t.value)];
    });
    return JSON.stringify(Object.fromEntries(entries), null, 2);
  },
});

StyleDictionary.registerFormat({
  name: 'custom/email-colors-ts',
  format: ({ dictionary }) => {
    const groups = new Map();
    for (const token of dictionary.allTokens) {
      if (token.path[0] !== 'email') continue;
      const [, mode, ...rest] = token.path;
      if (!mode || rest.length === 0) continue;
      const key = rest.join('-');
      const value = String(token.value);
      if (!groups.has(mode)) groups.set(mode, new Map());
      const bucket = groups.get(mode);
      bucket.set(key, value);
    }

    const buildObject = (map) => {
      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => `  ${name}: '${value.replace(/'/g, "\\'")}',`)
        .join('\n');
    };

    const light = groups.get('light');
    if (!light) {
      throw new Error('Email palette requires a light mode (email.light.* tokens)');
    }

    const dark = groups.get('dark');
    const lines = [];
    lines.push('// GENERATED FILE - DO NOT EDIT. Generated from design tokens.');
    lines.push('// Source: packages/design-tokens/tokens/tokens.json (email.* tokens)');
    lines.push('export const emailColors = {');
    lines.push(buildObject(light));
    lines.push('} as const;');
    lines.push('export type EmailColorName = keyof typeof emailColors;');

    if (dark && dark.size > 0) {
      lines.push('');
      lines.push('export const emailColorsDark = {');
      lines.push(buildObject(dark));
      lines.push('} as const;');
      lines.push('export type EmailColorNameDark = keyof typeof emailColorsDark;');
    }

    lines.push('');
    lines.push('export type EmailColorPalette = typeof emailColors;');
    if (dark && dark.size > 0) {
      lines.push('export type EmailColorPaletteDark = typeof emailColorsDark;');
    }

    return lines.join('\n');
  },
});

/** ---------- Web outputs (CSS variables + TS export) ---------- */
const webCss = {
  transformGroup: 'web',
  buildPath: 'build/web/',
  files: [
    // Light / default variables
    { destination: 'tokens.css', format: 'css/variables', options: { selector: ':root' } },
    { destination: 'tokens.ts',  format: 'javascript/module' },
    // Dark theme variables (mounts under :root[data-theme="dark"]) 
    { destination: 'tokens.dark.css', format: 'css/variables', options: { selector: ':root[data-theme="dark"]' } },
    // High-contrast variables (mounts under :root[data-contrast="more"]) 
    { destination: 'tokens.hc.css',   format: 'css/variables', options: { selector: ':root[data-contrast="more"]' } },
    // JSON map of CSS variables (light defaults)
    { destination: 'tokens.json', format: 'custom/json-css-variables' }
  ]
};

/** ---------- Public outputs (served by Next from repo root) ---------- */
// NOTE: write to the REPO ROOT public/tokens/ (two levels up from this package)
const webCssPublic = {
  transformGroup: 'web',
  buildPath: '../../public/tokens/',
  files: [
    { destination: 'tokens.css',      format: 'css/variables', options: { selector: ':root' } },
    { destination: 'tokens.dark.css', format: 'css/variables', options: { selector: ':root[data-theme="dark"]' } },
    { destination: 'tokens.hc.css',   format: 'css/variables', options: { selector: ':root[data-contrast="more"]' } }
  ]
};

/** ---------- Flutter output (Dart) ---------- */
StyleDictionary.registerFormat({
  name: 'custom/flutter-dart',
  // v4 expects `format`, not `formatter`
  format: ({ dictionary }) => {
    const lines = [];
    lines.push('// GENERATED FILE – do not edit manually.');
    lines.push("import 'package:flutter/material.dart';");
    lines.push('');
    lines.push('class LouhenTokens {');

    for (const t of dictionary.allTokens) {
      const name = t.name.replace(/-/g, '_');
      const raw = String(t.value).trim();

      // Hex color (#RRGGBB or #AARRGGBB)
      if (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) {
        const hex = raw.replace('#', '').toUpperCase();
        const argb = hex.length === 6 ? `FF${hex}` : hex; // assume FF alpha when missing
        lines.push(`  static const ${name} = Color(0x${argb});`);
        continue;
      }

      // rgba(r,g,b,a) → Color.fromRGBO(r,g,b,a)
      const m = raw.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i);
      if (m) {
        const r = Math.min(255, parseInt(m[1], 10));
        const g = Math.min(255, parseInt(m[2], 10));
        const b = Math.min(255, parseInt(m[3], 10));
        const a = m[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(m[4]))) : 1;
        lines.push(`  static const ${name} = Color.fromRGBO(${r}, ${g}, ${b}, ${a});`);
        continue;
      }

      // Numeric tokens → as-is
      if (!Number.isNaN(Number(raw))) {
        lines.push(`  static const ${name} = ${raw};`);
        continue;
      }

      // Fallback to string constant
      lines.push(`  static const ${name} = '${raw.replace(/'/g, "\\'")}';`);
    }

    lines.push('}');
    return lines.join('\n');
  }
});

const flutterDart = {
  // Using js transforms is fine for our simple output
  transformGroup: 'js',
  buildPath: 'build/flutter/',
  files: [{ destination: 'tokens.g.dart', format: 'custom/flutter-dart' }]
};

const emailTs = {
  transformGroup: 'js',
  buildPath: '../../lib/email/',
  files: [{ destination: 'colors.ts', format: 'custom/email-colors-ts' }]
};

export default {
  source: ['tokens/**/*.json'],
  platforms: { web: webCss, webCssPublic, flutter: flutterDart, email: emailTs }
};
