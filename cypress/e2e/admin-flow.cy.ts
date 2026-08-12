/**
 * Parcours E2E : Dashboard administrateur
 *
 * Couvre :
 *   1. Affichage des stats + liste avocats PENDING
 *   2. Validation d'un profil avocat (APPROVED)
 *   3. Refus d'un profil avocat (REJECTED)
 *   4. Filtrage par statut
 *   5. État vide (aucun avocat PENDING)
 */
describe('Dashboard administrateur', () => {

  const ADMIN_TOKEN = 'fake-jwt-admin'

  const loginAsAdmin = () => {
    cy.window().then(win => {
      win.localStorage.setItem('token', ADMIN_TOKEN)
      win.localStorage.setItem('role', 'ADMIN')
    })
  }

  const mockLawyers = [
    {
      id: 1, name: 'Sophie Martin', email: 'sophie@example.com',
      barNumber: '75001', specialty: 'Droit du travail', city: 'Paris',
      lawyerStatus: 'PENDING', enabled: true, createdAt: '2026-08-01T10:00:00',
    },
    {
      id: 2, name: 'Marc Dubois', email: 'marc@example.com',
      barNumber: '69001', specialty: 'Droit pénal', city: 'Lyon',
      lawyerStatus: 'APPROVED', enabled: true, createdAt: '2026-07-15T10:00:00',
    },
  ]

  const mockStats = { pending: 1, approved: 1, rejected: 0, clients: 5 }

  beforeEach(() => {
    loginAsAdmin()
    cy.intercept('GET', '**/api/admin/lawyers', mockLawyers).as('getLawyers')
    cy.intercept('GET', '**/api/admin/stats', mockStats).as('getStats')
  })

  it('affiche les statistiques et la liste des avocats en attente', () => {
    cy.visit('/admin/dashboard')
    cy.wait(['@getLawyers', '@getStats'])

    // Stats cards
    cy.contains('1').should('be.visible') // pending
    cy.contains('5').should('be.visible') // clients

    // Filtre PENDING actif par défaut → 1 avocat affiché
    cy.contains('Sophie Martin').should('be.visible')
    cy.contains('Marc Dubois').should('not.exist') // APPROVED, filtré
  })

  it('valide un profil avocat et met à jour la liste', () => {
    cy.intercept('PUT', '**/api/admin/lawyers/1/status', {
      statusCode: 200,
      body: { ...mockLawyers[0], lawyerStatus: 'APPROVED' },
    }).as('approveRequest')

    // Après validation, la liste ne contient plus l'avocat PENDING
    cy.intercept('GET', '**/api/admin/lawyers', [
      { ...mockLawyers[0], lawyerStatus: 'APPROVED' },
      mockLawyers[1],
    ]).as('getLawyersAfterApprove')

    cy.visit('/admin/dashboard')
    cy.wait(['@getLawyers', '@getStats'])

    cy.contains('Sophie Martin').should('be.visible')
    cy.contains('Valider').click()

    cy.wait('@approveRequest').its('request.body').should('deep.equal', { status: 'APPROVED' })
    cy.wait('@getLawyersAfterApprove')

    // Plus aucun avocat PENDING affiché
    cy.contains('File d\'attente vide').should('be.visible')
  })

  it('refuse un profil avocat', () => {
    cy.intercept('PUT', '**/api/admin/lawyers/1/status', {
      statusCode: 200,
      body: { ...mockLawyers[0], lawyerStatus: 'REJECTED' },
    }).as('rejectRequest')

    cy.intercept('GET', '**/api/admin/lawyers', [
      { ...mockLawyers[0], lawyerStatus: 'REJECTED' },
      mockLawyers[1],
    ]).as('getLawyersAfterReject')

    cy.visit('/admin/dashboard')
    cy.wait(['@getLawyers', '@getStats'])

    cy.contains('Refuser').click()

    cy.wait('@rejectRequest').its('request.body').should('deep.equal', { status: 'REJECTED' })
    cy.wait('@getLawyersAfterReject')

    cy.contains('File d\'attente vide').should('be.visible')
  })

  it('filtre les avocats par statut APPROVED', () => {
    cy.visit('/admin/dashboard')
    cy.wait(['@getLawyers', '@getStats'])

    cy.contains('button', 'Validés').click()

    cy.contains('Marc Dubois').should('be.visible')
    cy.contains('Sophie Martin').should('not.exist')
  })

  it('filtre Tous affiche les 2 avocats', () => {
    cy.visit('/admin/dashboard')
    cy.wait(['@getLawyers', '@getStats'])

    cy.contains('button', 'Tous').click()

    cy.contains('Sophie Martin').should('be.visible')
    cy.contains('Marc Dubois').should('be.visible')
  })

  it('affiche un état vide si aucun avocat dans la catégorie', () => {
    cy.intercept('GET', '**/api/admin/lawyers', []).as('getLawyersEmpty')
    cy.intercept('GET', '**/api/admin/stats', { pending: 0, approved: 0, rejected: 0, clients: 0 }).as('getStatsEmpty')

    cy.visit('/admin/dashboard')
    cy.wait(['@getLawyersEmpty', '@getStatsEmpty'])

    cy.contains('File d\'attente vide').should('be.visible')
  })
})