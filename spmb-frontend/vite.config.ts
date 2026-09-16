import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Pisahkan lib berat agar bundle awal ringan; halaman tetap lazy via React.lazy.
        manualChunks(id) {
          if (id.includes('node_modules/xlsx')) return 'lib-xlsx'
          if (id.includes('node_modules/html5-qrcode') || id.includes('node_modules/qrcode.react')) return 'lib-qr'
          if (id.includes('node_modules/html-to-image') || id.includes('node_modules/html2canvas')) return 'lib-print'
          if (id.includes('node_modules/tesseract.js')) return 'lib-ocr'
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom') || id.includes('node_modules/zustand')) return 'vendor-react'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
    globals: false,
    pool: 'threads',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
