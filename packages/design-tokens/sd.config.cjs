const StyleDictionary = require('style-dictionary');

const webCss = {
  transformGroup: 'web',
  buildPath: 'build/web/',
  files: [
    { destination: 'tokens.css', format: 'css/variables', options: { selector: ':root' } },
    { destination: 'tokens.ts',  format: 'javascript/module' }
  ]
};

const flutterDart = {
  transformGroup: 'js',
  buildPath: 'build/flutter/',
  files: [{ destination: 'tokens.g.dart', format: 'custom/flutter-dart' }]
};

StyleDictionary.registerFormat({
  name: 'custom/flutter-dart',
  formatter: ({ dictionary }) => {
    const lines = [];
    lines.push('// GENERATED FILE – do not edit manually.');
    lines.push("import 'package:flutter/material.dart';");
    lines.push('');
    lines.push('class LouhenTokens {');
    dictionary.allTokens.forEach(t => {
      const n = t.name.replace(/-/g, '_');
      const v = String(t.value);
      if (t.attributes.category === 'color' || /#|rgb|rgba/i.test(v)) {
        lines.push(`  static const ${n} = Color(0x${v.replace('#','')});`);
      } else if (!Number.isNaN(Number(v))) {
        lines.push(`  static const ${n} = ${v};`);
      } else {
        lines.push(`  static const ${n} = '${v}';`);
      }
    });
    lines.push('}');
    return lines.join('\n');
  }
});

module.exports = {
  source: ['tokens/**/*.json'],
  platforms: { web: webCss, flutter: flutterDart }
};
