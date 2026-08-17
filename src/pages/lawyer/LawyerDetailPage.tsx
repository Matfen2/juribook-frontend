import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLawyerById, type LawyerProfile } from '../../api/lawyerApi'
import { getSlots, createBooking, type TimeSlot, type Booking } from '../../api/bookingApi'
import { useAuth } from '../../context/AuthContext'
import ReviewsList from '../../components/ReviewsList'
import { useSEO } from '../../hooks/useSEO'
import { motion } from 'framer-motion'

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
  if (!rating) return <span style={{ fontSize: 13, color: '#94A3B8' }}>Aucun avis pour l'instant</span>
  const full = Math.round(rating)
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: '#F59E0B', fontSize: 18, letterSpacing: 2 }}>
        {'★'.repeat(full)}{'☆'.repeat(5 - full)}
      </span>
      <span style={{ fontSize: 13, color: '#94A3B8' }}>
        {rating.toFixed(1)} / 5 · {count} avis
      </span>
    </span>
  )
}

function Skeleton() {
  const bar = (w: string, h = 12) => (
    <div style={{ width: w, height: h, background: '#F1F5F9', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
  )
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: 32, background: '#fff', borderRadius: 16, padding: '1.75rem', border: '1px solid #E2E8F0' }}>
          <div style={{ width: 72, height: 72, borderRadius: 14, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
            {bar('40%', 14)} {bar('65%', 10)} {bar('50%', 10)}
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', border: '1px solid #E2E8F0', marginBottom: 12 }}>
            {bar('30%', 10)} <div style={{ marginTop: 12 }}>{bar('100%', 12)}</div> <div style={{ marginTop: 6 }}>{bar('80%', 12)}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: 16, padding: '1.25rem', marginBottom: 16,
      borderLeft: `4px solid ${color}`,
    }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        <i className={`ti ${icon}`} style={{ fontSize: 14, color }} aria-hidden />
        {title}
      </h2>
      {children}
    </div>
  )
}

// ── Réservation - Sélection + Confirmation réelle ──
// Sélecteur de date + créneaux libres du jour (GET /slots), motif de
// consultation, puis POST /api/bookings. Réservation en 2 clics depuis
// la fiche avocat : 1) cliquer un créneau, 2) cliquer "Confirmer" (le
// motif se tape entre les deux, mais ne compte pas comme un clic).

const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatHM(time: string): string {
  return time.slice(0, 5)
}

function formatSlotDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function BookingSection({ lawyerId, available }: { lawyerId: number; available: boolean }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const next14Days = useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < 14; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }, [])

  const [selectedDate, setSelectedDate] = useState<string>(toISODate(next14Days[0]))
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // ── État du formulaire de réservation ──────
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)

  const resetBookingForm = () => {
    setSelectedSlot(null)
    setReason('')
    setBookingError(null)
    setConfirmedBooking(null)
  }

  const selectSlot = (slot: TimeSlot, isSelected: boolean) => {
    setSelectedSlot(isSelected ? null : slot)
    setReason('')
    setBookingError(null)
    setConfirmedBooking(null)
  }

  useEffect(() => {
    if (!available) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    resetBookingForm()
    getSlots(lawyerId, { date: selectedDate, status: 'AVAILABLE' })
      .then(res => setSlots(res.data))
      .catch(() => setError('Impossible de charger les créneaux. Le service de réservation est peut-être indisponible.'))
      .finally(() => setLoading(false))
  }, [lawyerId, selectedDate, available])

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return
    if (!reason.trim()) {
      setBookingError('Merci d\u2019indiquer le motif de votre consultation.')
      return
    }

    setSubmitting(true)
    setBookingError(null)
    try {
      const { data } = await createBooking({ timeSlotId: selectedSlot.id, reason: reason.trim() })
      setConfirmedBooking(data)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } }
      const status = e.response?.status

      if (status === 409) {
        // Le créneau vient d'être pris par quelqu'un d'autre, on le retire
        // de la liste plutôt que de laisser l'utilisateur retenter dans le vide.
        setSlots(prev => prev.filter(s => s.id !== selectedSlot.id))
        setSelectedSlot(null)
        setBookingError('Ce créneau vient d\u2019être réservé par quelqu\u2019un d\u2019autre. Choisissez-en un autre.')
      } else if (status === 401) {
        navigate('/login')
      } else {
        setBookingError(e.response?.data?.message || 'Impossible de finaliser la réservation. Réessayez.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!available) return null

  return (
    <Section title="Prendre rendez-vous" icon="ti-calendar-event" color="#4F46E5">

      {/* Sélecteur de date - 14 prochains jours */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {next14Days.map(d => {
          const iso = toISODate(d)
          const isSelected = iso === selectedDate
          const isToday = iso === toISODate(new Date())
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              style={{
                flexShrink: 0, minWidth: 52, padding: '8px 6px', borderRadius: 10,
                border: isSelected ? 'none' : '1px solid #E2E8F0',
                background: isSelected ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#fff',
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 9, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', color: isSelected ? 'rgba(255,255,255,0.8)' : '#94A3B8' }}>
                {WEEKDAY_LABELS[d.getDay()]}
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '2px 0 0', color: isSelected ? '#fff' : '#1E293B' }}>
                {d.getDate()}
              </p>
              {isToday && !isSelected && (
                <span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: '#4F46E5', margin: '3px auto 0' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Erreur de chargement des créneaux */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 38, borderRadius: 8, background: '#F1F5F9', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {/* État vide */}
      {!loading && !error && slots.length === 0 && !confirmedBooking && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <i className="ti ti-calendar-off" style={{ fontSize: 28, color: '#CBD5E1' }} aria-hidden />
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '8px 0 0' }}>
            Aucun créneau libre ce jour-là, essayez une autre date
          </p>
        </div>
      )}

      {/* Grille des créneaux libres */}
      {!loading && !error && slots.length > 0 && !confirmedBooking && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8, marginBottom: selectedSlot ? 16 : 0 }}>
          {slots.map(slot => {
            const isSelected = selectedSlot?.id === slot.id
            return (
              <button
                key={slot.id}
                data-cy="lawyer-detail-slot-button"
                onClick={() => selectSlot(slot, isSelected)}
                style={{
                  padding: '9px 6px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: isSelected ? 'none' : '1.5px solid #C7D2FE',
                  background: isSelected ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#EEF2FF',
                  color: isSelected ? '#fff' : '#4F46E5',
                  transition: 'all 0.12s',
                }}
              >
                {formatHM(slot.startTime)}
              </button>
            )
          })}
        </div>
      )}

      {/* Récapitulatif + motif + confirmation */}
      {selectedSlot && !confirmedBooking && (
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px', fontWeight: 600 }}>Créneau sélectionné</p>
          <p style={{ fontSize: 14, color: '#1E293B', margin: '0 0 12px', fontWeight: 700 }}>
            {formatSlotDate(selectedSlot.date)}
            {' à '}{formatHM(selectedSlot.startTime)}–{formatHM(selectedSlot.endTime)}
          </p>

          {!user ? (
            // ── Visiteur non connecté ──────────────────────
            <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 12.5, color: '#4338CA', margin: '0 0 10px', lineHeight: 1.5 }}>
                Connectez-vous pour finaliser votre réservation.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '9px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                Se connecter
              </button>
            </div>
          ) : user.role !== 'CLIENT' ? (
            // ── Connecté mais pas un compte client (avocat/admin) ──
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: 12.5, borderRadius: 10, padding: '12px 14px', lineHeight: 1.5 }}>
              Seuls les comptes clients peuvent réserver un rendez-vous.
            </div>
          ) : (
            // ── Formulaire de réservation ──────────────────
            <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Motif de la consultation
              </label>
              <textarea
                data-cy="lawyer-detail-booking-reason-input"
                value={reason}
                onChange={e => { setReason(e.target.value); setBookingError(null) }}
                placeholder="Ex : Litige avec mon employeur"
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box', resize: 'vertical',
                  padding: '9px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0',
                  fontSize: 13, fontFamily: 'inherit', color: '#1E293B',
                  outline: 'none', marginBottom: 10, background: '#fff',
                }}
              />

              <button
                data-cy="lawyer-detail-confirm-booking-button"
                onClick={handleConfirmBooking}
                disabled={submitting}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff',
                  fontWeight: 700, fontSize: 13, cursor: submitting ? 'default' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {submitting ? (
                  <>
                    <i className="ti ti-loader-2" style={{ fontSize: 15, animation: 'spin 0.7s linear infinite' }} aria-hidden />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check" style={{ fontSize: 15 }} aria-hidden />
                    Confirmer ce créneau
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Erreur de réservation - bloc autonome : reste visible même si
          selectedSlot a été réinitialisé (ex: 409, le créneau en
          conflit est retiré de la sélection mais le message doit
          quand même apparaître). */}
      {bookingError && !confirmedBooking && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, borderRadius: 8, padding: '10px 14px', marginTop: selectedSlot ? 0 : 12 }}>
          {bookingError}
        </div>
      )}

      {/* Confirmation de la demande envoyée */}
      {confirmedBooking && (
        <div data-cy="lawyer-detail-booking-success" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-check" style={{ fontSize: 15, color: '#fff' }} aria-hidden />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#065F46', margin: '0 0 2px' }}>
                Demande de réservation envoyée
              </p>
              <p style={{ fontSize: 12.5, color: '#047857', margin: 0, lineHeight: 1.5 }}>
                {selectedSlot && (
                  <>{formatSlotDate(selectedSlot.date)} à {formatHM(selectedSlot.startTime)}, en attente de confirmation par l'avocat.</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={resetBookingForm}
            style={{
              fontSize: 12.5, color: '#059669', background: '#fff', border: '1.5px solid #A7F3D0',
              borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Réserver un autre créneau
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </Section>
  )
}

export default function LawyerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [lawyer, setLawyer] = useState<LawyerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getLawyerById(Number(id))
      .then(res => setLawyer(res.data))
      .catch(() => setError('Profil introuvable ou service indisponible.'))
      .finally(() => setLoading(false))
  }, [id])

  // SEO dynamique selon le profil avocat
  useSEO({
    title: lawyer ? `Me ${lawyer.name} - Avocat` : 'Profil avocat',
    description: lawyer?.bio
      ? `${lawyer.bio.slice(0, 120)}...`
      : 'Consultez le profil de cet avocat sur JuriBook, prenez rendez-vous en ligne.',
    canonical: `/lawyers/${id}`,
    ogType: 'profile',
  })

  if (loading) return <Skeleton />

  if (error || !lawyer) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="ti ti-alert-circle" style={{ fontSize: 32, color: '#DC2626' }} aria-hidden />
      </div>
      <p style={{ color: '#475569', fontSize: 15, margin: 0, fontWeight: 500 }}>{error ?? 'Avocat introuvable'}</p>
      <button onClick={() => navigate(-1)}
        style={{ fontSize: 13, color: '#4F46E5', border: '1.5px solid #818CF8', background: '#EEF2FF', borderRadius: 10, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
        Retour à la recherche
      </button>
    </div>
  )

  const av = avatarStyle(lawyer.name)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>

      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button data-cy="lawyer-detail-back-button" onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden />
            Retour aux résultats
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-scale" style={{ fontSize: 17, color: '#fff' }} aria-hidden />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>JuriBook</span>
          </div>
          <div className="detail-header-spacer" />
        </div>
      </header>

      {/* Bandeau violet */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', height: 80, transformOrigin: 'left' }} />

      <main style={{ maxWidth: 780, margin: '-40px auto 0', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {/* Hero card */}
        <div data-cy="lawyer-detail-hero" style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20,
          padding: '1.75rem', marginBottom: 16,
          boxShadow: '0 8px 32px rgba(79,70,229,0.12)',
          display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' as const,
        }}>
          {/* Avatar */}
          <div style={{
            width: 76, height: 76, borderRadius: 18, flexShrink: 0,
            background: av.bg, color: av.tx,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 24, letterSpacing: 1,
            boxShadow: `0 4px 14px ${av.bg}55`,
          }}>
            {initials(lawyer.name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 data-cy="lawyer-detail-name" style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>
              {lawyer.name ?? 'Avocat'}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span data-cy="lawyer-detail-bar-number" style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Barreau n° {lawyer.barNumber}
              </span>
              <span style={{
                fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                background: lawyer.available ? '#ECFDF5' : '#F1F5F9',
                color: lawyer.available ? '#059669' : '#94A3B8',
              }}>
                {lawyer.available ? '● Disponible' : '● Indisponible'}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {lawyer.specialties.map(s => (
                <span key={s.id} style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 99,
                  background: '#EEF2FF', color: '#4F46E5', fontWeight: 600,
                }}>
                  {s.name}
                </span>
              ))}
            </div>

            <Stars rating={lawyer.averageRating} count={lawyer.reviewCount} />
          </div>

          {/* Tarif */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {lawyer.hourlyRate ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: '#4F46E5' }}>{lawyer.hourlyRate}</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#6366F1' }}>€</span>
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0', fontWeight: 500 }}>par heure</p>
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, fontWeight: 500 }}>Tarif libre</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {lawyer.bio && (
          <Section title="Présentation" icon="ti-user" color="#4F46E5">
            <p data-cy="lawyer-detail-bio" style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line' }}>
              {lawyer.bio}
            </p>
          </Section>
        )}

        {/* Infos pratiques */}
        <Section title="Informations pratiques" icon="ti-info-circle" color="#0891B2">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>

            {lawyer.yearsExperience != null && (
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Expérience</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-briefcase" style={{ fontSize: 15, color: '#6366F1' }} aria-hidden />
                  {lawyer.yearsExperience} ans
                </p>
              </div>
            )}

            {lawyer.languages && (
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Langues</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-world" style={{ fontSize: 15, color: '#6366F1' }} aria-hidden />
                  {lawyer.languages}
                </p>
              </div>
            )}

            {lawyer.address?.city && (
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cabinet</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-map-pin" style={{ fontSize: 15, color: '#6366F1' }} aria-hidden />
                  {lawyer.address.city}
                </p>
                {lawyer.address.street && (
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: '3px 0 0 21px' }}>
                    {lawyer.address.street}{lawyer.address.postalCode && `, ${lawyer.address.postalCode}`}
                  </p>
                )}
              </div>
            )}

            {lawyer.address?.region && (
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Région</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="ti ti-building" style={{ fontSize: 15, color: '#6366F1' }} aria-hidden />
                  {lawyer.address.region}
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* Spécialités */}
        {lawyer.specialties.some(s => s.description) && (
          <Section title="Domaines d'expertise" icon="ti-scale" color="#7C3AED">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lawyer.specialties.map(s => (
                <div key={s.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#F8FAFC', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <i className="ti ti-check" style={{ fontSize: 13, color: '#4F46E5' }} aria-hidden />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>{s.name}</p>
                    {s.description && <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{s.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Avis */}
        <Section title="Avis" icon="ti-star" color="#F59E0B">
          <ReviewsList lawyerId={lawyer.id} />
        </Section>

        {/* Réservation */}
        <BookingSection lawyerId={lawyer.id} available={lawyer.available} />

        {!lawyer.available && (
          <div style={{
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            borderRadius: 16, padding: '1.5rem', textAlign: 'center',
          }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 28, color: '#94A3B8' }} aria-hidden />
            <p style={{ fontSize: 13, color: '#64748B', margin: '8px 0 0' }}>
              Cet avocat n'accepte pas de nouveaux clients pour le moment
            </p>
          </div>
        )}

      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </motion.div>
  )
}