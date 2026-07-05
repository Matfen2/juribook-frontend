/**
 * Parcours E2E : Recherche → Réservation → Confirmation
 *
 * Couvre le chemin critique bout en bout, côté CLIENT
 * puis côté AVOCAT :
 *   1. Le client cherche un avocat, ouvre sa fiche
 *   2. Il consulte les créneaux libres, en sélectionne un
 *   3. Il renseigne un motif et confirme → POST /api/bookings (201, PENDING)
 *   4. L'avocat se connecte, voit la demande dans "À traiter"
 *   5. Il confirme → PATCH /api/bookings/{id}/confirm (200, CONFIRMED)
 *      la demande bascule dans l'onglet "Confirmés"
 *
 * Un second test couvre le refus (→ "Annulés"), un troisième le cas
 * d'erreur 409 (créneau pris entre-temps).
 *
 * Stratégie identique à search-to-detail.cy.ts : tous les appels aux
 * microservices (lawyer-service:8082, booking-service:8083) sont
 * interceptés via cy.intercept() avec des fixtures fidèles au format
 * réel des DTO (LawyerProfile, TimeSlot, Booking, BookingHistoryItem).
 * Aucune session réelle n'est établie via /login : le token/rôle sont
 * injectés directement dans localStorage (cohérent avec la lecture
 * lazy faite par AuthContext au montage), puisque toutes les requêtes
 * HTTP qui en dépendent sont de toute façon interceptées.
 */
