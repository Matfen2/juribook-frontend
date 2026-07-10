import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchUsers, activateUser, type AdminUser, type AdminUserPage } from '../../api/adminUserApi'

function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const ROLE_LABEL: Record<string, string> = { CLIENT: 'Client', LAWYER: 'Avocat', ADMIN: 'Admin' }

function AlertCard({ user, onUnblock, unblocking }: {
  user: AdminUser; onUnblock: (id: number) => void; unblocking: boolean
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      borderLeft: '4px solid #DC2626',
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: '#FEF2F2', color: '#DC2626',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: 20 }} aria-hidden />
      </div>

      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>{user.name}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: '#F1F5F9', color: '#64748B' }}>
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-mail" style={{ fontSize: 12, color: '#6366F1' }} aria-hidden />
            {user.email}
          </span>
          <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-clock" style={{ fontSize: 12, color: '#6366F1' }} aria-hidden />
            Suspendu le {formatDateTime(user.suspendedAt)}
          </span>
        </div>
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
          padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <i className="ti ti-flag" style={{ fontSize: 12, color: '#DC2626' }} aria-hidden />
          <span style={{ fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>{user.suspendedReason}</span>
        </div>
      </div>

      <button
        disabled={unblocking}
        onClick={() => onUnblock(user.id)}
        style={{
          fontSize: 12.5, fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: unblocking ? 'default' : 'pointer',
          background: '#ECFDF5', color: '#059669', opacity: unblocking ? 0.5 : 1,
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}
      >
        {unblocking ? (
          <>
            <i className="ti ti-loader-2" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }} aria-hidden />
            Déblocage...
          </>
        ) : (
          <>
            <i className="ti ti-lock-open" style={{ fontSize: 14 }} aria-hidden />
            Débloquer
          </>
        )}
      </button>
    </div>
  )
}

export default function AdminAbuseAlertsPage() {
  const navigate = useNavigate()

  const [data, setData] = useState<AdminUserPage | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unblockingId, setUnblockingId] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async (p = 0) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await searchUsers({ enabled: false, suspensionSource: 'ABUSE_DETECTION', page: p })
      setData(data)
      setPage(p)
    } catch {
      setError("Impossible de charger les alertes d'abus. Vérifiez que l'auth-service est accessible.")
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(0) }, [load])

  const handleUnblock = async (id: number) => {
    setUnblockingId(id)
    try {
      await activateUser(id)
      setToast('Compte débloqué')
      await load(page)
    } catch {
      setToast('Échec du déblocage, réessayez')
    } finally {
      setUnblockingId(null)
      setTimeout(() => setToast(null), 3000)
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

          {/* Onglets de navigation entre les 4 vues admin */}
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
            <button
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fff', color: '#DC2626', cursor: 'pointer', boxShadow: '0 1px 3px rgba(220,38,38,0.15)' }}>
              Abus
            </button>
            <button onClick={() => navigate('/admin/reviews')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
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
      <div style={{ background: 'linear-gradient(135deg, #DC2626 0%, #7C3AED 100%)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Alertes d'abus détectés</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
            Comptes suspendus automatiquement par le système (annulations ou avis 1★ répétés) — jamais une désactivation manuelle ou un refus de profil
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '-1rem auto 0', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {data && !loading && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem', marginBottom: 16, boxShadow: '0 2px 12px rgba(220,38,38,0.07)' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>
              {data.totalElements} compte{data.totalElements > 1 ? 's' : ''} actuellement suspendu{data.totalElements > 1 ? 's' : ''} pour abus
            </p>
          </div>
        )}

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
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-shield-check" style={{ fontSize: 32, color: '#059669' }} aria-hidden />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', margin: '0 0 4px' }}>Aucune alerte en cours</p>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun compte n'est actuellement suspendu par détection d'abus</p>
          </div>
        )}

        {!loading && !error && data && data.content.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.content.map(user => (
              <AlertCard
                key={user.id}
                user={user}
                onUnblock={handleUnblock}
                unblocking={unblockingId === user.id}
              />
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '1.5rem' }}>
            <button disabled={page === 0} onClick={() => load(page - 1)}
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1, fontWeight: 500, color: '#4F46E5' }}>
              Précédent
            </button>
            <span style={{ fontSize: 13, color: '#64748B', padding: '0 8px' }}>
              {data.number + 1} / {data.totalPages}
            </span>
            <button disabled={page >= data.totalPages - 1} onClick={() => load(page + 1)}
              style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: page >= data.totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= data.totalPages - 1 ? 0.4 : 1, fontWeight: 500, color: '#4F46E5' }}>
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