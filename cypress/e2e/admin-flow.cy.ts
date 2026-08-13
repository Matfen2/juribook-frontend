/**
 * Parcours E2E : Dashboard administrateur
 */
describe('Dashboard administrateur', () => {

  const ADMIN_TOKEN = 'fake-jwt-admin'

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
    // Injecter le token AVANT le visit via cy.session ou window
    cy.intercept('GET', '**/api/admin/lawyers*', mockLawyers).as('getLawyers')
    cy.intercept('GET', '**/api/admin/stats', mockStats).as('getStats')
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const visitAsAdmin = (path: string) => {
    cy.window().then(win => {
      win.localStorage.setItem('token', ADMIN_TOKEN)
      win.localStorage.setItem('role', 'ADMIN')
    })
    cy.visit(path)
  }

  it('affiche les statistiques et la liste des avocats en attente', () => {
    // Injecter le token dans localStorage via cookie avant visit
    cy.visit('/admin/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', ADMIN_TOKEN)
        win.localStorage.setItem('role', 'ADMIN')
      },
    })

    cy.wait('@getLawyers')
    cy.wait('@getStats')

    // Stats visible
    cy.contains('1').should('be.visible')

    // Filtre PENDING actif par défaut
    cy.contains('Sophie Martin').should('be.visible')
  })

  it('valide un profil avocat', () => {
    cy.intercept('PUT', '**/api/admin/lawyers/1/status', {
      statusCode: 200,
      body: { ...mockLawyers[0], lawyerStatus: 'APPROVED' },
    }).as('approveRequest')

    cy.visit('/admin/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', ADMIN_TOKEN)
        win.localStorage.setItem('role', 'ADMIN')
      },
    })

    cy.wait('@getLawyers')
    cy.wait('@getStats')

    cy.contains('Sophie Martin').should('be.visible')
    cy.contains('Valider').first().click()

    cy.wait('@approveRequest')
      .its('request.body')
      .should('deep.equal', { status: 'APPROVED' })
  })

  it('refuse un profil avocat', () => {
    cy.intercept('PUT', '**/api/admin/lawyers/1/status', {
      statusCode: 200,
      body: { ...mockLawyers[0], lawyerStatus: 'REJECTED' },
    }).as('rejectRequest')

    cy.visit('/admin/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', ADMIN_TOKEN)
        win.localStorage.setItem('role', 'ADMIN')
      },
    })

    cy.wait('@getLawyers')
    cy.wait('@getStats')

    cy.contains('Refuser').first().click()

    cy.wait('@rejectRequest')
      .its('request.body')
      .should('deep.equal', { status: 'REJECTED' })
  })

  it('filtre les avocats par statut APPROVED', () => {
    cy.visit('/admin/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', ADMIN_TOKEN)
        win.localStorage.setItem('role', 'ADMIN')
      },
    })

    cy.wait('@getLawyers')
    cy.wait('@getStats')

    cy.contains('button', 'Validés').click()

    cy.contains('Marc Dubois').should('be.visible')
    cy.contains('Sophie Martin').should('not.exist')
  })

  it('filtre Tous affiche les 2 avocats', () => {
    cy.visit('/admin/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', ADMIN_TOKEN)
        win.localStorage.setItem('role', 'ADMIN')
      },
    })

    cy.wait('@getLawyers')
    cy.wait('@getStats')

    cy.contains('button', 'Tous').click()

    cy.contains('Sophie Martin').should('be.visible')
    cy.contains('Marc Dubois').should('be.visible')
  })

  it('affiche un état vide si aucun avocat', () => {
    cy.intercept('GET', '**/api/admin/lawyers*', []).as('getLawyersEmpty')
    cy.intercept('GET', '**/api/admin/stats', { pending: 0, approved: 0, rejected: 0, clients: 0 }).as('getStatsEmpty')

    cy.visit('/admin/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', ADMIN_TOKEN)
        win.localStorage.setItem('role', 'ADMIN')
      },
    })

    cy.wait('@getLawyersEmpty')
    cy.wait('@getStatsEmpty')

    // Pas de carte avocat
    cy.get('[data-cy="lawyer-admin-card"]').should('not.exist')
  })
})
