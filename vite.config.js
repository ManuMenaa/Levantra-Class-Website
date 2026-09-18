import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        settings: resolve(import.meta.dirname, 'pengaturan.html'),
        student: resolve(import.meta.dirname, 'siswa.html'),
        privacy: resolve(import.meta.dirname, 'kebijakan-privasi.html'),
        notfound: resolve(import.meta.dirname, '404.html')
      },
    },
  },
});