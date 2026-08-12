import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getMyBookings, type BookingHistoryItem, type BookingStatus } from '../../api/bookingApi'
import { getLawyerById, type LawyerProfile } from '../../api/lawyerApi'
import NotificationBell from '../../components/NotificationBell'
import DocumentUpload from '../../components/DocumentUpload'

// Enrichissement local : on ne connaît que lawyerId côté booking-service,
// le nom/ville de l'avocat vient du lawyer-service. On dédoublonne les
// lawyerId avant de fetcher pour éviter un appel par ligne d'historique.
type EnrichedBooking = BookingHistoryItem & { lawyer?: LawyerProfile }

type TabKey = 'upcoming' | 'past' | 'cancelled'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'upcoming',  label: 'À venir',  icon: 'ti-calendar-time'  },
  { key: 'past',      label: 'Passés',   icon: 'ti-calendar-check' },
  { key: 'cancelled', label: 'Annulés',  icon: 'ti-calendar-off'   },
]

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; label: string; icon: string }> = {
  PENDING:   { bg: '#FFFBEB', color: '#92400E', label: 'En attente',  icon: 'ti-clock' },
  CONFIRMED: { bg: '#ECFDF5', color: '#065F46', label: 'Confirmé',    icon: 'ti-check' },
  COMPLETED: { bg: '#F1F5F9', color: '#475569', label: 'Terminé',     icon: 'ti-flag' },
  CANCELLED: { bg: '#FEF2F2', color: '#B91C1C', label: 'Annulé',      icon: 'ti-x' },
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
    }}>
      <i className={`ti ${s.icon}`} style={{ fontSize: 11 }} aria-hidden />
      {s.label}
    </span>
  )
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatHM(time: string): string {
  return time.slice(0, 5)
}

function isPastBooking(b: BookingHistoryItem): boolean {
  if (!b.date || !b.startTime) return false
  const start = new Date(`${b.date}T${b.startTime}`)
  return start.getTime() < Date.now()
}

function categorize(b: BookingHistoryItem): TabKey {
  if (b.status === 'CANCELLED') return 'cancelled'
  if (b.status === 'COMPLETED' || isPastBooking(b)) return 'past'
  return 'upcoming'
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
          padding: '1rem 1.25rem', display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: '45%', height: 12, borderRadius: 6, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '70%', height: 10, borderRadius: 6, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function BookingCard({ booking }: { booking: EnrichedBooking }) {
  const navigate = useNavigate()
  const lawyerName = booking.lawyer?.name ?? `Avocat #${booking.lawyerId}`
  const city = booking.lawyer?.address?.city

  return (
    <div
      data-cy="client-booking-card"
      style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
        padding: '1rem 1.25rem', display: 'flex', gap: 14, alignItems: 'flex-start',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <i className="ti ti-scale" style={{ fontSize: 20, color: '#4F46E5' }} aria-hidden />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <button
            onClick={() => navigate(`/lawyers/${booking.lawyerId}`)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontSize: 14.5, fontWeight: 700, color: '#1E293B', textAlign: 'left',
            }}
          >
            {lawyerName}
          </button>
          <StatusBadge status={booking.status} />
        </div>

        {booking.date && booking.startTime && booking.endTime ? (
          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 13, color: '#94A3B8' }} aria-hidden />
            {formatFullDate(booking.date)}
            <span style={{ color: '#CBD5E1' }}>·</span>
            {formatHM(booking.startTime)}–{formatHM(booking.endTime)}
            {city && (
              <>
                <span style={{ color: '#CBD5E1' }}>·</span>
                <i className="ti ti-map-pin" style={{ fontSize: 12, color: '#94A3B8' }} aria-hidden />
                {city}
              </>
            )}
          </p>
        ) : (
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 6px', fontStyle: 'italic' }}>
            Créneau introuvable (peut-être supprimé)
          </p>
        )}

        {booking.reason && (
          <p style={{ fontSize: 12.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            « {booking.reason} »
          </p>
        )}

        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
          <DocumentUpload bookingId={booking.id} />
        )}
      </div>
    </div>
  )
}

export default function ClientBookingsPage() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<EnrichedBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming')

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    getMyBookings()
      .then(async ({ data }) => {
        // Dédoublonne les lawyerId avant de fetcher les profils, pour
        // éviter un appel par réservation quand plusieurs concernent le
        // même avocat.
        const uniqueLawyerIds = [...new Set(data.map(b => b.lawyerId))]
        const profiles = await Promise.all(
          uniqueLawyerIds.map(id =>
            getLawyerById(id).then(res => res.data).catch(() => null)
          )
        )
        const lawyerById = new Map<number, LawyerProfile>()
        profiles.forEach(p => { if (p) lawyerById.set(p.id, p) })

        if (!cancelled) {
          setBookings(data.map(b => ({ ...b, lawyer: lawyerById.get(b.lawyerId) })))
        }
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger votre historique. Réessayez dans un instant.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const grouped = useMemo(() => {
    const g: Record<TabKey, EnrichedBooking[]> = { upcoming: [], past: [], cancelled: [] }
    bookings.forEach(b => g[categorize(b)].push(b))
    return g
  }, [bookings])

  const activeList = grouped[activeTab]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>

      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/client/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden />
            Mon espace
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-scale" style={{ fontSize: 17, color: '#fff' }} aria-hidden />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>JuriBook</span>
          </div>
          <NotificationBell />
        </div>
      </header>

      {/* Bandeau violet */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', height: 80, transformOrigin: 'left' }} />

      <main style={{ maxWidth: 780, margin: '-40px auto 0', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {/* Titre */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20,
          padding: '1.5rem 1.75rem', marginBottom: 16,
          boxShadow: '0 8px 32px rgba(79,70,229,0.12)',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-calendar-event" style={{ fontSize: 20, color: '#4F46E5' }} aria-hidden />
            Mes rendez-vous
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
            Historique de vos consultations, passées et à venir
          </p>
        </motion.div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {TABS.map(tab => {
            const count = grouped[tab.key].length
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                data-cy={`client-bookings-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid #E2E8F0',
                  background: isActive ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                <i className={`ti ${tab.icon}`} style={{ fontSize: 16, color: isActive ? '#fff' : '#94A3B8' }} aria-hidden />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: isActive ? '#fff' : '#475569' }}>
                  {tab.label}
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: isActive ? 'rgba(255,255,255,0.8)' : '#94A3B8' }}>
                  {loading ? '···' : count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && <Skeleton />}

        {/* Liste */}
        {!loading && !error && (
          activeList.length === 0 ? (
            <div style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
              padding: '2.5rem 1.5rem', textAlign: 'center',
            }}>
              <i className={`ti ${TABS.find(t => t.key === activeTab)?.icon}`} style={{ fontSize: 32, color: '#CBD5E1' }} aria-hidden />
              <p style={{ fontSize: 13.5, color: '#64748B', margin: '10px 0 16px' }}>
                {activeTab === 'upcoming' && "Vous n'avez aucun rendez-vous à venir"}
                {activeTab === 'past' && "Aucun rendez-vous passé pour l'instant"}
                {activeTab === 'cancelled' && 'Aucune réservation annulée'}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  onClick={() => navigate('/search')}
                  style={{
                    fontSize: 13, color: '#fff', border: 'none',
                    background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
                    borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Trouver un avocat
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeList.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )
        )}
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </motion.div>
  )
}