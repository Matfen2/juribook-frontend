/**
 * Parcours E2E : Recherche → Fiche avocat
 *
 * Sprint 2.8 — vérifie le chemin critique de l'utilisateur CLIENT :
 *   1. Arrivée sur la page de recherche
 *   2. Filtrage des résultats (spécialité, ville)
 *   3. Clic sur une carte avocat
 *   4. Affichage de la fiche détail avec toutes les informations
 *   5. Retour à la recherche, état préservé
 *
 * Stratégie : les appels au lawyer-service (port 8082) sont interceptés
 * via cy.intercept() avec des fixtures JSON fidèles au format réel de
 * l'API (LawyerSearchResponse, LawyerProfileResponse). Ce choix rend le
 * test déterministe et indépendant de l'état de la base de données —
 * pas besoin de PostgreSQL/Kafka démarrés pour faire tourner ce test.
 */
describe('Parcours recherche → détail avocat', () => {

  beforeEach(() => {
    // Intercepter les spécialités (chargées au montage de SearchPage)
    cy.intercept('GET', '**/api/specialties', { fixture: 'specialties.json' }).as('getSpecialties')

    // Intercepter la recherche initiale (sans filtre, au chargement de la page)
    cy.intercept('GET', '**/api/lawyers?*', { fixture: 'search-results.json' }).as('search')
  })

  it('affiche les résultats de recherche au chargement de la page', () => {
    cy.visit('/search')

    cy.wait('@getSpecialties')
    cy.wait('@search')

    // Le compteur de résultats doit refléter le contenu de la fixture
    cy.getByCy('search-results-count').should('contain', '2 avocats trouvés')

    // La grille doit contenir exactement 2 cartes
    cy.getByCy('search-results-grid').should('exist')
    cy.getByCy('lawyer-card').should('have.length', 2)

    // Le select spécialité doit être peuplé depuis la fixture
    cy.getByCy('search-specialty-select')
      .find('option')
      .should('have.length', 4) // "Toutes" + 3 spécialités
  })

  it('filtre les résultats par ville et déclenche une nouvelle recherche', () => {
    cy.visit('/search')
    cy.wait('@search')

    // Intercepter la recherche filtrée par ville
    cy.intercept('GET', '**/api/lawyers?*city=Paris*', {
      statusCode: 200,
      body: {
        content: [
          {
            id: 10, barNumber: '75001',
            bioExcerpt: 'Avocate au barreau de Paris...',
            hourlyRate: 220, yearsExperience: 12,
            languages: 'Français, Anglais, Espagnol',
            available: true, averageRating: 4.5, reviewCount: 8,
            address: { city: 'Paris', postalCode: '75001', region: 'Île-de-France' },
            specialties: [{ id: 1, name: 'Droit du travail', slug: 'droit-du-travail' }],
          },
        ],
        totalElements: 1, totalPages: 1, number: 0, size: 20,
      },
    }).as('searchByCity')

    cy.getByCy('search-city-input').type('Paris')
    cy.getByCy('search-submit-button').click()

    cy.wait('@searchByCity')

    cy.getByCy('search-results-count').should('contain', '1 avocat trouvé')
    cy.getByCy('lawyer-card').should('have.length', 1)
  })

  it('affiche un état vide quand aucun avocat ne correspond aux filtres', () => {
    cy.visit('/search')
    cy.wait('@search')

    cy.intercept('GET', '**/api/lawyers?*city=Marseille*', { fixture: 'search-results-empty.json' })
      .as('searchEmpty')

    cy.getByCy('search-city-input').type('Marseille')
    cy.getByCy('search-submit-button').click()

    cy.wait('@searchEmpty')

    cy.getByCy('search-empty-state').should('be.visible')
    cy.getByCy('search-empty-state').should('contain', 'Aucun avocat ne correspond')
    cy.getByCy('lawyer-card').should('not.exist')
  })

  it('navigue de la recherche vers la fiche détail au clic sur une carte', () => {
    // Intercepter le profil complet de l'avocat ciblé (id=10, Sophie Martin)
    cy.intercept('GET', '**/api/lawyers/10', { fixture: 'lawyer-detail.json' }).as('getLawyerDetail')

    cy.visit('/search')
    cy.wait('@search')

    // Cliquer sur la première carte (Sophie Martin, barreau 75001)
    cy.getByCy('lawyer-card').first().click()

    // L'URL doit refléter l'id de l'avocat cliqué
    cy.url().should('include', '/lawyers/10')

    cy.wait('@getLawyerDetail')

    // La fiche détail doit afficher les informations complètes
    cy.getByCy('lawyer-detail-hero').should('be.visible')
    cy.getByCy('lawyer-detail-bar-number').should('contain', '75001')

    // La bio complète (non tronquée) doit être affichée, contrairement
    // à la carte de recherche qui n'affiche que bioExcerpt
    cy.getByCy('lawyer-detail-bio')
      .should('be.visible')
      .and('contain', 'Trilingue français/anglais/espagnol')

    // Le CTA de réservation doit être actif car available = true
    cy.getByCy('lawyer-detail-book-button').should('not.be.disabled')
  })

  it('permet de revenir à la recherche depuis la fiche détail', () => {
    cy.intercept('GET', '**/api/lawyers/10', { fixture: 'lawyer-detail.json' }).as('getLawyerDetail')

    cy.visit('/search')
    cy.wait('@search')

    cy.getByCy('lawyer-card').first().click()
    cy.wait('@getLawyerDetail')

    cy.getByCy('lawyer-detail-back-button').click()

    cy.url().should('include', '/search')
    cy.getByCy('search-results-grid').should('be.visible')
  })

  it('désactive le bouton de réservation quand l\'avocat est indisponible', () => {
    cy.intercept('GET', '**/api/lawyers/11', {
      statusCode: 200,
      body: {
        id: 11, authUserId: 101, barNumber: '69001',
        bio: 'Avocat pénaliste actuellement en congé.',
        hourlyRate: 180, yearsExperience: 8,
        languages: 'Français, Anglais',
        available: false,
        averageRating: null, reviewCount: 0,
        address: { city: 'Lyon', postalCode: '69001', region: 'Auvergne-Rhône-Alpes' },
        specialties: [{ id: 3, name: 'Droit pénal', slug: 'droit-penal' }],
      },
    }).as('getUnavailableLawyer')

    cy.visit('/lawyers/11')
    cy.wait('@getUnavailableLawyer')

    cy.getByCy('lawyer-detail-book-button').should('be.disabled')
  })

  it('affiche un message d\'erreur si le lawyer-service est indisponible', () => {
    cy.intercept('GET', '**/api/lawyers?*', { forceNetworkError: true }).as('searchFailed')
    cy.intercept('GET', '**/api/specialties', { fixture: 'specialties.json' })

    cy.visit('/search')
    cy.wait('@searchFailed')

    cy.contains('Impossible de joindre le lawyer-service').should('be.visible')
  })
})
