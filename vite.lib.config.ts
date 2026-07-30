import { defineConfig } from 'vite';

// 라이브러리(dist/index.js) 빌드. 웹 앱 빌드는 vite.config.ts 참고.
export default defineConfig({
  build: {
    target: 'es2022',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
  },
});
