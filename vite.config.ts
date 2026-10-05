import { defineConfig, loadEnv } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-ignore - Node.js built-in modules are available in Vite config context
import { fileURLToPath } from 'url'
// @ts-ignore - Node.js built-in modules are available in Vite config context
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local only: must match Laravel APP_URL (php artisan serve).
  const apiOrigin =
    env.VITE_APP_URL || env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000'

  const proxy = {
    // Browser: http://localhost:3000/api/* → Laravel APP_URL /api/*
    '/api': {
      target: apiOrigin,
      changeOrigin: true,
    },
    '/storage': {
      target: apiOrigin,
      changeOrigin: true,
    },
  }

  return {
    plugins: [
      viteReact(),
      tailwindcss(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(
            /%VITE_FRONTEND_URL%/g,
            env.VITE_FRONTEND_URL || 'http://localhost:3000',
          )
        },
      },
    ],
    test: {
      globals: true,
      environment: 'jsdom',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy,
    },
    preview: {
      port: 3000,
      proxy,
    },
  }
})
