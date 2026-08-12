import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// ── Types ────────────────────────────────────────────────
interface LawyerAdminRow {
  id: number
  name: string
  email: string
  barNumber?: string
  specialty?: string
  city?: string
  lawyerStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  enabled: boolean
  createdAt?: string
}

interface Stats {
  pending: number
  approved: number
  rejected: number
  clients: number
}

// ── Instance axios admin ──────────────────────────────────
// ⚠️ Pointé en dur sur auth-service (8081), pas sur la gateway comme
// bookingApi.ts/lawyerApi.ts/authApi.ts/notificationApi.ts/analyticsApi.ts.
// Laissé tel quel ici (pas demandé), mais à harmoniser un jour pour éviter
// une 2e config de baseURL/token à maintenir en parallèle.
const adminAxios = axios.create({ baseURL: 'http://localhost:8081' })
adminAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Badges statut ─────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: '#FEF3C7', color: '#D97706', label: 'En attente' },
  APPROVED: { bg: '#ECFDF5', color: '#059669', label: 'Validé' },
  REJECTED: { bg: '#FEF2F2', color: '#DC2626', label: 'Refusé' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: '#F1F5F9', color: '#64748B', label: status }
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ── Carte stat ────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
      padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 14,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`ti ${icon}`} style={{ fontSize: 22, color }} aria-hidden />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#1E293B', margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()

  const [lawyers, setLawyers] = useState<LawyerAdminRow[]>([])
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [filter,  setFilter]  = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [lawyersRes, statsRes] = await Promise.all([
        adminAxios.get<LawyerAdminRow[]>('/api/admin/lawyers'),
        adminAxios.get<Stats>('/api/admin/stats'),
      ])
      setLawyers(lawyersRes.data)
      setStats(statsRes.data)
    } catch {
      setError('Impossible de charger les données. Vérifiez votre connexion admin.')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData() }, [])

  const handleStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setActionId(id)
    try {
      await adminAxios.put(`/api/admin/lawyers/${id}/status`, { status })
      await fetchData()
    } catch {
      alert('Erreur lors de la mise à jour du statut.')
    } finally {
      setActionId(null)
    }
  }

  const displayed = filter === 'ALL' ? lawyers : lawyers.filter(l => l.lawyerStatus === filter)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>

      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 1.5rem', height: 'auto', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-scale" style={{ fontSize: 18, color: '#fff' }} aria-hidden />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>JuriBook</span>
              <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8, fontWeight: 600 }}>ADMIN</span>
            </div>
          </div>

          {/* Onglets de navigation entre les 3 vues admin */}
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 10, overflowX: 'auto' as const, flexShrink: 1, minWidth: 0 }}>
            <button
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: 'none', background: '#fff', color: '#4F46E5', cursor: 'pointer', boxShadow: '0 1px 3px rgba(79,70,229,0.15)' }}>
              Avocats
            </button>
            <button onClick={() => navigate('/admin/analytics')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Statistiques
            </button>
            <button onClick={() => navigate('/admin/audit')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Audit
            </button>
            <button onClick={() => navigate('/admin/abuse-alerts')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Abus
            </button>
            <button onClick={() => navigate('/admin/reviews')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
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
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Dashboard administrateur</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Validation des profils avocats · Gestion des accès</p>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '-1rem auto 0', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard label="En attente"  value={stats.pending}  icon="ti-clock"       color="#D97706" />
            <StatCard label="Validés"     value={stats.approved} icon="ti-circle-check" color="#059669" />
            <StatCard label="Refusés"     value={stats.rejected} icon="ti-circle-x"    color="#DC2626" />
            <StatCard label="Clients"     value={stats.clients}  icon="ti-users"        color="#4F46E5" />
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 16 }} aria-hidden />
            {error}
          </div>
        )}

        {/* Filtres */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem', marginBottom: 16, boxShadow: '0 2px 12px rgba(79,70,229,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>
              Avocats inscrits
              {!loading && (
                <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8', marginLeft: 8 }}>
                  {displayed.length} résultat{displayed.length > 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    fontSize: 12, padding: '5px 14px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: filter === f ? '#4F46E5' : '#F1F5F9',
                    color: filter === f ? '#fff' : '#64748B',
                    transition: 'all 0.15s',
                  }}>
                  {f === 'ALL' ? 'Tous' : f === 'PENDING' ? 'En attente' : f === 'APPROVED' ? 'Validés' : 'Refusés'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94A3B8' }}>
            <i className="ti ti-loader-2" style={{ fontSize: 32, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} aria-hidden />
            Chargement...
          </div>
        )}

        {/* Vide */}
        {!loading && displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="ti ti-inbox" style={{ fontSize: 32, color: '#4F46E5' }} aria-hidden />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#1E293B', margin: '0 0 4px' }}>File d'attente vide</p>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun avocat dans cette catégorie</p>
          </div>
        )}

        {/* Liste avocats */}
        {!loading && displayed.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {displayed.map(lawyer => (
              <div key={lawyer.id} style={{
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem',
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                borderLeft: lawyer.lawyerStatus === 'PENDING' ? '4px solid #D97706' :
                            lawyer.lawyerStatus === 'APPROVED' ? '4px solid #059669' : '4px solid #DC2626',
              }}>

                {/* Avatar */}
                <div style={{
                  width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                  background: '#EEF2FF', color: '#4F46E5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15,
                }}>
                  {(lawyer.barNumber ?? 'XX').slice(0, 2)}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>{lawyer.name}</span>
                    <StatusBadge status={lawyer.lawyerStatus} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-mail" style={{ fontSize: 12, color: '#6366F1' }} aria-hidden />
                      {lawyer.email}
                    </span>
                    {lawyer.barNumber && (
                      <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-id-badge" style={{ fontSize: 12, color: '#6366F1' }} aria-hidden />
                        Barreau {lawyer.barNumber}
                      </span>
                    )}
                    {lawyer.specialty && (
                      <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-scale" style={{ fontSize: 12, color: '#6366F1' }} aria-hidden />
                        {lawyer.specialty}
                      </span>
                    )}
                    {lawyer.city && (
                      <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="ti ti-map-pin" style={{ fontSize: 12, color: '#6366F1' }} aria-hidden />
                        {lawyer.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {lawyer.lawyerStatus !== 'APPROVED' && (
                    <button
                      disabled={actionId === lawyer.id}
                      onClick={() => handleStatus(lawyer.id, 'APPROVED')}
                      style={{
                        fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#ECFDF5', color: '#059669',
                        opacity: actionId === lawyer.id ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <i className="ti ti-circle-check" style={{ fontSize: 14 }} aria-hidden />
                      Valider
                    </button>
                  )}
                  {lawyer.lawyerStatus !== 'REJECTED' && (
                    <button
                      disabled={actionId === lawyer.id}
                      onClick={() => handleStatus(lawyer.id, 'REJECTED')}
                      style={{
                        fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        background: '#FEF2F2', color: '#DC2626',
                        opacity: actionId === lawyer.id ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', gap: 5,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <i className="ti ti-circle-x" style={{ fontSize: 14 }} aria-hidden />
                      Refuser
                    </button>
                  )}
                  {actionId === lawyer.id && (
                    <span style={{ fontSize: 12, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="ti ti-loader-2" style={{ fontSize: 14, animation: 'spin 1s linear infinite' }} aria-hidden />
                      Mise à jour...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}