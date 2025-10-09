const config = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix'],
  '*.{md,mdx,json,yml,yaml,css}': ['prettier -w'],
  'CONTEXT/**/*.md': ['prettier -w'],
};

export default config;
