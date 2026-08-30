import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        settings: 'settings.html',
        siswa: 'siswa.html'
      }
    }
  }
});