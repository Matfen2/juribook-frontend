import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getLawyerBookings, confirmBooking, rejectBooking,
  type BookingHistoryItem, type BookingStatus,
} from '../../api/bookingApi'
import { getMyProfile } from '../../api/lawyerApi'

type TabKey = 'pending' | 'confirmed' | 'cancelled'

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'pending',   label: 'À traiter',  icon: 'ti-inbox'          },
  { key: 'confirmed', label: 'Confirmés',  icon: 'ti-calendar-check' },
  { key: 'cancelled', label: 'Annulés',    icon: 'ti-calendar-off'   },
]

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; label: string; icon: string }> = {
  PENDING:   { bg: '#FFFBEB', color: '#92400E', label: 'En attente', icon: 'ti-clock' },
  CONFIRMED: { bg: '#ECFDF5', color: '#065F46', label: 'Confirmé',   icon: 'ti-check' },
  COMPLETED: { bg: '#F1F5F9', color: '#475569', label: 'Terminé',    icon: 'ti-flag' },
  CANCELLED: { bg: '#FEF2F2', color: '#B91C1C', label: 'Annulé',     icon: 'ti-x' },
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

function categorize(b: BookingHistoryItem): TabKey {
  if (b.status === 'CANCELLED') return 'cancelled'
  if (b.status === 'PENDING') return 'pending'
  return 'confirmed' // CONFIRMED et COMPLETED regroupés ici pour ce sprint
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

function BookingRow({
  booking, onConfirm, onReject, processing, actionError,
}: {
  booking: BookingHistoryItem
  onConfirm: (id: number) => void
  onReject: (id: number) => void
  processing: boolean
  actionError: string | null
}) {
  return (
    <div
      data-cy="lawyer-booking-card"
      style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
        padding: '1rem 1.25rem',
      }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className="ti ti-user" style={{ fontSize: 20, color: '#4F46E5' }} aria-hidden />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1E293B' }}>
              Client #{booking.id}
            </span>
            <StatusBadge status={booking.status} />
          </div>

          {booking.date && booking.startTime && booking.endTime ? (
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <i className="ti ti-calendar-event" style={{ fontSize: 13, color: '#94A3B8' }} aria-hidden />
              {formatFullDate(booking.date)}
              <span style={{ color: '#CBD5E1' }}>·</span>
              {formatHM(booking.startTime)}–{formatHM(booking.endTime)}
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
        </div>
      </div>

      {booking.status === 'PENDING' && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            data-cy="lawyer-booking-confirm-button"
            onClick={() => onConfirm(booking.id)}
            disabled={processing}
            style={{
              flex: 1, padding: '9px', borderRadius: 9, border: 'none', cursor: processing ? 'default' : 'pointer',
              background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff',
              fontWeight: 700, fontSize: 12.5, opacity: processing ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <i className="ti ti-check" style={{ fontSize: 14 }} aria-hidden />
            Confirmer
          </button>
          <button
            data-cy="lawyer-booking-reject-button"
            onClick={() => onReject(booking.id)}
            disabled={processing}
            style={{
              flex: 1, padding: '9px', borderRadius: 9, cursor: processing ? 'default' : 'pointer',
              border: '1.5px solid #FCA5A5', background: '#fff', color: '#DC2626',
              fontWeight: 700, fontSize: 12.5, opacity: processing ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden />
            Refuser
          </button>
        </div>
      )}

      {actionError && (
        <div style={{ marginTop: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, borderRadius: 8, padding: '7px 10px' }}>
          {actionError}
        </div>
      )}
    </div>
  )
}

export default function LawyerBookingsPage() {
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<BookingHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')

  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({})

  const loadBookings = (id: number) => {
    setLoading(true)
    setError(null)
    getLawyerBookings(id)
      .then(({ data }) => setBookings(data))
      .catch(() => setError('Impossible de charger vos rendez-vous. Réessayez dans un instant.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    getMyProfile()
      .then(({ data }) => loadBookings(data.id))
      .catch(() => {
        setError('Impossible de résoudre votre profil avocat.')
        setLoading(false)
      })
  }, [])

  const grouped = useMemo(() => {
    const g: Record<TabKey, BookingHistoryItem[]> = { pending: [], confirmed: [], cancelled: [] }
    bookings.forEach(b => g[categorize(b)].push(b))
    return g
  }, [bookings])

  const activeList = grouped[activeTab]

  const handleConfirm = async (bookingId: number) => {
    setProcessingId(bookingId)
    setRowErrors(prev => ({ ...prev, [bookingId]: '' }))
    try {
      await confirmBooking(bookingId)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CONFIRMED' } : b))
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setRowErrors(prev => ({ ...prev, [bookingId]: e.response?.data?.message || 'Échec de la confirmation.' }))
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (bookingId: number) => {
    setProcessingId(bookingId)
    setRowErrors(prev => ({ ...prev, [bookingId]: '' }))
    try {
      await rejectBooking(bookingId)
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setRowErrors(prev => ({ ...prev, [bookingId]: e.response?.data?.message || 'Échec du refus.' }))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>

      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/lawyer/dashboard')}
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
          <div style={{ width: 90 }} />
        </div>
      </header>

      {/* Bandeau violet */}
      <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', height: 80 }} />

      <main style={{ maxWidth: 780, margin: '-40px auto 0', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {/* Titre */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20,
          padding: '1.5rem 1.75rem', marginBottom: 16,
          boxShadow: '0 8px 32px rgba(79,70,229,0.12)',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-inbox" style={{ fontSize: 20, color: '#4F46E5' }} aria-hidden />
            Mes rendez-vous
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
            Traitez les demandes en attente et suivez vos consultations
          </p>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {TABS.map(tab => {
            const count = grouped[tab.key].length
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                data-cy={`lawyer-bookings-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid #E2E8F0',
                  background: isActive ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  position: 'relative',
                }}
              >
                {tab.key === 'pending' && grouped.pending.length > 0 && !isActive && (
                  <span style={{
                    position: 'absolute', top: 6, right: 10, width: 8, height: 8,
                    borderRadius: '50%', background: '#EF4444',
                  }} />
                )}
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

        {/* Erreur globale */}
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
              <p style={{ fontSize: 13.5, color: '#64748B', margin: '10px 0 0' }}>
                {activeTab === 'pending' && 'Aucune demande en attente pour le moment'}
                {activeTab === 'confirmed' && 'Aucun rendez-vous confirmé'}
                {activeTab === 'cancelled' && 'Aucune réservation annulée'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeList.map(b => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                  processing={processingId === b.id}
                  actionError={rowErrors[b.id] || null}
                />
              ))}
            </div>
          )
        )}
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}