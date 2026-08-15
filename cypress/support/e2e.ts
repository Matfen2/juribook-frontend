// Fichier de support chargé avant chaque test E2E.
// Point d'entrée pour les commandes personnalisées (./commands.ts)
// et toute configuration globale Cypress.

import './commands'

// Empêche Cypress de faire échouer un test à cause d'une exception JS
// non gérée provenant de l'application (ex: warning React non bloquant).
// Sans ce hook, toute erreur console fait planter le test.
Cypress.on('uncaught:exception', () => {
  return false
})
