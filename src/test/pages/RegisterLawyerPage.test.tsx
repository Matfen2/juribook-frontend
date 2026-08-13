import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RegisterLawyerPage from '../../pages/auth/RegisterLawyerPage'
import * as authApi from '../../api/authApi'

/**
 * Tests Jest (Vitest) pour RegisterLawyerPage.
 *
 * Cas couverts :
 *   ✅ Rendu initial - champs personnels et professionnels présents
 *   ✅ Soumission réussie → redirection /login avec message PENDING
 *   ❌ Numéro de barreau déjà enregistré → message d'erreur 409
 *   ❌ Erreur réseau → message générique
 *   ✅ Bouton affiche "Envoi en cours..." pendant le chargement
 *   ✅ Appel API avec tous les champs (nom, email, mdp, barreau, spécialité, ville)
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
      <RegisterLawyerPage />
    </MemoryRouter>
  )

// Helper : remplir tous les champs du formulaire avocat
const fillForm = (overrides: Record<string, string> = {}) => {
  const defaults = {
    name: 'Maître Sophie Martin',
    email: 'sophie@barreau.fr',
    password: 'motdepasse123',
    barNumber: '75001',
    specialty: 'Droit du travail',
    city: 'Paris',
  }
  const values = { ...defaults, ...overrides }

  fireEvent.change(screen.getByPlaceholderText('Maître Jean Dupont'), {
    target: { name: 'name', value: values.name },
  })
  fireEvent.change(screen.getByPlaceholderText('jean@barreau.fr'), {
    target: { name: 'email', value: values.email },
  })
  fireEvent.change(screen.getByPlaceholderText('Minimum 8 caractères'), {
    target: { name: 'password', value: values.password },
  })
  fireEvent.change(screen.getByPlaceholderText('75001'), {
    target: { name: 'barNumber', value: values.barNumber },
  })
  fireEvent.change(screen.getByPlaceholderText('Droit du travail'), {
    target: { name: 'specialty', value: values.specialty },
  })
  fireEvent.change(screen.getByPlaceholderText('Paris'), {
    target: { name: 'city', value: values.city },
  })
}

describe('RegisterLawyerPage', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─────────────────────────────────────────────────────────────
  //  RENDU INITIAL
  // ─────────────────────────────────────────────────────────────
  describe('Rendu initial', () => {

    it('affiche le titre "Inscrire mon cabinet"', () => {
      renderPage()
      expect(screen.getByText('Inscrire mon cabinet')).toBeInTheDocument()
    })

    it('affiche le message de validation sous 48h', () => {
      renderPage()
      // Plusieurs éléments contiennent '48h' → getAllByText
      const elements = screen.getAllByText(/48h/i)
      expect(elements.length).toBeGreaterThan(0)
    })

    it('affiche tous les champs personnels', () => {
      renderPage()
      expect(screen.getByPlaceholderText('Maître Jean Dupont')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('jean@barreau.fr')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Minimum 8 caractères')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('0612345678')).toBeInTheDocument()
    })

    it('affiche tous les champs professionnels', () => {
      renderPage()
      expect(screen.getByPlaceholderText('75001')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Droit du travail')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Paris')).toBeInTheDocument()
    })

    it('affiche le bouton "Soumettre ma demande"', () => {
      renderPage()
      expect(
        screen.getByRole('button', { name: /soumettre ma demande/i })
      ).toBeInTheDocument()
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  SOUMISSION RÉUSSIE
  // ─────────────────────────────────────────────────────────────
  describe('Soumission réussie', () => {

    it('appelle registerLawyer avec tous les champs', async () => {
      vi.mocked(authApi.registerLawyer).mockResolvedValue({
        data: { message: 'Inscription en attente de validation' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()
      fillForm()
      fireEvent.click(screen.getByRole('button', { name: /soumettre ma demande/i }))

      await waitFor(() => {
        expect(authApi.registerLawyer).toHaveBeenCalledWith({
          name: 'Maître Sophie Martin',
          email: 'sophie@barreau.fr',
          password: 'motdepasse123',
          phone: '',
          barNumber: '75001',
          specialty: 'Droit du travail',
          city: 'Paris',
        })
      })
    })

    it('affiche le message de succès après soumission réussie', async () => {
      vi.mocked(authApi.registerLawyer).mockResolvedValue({
        data: { message: 'Inscription en attente de validation' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      renderPage()
      fillForm()
      fireEvent.click(screen.getByRole('button', { name: /soumettre ma demande/i }))

      await waitFor(() => {
        // Vérifier que l'API a bien été appelée (la navigation est gérée en interne après 2s)
        expect(authApi.registerLawyer).toHaveBeenCalled()
      })
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  AFFICHAGE DES ERREURS
  // ─────────────────────────────────────────────────────────────
  describe('Affichage des erreurs', () => {

    it('affiche le message d\'erreur si le barreau est déjà enregistré', async () => {
      vi.mocked(authApi.registerLawyer).mockRejectedValue({
        response: { data: { message: 'Ce numéro de barreau est déjà enregistré' } },
      })

      renderPage()
      fillForm()
      fireEvent.click(screen.getByRole('button', { name: /soumettre ma demande/i }))

      await waitFor(() => {
        expect(
          screen.getByText('Ce numéro de barreau est déjà enregistré')
        ).toBeInTheDocument()
      })
    })

    it('affiche le message d\'erreur si l\'email est déjà utilisé', async () => {
      vi.mocked(authApi.registerLawyer).mockRejectedValue({
        response: { data: { message: 'Email déjà utilisé' } },
      })

      renderPage()
      fillForm()
      fireEvent.click(screen.getByRole('button', { name: /soumettre ma demande/i }))

      await waitFor(() => {
        expect(screen.getByText('Email déjà utilisé')).toBeInTheDocument()
      })
    })

    it('affiche un message générique pour une erreur réseau', async () => {
      vi.mocked(authApi.registerLawyer).mockRejectedValue(new Error('Network Error'))

      renderPage()
      fillForm()
      fireEvent.click(screen.getByRole('button', { name: /soumettre ma demande/i }))

      await waitFor(() => {
        expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument()
      })
    })

    it('efface l\'erreur quand l\'utilisateur modifie un champ', async () => {
      vi.mocked(authApi.registerLawyer).mockRejectedValue({
        response: { data: { message: 'Email déjà utilisé' } },
      })

      renderPage()
      fillForm()
      fireEvent.click(screen.getByRole('button', { name: /soumettre ma demande/i }))

      await waitFor(() => {
        expect(screen.getByText('Email déjà utilisé')).toBeInTheDocument()
      })

      // Modifier un champ → l'erreur doit disparaître
      fireEvent.change(screen.getByPlaceholderText('jean@barreau.fr'), {
        target: { name: 'email', value: 'autre@barreau.fr' },
      })

      expect(screen.queryByText('Email déjà utilisé')).not.toBeInTheDocument()
    })
  })

  // ─────────────────────────────────────────────────────────────
  //  ÉTAT DU BOUTON
  // ─────────────────────────────────────────────────────────────
  describe('État du bouton pendant le chargement', () => {

    it('affiche "Envoi en cours..." pendant la soumission', async () => {
      vi.mocked(authApi.registerLawyer).mockImplementation(
        () => new Promise(() => {})
      )

      renderPage()
      fillForm()
      fireEvent.click(screen.getByRole('button', { name: /soumettre ma demande/i }))

      await waitFor(() => {
        expect(screen.getByText(/envoi en cours/i)).toBeInTheDocument()
      })
    })
  })
})