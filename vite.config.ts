import { defineConfig } from 'vite';

// 웹 앱(index.html) 빌드. 라이브러리 빌드는 vite.lib.config.ts 참고.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'site',
  },
});
