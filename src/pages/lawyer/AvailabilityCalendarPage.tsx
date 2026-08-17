import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getMyProfile } from '../../api/lawyerApi'
import {
  getAvailabilities, createAvailability, deactivateAvailability,
  getSlots, createTimeSlot, deleteTimeSlot, blockPeriod, unblockSlot,
  type Availability, type TimeSlot, type DayOfWeek, type SlotStatus,
} from '../../api/bookingApi'

// ── Constantes ───────────────────────────────────────────

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY',    label: 'Lun' },
  { key: 'TUESDAY',   label: 'Mar' },
  { key: 'WEDNESDAY', label: 'Mer' },
  { key: 'THURSDAY',  label: 'Jeu' },
  { key: 'FRIDAY',    label: 'Ven' },
  { key: 'SATURDAY',  label: 'Sam' },
  { key: 'SUNDAY',    label: 'Dim' },
]

const STATUS_STYLE: Record<SlotStatus, { bg: string; border: string; text: string; label: string }> = {
  AVAILABLE: { bg: '#ECFDF5', border: '#6EE7B7', text: '#059669', label: 'Libre' },
  BOOKED:    { bg: '#EEF2FF', border: '#A5B4FC', text: '#4F46E5', label: 'Réservé' },
  BLOCKED:   { bg: '#FEF2F2', border: '#FCA5A5', text: '#DC2626', label: 'Bloqué' },
  CANCELLED: { bg: '#F1F5F9', border: '#CBD5E1', text: '#64748B', label: 'Annulé' },
  COMPLETED: { bg: '#F8FAFC', border: '#E2E8F0', text: '#94A3B8', label: 'Terminé' },
}

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() === 0 ? 7 : d.getDay() // dimanche = 7 plutôt que 0
  d.setDate(d.getDate() - (day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatHM(time: string): string {
  return time.slice(0, 5)
}

// ── Modale générique ─────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: '1.5rem', maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1 }}>
            <i className="ti ti-x" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid #E2E8F0',
  padding: '9px 12px', fontSize: 13, outline: 'none', marginBottom: 12,
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
}

// ── Page principale ───────────────────────────────────────

export default function AvailabilityCalendarPage() {
  const navigate = useNavigate()

  const [lawyerId, setLawyerId] = useState<number | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showAvailModal, setShowAvailModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showSlotModal, setShowSlotModal] = useState<{ date: string } | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // ── Résoudre lawyerId depuis le token connecté ──────────
  useEffect(() => {
    getMyProfile()
      .then(res => setLawyerId(res.data.id))
      .catch(() => setProfileError('Profil avocat introuvable. Avez-vous créé votre profil ?'))
      .finally(() => setLoadingProfile(false))
  }, [])

  // ── Charger les créneaux de la semaine affichée ─────────
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const loadWeek = useCallback(async () => {
    if (!lawyerId) return
    setLoading(true)
    setError(null)
    try {
      const from = toISODate(weekDates[0])
      const to = toISODate(weekDates[6])
      const [slotsRes, availRes] = await Promise.all([
        getSlots(lawyerId, { fromDate: from, toDate: to }),
        getAvailabilities(lawyerId),
      ])
      setSlots(slotsRes.data)
      setAvailabilities(availRes.data)
    } catch {
      setError('Impossible de charger le calendrier. Vérifiez que le booking-service est démarré.')
    } finally {
      setLoading(false)
    }
  }, [lawyerId, weekStart]) // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadWeek() }, [loadWeek])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Actions sur un créneau ───────────────────────────────
  const handleSlotAction = async (slot: TimeSlot, action: 'block' | 'unblock' | 'delete') => {
    if (!lawyerId) return
    setActionBusy(true)
    try {
      if (action === 'delete') {
        await deleteTimeSlot(lawyerId, slot.id)
        showToast('Créneau supprimé')
      } else if (action === 'unblock') {
        await unblockSlot(lawyerId, slot.id)
        showToast('Créneau débloqué')
      } else if (action === 'block') {
        await blockPeriod(lawyerId, { fromDate: slot.date, toDate: slot.date, reason: 'Indisponibilité ponctuelle' })
        showToast('Créneau bloqué')
      }
      await loadWeek()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      showToast(e.response?.data?.message ?? 'Action impossible')
    } finally {
      setActionBusy(false)
    }
  }

  // ── Grouper les créneaux par date ────────────────────────
  const slotsByDate = weekDates.reduce<Record<string, TimeSlot[]>>((acc, d) => {
    const iso = toISODate(d)
    acc[iso] = slots.filter(s => s.date === iso).sort((a, b) => a.startTime.localeCompare(b.startTime))
    return acc
  }, {})

  if (loadingProfile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFF' }}>
        <i className="ti ti-loader-2" style={{ fontSize: 32, color: '#4F46E5', animation: 'spin 1s linear infinite' }} aria-hidden />
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    )
  }

  if (profileError || !lawyerId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#F8FAFF' }}>
        <i className="ti ti-alert-circle" style={{ fontSize: 36, color: '#DC2626' }} aria-hidden />
        <p style={{ color: '#475569', fontSize: 14 }}>{profileError}</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F4FF 100%)' }}>

      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/lawyer/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 16 }} aria-hidden />
            Tableau de bord
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>Mes disponibilités</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowBlockModal(true)}
              style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #FCA5A5', color: '#DC2626', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-beach" style={{ fontSize: 14 }} aria-hidden />
              Bloquer une période
            </button>
            <button onClick={() => setShowAvailModal(true)}
              style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 8, border: 'none', color: '#fff', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-calendar-plus" style={{ fontSize: 14 }} aria-hidden />
              Nouvelle disponibilité
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Navigation semaine */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#4F46E5', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '7px 14px', cursor: 'pointer' }}>
            <i className="ti ti-chevron-left" aria-hidden /> Semaine précédente
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
            {weekDates[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – {weekDates[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#4F46E5', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '7px 14px', cursor: 'pointer' }}>
            Semaine suivante <i className="ti ti-chevron-right" aria-hidden />
          </button>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Grille semaine - scroll horizontal sur mobile */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as const, marginBottom: 4 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, minWidth: 560,
          opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s',
        }}>
          {DAYS.map((day, i) => {
            const date = weekDates[i]
            const iso = toISODate(date)
            const daySlots = slotsByDate[iso] ?? []
            const isToday = toISODate(new Date()) === iso

            return (
              <div key={day.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* En-tête jour */}
                <div style={{
                  textAlign: 'center', padding: '8px 4px', borderRadius: 10,
                  background: isToday ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : '#fff',
                  border: isToday ? 'none' : '1px solid #E2E8F0',
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, margin: 0, color: isToday ? '#fff' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {day.label}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 0', color: isToday ? '#fff' : '#1E293B' }}>
                    {date.getDate()}
                  </p>
                </div>

                {/* Créneaux du jour */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 80 }}>
                  {daySlots.length === 0 && (
                    <button onClick={() => setShowSlotModal({ date: iso })}
                      style={{
                        fontSize: 11, color: '#CBD5E1', background: 'none', border: '1.5px dashed #E2E8F0',
                        borderRadius: 8, padding: '12px 4px', cursor: 'pointer',
                      }}>
                      <i className="ti ti-plus" aria-hidden /> Ajouter
                    </button>
                  )}
                  {daySlots.map(slot => {
                    const s = STATUS_STYLE[slot.status]
                    const clickable = slot.status === 'AVAILABLE' || slot.status === 'BLOCKED'
                    return (
                      <div key={slot.id}
                        title={slot.blockReason ?? undefined}
                        onClick={() => {
                          if (!clickable || actionBusy) return
                          if (slot.status === 'AVAILABLE') {
                            const choice = window.confirm(`Créneau ${formatHM(slot.startTime)}–${formatHM(slot.endTime)}\n\nOK = Bloquer ce créneau\nAnnuler = Supprimer ce créneau`)
                            void handleSlotAction(slot, choice ? 'block' : 'delete')
                          } else if (slot.status === 'BLOCKED') {
                            if (window.confirm(`Débloquer ce créneau (${formatHM(slot.startTime)}–${formatHM(slot.endTime)}) ?`)) {
                              void handleSlotAction(slot, 'unblock')
                            }
                          }
                        }}
                        style={{
                          fontSize: 11, padding: '6px 8px', borderRadius: 8,
                          background: s.bg, border: `1px solid ${s.border}`, color: s.text,
                          cursor: clickable ? 'pointer' : 'default', fontWeight: 600,
                          display: 'flex', flexDirection: 'column', gap: 2,
                        }}>
                        <span>{formatHM(slot.startTime)}–{formatHM(slot.endTime)}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.75 }}>{s.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        </div>{/* fin wrapper scroll */}

        {/* Légende */}
        <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
          {(Object.keys(STATUS_STYLE) as SlotStatus[]).map(key => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_STYLE[key].bg, border: `1px solid ${STATUS_STYLE[key].border}` }} />
              {STATUS_STYLE[key].label}
            </span>
          ))}
        </div>

        {/* Liste des disponibilités récurrentes */}
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 12 }}>Disponibilités récurrentes</h2>
          {availabilities.length === 0 && (
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Aucune disponibilité récurrente configurée.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availabilities.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px',
                opacity: a.active ? 1 : 0.5,
              }}>
                <span style={{ fontSize: 13, color: '#1E293B' }}>
                  <strong>{DAYS.find(d => d.key === a.dayOfWeek)?.label ?? a.dayOfWeek}</strong>
                  {' · '}{formatHM(a.startTime)}–{formatHM(a.endTime)}
                  {' · '}créneaux de {a.slotDurationMinutes} min
                  {!a.active && <span style={{ color: '#94A3B8', marginLeft: 8 }}>(désactivée)</span>}
                </span>
                {a.active && (
                  <button
                    onClick={async () => {
                      if (!lawyerId || !window.confirm('Désactiver cette disponibilité récurrente ?')) return
                      await deactivateAvailability(lawyerId, a.id)
                      await loadWeek()
                    }}
                    style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Désactiver
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modale création disponibilité */}
      {showAvailModal && lawyerId && (
        <CreateAvailabilityModal
          lawyerId={lawyerId}
          onClose={() => setShowAvailModal(false)}
          onCreated={async (count) => { setShowAvailModal(false); showToast(`Disponibilité créée : ${count} créneaux générés`); await loadWeek() }}
        />
      )}

      {/* Modale blocage de période */}
      {showBlockModal && lawyerId && (
        <BlockPeriodModal
          lawyerId={lawyerId}
          onClose={() => setShowBlockModal(false)}
          onBlocked={async (count) => { setShowBlockModal(false); showToast(`${count} créneaux bloqués`); await loadWeek() }}
        />
      )}

      {/* Modale créneau ponctuel */}
      {showSlotModal && lawyerId && (
        <CreateSlotModal
          lawyerId={lawyerId}
          date={showSlotModal.date}
          onClose={() => setShowSlotModal(null)}
          onCreated={async () => { setShowSlotModal(null); showToast('Créneau ajouté'); await loadWeek() }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1E293B', color: '#fff', fontSize: 13, fontWeight: 500,
          padding: '10px 20px', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 100,
        }}>
          {toast}
        </div>
      )}
    </motion.div>
  )
}

// ── Modale : créer une disponibilité récurrente ───────────

function CreateAvailabilityModal({ lawyerId, onClose, onCreated }: {
  lawyerId: number; onClose: () => void; onCreated: (count: number) => void
}) {
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('MONDAY')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [duration, setDuration] = useState(30)
  const [weeks, setWeeks] = useState(4)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await createAvailability(lawyerId, {
        dayOfWeek, startTime: `${startTime}:00`, endTime: `${endTime}:00`,
        slotDurationMinutes: duration, generationWeeks: weeks,
      })
      onCreated(res.data.generatedSlotsCount ?? 0)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Nouvelle disponibilité récurrente" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 12, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}

        <label style={labelStyle}>Jour de la semaine</label>
        <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value as DayOfWeek)} style={inputStyle}>
          {DAYS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Début</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Fin</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Durée créneau (min)</label>
            <input type="number" min={5} max={480} value={duration} onChange={e => setDuration(Number(e.target.value))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Semaines à générer</label>
            <input type="number" min={1} max={12} value={weeks} onChange={e => setWeeks(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={submitting}
          style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? '#A5B4FC' : 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          {submitting ? 'Création...' : 'Créer et générer les créneaux'}
        </button>
      </form>
    </Modal>
  )
}

// ── Modale : bloquer une période (congés) ─────────────────

function BlockPeriodModal({ lawyerId, onClose, onBlocked }: {
  lawyerId: number; onClose: () => void; onBlocked: (count: number) => void
}) {
  const [fromDate, setFromDate] = useState(toISODate(new Date()))
  const [toDate, setToDate] = useState(toISODate(new Date()))
  const [reason, setReason] = useState('Congés')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await blockPeriod(lawyerId, { fromDate, toDate, reason })
      onBlocked(res.data.blockedSlotsCount)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erreur lors du blocage')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Bloquer une période" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 12, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Du</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Au</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>Motif</label>
        <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Congés, formation..." style={inputStyle} />

        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: -4, marginBottom: 12 }}>
          Seuls les créneaux libres seront bloqués, les rendez-vous déjà réservés ne sont jamais affectés.
        </p>

        <button type="submit" disabled={submitting}
          style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? '#FCA5A5' : '#DC2626' }}>
          {submitting ? 'Blocage...' : 'Bloquer cette période'}
        </button>
      </form>
    </Modal>
  )
}

// ── Modale : créneau ponctuel ──────────────────────────────

function CreateSlotModal({ lawyerId, date, onClose, onCreated }: {
  lawyerId: number; date: string; onClose: () => void; onCreated: () => void
}) {
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('09:30')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createTimeSlot(lawyerId, { date, startTime: `${startTime}:00`, endTime: `${endTime}:00` })
      onCreated()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Créneau ponctuel — ${new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 12, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Début</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Fin</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={submitting}
          style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', background: submitting ? '#A5B4FC' : 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
          {submitting ? 'Création...' : 'Ajouter ce créneau'}
        </button>
      </form>
    </Modal>
  )
}