describe('Parcours complet : recherche → réservation → confirmation', () => {

  const CLIENT_TOKEN = 'fake-jwt-client'
  const LAWYER_TOKEN = 'fake-jwt-lawyer'

  const loginAs = (role: 'CLIENT' | 'LAWYER', token: string) => {
    cy.window().then(win => {
      win.localStorage.setItem('token', token)
      win.localStorage.setItem('role', role)
    })
  }

  beforeEach(() => {
    cy.intercept('GET', '**/api/specialties', { fixture: 'specialties.json' }).as('getSpecialties')
    cy.intercept('GET', '**/api/lawyers?*', { fixture: 'search-results.json' }).as('search')
  })

  it('un client réserve un créneau chez un avocat, qui confirme la demande', () => {
    // ── Étape 1 : le client cherche et ouvre la fiche de l'avocat ──
    loginAs('CLIENT', CLIENT_TOKEN)

    cy.intercept('GET', '**/api/lawyers/10', { fixture: 'lawyer-detail.json' }).as('getLawyerDetail')
    cy.intercept('GET', '**/api/lawyers/10/reviews', []).as('getReviews')
    cy.intercept('GET', '**/api/lawyers/10/slots*', { fixture: 'slots-available.json' }).as('getSlots')

    cy.visit('/search')
    cy.wait('@getSpecialties')
    cy.wait('@search')

    cy.getByCy('lawyer-card').first().click()
    cy.url().should('include', '/lawyers/10')
    cy.wait('@getLawyerDetail')
    cy.wait('@getReviews')
    cy.wait('@getSlots')
    cy.getByCy('lawyer-detail-hero').should('be.visible')

    // ── Étape 2 : consultation des créneaux libres ──────────────────
    cy.getByCy('lawyer-detail-slot-button').should('have.length.at.least', 1)
    cy.getByCy('lawyer-detail-slot-button').first().click()

    // ── Étape 3 : motif + confirmation ───────────────────────────────
    cy.getByCy('lawyer-detail-booking-reason-input').type('Litige avec mon employeur')

    cy.intercept('POST', '**/api/bookings', { fixture: 'booking-created.json' }).as('createBooking')

    cy.getByCy('lawyer-detail-confirm-booking-button').click()

    cy.wait('@createBooking').its('request.body').should('deep.equal', {
      timeSlotId: 501,
      reason: 'Litige avec mon employeur',
    })

    cy.getByCy('lawyer-detail-booking-success')
      .should('be.visible')
      .and('contain', 'Demande de réservation envoyée')

    // ── Étape 4 : côté avocat, la demande apparaît "à traiter" ───────
    loginAs('LAWYER', LAWYER_TOKEN)

    cy.intercept('GET', '**/api/lawyers/profile', { fixture: 'lawyer-own-profile.json' }).as('getMyProfile')
    cy.intercept('GET', '**/api/lawyers/10/bookings', { fixture: 'lawyer-bookings-pending.json' }).as('getLawyerBookings')

    cy.visit('/lawyer/bookings')
    cy.wait('@getMyProfile')
    cy.wait('@getLawyerBookings')

    cy.getByCy('lawyer-bookings-tab-pending').should('contain', '1')
    cy.getByCy('lawyer-booking-card').should('have.length', 1)
    cy.getByCy('lawyer-booking-card').first().should('contain', 'Litige avec mon employeur')

    // ── Étape 5 : l'avocat confirme la demande ──────────────────────
    cy.intercept('PATCH', '**/api/bookings/900/confirm', { fixture: 'booking-confirmed.json' }).as('confirmBooking')

    cy.getByCy('lawyer-booking-confirm-button').click()
    cy.wait('@confirmBooking')

    // La demande n'est plus dans "à traiter"...
    cy.getByCy('lawyer-bookings-tab-pending').should('contain', '0')

    // ...et apparaît maintenant dans "Confirmés"
    cy.getByCy('lawyer-bookings-tab-confirmed').click()
    cy.getByCy('lawyer-booking-card').should('have.length', 1)
    cy.getByCy('lawyer-booking-card').first().should('contain', 'Confirmé')
  })

  it('l\'avocat peut refuser une demande, elle bascule dans "Annulés" et le compteur "à traiter" descend', () => {
    loginAs('LAWYER', LAWYER_TOKEN)

    cy.intercept('GET', '**/api/lawyers/profile', { fixture: 'lawyer-own-profile.json' }).as('getMyProfile')
    cy.intercept('GET', '**/api/lawyers/10/bookings', { fixture: 'lawyer-bookings-pending.json' }).as('getLawyerBookings')

    cy.visit('/lawyer/bookings')
    cy.wait('@getMyProfile')
    cy.wait('@getLawyerBookings')

    cy.getByCy('lawyer-bookings-tab-pending').should('contain', '1')

    cy.intercept('PATCH', '**/api/bookings/900/reject', { fixture: 'booking-rejected.json' }).as('rejectBooking')

    cy.getByCy('lawyer-booking-reject-button').click()
    cy.wait('@rejectBooking')

    cy.getByCy('lawyer-bookings-tab-pending').should('contain', '0')

    cy.getByCy('lawyer-bookings-tab-cancelled').click()
    cy.getByCy('lawyer-booking-card').should('have.length', 1)
    cy.getByCy('lawyer-booking-card').first().should('contain', 'Annulé')
  })

  it('affiche un message explicite si le créneau vient d\'être réservé par quelqu\'un d\'autre (409)', () => {
    loginAs('CLIENT', CLIENT_TOKEN)

    cy.intercept('GET', '**/api/lawyers/10', { fixture: 'lawyer-detail.json' }).as('getLawyerDetail')
    cy.intercept('GET', '**/api/lawyers/10/slots*', { fixture: 'slots-available.json' }).as('getSlots')
    cy.intercept('GET', '**/api/lawyers/10/reviews', []).as('getReviews')

    cy.visit('/lawyers/10')
    cy.wait('@getLawyerDetail')
    cy.wait('@getSlots')
    cy.wait('@getReviews')

    cy.getByCy('lawyer-detail-slot-button').first().click()
    cy.getByCy('lawyer-detail-booking-reason-input').type('Consultation urgente')

    cy.intercept('POST', '**/api/bookings', {
      statusCode: 409,
      body: { message: 'Ce créneau est déjà réservé' },
    }).as('createBookingConflict')

    cy.getByCy('lawyer-detail-confirm-booking-button').click()
    cy.wait('@createBookingConflict')

    // Fragment volontairement sans apostrophe : le composant utilise des
    // apostrophes typographiques (’ U+2019), qui ne matcheraient pas une
    // apostrophe droite (' U+0027) dans une assertion cy.contains().
    cy.contains('Choisissez-en un autre').should('be.visible')

    // Le créneau en conflit a été retiré de la grille, pas de risque de re-cliquer dessus
    cy.getByCy('lawyer-detail-slot-button').should('have.length', 1)
  })
})