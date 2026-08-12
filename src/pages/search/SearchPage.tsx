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

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  const relevant = parts.slice(-2)
  return relevant.map(p => p[0]).join('').toUpperCase()
}

const AVATAR_BG = ['#4F46E5', '#7C3AED', '#0891B2', '#059669', '#D97706']
const AVATAR_TX = ['#EEF2FF', '#F5F3FF', '#E0F7FA', '#ECFDF5', '#FFFBEB']
function avatarStyle(seed?: string) {
  const safeSeed = seed && seed.length > 0 ? seed : '?'
  const i = safeSeed.charCodeAt(0) % AVATAR_BG.length
  return { bg: AVATAR_BG[i], tx: AVATAR_TX[i] }
}

function Stars({ rating, count }: { rating?: number; count: number }) {
  if (!rating) return <span style={{ fontSize: 12, color: '#94A3B8' }}>Aucun avis</span>
  const full = Math.round(rating)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#F59E0B', fontSize: 13, letterSpacing: 1 }}>
        {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      </span>
      <span style={{ fontSize: 12, color: '#94A3B8' }}>({count})</span>
    </span>
  )
}

function LawyerCard({ lawyer, onClick }: { lawyer: LawyerSearchResult; onClick: () => void }) {
  const av = avatarStyle(lawyer.name)

  return (
    <article
      data-cy="lawyer-card"
      data-lawyer-id={lawyer.id}
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,70,229,0.12)'
        e.currentTarget.style.borderColor = '#818CF8'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#E2E8F0'
      }}
    >
      {/* Avatar + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: av.bg, color: av.tx,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16, letterSpacing: 1,
        }}>
          {initials(lawyer.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>
            {lawyer.name ?? 'Avocat'}
          </p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Barreau n° {lawyer.barNumber}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {lawyer.specialties.slice(0, 2).map(s => (
              <span key={s.id} style={{
                fontSize: 11, padding: '2px 9px', borderRadius: 99, fontWeight: 600,
                background: '#EEF2FF', color: '#4F46E5',
              }}>
                {s.name}
              </span>
            ))}
            {lawyer.specialties.length > 2 && (
              <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, background: '#F1F5F9', color: '#64748B' }}>
                +{lawyer.specialties.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {lawyer.bioExcerpt && (
        <p style={{
          fontSize: 13, color: '#475569', lineHeight: 1.65, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {lawyer.bioExcerpt}
        </p>
      )}

      {/* Infos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {lawyer.address?.city && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
            <i className="ti ti-map-pin" style={{ fontSize: 13, color: '#6366F1' }} aria-hidden />
            {lawyer.address.city}
          </span>
        )}
        {lawyer.yearsExperience != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
            <i className="ti ti-briefcase" style={{ fontSize: 13, color: '#6366F1' }} aria-hidden />
            {lawyer.yearsExperience} ans
          </span>
        )}
        {lawyer.languages && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
            <i className="ti ti-world" style={{ fontSize: 13, color: '#6366F1' }} aria-hidden />
            {lawyer.languages}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 10, borderTop: '1px solid #F1F5F9',
      }}>
        <Stars rating={lawyer.averageRating} count={lawyer.reviewCount} />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>
          {lawyer.hourlyRate ? `${lawyer.hourlyRate} €/h` : 'Tarif libre'}
        </span>
      </div>

      {/* Lien vers détail */}
      <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        Voir le profil complet <i className="ti ti-arrow-right" style={{ fontSize: 13 }} aria-hidden />
      </div>
    </article>
  )
}

const INITIAL_FILTERS: SearchFilters = {
  specialty: '', city: '', query: '', maxRate: undefined, page: 0, size: 20,
}

