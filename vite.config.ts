import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VitePWA from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Kanban Meals',
        short_name: 'Kanban Meals',
        description: 'A meal planning and tracking application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5174,
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.firebaseio.com https://*.googleapis.com blob:;
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob: https://*.firebaseapp.com https://*.firebaseio.com https://*.googleapis.com https://firebasestorage.googleapis.com;
        connect-src 'self' https://*.firebaseapp.com https://*.firebaseio.com https://*.googleapis.com https://firebasestorage.googleapis.com wss://*.firebaseio.com;
        worker-src 'self' blob:;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';
        block-all-mixed-content;
      `.replace(/\s+/g, ' ').trim()
    }
  }
}) 