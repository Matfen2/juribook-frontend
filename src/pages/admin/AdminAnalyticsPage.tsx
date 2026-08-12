import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getDailyBookings, getCancellationRate, getSpecialtyPopularity,
  getSearchedSpecialties, getSearchedCities, getPeakHours,
  type DailyBookingStat, type CancellationRate, type SpecialtyStat,
  type SearchedSpecialtyStat, type SearchedCityStat, type PeakHourStat,
} from '../../api/analyticsApi'

// ── Helpers ──────────────────────────────────────────────
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const RANGE_OPTIONS = [
  { days: 7, label: '7 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
] as const

// ── Carte KPI ────────────────────────────────────────────
function KpiCard({ label, value, icon, color, sublabel }: {
  label: string; value: string; icon: string; color: string; sublabel?: string
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
      padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 14,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 22, color }} aria-hidden />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#1E293B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</p>
        {sublabel && <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{sublabel}</p>}
      </div>
    </div>
  )
}

// ── Section (carte encadrée, cohérente avec LawyerDetailPage) ──
function Section({ title, icon, color, action, children }: {
  title: string; icon: string; color: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0',
      borderRadius: 16, padding: '1.25rem', marginBottom: 16,
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', margin: 0, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          <i className={`ti ${icon}`} style={{ fontSize: 14, color }} aria-hidden />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>
      {text}
    </p>
  )
}