export default function SearchPage() {
  const navigate = useNavigate()

  const [filters, setFilters]         = useState<SearchFilters>(INITIAL_FILTERS)
  const [triggerSearch, setTrigger]   = useState(0)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [results, setResults]         = useState<LawyerSearchPage | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const pendingFilters = useRef<SearchFilters>(INITIAL_FILTERS)

  useEffect(() => {
    getSpecialties()
      .then((res: { data: Specialty[] }) => setSpecialties(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    const run = async () => {
      setLoading(true); setError(null)
      try {
        const res = await searchLawyers(pendingFilters.current)
        if (!ctrl.signal.aborted) setResults(res.data)
      } catch {
        if (!ctrl.signal.aborted)
          setError('Impossible de joindre le lawyer-service. Vérifiez qu\'il est démarré sur le port 8082.')
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }
    void run()
    return () => ctrl.abort()
  }, [triggerSearch])

  const doSearch = (f: SearchFilters) => { pendingFilters.current = f; setTrigger(n => n + 1) }
  const handleFilterChange = (k: keyof SearchFilters, v: string | number | undefined) =>
    setFilters(prev => ({ ...prev, [k]: v, page: 0 }))
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); doSearch({ ...filters, page: 0 }) }
  const handleReset  = () => { setFilters(INITIAL_FILTERS); doSearch(INITIAL_FILTERS) }
  const handlePage   = (p: number) => { const f = { ...filters, page: p }; setFilters(f); doSearch(f) }
  const hasFilters   = filters.specialty || filters.city || filters.query || filters.maxRate

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>

      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/client/dashboard')}
            className="search-back-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden />
            <span className="search-back-label">Tableau de bord</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-scale" style={{ fontSize: 17, color: '#fff' }} aria-hidden />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>JuriBook</span>
          </div>
          {/* Spacer adaptatif */}
          <div className="search-header-spacer" />
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', padding: '2rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
          Trouver un avocat
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
          Des experts juridiques près de chez vous, disponibles rapidement
        </p>
      </div>

      <main style={{ maxWidth: 1100, margin: '-1.5rem auto 0', padding: '0 1rem 3rem', position: 'relative', zIndex: 1 }}>

        {/* Formulaire de recherche */}
        <form onSubmit={handleSubmit} style={{
          background: '#fff', borderRadius: 16, padding: '1.25rem',
          marginBottom: '1.5rem', boxShadow: '0 4px 24px rgba(79,70,229,0.10)',
          border: '1px solid #E2E8F0',
        }}>
          <div className="search-form-grid">

            {/* Recherche libre — pleine largeur sur mobile, span 2 sur desktop */}
            <div className="search-field-full">
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Recherche libre
              </label>
              <div style={{ position: 'relative' }}>
                <i className="ti ti-search" aria-hidden style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#94A3B8', pointerEvents: 'none' }} />
                <input
                  data-cy="search-query-input"
                  type="text" placeholder="Mot-clé dans la biographie..."
                  value={filters.query ?? ''}
                  onChange={e => handleFilterChange('query', e.target.value)}
                  style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '10px 12px 10px 36px', fontSize: 13, outline: 'none', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#6366F1'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Spécialité</label>
              <select data-cy="search-specialty-select" value={filters.specialty ?? ''} onChange={e => handleFilterChange('specialty', e.target.value)}
                style={{ width: '100%', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '10px 12px', fontSize: 13, background: '#fff', outline: 'none' }}>
                <option value="">Toutes</option>
                {specialties.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ville</label>
              <input data-cy="search-city-input" type="text" placeholder="Paris, Lyon..." value={filters.city ?? ''}
                onChange={e => handleFilterChange('city', e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '10px 12px', fontSize: 13, outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tarif max (€/h)</label>
              <input type="number" placeholder="500" min={0} value={filters.maxRate ?? ''}
                onChange={e => handleFilterChange('maxRate', e.target.value ? Number(e.target.value) : undefined)}
                style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '10px 12px', fontSize: 13, outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = '#6366F1'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button data-cy="search-submit-button" type="submit" disabled={loading}
                style={{ flex: 1, background: loading ? '#A5B4FC' : 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(79,70,229,0.3)', transition: 'opacity 0.15s' }}>
                {loading ? 'Recherche...' : 'Rechercher'}
              </button>
              {hasFilters && (
                <button type="button" onClick={handleReset}
                  style={{ padding: '10px 12px', fontSize: 13, color: '#64748B', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  Effacer
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Compteur */}
        {results && !loading && (
          <div data-cy="search-results-count" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
            {results.totalElements > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#4F46E5', background: '#EEF2FF', padding: '4px 12px', borderRadius: 99 }}>
                <i className="ti ti-users" style={{ fontSize: 13 }} aria-hidden />
                {results.totalElements} avocat{results.totalElements > 1 ? 's' : ''} trouvé{results.totalElements > 1 ? 's' : ''}
              </span>
            )}
            {results.totalElements === 0 && (
              <span style={{ fontSize: 13, color: '#94A3B8' }}>Aucun avocat trouvé</span>
            )}
            {hasFilters && <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 500 }}>· Filtres actifs</span>}
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, borderRadius: 12, padding: '12px 16px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 16 }} aria-hidden />
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="search-results-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 10, width: '35%', background: '#F1F5F9', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <div style={{ height: 10, width: '65%', background: '#F1F5F9', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  </div>
                </div>
                <div style={{ height: 10, background: '#F1F5F9', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ height: 10, width: '80%', background: '#F1F5F9', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        )}

        {/* État vide */}
        {!loading && results?.content.length === 0 && (
          <div data-cy="search-empty-state" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-scale" style={{ fontSize: 36, color: '#4F46E5' }} aria-hidden />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: '#1E293B', margin: '0 0 6px' }}>Aucun avocat ne correspond</p>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 24px' }}>Élargissez les filtres ou changez de ville</p>
            <button onClick={handleReset}
              style={{ fontSize: 13, color: '#4F46E5', border: '1.5px solid #818CF8', background: '#EEF2FF', borderRadius: 10, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>
              Voir tous les avocats
            </button>
          </div>
        )}

        {/* Grille résultats */}
        {!loading && results && results.content.length > 0 && (
          <div data-cy="search-results-grid" className="search-results-grid">
            {results.content.map(lawyer => (
              <LawyerCard key={lawyer.id} lawyer={lawyer} onClick={() => navigate(`/lawyers/${lawyer.id}`)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && results && results.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '2.5rem' }}>
            <button disabled={results.number === 0} onClick={() => handlePage(results.number - 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: results.number === 0 ? 'not-allowed' : 'pointer', opacity: results.number === 0 ? 0.4 : 1, fontWeight: 500, color: '#4F46E5' }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden />Précédent
            </button>
            <span style={{ fontSize: 13, color: '#64748B', padding: '0 12px', fontWeight: 500 }}>
              {results.number + 1} / {results.totalPages}
            </span>
            <button disabled={results.number >= results.totalPages - 1} onClick={() => handlePage(results.number + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: results.number >= results.totalPages - 1 ? 'not-allowed' : 'pointer', opacity: results.number >= results.totalPages - 1 ? 0.4 : 1, fontWeight: 500, color: '#4F46E5' }}>
              Suivant<i className="ti ti-arrow-right" style={{ fontSize: 14 }} aria-hidden />
            </button>
          </div>
        )}
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }`}</style>
    </div>
  )
}