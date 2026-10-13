import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    /* PWA: сайт ставится иконкой на телефон и на компьютер бесплатно,
       без маркета и модерации, и открывается без интернета. */
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'UniMap AI — навигатор по корпусу',
        short_name: 'UniMap AI',
        description: 'Навигация по корпусу ОҚМПУ им. Ө. Жәнібекова: 3D-карта этажа и маршруты до кабинетов.',
        lang: 'ru',
        start_url: '/map',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#edf1f6',
        theme_color: '#0b1220',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Найти кабинет', url: '/search' },
          { name: 'Расписание', url: '/schedule' },
        ],
      },
      workbox: {
        /* Сборка со сценой весит больше стандартного лимита в 2 МБ */
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,hdr}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    /* stats-gl тянет собственную three@0.170 — из-за двух копий ломались
       проверки instanceof, и сцена молча не отрисовывалась.
       dedupe заставляет все импорты идти в одну корневую three. */
    dedupe: ['three'],
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'postprocessing'],
  },
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        /* rolldown (Vite 8) принимает manualChunks только функцией */
        manualChunks(id) {
          if (!id.includes('node_modules')) return null;
          if (id.includes('postprocessing')) return 'post';
          if (id.includes('@react-three')) return 'r3f';
          if (id.includes('three')) return 'three';
          return 'vendor';
        },
      },
    },
  },
});
