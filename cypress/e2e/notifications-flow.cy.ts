/**
 * Parcours E2E : Notifications in-app
 *
 * Couvre :
 *   1. Badge de notification affiché quand unread-count > 0
 *   2. Badge absent quand unread-count = 0
 *   3. Marquer une notification comme lue
 *   4. Affichage de la liste des notifications
 */
describe('Notifications in-app', () => {

  const CLIENT_TOKEN = 'fake-jwt-client'

  const loginAsClient = () => {
    cy.window().then(win => {
      win.localStorage.setItem('token', CLIENT_TOKEN)
      win.localStorage.setItem('role', 'CLIENT')
    })
  }

  beforeEach(() => {
    loginAsClient()
    cy.intercept('GET', '**/api/bookings', { body: [] }).as('getBookings')
  })

  it('affiche un badge quand il y a des notifications non lues', () => {
    cy.intercept('GET', '**/api/notifications/unread-count', { body: { count: 3 } }).as('unreadCount')

    cy.visit('/client/bookings')
    cy.wait('@unreadCount')

    cy.getByCy('notification-bell').should('exist')
    cy.getByCy('notification-badge').should('be.visible').and('contain', '3')
  })

  it('n\'affiche pas de badge quand toutes les notifications sont lues', () => {
    cy.intercept('GET', '**/api/notifications/unread-count', { body: { count: 0 } }).as('unreadCount')

    cy.visit('/client/bookings')
    cy.wait('@unreadCount')

    cy.getByCy('notification-badge').should('not.exist')
  })

  it('affiche la liste des notifications au clic sur la cloche', () => {
    cy.intercept('GET', '**/api/notifications/unread-count', { body: { count: 1 } }).as('unreadCount')
    cy.intercept('GET', '**/api/notifications', {
      body: [{
        id: 1,
        type: 'BOOKING_CONFIRMED',
        message: 'Votre rendez-vous avec Sophie Martin est confirmé pour le 10 août 2026 à 09:00',
        bookingId: 900,
        read: false,
        createdAt: '2026-08-10T09:00:00',
      }],
    }).as('getNotifications')

    cy.visit('/client/bookings')
    cy.wait('@unreadCount')

    cy.getByCy('notification-bell').click()
    cy.wait('@getNotifications')

    cy.contains('Sophie Martin').should('be.visible')
    cy.contains('confirmé').should('be.visible')
  })

  it('marque une notification comme lue', () => {
    cy.intercept('GET', '**/api/notifications/unread-count', { body: { count: 1 } }).as('unreadCount')
    cy.intercept('GET', '**/api/notifications', {
      body: [{
        id: 1, type: 'BOOKING_CONFIRMED',
        message: 'Votre rendez-vous est confirmé',
        bookingId: 900, read: false, createdAt: '2026-08-10T09:00:00',
      }],
    }).as('getNotifications')
    cy.intercept('PATCH', '**/api/notifications/1/read', { statusCode: 200, body: {} }).as('markRead')

    cy.visit('/client/bookings')
    cy.wait('@unreadCount')
    cy.getByCy('notification-bell').click()
    cy.wait('@getNotifications')

    cy.get('[data-cy="notification-item"]').first().click()
    cy.wait('@markRead')

    // Le badge doit disparaître ou décrémenter
    cy.getByCy('notification-badge').should('not.exist')
  })
})