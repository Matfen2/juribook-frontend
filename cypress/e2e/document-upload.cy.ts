/**
 * Parcours E2E : Upload de documents sur une réservation (Sprint 6.6 → 6.8)
 *
 * Réécrit à partir du vrai code de ClientBookingsPage.tsx et
 * DocumentUpload.tsx (plus de data-cy devinés) :
 *   - carte de réservation : [data-cy="client-booking-card"]
 *   - onglets : [data-cy="client-bookings-tab-upcoming|past|cancelled"]
 *   - widget d'upload : [data-cy="document-upload"], bouton
 *     [data-cy="document-upload-button"], chaque fichier listé dans
 *     [data-cy="document-upload-item"] (pas de data-cy dédié pour
 *     l'input caché ni pour un message d'erreur séparé — tout est
 *     dans l'item)
 *
 * Point de comportement important : la validation taille/type se fait
 * CÔTÉ CLIENT, avant tout appel réseau (cf. handleFileChange dans
 * DocumentUpload.tsx) — ces deux cas n'attendent donc aucun cy.wait()
 * sur une requête POST, contrairement à ma première version.
 *
 * Les dates de créneaux "à venir" sont fixées loin dans le futur
 * (2030) pour ne jamais basculer côté "passé" selon la date réelle
 * d'exécution des tests (categorize() compare au vrai Date.now()).
 */
