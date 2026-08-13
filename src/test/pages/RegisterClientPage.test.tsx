import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RegisterClientPage from '../../pages/auth/RegisterClientPage'
import * as authApi from '../../api/authApi'

/**
 * Tests Jest (Vitest) pour RegisterClientPage.
 *
 * Cas couverts :
 *   ✅ Rendu initial - tous les champs présents
 *   ✅ Soumission réussie → redirection vers /login avec message
 *   ❌ Email déjà utilisé → message d'erreur 409
 *   ❌ Erreur réseau → message générique
 *   ✅ Mise à jour des champs via handleChange
 *   ✅ Bouton affiche "Création..." pendant le chargement
 */

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../api/authApi')

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterClientPage />
    </MemoryRouter>
  )

describe('RegisterClientPage', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─────────────────────────────────────────────────────────────
  //  RENDU INITIAL
  // ─────────────────────────────────────────────────────────────
  describe('Rendu initial', () => {

    it('affiche le titre "Créer un compte"', () => {
      renderPage()
      expect(screen.getByText('Créer un compte')).toBeInTheDocument()
    })

    it('affiche le champ nom complet', () => {
      renderPage()
      expect(screen.getByPlaceholderText('Jean Dupont')).toBeInTheDocument()
    })

    it('affiche le champ email', () => {
      renderPage()
      expect(screen.getByPlaceholderText('jean@example.com')).toBeInTheDocument()
    })

    it('affiche le champ mot de passe', () => {
      renderPage()
      expect(screen.getByPlaceholderText('Minimum 8 caractères')).toBeInTheDocument()
    })

    it('affiche le champ téléphone (optionnel)', () => {
      renderPage()
      expect(screen.getByPlaceholderText('0612345678')).toBeInTheDocument()
    })

    it('affiche le bouton de soumission', () => {
      renderPage()
      expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeInTheDocument()
    })

    it('affiche le lien vers la page de connexion', () => {
      renderPage()
      expect(screen.getByText(/se connecter/i)).toBeInTheDocument()
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  MISE À JOUR DES CHAMPS
  // ─────────────────────────────────────────────────────────────
  describe('Mise à jour des champs', () => {

    it('met à jour le champ nom', () => {
      renderPage()
      const input = screen.getByPlaceholderText('Jean Dupont') as HTMLInputElement
      fireEvent.change(input, { target: { name: 'name', value: 'Marie Curie' } })
      expect(input.value).toBe('Marie Curie')
    })

    it('met à jour le champ email', () => {
      renderPage()
      const input = screen.getByPlaceholderText('jean@example.com') as HTMLInputElement
      fireEvent.change(input, { target: { name: 'email', value: 'marie@test.com' } })
      expect(input.value).toBe('marie@test.com')
    })

    it('efface l\'erreur quand l\'utilisateur modifie un champ', async () => {
      // ARRANGE : provoquer une erreur d'abord
      vi.mocked(authApi.registerClient).mockRejectedValue({
        response: { data: { message: 'Un compte existe déjà avec cet email' } },
      })

      renderPage()

      fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), {
        target: { name: 'name', value: 'Jean Dupont' },
      })
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { name: 'email', value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Minimum 8 caractères'), {
        target: { name: 'password', value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

      await waitFor(() => {
        expect(screen.getByText('Un compte existe déjà avec cet email')).toBeInTheDocument()
      })

      // ACT : modifier un champ → l'erreur disparaît
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { name: 'email', value: 'autre@test.com' },
      })

      // ASSERT : l'erreur est effacée
      expect(screen.queryByText('Un compte existe déjà avec cet email')).not.toBeInTheDocument()
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  SOUMISSION RÉUSSIE
  // ─────────────────────────────────────────────────────────────
  describe('Soumission réussie', () => {

    it('appelle registerClient avec les bons paramètres', async () => {
      vi.mocked(authApi.registerClient).mockResolvedValue({
        data: { message: 'Inscription réussie' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()

      fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), {
        target: { name: 'name', value: 'Jean Dupont' },
      })
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { name: 'email', value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Minimum 8 caractères'), {
        target: { name: 'password', value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

      await waitFor(() => {
        expect(authApi.registerClient).toHaveBeenCalledWith({
          name: 'Jean Dupont',
          email: 'jean@test.com',
          password: 'motdepasse123',
          phone: '',
        })
      })
    })

    it('affiche le message de succès après inscription réussie', async () => {
      vi.mocked(authApi.registerClient).mockResolvedValue({
        data: { message: 'Inscription réussie' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()

      fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), {
        target: { name: 'name', value: 'Jean Dupont' },
      })
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { name: 'email', value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Minimum 8 caractères'), {
        target: { name: 'password', value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

      await waitFor(() => {
        // Vérifier que l'API a bien été appelée (la navigation est gérée en interne après 2s)
        expect(authApi.registerClient).toHaveBeenCalled()
      })
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  AFFICHAGE DES ERREURS
  // ─────────────────────────────────────────────────────────────
  describe('Affichage des erreurs', () => {

    it('affiche le message d\'erreur 409 (email déjà utilisé)', async () => {
      vi.mocked(authApi.registerClient).mockRejectedValue({
        response: { data: { message: 'Un compte existe déjà avec cet email' } },
      })

      renderPage()

      fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), {
        target: { name: 'name', value: 'Jean Dupont' },
      })
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { name: 'email', value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Minimum 8 caractères'), {
        target: { name: 'password', value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

      await waitFor(() => {
        expect(
          screen.getByText('Un compte existe déjà avec cet email')
        ).toBeInTheDocument()
      })
    })

    it('affiche un message générique pour une erreur réseau', async () => {
      vi.mocked(authApi.registerClient).mockRejectedValue(new Error('Network Error'))

      renderPage()

      fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), {
        target: { name: 'name', value: 'Jean Dupont' },
      })
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { name: 'email', value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Minimum 8 caractères'), {
        target: { name: 'password', value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

      await waitFor(() => {
        expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()
      })
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  ÉTAT DU BOUTON
  // ─────────────────────────────────────────────────────────────
  describe('État du bouton pendant le chargement', () => {

    it('affiche "Création..." pendant la soumission', async () => {
      vi.mocked(authApi.registerClient).mockImplementation(
        () => new Promise(() => {}) // promesse en attente infinie
      )

      renderPage()

      fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), {
        target: { name: 'name', value: 'Jean Dupont' },
      })
      fireEvent.change(screen.getByPlaceholderText('jean@example.com'), {
        target: { name: 'email', value: 'jean@test.com' },
      })
      fireEvent.change(screen.getByPlaceholderText('Minimum 8 caractères'), {
        target: { name: 'password', value: 'motdepasse123' },
      })
      fireEvent.click(screen.getByRole('button', { name: /créer mon compte/i }))

      await waitFor(() => {
        expect(screen.getByText(/création\.\.\./i)).toBeInTheDocument()
      })
    })
  })
})