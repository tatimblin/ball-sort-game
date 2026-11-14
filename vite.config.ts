// The standalone page: index.html → build/, served by GitHub Pages at
// https://tatimblin.github.io/ball-sort-game/. `npm run build`.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/ball-sort-game/',
  plugins: [react()],
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
});
