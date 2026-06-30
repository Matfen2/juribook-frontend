import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    // Vitest utilise jsdom pour simuler le DOM du navigateur
    environment: 'jsdom',
    // Importer automatiquement les matchers Jest DOM (@testing-library/jest-dom)
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    // Utiliser tsconfig.test.json pour les types vitest/globals
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
})