import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    retries: {
      runMode: 2,   // 2 tentatives en CI (flakiness réseau)
      openMode: 0,  // pas de retry en mode interactif (debug plus clair)
    },
  },
})
