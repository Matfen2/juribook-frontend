import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchAuditLog, getBookingHistory, type AuditEntry, type AuditEntryPage } from '../../api/auditApi'

type Mode = 'user' | 'booking'

// ── Helpers ──────────────────────────────────────────────
function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const TOPIC_COLOR: Record<string, string> = {
  'booking-events': '#4F46E5',
  'slot-events': '#0891B2',
  'lawyer-events': '#7C3AED',
  'review-events': '#F59E0B',
  'audit-events': '#64748B',
  'search-events': '#059669',
  'document-events': '#DC2626',
  'abuse-events': '#B91C1C',
}

function TopicBadge({ topic }: { topic: string }) {
  const color = TOPIC_COLOR[topic] ?? '#64748B'
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
      background: `${color}18`, color, textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {topic}
    </span>
  )
}

// ── Ligne d'entrée d'audit, avec payload dépliable ────────
function AuditEntryRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)

  let prettyPayload = entry.payload
  try {
    prettyPayload = JSON.stringify(JSON.parse(entry.payload), null, 2)
  } catch {
    // payload non-JSON - affiché brut tel quel
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
      padding: '0.9rem 1.1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <TopicBadge topic={entry.topic} />
        {entry.eventType && (
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{entry.eventType}</span>
        )}
        {entry.actorId != null && (
          <span style={{ fontSize: 11.5, color: '#94A3B8' }}>· acteur #{entry.actorId}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#94A3B8' }}>
          {formatDateTime(entry.occurredAt ?? entry.recordedAt)}
        </span>
      </div>

      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          fontSize: 11.5, color: '#4F46E5', background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <i className={`ti ${expanded ? 'ti-chevron-down' : 'ti-chevron-right'}`} style={{ fontSize: 13 }} aria-hidden />
        {expanded ? 'Masquer le payload brut' : 'Voir le payload brut'}
      </button>

      {expanded && (
        <pre style={{
          marginTop: 8, background: '#0F172A', color: '#E2E8F0', fontSize: 11.5,
          padding: '10px 14px', borderRadius: 8, overflowX: 'auto', lineHeight: 1.6,
        }}>
          {prettyPayload}
        </pre>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
      <i className="ti ti-file-off" style={{ fontSize: 32, color: '#CBD5E1' }} aria-hidden />
      <p style={{ fontSize: 13.5, color: '#94A3B8', margin: '10px 0 0' }}>{text}</p>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────
export default function AdminAuditPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('user')

  // Recherche par utilisateur
  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [userResults, setUserResults] = useState<AuditEntryPage | null>(null)
  const [userPage, setUserPage] = useState(0)

  // Recherche par réservation
  const [bookingId, setBookingId] = useState('')
  const [bookingResults, setBookingResults] = useState<AuditEntry[] | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const runUserSearch = async (page = 0) => {
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const { data } = await searchAuditLog({
        userId: userId ? Number(userId) : undefined,
        from: from ? `${from}:00` : undefined,
        to: to ? `${to}:00` : undefined,
        page,
      })
      setUserResults(data)
      setUserPage(page)
    } catch {
      setError("Impossible de charger le journal d'audit. Vérifiez que l'audit-service est accessible.")
    } finally {
      setLoading(false)
    }
  }

  const runBookingSearch = async () => {
    if (!bookingId) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const { data } = await getBookingHistory(Number(bookingId))
      setBookingResults(data)
    } catch {
      setError("Impossible de charger l'historique de cette réservation.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'user') void runUserSearch(0)
    else void runBookingSearch()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>

      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 1.5rem', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 8 }}>
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
            <button onClick={() => navigate('/admin/dashboard')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Avocats
            </button>
            <button onClick={() => navigate('/admin/analytics')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Statistiques
            </button>
            <button
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fff', color: '#4F46E5', cursor: 'pointer', boxShadow: '0 1px 3px rgba(79,70,229,0.15)' }}>
              Audit
            </button>
            <button onClick={() => navigate('/admin/abuse-alerts')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
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
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Journal d'audit</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Historique complet et immuable — tous les événements de la plateforme, tous topics confondus
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '-1rem auto 0', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {/* Sélecteur de mode */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '1.25rem', marginBottom: 16, boxShadow: '0 2px 12px rgba(79,70,229,0.07)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {(['user', 'booking'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setSearched(false); setError(null) }}
                style={{
                  fontSize: 12.5, padding: '7px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: mode === m ? '#4F46E5' : '#F1F5F9',
                  color: mode === m ? '#fff' : '#64748B',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                <i className={`ti ${m === 'user' ? 'ti-user' : 'ti-calendar-event'}`} style={{ fontSize: 14 }} aria-hidden />
                {m === 'user' ? 'Par utilisateur' : 'Par réservation'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'user' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ID utilisateur
                  </label>
                  <input type="number" placeholder="Ex : 42" value={userId} onChange={e => setUserId(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '9px 12px', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Depuis (optionnel)
                  </label>
                  <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '9px 12px', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Jusqu'à (optionnel)
                  </label>
                  <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '9px 12px', fontSize: 13, outline: 'none' }} />
                </div>
                <button type="submit" disabled={loading}
                  style={{ background: loading ? '#A5B4FC' : 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ID de réservation
                  </label>
                  <input type="number" placeholder="Ex : 900" value={bookingId} onChange={e => setBookingId(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '9px 12px', fontSize: 13, outline: 'none' }} />
                </div>
                <button type="submit" disabled={loading || !bookingId}
                  style={{ background: (loading || !bookingId) ? '#A5B4FC' : 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: (loading || !bookingId) ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Recherche...' : 'Voir la timeline'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 16 }} aria-hidden />
            {error}
          </div>
        )}

        {/* Résultats - mode utilisateur */}
        {mode === 'user' && searched && !error && (
          <>
            {userResults && (
              <p style={{ fontSize: 12.5, color: '#64748B', marginBottom: 10 }}>
                {userResults.totalElements} événement{userResults.totalElements > 1 ? 's' : ''} trouvé{userResults.totalElements > 1 ? 's' : ''}
              </p>
            )}

            {userResults?.content.length === 0 ? (
              <EmptyState text="Aucun événement ne correspond à ces critères" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userResults?.content.map(entry => <AuditEntryRow key={entry.id} entry={entry} />)}
              </div>
            )}

            {userResults && userResults.totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '1.5rem' }}>
                <button disabled={userPage === 0} onClick={() => runUserSearch(userPage - 1)}
                  style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: userPage === 0 ? 'not-allowed' : 'pointer', opacity: userPage === 0 ? 0.4 : 1, fontWeight: 500, color: '#4F46E5' }}>
                  Précédent
                </button>
                <span style={{ fontSize: 13, color: '#64748B', padding: '0 8px' }}>
                  {userResults.number + 1} / {userResults.totalPages}
                </span>
                <button disabled={userPage >= userResults.totalPages - 1} onClick={() => runUserSearch(userPage + 1)}
                  style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: userPage >= userResults.totalPages - 1 ? 'not-allowed' : 'pointer', opacity: userPage >= userResults.totalPages - 1 ? 0.4 : 1, fontWeight: 500, color: '#4F46E5' }}>
                  Suivant
                </button>
              </div>
            )}
          </>
        )}

        {/* Résultats - mode réservation */}
        {mode === 'booking' && searched && !error && (
          bookingResults?.length === 0 ? (
            <EmptyState text="Aucun événement ne mentionne cette réservation" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bookingResults?.map(entry => <AuditEntryRow key={entry.id} entry={entry} />)}
            </div>
          )
        )}

        {!searched && !error && (
          <EmptyState text={mode === 'user'
            ? "Renseigne un identifiant utilisateur (et éventuellement une plage de dates) pour lancer une recherche"
            : 'Renseigne un identifiant de réservation pour afficher sa timeline complète'} />
        )}
      </main>
    </div>
  )
}