import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',

    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,

    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,

    retries: {
      runMode: 2,
      openMode: 0,
    },

    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      reporterEnabled: 'spec, mocha-junit-reporter',
      mochajunitReporterReporterOptions: {
        mochaFile: 'cypress/results/junit-[hash].xml',
        toConsole: false,
      },
    },

    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
  },
})