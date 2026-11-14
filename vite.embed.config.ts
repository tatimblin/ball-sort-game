// The embed build: src/embed.ts → dist/index.js, one ES module with React,
// the levels and the scoped stylesheet inside it. `npm run build:embed`. The
// Pages workflow builds it on each v* tag and serves it at
// https://tatimblin.github.io/ball-sort-game/dist/index.js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Library mode leaves process.env.NODE_ENV for the consumer; a browser
  // import has none, and React needs it to pick its production build.
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Library mode skips whitespace minification for `es` (to keep pure
    // annotations for a consumer's bundler); this module is loaded as is.
    rolldownOptions: { output: { minify: true } },
    lib: {
      entry: 'src/embed.ts',
      formats: ['es'],
      fileName: () => 'index.js',
    },
  },
});
