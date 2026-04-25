import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// dev 서버 전용 백엔드 proxy 타겟. 운영 빌드에는 적용되지 않음.
const DEV_BACKEND = process.env.VITE_DEV_BACKEND || 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // dev에서만 proxy 활성화 (vite build에서는 무시됨)
  server: command === 'serve' ? {
    proxy: {
      '/api': {
        target: DEV_BACKEND,
        changeOrigin: true,
        secure: false,
      },
      '/files': {
        target: DEV_BACKEND,
        changeOrigin: true,
        secure: false,
      },
    },
  } : undefined,
  build: {
    sourcemap: false, // 운영 번들에 소스맵 노출 방지
  },
}))
