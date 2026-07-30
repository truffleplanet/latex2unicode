import { defineConfig } from 'vite';

// GitHub Pages serves the project site from /<repo>/, so the base path must match.
// Set BASE_PATH=/ when serving from a custom domain or a user/org root site.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/latex2unicode/',
  build: { target: 'es2022' },
});
