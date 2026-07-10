import axios from 'axios'

// Instance axios pointant vers l'api-gateway, cohérent avec bookingApi.ts,
// lawyerApi.ts, authApi.ts, notificationApi.ts.
//
// ⚠️ Hypothèse non vérifiée : /api/audit/** doit être proxifié par
// l'api-gateway vers audit-service, comme les autres services. Si ce
// n'est pas encore configuré côté gateway, ces appels échoueront
// (404/erreur réseau) sans que ce soit un bug de ce fichier.
const analyticsAxios = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

analyticsAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Types (miroir des DTOs Java d'AnalyticsController) ───
export interface DailyBookingStat {
  date: string // "YYYY-MM-DD"
  bookingsCount: number
  cancellationsCount: number
}

export interface CancellationRate {
  from: string
  to: string
  totalBookings: number
  totalCancellations: number
  cancellationRate: number // 0.0 à 1.0
}

// Spécialités les plus RÉSERVÉES (booking-events)
export interface SpecialtyStat {
  specialty: string
  bookingsCount: number
}

// Spécialités les plus RECHERCHÉES (search-events), slug,
// pas le nom affichable (cf. LawyerService.search, compromis assumé
// côté backend)
export interface SearchedSpecialtyStat {
  specialty: string
  searchCount: number
}

export interface SearchedCityStat {
  city: string
  searchCount: number
}

export interface PeakHourStat {
  hourOfDay: number // 0-23
  bookingsCount: number
}

// ── Appels API ────────────────────────────────────────────
export const getDailyBookings = (from?: string, to?: string) => {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const qs = params.toString()
  return analyticsAxios.get<DailyBookingStat[]>(`/api/audit/analytics/daily-bookings${qs ? `?${qs}` : ''}`)
}

export const getCancellationRate = (from?: string, to?: string) => {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const qs = params.toString()
  return analyticsAxios.get<CancellationRate>(`/api/audit/analytics/cancellation-rate${qs ? `?${qs}` : ''}`)
}

export const getSpecialtyPopularity = () =>
  analyticsAxios.get<SpecialtyStat[]>('/api/audit/analytics/specialty-popularity')

export const getSearchedSpecialties = () =>
  analyticsAxios.get<SearchedSpecialtyStat[]>('/api/audit/analytics/searched-specialties')

export const getSearchedCities = () =>
  analyticsAxios.get<SearchedCityStat[]>('/api/audit/analytics/searched-cities')

export const getPeakHours = () =>
  analyticsAxios.get<PeakHourStat[]>('/api/audit/analytics/peak-hours')