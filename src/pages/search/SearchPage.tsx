import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  searchLawyers,
  getSpecialties,
  type LawyerSearchResult,
  type LawyerSearchPage,
  type Specialty,
  type SearchFilters,
} from '../../api/lawyerApi'

// ── Composant carte avocat ───────────────────────────────

function LawyerCard({ lawyer }: { lawyer: LawyerSearchResult }) {
  return (
    <article className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex flex-col gap-4">

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {lawyer.barNumber.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            Barreau n° {lawyer.barNumber}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {lawyer.specialties.slice(0, 3).map(s => (
              <span key={s.id} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                {s.name}
              </span>
            ))}
            {lawyer.specialties.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                +{lawyer.specialties.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      {lawyer.bioExcerpt && (
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {lawyer.bioExcerpt}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-sm text-slate-500">
        {lawyer.address?.city && <span>📍 {lawyer.address.city}</span>}
        {lawyer.yearsExperience != null && <span>⚖️ {lawyer.yearsExperience} ans d'expérience</span>}
        {lawyer.languages && <span>🌐 {lawyer.languages}</span>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <span className="text-xs text-slate-400">
          {lawyer.averageRating
            ? `${'★'.repeat(Math.round(lawyer.averageRating))} (${lawyer.reviewCount})`
            : 'Pas encore d\'avis'}
        </span>
        <span className="text-indigo-600 font-semibold text-sm">
          {lawyer.hourlyRate ? `${lawyer.hourlyRate} €/h` : 'Tarif sur demande'}
        </span>
      </div>

      {!lawyer.available && (
        <div className="text-xs text-center text-slate-400 bg-slate-50 rounded-lg py-1.5">
          Indisponible actuellement
        </div>
      )}
    </article>
  )
}

// ── Page principale ──────────────────────────────────────

const INITIAL_FILTERS: SearchFilters = {
  specialty: '', city: '', query: '', maxRate: undefined, page: 0, size: 20,
}

export default function SearchPage() {
  const navigate = useNavigate()

  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS)
  // triggerSearch incrémente pour déclencher l'effet de recherche
  const [triggerSearch, setTriggerSearch] = useState(0)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [results, setResults] = useState<LawyerSearchPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ref pour stocker les filtres actifs lors du dernier trigger
  const pendingFilters = useRef<SearchFilters>(INITIAL_FILTERS)

  // Charger les spécialités une seule fois
  useEffect(() => {
    getSpecialties()
      .then((res: { data: Specialty[] }) => { setSpecialties(res.data) })
      .catch(() => { /* service offline */ })
  }, [])

  // Effet de recherche — se déclenche quand triggerSearch change
  // Les setState sont dans des callbacks async, pas dans le corps de l'effet
  useEffect(() => {
    const controller = new AbortController()

    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await searchLawyers(pendingFilters.current)
        if (!controller.signal.aborted) {
          setResults(res.data)
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Impossible de charger les résultats. Vérifiez que le lawyer-service est démarré.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetch()
    return () => { controller.abort() }
  }, [triggerSearch])

  const doSearch = (newFilters: SearchFilters) => {
    pendingFilters.current = newFilters
    setTriggerSearch(n => n + 1)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch({ ...filters, page: 0 })
  }

  const handleReset = () => {
    setFilters(INITIAL_FILTERS)
    doSearch(INITIAL_FILTERS)
  }

  const handlePageChange = (newPage: number) => {
    const updated = { ...filters, page: newPage }
    setFilters(updated)
    doSearch(updated)
  }

  const hasActiveFilters = filters.specialty || filters.city || filters.query || filters.maxRate

  return (
    <div className="min-h-screen bg-slate-50">

      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/client/dashboard')}
            className="text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium"
          >
            ← Tableau de bord
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Trouver un avocat</h1>
          <div className="w-32" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Filtres */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 mb-8 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Affiner votre recherche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Recherche libre</label>
              <input
                type="text"
                placeholder="Mot-clé dans la biographie..."
                value={filters.query ?? ''}
                onChange={e => handleFilterChange('query', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Spécialité</label>
              <select
                value={filters.specialty ?? ''}
                onChange={e => handleFilterChange('specialty', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-white"
              >
                <option value="">Toutes</option>
                {specialties.map(s => (
                  <option key={s.id} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Ville</label>
              <input
                type="text"
                placeholder="Paris, Lyon..."
                value={filters.city ?? ''}
                onChange={e => handleFilterChange('city', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Tarif max (€/h)</label>
              <input
                type="number"
                placeholder="500"
                min={0}
                value={filters.maxRate ?? ''}
                onChange={e => handleFilterChange('maxRate', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
              />
            </div>

            <div className="flex gap-3 items-end lg:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Compteur */}
        {results && !loading && (
          <p className="text-sm text-slate-500 mb-4">
            {results.totalElements === 0
              ? 'Aucun avocat trouvé'
              : `${results.totalElements} avocat${results.totalElements > 1 ? 's' : ''} trouvé${results.totalElements > 1 ? 's' : ''}`}
            {hasActiveFilters && <span className="text-indigo-500 ml-1">· Filtres actifs</span>}
          </p>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-4 mb-6">{error}</div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* État vide */}
        {!loading && results?.content.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">⚖️</p>
            <p className="text-lg font-medium text-slate-500">Aucun avocat ne correspond à votre recherche</p>
            <p className="text-sm text-slate-400 mt-2">Essayez d'élargir les filtres ou de changer de ville</p>
            <button
              onClick={handleReset}
              className="mt-6 px-5 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition"
            >
              Voir tous les avocats
            </button>
          </div>
        )}

        {/* Grille de résultats */}
        {!loading && results && results.content.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.content.map(lawyer => (
              <LawyerCard key={lawyer.id} lawyer={lawyer} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && results && results.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              disabled={results.number === 0}
              onClick={() => handlePageChange(results.number - 1)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Précédent
            </button>
            <span className="text-sm text-slate-500 px-4">
              Page {results.number + 1} / {results.totalPages}
            </span>
            <button
              disabled={results.number >= results.totalPages - 1}
              onClick={() => handlePageChange(results.number + 1)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Suivant →
            </button>
          </div>
        )}
      </main>
    </div>
  )
}