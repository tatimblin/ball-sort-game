// Every rule is scoped under .bsg-root, Tailwind's preflight included, so the
// game styles only itself when it's mounted into another page: `html`/`body`
// rules land on the root, everything else becomes `.bsg-root <selector>`,
// which also outweighs a host page's bare element rules.
const ROOT = '.bsg-root';

module.exports = {
  plugins: {
    tailwindcss: {},
    'postcss-prefix-selector': {
      prefix: ROOT,
      transform(prefix, selector, prefixed, file) {
        // index.html's own page style stays as written.
        if (!file || !file.includes('/src/')) return selector;
        if (selector.startsWith(ROOT)) return selector;
        if (/^(html|body|:root|:host)\b/.test(selector)) {
          return selector.replace(/^(html|body|:root|:host)/, prefix);
        }
        return prefixed;
      },
    },
    autoprefixer: {},
  },
}
