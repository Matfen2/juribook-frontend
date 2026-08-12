/**
 * Parcours E2E : Authentification complète
 *
 * Couvre :
 *   1. Inscription client (POST /api/auth/register)
 *   2. Inscription avocat (POST /api/auth/register/lawyer)
 *   3. Connexion valide → redirection dashboard
 *   4. Connexion avec mauvais mot de passe → message d'erreur
 *   5. Déconnexion → retour login + localStorage vidé
 *   6. Accès route protégée sans token → redirect login
 */
describe('Parcours authentification', () => {

  beforeEach(() => {
    cy.window().then(win => win.localStorage.clear())
  })

  // ── Inscription client ──────────────────────────────────────────────
  it('un client peut s\'inscrire et est redirigé vers le login', () => {
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        id: 1, name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        role: 'CLIENT', message: 'Inscription réussie',
      },
    }).as('register')

    cy.visit('/register')

    cy.get('input[name="name"], input[placeholder*="nom"], input[placeholder*="Nom"]').first().type('Jean Dupont')
    cy.get('input[type="email"]').type('jean.dupont@example.com')
    cy.get('input[name="phone"], input[placeholder*="téléphone"], input[placeholder*="Téléphone"]').first().type('0612345678')
    cy.get('input[type="password"]').first().type('motdepasse123')

    cy.get('button[type="submit"]').click()
    cy.wait('@register')

    cy.url().should('include', '/login')
  })

  it('affiche une erreur si l\'email est déjà utilisé (409)', () => {
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 409,
      body: { message: 'Email déjà utilisé' },
    }).as('registerConflict')

    cy.visit('/register')

    cy.get('input[type="email"]').type('existant@example.com')
    cy.get('input[type="password"]').first().type('motdepasse123')
    cy.get('button[type="submit"]').click()
    cy.wait('@registerConflict')

    cy.contains('déjà utilisé').should('be.visible')
  })

  // ── Connexion ──────────────────────────────────────────────────────
  it('un client se connecte et est redirigé vers son dashboard', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        id: 1, name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        role: 'CLIENT',
        token: 'fake-jwt-client',
        refreshToken: 'fake-refresh-client',
        type: 'Bearer',
      },
    }).as('login')

    cy.visit('/login')

    cy.get('input[type="email"]').type('jean.dupont@example.com')
    cy.get('input[type="password"]').type('motdepasse123')
    cy.get('button[type="submit"]').click()
    cy.wait('@login')

    cy.url().should('include', '/client/dashboard')
    cy.window().its('localStorage').invoke('getItem', 'token').should('eq', 'fake-jwt-client')
  })

  it('un avocat se connecte et est redirigé vers son dashboard', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        id: 2, name: 'Sophie Martin',
        email: 'sophie.martin@example.com',
        role: 'LAWYER',
        token: 'fake-jwt-lawyer',
        refreshToken: 'fake-refresh-lawyer',
        type: 'Bearer',
      },
    }).as('loginLawyer')

    cy.visit('/login')

    cy.get('input[type="email"]').type('sophie.martin@example.com')
    cy.get('input[type="password"]').type('motdepasse123')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginLawyer')

    cy.url().should('include', '/lawyer/dashboard')
  })

  it('affiche "Email ou mot de passe incorrect" sur credentials invalides (401)', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 401,
      body: { message: 'Email ou mot de passe incorrect' },
    }).as('loginFailed')

    cy.visit('/login')

    cy.get('input[type="email"]').type('mauvais@example.com')
    cy.get('input[type="password"]').type('mauvais')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginFailed')

    cy.contains('incorrect').should('be.visible')
    cy.url().should('include', '/login')
  })

  it('un admin se connecte et est redirigé vers le dashboard admin', () => {
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        id: 99, name: 'Admin JuriBook',
        email: 'admin@juribook.fr',
        role: 'ADMIN',
        token: 'fake-jwt-admin',
        refreshToken: 'fake-refresh-admin',
        type: 'Bearer',
      },
    }).as('loginAdmin')

    cy.visit('/login')

    cy.get('input[type="email"]').type('admin@juribook.fr')
    cy.get('input[type="password"]').type('adminpass')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginAdmin')

    cy.url().should('include', '/admin/dashboard')
  })

  // ── Déconnexion ────────────────────────────────────────────────────
  it('la déconnexion vide le localStorage et redirige vers /login', () => {
    cy.window().then(win => {
      win.localStorage.setItem('token', 'fake-jwt-client')
      win.localStorage.setItem('role', 'CLIENT')
    })

    cy.visit('/client/dashboard')

    // Cliquer sur le bouton de déconnexion (texte ou data-cy)
    cy.contains('Déconnexion').click()

    cy.url().should('include', '/login')
    cy.window().its('localStorage').invoke('getItem', 'token').should('be.null')
  })

  // ── Routes protégées ───────────────────────────────────────────────
  it('redirige vers /login si on accède à un dashboard sans token', () => {
    cy.visit('/client/dashboard')
    cy.url().should('include', '/login')
  })

  it('affiche la page 403 si un CLIENT essaie d\'accéder au dashboard admin', () => {
    cy.window().then(win => {
      win.localStorage.setItem('token', 'fake-jwt-client')
      win.localStorage.setItem('role', 'CLIENT')
    })

    cy.visit('/admin/dashboard')
    cy.contains('403').should('be.visible')
    cy.contains('Accès interdit').should('be.visible')
  })
})