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
  }
})
