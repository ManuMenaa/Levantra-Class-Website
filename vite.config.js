import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        settings: 'settings.html',
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'img/[name][extname]';
          }

          if (/\.css$/i.test(assetInfo.name)) {
            return 'css/[name][extname]';
          }

          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});