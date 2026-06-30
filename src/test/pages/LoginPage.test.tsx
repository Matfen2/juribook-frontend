import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../pages/auth/LoginPage'
import { AuthProvider } from '../../context/AuthContext'
import * as authApi from '../../api/authApi'

/**
 * Tests Jest (Vitest) pour LoginPage.
 *
 * Stratégie de mock :
 *   - authApi (login) → mocké pour contrôler les réponses sans réseau
 *   - useNavigate → mocké pour vérifier les redirections
 *   - AuthContext → AuthProvider réel (logique de saveUser testée aussi)
 *
 * On utilise MemoryRouter pour simuler React Router sans navigateur.
 *
 * Cas couverts :
 *   ✅ Rendu initial - champs et bouton présents
 *   ✅ Soumission réussie CLIENT → redirection /client/dashboard
 *   ✅ Soumission réussie LAWYER → redirection /lawyer/dashboard
 *   ❌ Erreur API → message d'erreur affiché
 *   ❌ Champs vides → bouton désactivé pendant le chargement
 */

// Mock de useNavigate pour capturer les redirections sans navigateur réel
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock du module authApi pour éviter les appels réseau réels
vi.mock('../../api/authApi')

// Helper : rend LoginPage avec tous les providers nécessaires
const renderLoginPage = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )

describe('LoginPage', () => {

  beforeEach(() => {
    // Réinitialiser les mocks entre chaque test
    vi.clearAllMocks()
    // Nettoyer le localStorage manuellement (localStorage.clear() non supporté dans jsdom)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
  })

  // ─────────────────────────────────────────────────────────────
  //  RENDU INITIAL
  // ─────────────────────────────────────────────────────────────
  describe('Rendu initial', () => {

    it('affiche le titre "Connexion"', () => {
      renderLoginPage()
      // getByText lève une exception si l'élément est absent → test fail
      expect(screen.getByText('Connexion')).toBeInTheDocument()
    })

    it('affiche le champ email', () => {
      renderLoginPage()
      // Le placeholder est défini dans LoginPage.tsx
      expect(screen.getByPlaceholderText('jean@example.com')).toBeInTheDocument()
    })

    it('affiche le champ mot de passe', () => {
      renderLoginPage()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    })

    it('affiche le bouton "Se connecter"', () => {
      renderLoginPage()
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    })

    it('affiche le lien vers la page d\'inscription', () => {
      renderLoginPage()
      expect(screen.getByText(/créer un compte/i)).toBeInTheDocument()
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  SOUMISSION DU FORMULAIRE - CAS SUCCÈS
  // ─────────────────────────────────────────────────────────────
  describe('Soumission réussie', () => {

    it('redirige vers /client/dashboard pour un CLIENT', async () => {
      // ARRANGE - simuler une réponse login réussie avec rôle CLIENT
      vi.mocked(authApi.login).mockResolvedValue({
        data: { token: 'jwt-token', role: 'CLIENT', message: 'OK' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderLoginPage()

      // ACT - remplir les champs et soumettre
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      // ASSERT - attendre la navigation (asynchrone)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard')
      })
    })

    it('redirige vers /lawyer/dashboard pour un LAWYER', async () => {
      // ARRANGE — simuler une réponse login réussie avec rôle LAWYER
      vi.mocked(authApi.login).mockResolvedValue({
        data: { token: 'jwt-token', role: 'LAWYER', message: 'OK' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderLoginPage()

      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { value: 'avocat@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/lawyer/dashboard')
      })
    })

    it('redirige vers /admin/dashboard pour un ADMIN', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        data: { token: 'jwt-token', role: 'ADMIN', message: 'OK' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderLoginPage()

      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { value: 'admin@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard')
      })
    })

    it('appelle authApi.login avec les bons paramètres', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        data: { token: 'jwt-token', role: 'CLIENT', message: 'OK' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderLoginPage()

      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        // Vérifier que login() a bien été appelé avec email + password
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'jean@test.com',
          password: 'motdepasse123',
        })
      })
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  AFFICHAGE DES ERREURS
  // ─────────────────────────────────────────────────────────────
  describe('Affichage des erreurs', () => {

    it('affiche le message d\'erreur API en cas d\'échec', async () => {
      // ARRANGE - simuler une erreur 404 (mauvais mot de passe)
      vi.mocked(authApi.login).mockRejectedValue({
        response: { data: { message: 'Email ou mot de passe incorrect' } },
      })

      renderLoginPage()

      // ACT - soumettre avec de mauvais identifiants
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'mauvaismdp' },
      })
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      // ASSERT - le message d'erreur doit apparaître dans le DOM
      await waitFor(() => {
        expect(
          screen.getByText('Email ou mot de passe incorrect')
        ).toBeInTheDocument()
      })
    })

    it('affiche un message générique si l\'API ne retourne pas de message', async () => {
      // ARRANGE - erreur réseau sans corps de réponse
      vi.mocked(authApi.login).mockRejectedValue(new Error('Network Error'))

      renderLoginPage()

      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      await waitFor(() => {
        expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()
      })
    })

    it('n\'affiche pas d\'erreur au chargement initial', () => {
      renderLoginPage()
      // Aucun bandeau d'erreur ne doit être visible sans soumission
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  ÉTAT DU BOUTON PENDANT LE CHARGEMENT
  // ─────────────────────────────────────────────────────────────
  describe('État du bouton', () => {

    it('affiche "Connexion..." pendant la soumission', async () => {
      // ARRANGE - simuler un délai réseau avec une promesse en attente
      vi.mocked(authApi.login).mockImplementation(
        () => new Promise(() => {}) // promesse qui ne se résout jamais
      )

      renderLoginPage()

      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /se connecter/i }))

      // Pendant le chargement, le bouton doit afficher "Connexion..."
      await waitFor(() => {
        expect(screen.getByText(/connexion\.\.\./i)).toBeInTheDocument()
      })
    })
  })
})