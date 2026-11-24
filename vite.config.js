import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: env.VITE_API_URL ? {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: true,
        },
      } : undefined,
    },
  }
})
