import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getReviewsForModeration, hideReview, unhideReview, deleteReview,
  type AdminReview, type AdminReviewPage,
} from '../../api/reviewModerationApi'

type Filter = 'all' | 'visible' | 'hidden'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#F59E0B', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(rating)}
      <span style={{ color: '#E2E8F0' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function ReviewRow({ review, onHide, onUnhide, onDelete, busy }: {
  review: AdminReview
  onHide: (id: number) => void
  onUnhide: (id: number) => void
  onDelete: (id: number) => void
  busy: boolean
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.1rem 1.25rem',
      borderLeft: review.rating <= 2 ? '4px solid #DC2626' : '4px solid #E2E8F0',
      opacity: review.visible ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Stars rating={review.rating} />
          <span style={{ fontSize: 11.5, color: '#94A3B8' }}>
            avocat #{review.lawyerId} · client #{review.clientId} · réservation #{review.bookingId}
          </span>
          {!review.visible && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: '#F1F5F9', color: '#64748B' }}>
              MASQUÉ
            </span>
          )}
        </div>
        <span style={{ fontSize: 11.5, color: '#94A3B8' }}>{formatDateTime(review.createdAt)}</span>
      </div>

      {review.comment && (
        <p style={{ fontSize: 13, color: '#475569', margin: '0 0 12px', lineHeight: 1.6 }}>
          « {review.comment} »
        </p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {review.visible ? (
          <button disabled={busy} onClick={() => onHide(review.id)}
            style={{
              fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: busy ? 'default' : 'pointer',
              background: '#FFFBEB', color: '#D97706', opacity: busy ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 5,
            }}>
            <i className="ti ti-eye-off" style={{ fontSize: 13 }} aria-hidden />
            Masquer
          </button>
        ) : (
          <button disabled={busy} onClick={() => onUnhide(review.id)}
            style={{
              fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: busy ? 'default' : 'pointer',
              background: '#ECFDF5', color: '#059669', opacity: busy ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 5,
            }}>
            <i className="ti ti-eye" style={{ fontSize: 13 }} aria-hidden />
            Démasquer
          </button>
        )}
        <button disabled={busy} onClick={() => onDelete(review.id)}
          style={{
            fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #FCA5A5', cursor: busy ? 'default' : 'pointer',
            background: '#fff', color: '#DC2626', opacity: busy ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 5,
          }}>
          <i className="ti ti-trash" style={{ fontSize: 13 }} aria-hidden />
          Supprimer
        </button>
      </div>
    </div>
  )
}

export default function AdminReviewModerationPage() {
  const navigate = useNavigate()

  const [filter, setFilter] = useState<Filter>('all')
  const [data, setData] = useState<AdminReviewPage | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const visibleParam = filter === 'all' ? undefined : filter === 'visible'

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getReviewsForModeration({ visible: visibleParam, page: p })
      setData(data)
      setPage(p)
    } catch {
      setError("Impossible de charger les avis. Vérifiez que le lawyer-service est accessible.")
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(0) }, [load])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleHide = async (id: number) => {
    setBusyId(id)
    try {
      await hideReview(id)
      showToast('Avis masqué')
      await load(page)
    } catch {
      showToast('Échec du masquage')
    } finally {
      setBusyId(null)
    }
  }

  const handleUnhide = async (id: number) => {
    setBusyId(id)
    try {
      await unhideReview(id)
      showToast('Avis démasqué')
      await load(page)
    } catch {
      showToast('Échec du démasquage')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer définitivement cet avis ? Cette action est irréversible.')) return
    setBusyId(id)
    try {
      await deleteReview(id)
      showToast('Avis supprimé définitivement')
      await load(page)
    } catch {
      showToast('Échec de la suppression')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>

      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-scale" style={{ fontSize: 18, color: '#fff' }} aria-hidden />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>JuriBook</span>
              <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8, fontWeight: 600 }}>ADMIN</span>
            </div>
          </div>

          {/* Onglets de navigation entre les 5 vues admin (Sprint 7.6-7.9) */}
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/admin/dashboard')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Avocats
            </button>
            <button onClick={() => navigate('/admin/analytics')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Statistiques
            </button>
            <button onClick={() => navigate('/admin/audit')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Audit
            </button>
            <button onClick={() => navigate('/admin/abuse-alerts')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Abus
            </button>
            <button
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fff', color: '#F59E0B', cursor: 'pointer', boxShadow: '0 1px 3px rgba(245,158,11,0.15)' }}>
              Avis
            </button>
          </div>

          <button onClick={() => { localStorage.clear(); navigate('/login') }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748B', background: 'none', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}>
            <i className="ti ti-logout" style={{ fontSize: 14 }} aria-hidden />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Modération des avis</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            Triés par note croissante — les moins bien notés en priorité, aucun signalement côté client à ce stade
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '-1rem auto 0', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {/* Filtres */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: 16, boxShadow: '0 2px 12px rgba(245,158,11,0.07)', display: 'flex', gap: 6 }}>
          {(['all', 'visible', 'hidden'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                fontSize: 12.5, padding: '7px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: filter === f ? '#F59E0B' : '#F1F5F9',
                color: filter === f ? '#fff' : '#64748B',
              }}>
              {f === 'all' ? 'Tous' : f === 'visible' ? 'Visibles' : 'Masqués'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 16 }} aria-hidden />
            {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
            <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} aria-hidden />
            Chargement...
          </div>
        )}

        {!loading && !error && data?.content.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-star-off" style={{ fontSize: 32, color: '#94A3B8' }} aria-hidden />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', margin: '0 0 4px' }}>Aucun avis dans cette catégorie</p>
          </div>
        )}

        {!loading && !error && data && data.content.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.content.map(review => (
              <ReviewRow
                key={review.id}
                review={review}
                onHide={handleHide}
                onUnhide={handleUnhide}
                onDelete={handleDelete}
                busy={busyId === review.id}
              />
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '1.5rem' }}>
            <button disabled={page === 0} onClick={() => load(page - 1)}
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontWeight: 500, color: '#D97706' }}>
              Précédent
            </button>
            <span style={{ fontSize: 13, color: '#64748B', padding: '0 8px' }}>
              {data.number + 1} / {data.totalPages}
            </span>
            <button disabled={page >= data.totalPages - 1} onClick={() => load(page + 1)}
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: page >= data.totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= data.totalPages - 1 ? 0.4 : 1, fontWeight: 500, color: '#D97706' }}>
              Suivant
            </button>
          </div>
        )}
      </main>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1E293B', color: '#fff', fontSize: 13, fontWeight: 500,
          padding: '10px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 100,
        }}>
          {toast}
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}