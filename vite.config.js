import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression2'
import { imagetools } from 'vite-imagetools'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Function to calculate SRI hash
function calculateSRIHash(content) {
  const hash = crypto.createHash('sha384')
  hash.update(content)
  return `sha384-${hash.digest('base64')}`
}

// Custom plugin for SRI
function sriPlugin() {
  return {
    name: 'vite-plugin-sri',
    transformIndexHtml(html) {
      // Find all script and link tags
      const scriptRegex = /<script[^>]*src="([^"]*)"[^>]*>/g
      const linkRegex = /<link[^>]*href="([^"]*)"[^>]*>/g
      
      let modifiedHtml = html
      
      // Process script tags
      modifiedHtml = modifiedHtml.replace(scriptRegex, (match, src) => {
        if (src.startsWith('http')) return match
        const filePath = path.join('dist', src)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          const hash = calculateSRIHash(content)
          return match.replace('>', ` integrity="${hash}">`)
        }
        return match
      })
      
      // Process link tags
      modifiedHtml = modifiedHtml.replace(linkRegex, (match, href) => {
        if (href.startsWith('http')) return match
        const filePath = path.join('dist', href)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          const hash = calculateSRIHash(content)
          return match.replace('>', ` integrity="${hash}">`)
        }
        return match
      })
      
      return modifiedHtml
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false
      }),
      imagetools({
        defaultDirectives: new URLSearchParams({
          format: 'webp',
          as: 'picture'
        })
      }),
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      }),
      sriPlugin()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define: {
      'process.env': env
    },
    optimizeDeps: {
      include: ['firebase/app', 'firebase/firestore', 'firebase/storage']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', 'vuedraggable'],
            'firebase-app': ['firebase/app'],
            'firebase-firestore': ['firebase/firestore'],
            'firebase-storage': ['firebase/storage']
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      manifest: true,
      ssrManifest: true,
      integrity: true,
      target: 'esnext',
      sourcemap: false
    },
    server: {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com; frame-src 'self' https://*.firebaseapp.com; require-trusted-types-for 'script'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
      }
    },
    preview: {
      port: 4173,
      host: true,
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com; frame-src 'self' https://*.firebaseapp.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Content-Type': 'text/html; charset=utf-8'
      },
      fs: {
        strict: true,
        allow: ['dist']
      }
    }
  }
})
