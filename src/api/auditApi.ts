import axios from 'axios'

// Cohérent avec analyticsApi.ts, bookingApi.ts, lawyerApi.ts, authApi.ts :
// passe par l'api-gateway, jamais directement sur audit-service.
const auditAxios = axios.create({
  baseURL: 'https://api.juribook.fr',
  headers: { 'Content-Type': 'application/json' },
})

auditAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Types (miroir d'AuditEntryResponse côté backend) ─────
export interface AuditEntry {
  id: number
  topic: string
  eventType?: string
  actorId?: number
  payload: string // JSON brut, tel que publié par le producteur Kafka
  occurredAt?: string
  recordedAt: string
}

export interface AuditEntryPage {
  content: AuditEntry[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface SearchAuditParams {
  userId?: number
  from?: string // ISO 8601, ex: "2026-07-01T00:00:00"
  to?: string
  page?: number
  size?: number
}

// GET /api/audit — recherche filtrée, paginée (userId/from/to optionnels et cumulables)
export const searchAuditLog = (params: SearchAuditParams = {}) => {
  const query = new URLSearchParams()
  if (params.userId != null) query.append('userId', String(params.userId))
  if (params.from) query.append('from', params.from)
  if (params.to) query.append('to', params.to)
  query.append('page', String(params.page ?? 0))
  query.append('size', String(params.size ?? 20))
  return auditAxios.get<AuditEntryPage>(`/api/audit?${query.toString()}`)
}

// GET /api/audit/booking/{bookingId} — historique complet, non paginé,
// trié chronologiquement croissant (timeline)
export const getBookingHistory = (bookingId: number) =>
  auditAxios.get<AuditEntry[]>(`/api/audit/booking/${bookingId}`)