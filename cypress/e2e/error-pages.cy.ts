/**
 * Parcours E2E : Pages d'erreur (Sprint 9.2)
 *
 * Couvre :
 *   1. Page 404 sur route inexistante
 *   2. Page 403 sur accès interdit (mauvais rôle)
 *   3. Page 500 accessible via /500
 *   4. Redirection depuis 404 vers l'accueil
 *   5. Redirection depuis 403 vers l'espace utilisateur
 */
describe('Pages d\'erreur', () => {

  it('affiche la page 404 sur une URL inexistante', () => {
    cy.visit('/cette-page-nexiste-vraiment-pas', { failOnStatusCode: false })

    cy.contains('404').should('be.visible')
    cy.contains('Page introuvable').should('be.visible')
    cy.contains('Retour').should('be.visible')
    cy.contains('Accueil').should('be.visible')
  })

  it('le bouton Retour de la 404 navigue en arrière', () => {
    cy.visit('/login')
    cy.visit('/url-inexistante', { failOnStatusCode: false })

    cy.contains('404').should('be.visible')
    cy.contains('Retour').click()

    cy.url().should('include', '/login')
  })

  it('affiche la page 403 quand un CLIENT accède au dashboard admin', () => {
    cy.window().then(win => {
      win.localStorage.setItem('token', 'fake-jwt-client')
      win.localStorage.setItem('role', 'CLIENT')
    })

    cy.visit('/admin/dashboard')

    cy.contains('403').should('be.visible')
    cy.contains('Accès interdit').should('be.visible')
    cy.contains('client').should('be.visible') // rôle affiché
    cy.contains('Mon espace').should('be.visible')
    cy.contains('Changer de compte').should('be.visible')
  })

  it('affiche la page 403 quand un LAWYER accède au dashboard client', () => {
    cy.window().then(win => {
      win.localStorage.setItem('token', 'fake-jwt-lawyer')
      win.localStorage.setItem('role', 'LAWYER')
    })

    cy.visit('/client/dashboard')

    cy.contains('403').should('be.visible')
    cy.contains('lawyer').should('be.visible')
  })

  it('le bouton Mon espace de la 403 redirige vers le bon dashboard', () => {
    cy.window().then(win => {
      win.localStorage.setItem('token', 'fake-jwt-client')
      win.localStorage.setItem('role', 'CLIENT')
    })

    cy.visit('/admin/dashboard')
    cy.contains('Mon espace').click()

    cy.url().should('include', '/client/dashboard')
  })

  it('affiche la page 500 via la route /500', () => {
    cy.visit('/500')

    cy.contains('500').should('be.visible')
    cy.contains('Erreur serveur').should('be.visible')
    cy.contains('Réessayer').should('be.visible')
    cy.contains('Accueil').should('be.visible')
  })
})