describe('Upload de documents sur une réservation', () => {
  const CLIENT_TOKEN = 'fake-jwt-client'
  const BOOKING_ID = 900
  const LAWYER_ID = 10

  const loginAsClient = () => {
    cy.window().then(win => {
      win.localStorage.setItem('token', CLIENT_TOKEN)
      win.localStorage.setItem('role', 'CLIENT')
    })
  }

  const interceptLawyerProfile = () => {
    cy.intercept('GET', `**/api/lawyers/${LAWYER_ID}`, {
      statusCode: 200,
      body: { id: LAWYER_ID, name: 'Sophie Martin', address: { city: 'Paris' } },
    })
  }

  const validPdf = () => ({
    contents: Cypress.Buffer.from('%PDF-1.4 contenu factice pour le test'),
    fileName: 'contrat-travail.pdf',
    mimeType: 'application/pdf',
  })

  beforeEach(() => {
    loginAsClient()
    cy.intercept('GET', '**/api/notifications/unread-count', { count: 0 })
  })

  it("permet au client d'attacher un document PDF à un rendez-vous confirmé", () => {
    cy.intercept('GET', '**/api/bookings', {
      statusCode: 200,
      body: [{
        id: BOOKING_ID, lawyerId: LAWYER_ID, timeSlotId: 501, status: 'CONFIRMED',
        reason: 'Litige avec mon employeur', date: '2030-07-10',
        startTime: '09:00:00', endTime: '09:30:00', createdAt: '2026-07-02T09:00:00',
      }],
    }).as('getHistory')
    interceptLawyerProfile()

    cy.visit('/client/bookings')
    cy.wait('@getHistory')

    cy.getByCy('client-booking-card').should('have.length', 1)
    cy.getByCy('document-upload').should('exist')

    cy.intercept('POST', `**/api/bookings/${BOOKING_ID}/documents`, { statusCode: 200, body: {} })
      .as('uploadDocument')

    cy.getByCy('document-upload').find('input[type="file"]').selectFile(validPdf(), { force: true })

    cy.wait('@uploadDocument')

    cy.getByCy('document-upload-item')
      .should('have.length', 1)
      .and('contain', 'contrat-travail.pdf')
      .and('contain', 'Envoyé')
  })

  it('rejette un fichier trop volumineux sans appeler le serveur (validation côté client)', () => {
    cy.intercept('GET', '**/api/bookings', {
      statusCode: 200,
      body: [{
        id: BOOKING_ID, lawyerId: LAWYER_ID, timeSlotId: 501, status: 'CONFIRMED',
        reason: 'Litige', date: '2030-07-10', startTime: '09:00:00', endTime: '09:30:00',
        createdAt: '2026-07-02T09:00:00',
      }],
    }).as('getHistory')
    interceptLawyerProfile()

    // Filet de sécurité : si le composant appelait quand même le
    // serveur, ce spy le prouverait et le test échouerait explicitement
    // plutôt que de laisser passer une vraie requête réseau non gérée.
    cy.intercept('POST', `**/api/bookings/${BOOKING_ID}/documents`, cy.spy().as('uploadSpy'))

    cy.visit('/client/bookings')
    cy.wait('@getHistory')

    const tooLarge = {
      contents: Cypress.Buffer.alloc(11 * 1024 * 1024),
      fileName: 'gros-dossier.pdf',
      mimeType: 'application/pdf',
    }
    cy.getByCy('document-upload').find('input[type="file"]').selectFile(tooLarge, { force: true })

    cy.getByCy('document-upload-item')
      .should('have.length', 1)
      .and('contain', 'gros-dossier.pdf')
      .and('contain', 'Fichier trop volumineux (10 Mo max)')

    cy.get('@uploadSpy').should('not.have.been.called')
  })

  it('rejette un type de fichier non autorisé sans appeler le serveur (ex: .exe)', () => {
    cy.intercept('GET', '**/api/bookings', {
      statusCode: 200,
      body: [{
        id: BOOKING_ID, lawyerId: LAWYER_ID, timeSlotId: 501, status: 'PENDING',
        reason: 'Litige', date: '2030-07-10', startTime: '09:00:00', endTime: '09:30:00',
        createdAt: '2026-07-02T09:00:00',
      }],
    }).as('getHistory')
    interceptLawyerProfile()
    cy.intercept('POST', `**/api/bookings/${BOOKING_ID}/documents`, cy.spy().as('uploadSpy'))

    cy.visit('/client/bookings')
    cy.wait('@getHistory')

    const exeFile = {
      contents: Cypress.Buffer.from('MZ-fake-binary'),
      fileName: 'virus.exe',
      mimeType: 'application/x-msdownload',
    }
    cy.getByCy('document-upload').find('input[type="file"]').selectFile(exeFile, { force: true })

    cy.getByCy('document-upload-item')
      .should('have.length', 1)
      .and('contain', 'virus.exe')
      .and('contain', 'Format non accepté (PDF, JPEG, PNG uniquement)')

    cy.get('@uploadSpy').should('not.have.been.called')
  })

  it("affiche le message d'erreur du serveur si l'upload échoue malgré un fichier valide", () => {
    cy.intercept('GET', '**/api/bookings', {
      statusCode: 200,
      body: [{
        id: BOOKING_ID, lawyerId: LAWYER_ID, timeSlotId: 501, status: 'CONFIRMED',
        reason: 'Litige', date: '2030-07-10', startTime: '09:00:00', endTime: '09:30:00',
        createdAt: '2026-07-02T09:00:00',
      }],
    }).as('getHistory')
    interceptLawyerProfile()
    cy.intercept('POST', `**/api/bookings/${BOOKING_ID}/documents`, {
      statusCode: 500,
      body: { message: 'Échec de l’enregistrement du fichier, réessayez' },
    }).as('uploadFailed')

    cy.visit('/client/bookings')
    cy.wait('@getHistory')

    cy.getByCy('document-upload').find('input[type="file"]').selectFile(validPdf(), { force: true })
    cy.wait('@uploadFailed')

    cy.getByCy('document-upload-item')
      .should('have.length', 1)
      .and('contain', 'Échec de l’enregistrement du fichier, réessayez')
  })

  it('ne propose pas de widget d\'upload sur un rendez-vous déjà honoré (COMPLETED)', () => {
    cy.intercept('GET', '**/api/bookings', {
      statusCode: 200,
      body: [{
        id: 800, lawyerId: LAWYER_ID, timeSlotId: 400, status: 'COMPLETED',
        reason: 'Consultation initiale', date: '2026-06-01',
        startTime: '09:00:00', endTime: '09:30:00', createdAt: '2026-05-25T09:00:00',
      }],
    }).as('getHistory')
    interceptLawyerProfile()

    cy.visit('/client/bookings')
    cy.wait('@getHistory')

    // COMPLETED est classé dans l'onglet "past" par categorize() —
    // invisible dans l'onglet "upcoming" actif par défaut, il faut
    // changer d'onglet avant de vérifier quoi que ce soit sur la carte.
    cy.getByCy('client-bookings-tab-past').click()

    cy.getByCy('client-booking-card').should('have.length', 1)
    cy.getByCy('document-upload').should('not.exist')
  })

  it("ne propose pas de widget d'upload sur un rendez-vous annulé (CANCELLED)", () => {
    cy.intercept('GET', '**/api/bookings', {
      statusCode: 200,
      body: [{
        id: 801, lawyerId: LAWYER_ID, timeSlotId: 401, status: 'CANCELLED',
        reason: 'Consultation initiale', date: '2030-06-05',
        startTime: '09:00:00', endTime: '09:30:00', createdAt: '2026-05-28T09:00:00',
      }],
    }).as('getHistory')
    interceptLawyerProfile()

    cy.visit('/client/bookings')
    cy.wait('@getHistory')

    cy.getByCy('client-bookings-tab-cancelled').click()

    cy.getByCy('client-booking-card').should('have.length', 1)
    cy.getByCy('document-upload').should('not.exist')
  })
})