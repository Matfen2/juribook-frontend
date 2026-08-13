/**
 * Affichage des avis sur LawyerDetailPage.
 *
 * Tout est stubbé via cy.intercept() : pas de dépendance à un vrai
 * backend ni à des données pré-existantes en base, ce spec est
 * autonome et rejouable dans n'importe quel environnement.
 */
describe('Avis sur la fiche avocat', () => {
  const LAWYER_ID = 4;

  const mockLawyerProfile = {
    id: LAWYER_ID,
    authUserId: 100,
    name: 'Sophie Martin',
    barNumber: '75001',
    bio: 'Avocate en droit du travail.',
    hourlyRate: 200,
    yearsExperience: 8,
    available: true,
    averageRating: 4.5,
    reviewCount: 2,
    address: { city: 'Paris', postalCode: '75001', region: 'Île-de-France' },
    specialties: [{ id: 1, name: 'Droit du travail', slug: 'droit-du-travail' }],
  };

  beforeEach(() => {
    cy.intercept('GET', `**/api/lawyers/${LAWYER_ID}`, mockLawyerProfile).as('getLawyer');
  });

  it("affiche la liste des avis avec note, commentaire et date", () => {
    cy.intercept('GET', `**/api/lawyers/${LAWYER_ID}/reviews`, [
      {
        id: 1,
        rating: 5,
        comment: 'Avocate très à l\'écoute, je recommande.',
        createdAt: '2026-07-04T02:06:58.46081',
      },
      {
        id: 2,
        rating: 4,
        comment: 'Très professionnelle, réponse rapide.',
        createdAt: '2026-07-02T14:30:00',
      },
    ]).as('getReviews');

    cy.visit(`/lawyers/${LAWYER_ID}`);
    cy.wait(['@getLawyer', '@getReviews']);

    cy.get('[data-cy="lawyer-review-item"]').should('have.length', 2);
    cy.get('[data-cy="lawyer-review-item"]').first().within(() => {
      cy.contains("Avocate très à l'écoute, je recommande.").should('be.visible');
      cy.contains('juillet 2026').should('be.visible');
    });
  });

  it("affiche un message d'état vide quand l'avocat n'a aucun avis", () => {
    cy.intercept('GET', `**/api/lawyers/${LAWYER_ID}/reviews`, []).as('getReviews');

    cy.visit(`/lawyers/${LAWYER_ID}`);
    cy.wait(['@getLawyer', '@getReviews']);

    cy.get('[data-cy="lawyer-review-item"]').should('not.exist');
    cy.contains("Aucun avis pour l'instant").should('be.visible');
  });

  it("affiche un message d'erreur si le chargement des avis échoue, sans casser le reste de la page", () => {
    cy.intercept('GET', `**/api/lawyers/${LAWYER_ID}/reviews`, { statusCode: 500 }).as('getReviewsError');

    cy.visit(`/lawyers/${LAWYER_ID}`);
    cy.wait(['@getLawyer', '@getReviewsError']);

    cy.contains("Impossible de charger les avis").should('be.visible');
    // Le reste de la page (profil avocat) doit rester fonctionnel malgré l'échec des avis
    cy.contains('Sophie Martin').should('be.visible');
  });

  it("n'affiche pas de commentaire vide pour un avis sans texte", () => {
    cy.intercept('GET', `**/api/lawyers/${LAWYER_ID}/reviews`, [
      { id: 3, rating: 3, comment: null, createdAt: '2026-07-01T09:00:00' },
    ]).as('getReviews');

    cy.visit(`/lawyers/${LAWYER_ID}`);
    cy.wait(['@getLawyer', '@getReviews']);

    cy.get('[data-cy="lawyer-review-item"]').should('have.length', 1);
    cy.get('[data-cy="lawyer-review-item"]').find('p').should('not.exist');
  });
});