/// <reference types="cypress" />

// Commandes personnalisées réutilisables dans les specs.

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Récupère un élément par son attribut data-cy.
       * Convention recommandée par la doc Cypress pour des sélecteurs
       * stables, indépendants du CSS ou du texte affiché.
       */
      getByCy(selector: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('getByCy', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`)
})

export {}