function ChartSkeleton({ height = 140 }: { height?: number }) {
  return <div style={{ height, background: '#F1F5F9', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
}

// ── Graphique réservations/annulations par jour ─────────
function DailyBookingsChart({ data }: { data: DailyBookingStat[] }) {
  if (data.length === 0) return <EmptyState text="Aucune donnée sur cette période" />

  const max = Math.max(1, ...data.map(d => d.bookingsCount))

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160, overflowX: 'auto', paddingBottom: 4 }}>
      {data.map(d => {
        const bookingHeight = (d.bookingsCount / max) * 130
        const cancelHeight = d.bookingsCount > 0 ? (d.cancellationsCount / max) * 130 : 0
        return (
          <div
            key={d.date}
            title={`${formatShortDate(d.date)} — ${d.bookingsCount} réservation${d.bookingsCount > 1 ? 's' : ''}, ${d.cancellationsCount} annulation${d.cancellationsCount > 1 ? 's' : ''}`}
            style={{ flex: '1 0 10px', minWidth: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' }}
          >
            <div style={{ width: '100%', maxWidth: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 130 }}>
              <div style={{
                width: '100%', borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(180deg,#818CF8,#4F46E5)',
                height: Math.max(bookingHeight, d.bookingsCount > 0 ? 3 : 0),
              }} />
              {cancelHeight > 0 && (
                <div style={{
                  width: '100%', background: '#FCA5A5',
                  height: Math.max(cancelHeight, 2), marginTop: -cancelHeight,
                  borderRadius: bookingHeight <= cancelHeight ? '3px 3px 0 0' : 0,
                  opacity: 0.85,
                }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Classement horizontal (spécialités / villes) ─────────
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
function HorizontalRanking<T extends { }>({
  items, getLabel, getCount, color, emptyText, maxItems = 6,
}: {
  items: T[]
  getLabel: (item: T) => string
  getCount: (item: T) => number
  color: string
  emptyText: string
  maxItems?: number
}) {
  if (items.length === 0) return <EmptyState text={emptyText} />

  const top = items.slice(0, maxItems)
  const max = Math.max(1, ...top.map(getCount))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {top.map((item, i) => {
        const count = getCount(item)
        const pct = (count / max) * 100
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#475569', width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getLabel(item)}
            </span>
            <div style={{ flex: 1, height: 16, background: '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', width: 28, textAlign: 'right', flexShrink: 0 }}>
              {count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Graphique heures de pointe ───────────────────────────
function PeakHoursChart({ data }: { data: PeakHourStat[] }) {
  const total = data.reduce((sum, h) => sum + h.bookingsCount, 0)
  if (total === 0) return <EmptyState text="Aucune réservation enregistrée" />

  const max = Math.max(1, ...data.map(h => h.bookingsCount))
  const busiest = data.reduce((a, b) => (b.bookingsCount > a.bookingsCount ? b : a), data[0])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
        {data.map(h => {
          const isBusiest = h.hourOfDay === busiest.hourOfDay && h.bookingsCount > 0
          return (
            <div key={h.hourOfDay} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <div
                title={`${h.hourOfDay}h — ${h.bookingsCount} rendez-vous`}
                style={{
                  width: '100%', maxWidth: 14, borderRadius: '3px 3px 0 0',
                  background: isBusiest ? '#F59E0B' : '#C7D2FE',
                  height: Math.max((h.bookingsCount / max) * 96, h.bookingsCount > 0 ? 3 : 0),
                }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
        {data.map(h => (
          <span key={h.hourOfDay} style={{ flex: 1, textAlign: 'center', fontSize: 8.5, color: '#94A3B8' }}>
            {h.hourOfDay % 3 === 0 ? h.hourOfDay : ''}
          </span>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: '#B45309', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 5 }}>
        <i className="ti ti-flame" style={{ fontSize: 13 }} aria-hidden />
        Heure la plus demandée : <strong>{busiest.hourOfDay}h</strong> ({busiest.bookingsCount} rendez-vous)
      </p>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────
export default function AdminAnalyticsPage() {
  const navigate = useNavigate()

  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30)

  const [dailyStats, setDailyStats] = useState<DailyBookingStat[]>([])
  const [cancellationRate, setCancellationRate] = useState<CancellationRate | null>(null)
  const [bookedSpecialties, setBookedSpecialties] = useState<SpecialtyStat[]>([])
  const [searchedSpecialties, setSearchedSpecialties] = useState<SearchedSpecialtyStat[]>([])
  const [searchedCities, setSearchedCities] = useState<SearchedCityStat[]>([])
  const [peakHours, setPeakHours] = useState<PeakHourStat[]>([])

  const [loadingRange, setLoadingRange] = useState(true)
  const [loadingStatic, setLoadingStatic] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Réservations/annulations dépendent de la plage sélectionnée
  const loadRangeData = useCallback(async (days: number) => {
    setLoadingRange(true)
    try {
      const to = toISODate(new Date())
      const from = toISODate(new Date(Date.now() - (days - 1) * 86400000))
      const [dailyRes, rateRes] = await Promise.all([
        getDailyBookings(from, to),
        getCancellationRate(from, to),
      ])
      setDailyStats(dailyRes.data)
      setCancellationRate(rateRes.data)
      setError(null)
    } catch {
      setError("Impossible de charger les statistiques. Vérifiez que l'audit-service est démarré et accessible via la gateway.")
    } finally {
      setLoadingRange(false)
    }
  }, [])

  // Spécialités/villes/heures : cumulatif depuis toujours, pas de plage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingStatic(true)
    Promise.all([
      getSpecialtyPopularity(),
      getSearchedSpecialties(),
      getSearchedCities(),
      getPeakHours(),
    ])
      .then(([bookedRes, searchedSpecRes, searchedCityRes, peakRes]) => {
        setBookedSpecialties(bookedRes.data)
        setSearchedSpecialties(searchedSpecRes.data)
        setSearchedCities(searchedCityRes.data)
        setPeakHours(peakRes.data)
      })
      .catch(() => setError("Impossible de charger les statistiques. Vérifiez que l'audit-service est démarré et accessible via la gateway."))
      .finally(() => setLoadingStatic(false))
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadRangeData(rangeDays) }, [rangeDays, loadRangeData])

  const cancellationPct = cancellationRate
    ? `${(cancellationRate.cancellationRate * 100).toFixed(1)}%`
    : '—'

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

          {/* Onglets de navigation entre les 3 vues admin (Sprint 7.6-7.7) */}
          <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 10, overflowX: 'auto' as const, flexShrink: 1, minWidth: 0 }}>
            <button onClick={() => navigate('/admin/dashboard')}
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>
              Avocats
            </button>
            <button
              style={{ fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fff', color: '#4F46E5', cursor: 'pointer', boxShadow: '0 1px 3px rgba(79,70,229,0.15)' }}>
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Statistiques temps réel</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Alimentées en direct depuis les événements Kafka — jamais de calcul sur les tables transactionnelles
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '-1rem auto 0', padding: '0 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 16 }} aria-hidden />
            {error}
          </div>
        )}

        {/* Sélecteur de plage */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 4 }}>
            {RANGE_OPTIONS.map(opt => (
              <button key={opt.days} onClick={() => setRangeDays(opt.days)}
                style={{
                  fontSize: 12, padding: '5px 14px', borderRadius: 7, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: rangeDays === opt.days ? '#4F46E5' : 'transparent',
                  color: rangeDays === opt.days ? '#fff' : '#64748B',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
          <KpiCard
            label={`Réservations (${rangeDays}j)`}
            value={loadingRange ? '···' : String(cancellationRate?.totalBookings ?? 0)}
            icon="ti-calendar-event" color="#4F46E5"
          />
          <KpiCard
            label="Taux d'annulation"
            value={loadingRange ? '···' : cancellationPct}
            sublabel={loadingRange ? undefined : `${cancellationRate?.totalCancellations ?? 0} annulation${(cancellationRate?.totalCancellations ?? 0) > 1 ? 's' : ''}`}
            icon="ti-calendar-off" color="#DC2626"
          />
          <KpiCard
            label="Spécialité la + réservée"
            value={loadingStatic ? '···' : (bookedSpecialties[0]?.specialty ?? '—')}
            icon="ti-scale" color="#059669"
          />
          <KpiCard
            label="Heure de pointe"
            value={loadingStatic
              ? '···'
              : peakHours.length > 0
                ? `${peakHours.reduce((a, b) => (b.bookingsCount > a.bookingsCount ? b : a), peakHours[0]).hourOfDay}h`
                : '—'}
            icon="ti-clock" color="#D97706"
          />
        </div>

        {/* Réservations par jour */}
        <Section
          title={`Réservations & annulations — ${rangeDays} derniers jours`}
          icon="ti-chart-bar" color="#4F46E5"
          action={
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: '#4F46E5' }} /> Réservations
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: '#FCA5A5' }} /> Annulations
              </span>
            </div>
          }
        >
          {loadingRange ? <ChartSkeleton height={160} /> : <DailyBookingsChart data={dailyStats} />}
        </Section>

        {/* Top spécialités : réservées vs recherchées, côte à côte */}
        {/* ⚠️ Choix par défaut faute de réponse confirmée : affichage des
            deux jeux de données côte à côte. Si tu voulais seulement l'un
            des deux, dis-le moi et je retire l'autre colonne. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <Section title="Spécialités les plus RÉSERVÉES" icon="ti-gavel" color="#059669">
            {loadingStatic
              ? <ChartSkeleton height={140} />
              : <HorizontalRanking
                  items={bookedSpecialties}
                  getLabel={s => s.specialty}
                  getCount={s => s.bookingsCount}
                  color="#059669"
                  emptyText="Aucune réservation enregistrée pour l'instant"
                />}
          </Section>

          <Section title="Spécialités les plus RECHERCHÉES" icon="ti-search" color="#7C3AED">
            {loadingStatic
              ? <ChartSkeleton height={140} />
              : <HorizontalRanking
                  items={searchedSpecialties}
                  getLabel={s => s.specialty}
                  getCount={s => s.searchCount}
                  color="#7C3AED"
                  emptyText="Aucune recherche enregistrée pour l'instant"
                />}
          </Section>
        </div>

        {/* Villes les plus recherchées */}
        <Section title="Villes les plus recherchées" icon="ti-map-pin" color="#0891B2">
          {loadingStatic
            ? <ChartSkeleton height={120} />
            : <HorizontalRanking
                items={searchedCities}
                getLabel={c => c.city}
                getCount={c => c.searchCount}
                color="#0891B2"
                emptyText="Aucune recherche enregistrée pour l'instant"
              />}
        </Section>

        {/* Heures de pointe */}
        <Section title="Heures de pointe (heure du rendez-vous)" icon="ti-clock" color="#D97706">
          {loadingStatic ? <ChartSkeleton height={140} /> : <PeakHoursChart data={peakHours} />}
        </Section>

      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}