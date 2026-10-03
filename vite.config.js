import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'src/index.html'),
        settings: resolve(import.meta.dirname, 'src/pengaturan.html'),
        student: resolve(import.meta.dirname, 'src/siswa.html'),
        schedule: resolve(import.meta.dirname, 'src/jadwal.html'),
        cash: resolve(import.meta.dirname, 'src/kas.html'),
        privacy: resolve(import.meta.dirname, 'src/kebijakan-privasi.html'),
        notfound: resolve(import.meta.dirname, 'src/404.html')
      },
    },
  },
});