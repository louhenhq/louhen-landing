import StyleDictionary from 'style-dictionary';

/** ---------- Web outputs (CSS variables + TS export) ---------- */
const webCss = {
  transformGroup: 'web',
  buildPath: 'build/web/',
  files: [
    { destination: 'tokens.css', format: 'css/variables', options: { selector: ':root' } },
    { destination: 'tokens.ts',  format: 'javascript/module' }
  ]
};

/** ---------- Flutter output (Dart) ---------- */
StyleDictionary.registerFormat({
  name: 'custom/flutter-dart',
  formatter: ({ dictionary }) => {
    const lines = [];
    lines.push('// GENERATED FILE – do not edit manually.');
    lines.push("import 'package:flutter/material.dart';");
    lines.push('');
    lines.push('class LouhenTokens {');

    const toHex = (n) => {
      const h = Number(n).toString(16).padStart(2, '0');
      return h.toUpperCase();
    };

    for (const t of dictionary.allTokens) {
      const name = t.name.replace(/-/g, '_');
      const raw = String(t.value).trim();

      // Hex color (#RRGGBB or #AARRGGBB)
      if (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) {
        const hex = raw.replace('#', '').toUpperCase();
        // If #RRGGBB, assume FF alpha
        const argb = hex.length === 6 ? `FF${hex}` : hex;
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

      // Numeric tokens → as-is (spacing, radii, durations, etc.)
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
  transformGroup: 'js',
  buildPath: 'build/flutter/',
  files: [{ destination: 'tokens.g.dart', format: 'custom/flutter-dart' }]
};

export default {
  source: ['tokens/**/*.json'],
  platforms: { web: webCss, flutter: flutterDart }
};
