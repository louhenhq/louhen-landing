/* CODEx: tiny helpers to read CSS var values at runtime if needed */
export const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const token = {
  color: {
    primary: () => cssVar('--color-light-primary'),
    text: () => cssVar('--semantic-color-text-body'),
    bg: () => cssVar('--semantic-color-bg-page'),
  },
  space: {
    md: () => cssVar('--spacing-md'),
  },
};
