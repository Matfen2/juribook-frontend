import axios from 'axios'

// Instance axios pointant vers l'api-gateway, plus directement vers
// booking-service depuis l'introduction de la gateway (port unique 8080).
const bookingAxios = axios.create({
  baseURL: 'https://api.juribook.fr',
  headers: { 'Content-Type': 'application/json' },
})

bookingAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Types ────────────────────────────────────────────────
export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export type SlotStatus =
  | 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'CANCELLED' | 'COMPLETED'

export interface Availability {
  id: number
  lawyerId: number
  dayOfWeek: DayOfWeek
  startTime: string  // "HH:mm:ss"
  endTime: string
  slotDurationMinutes: number
  active: boolean
  validFrom?: string
  validUntil?: string
  createdAt?: string
  updatedAt?: string
  generatedSlotsCount?: number
}

export interface TimeSlot {
  id: number
  lawyerId: number
  availabilityId?: number
  date: string       // "YYYY-MM-DD"
  startTime: string
  endTime: string
  status: SlotStatus
  blockReason?: string
}

export interface CreateAvailabilityPayload {
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  slotDurationMinutes: number
  validFrom?: string
  validUntil?: string
  generationWeeks?: number
}

export interface CreateTimeSlotPayload {
  date: string
  startTime: string
  endTime: string
}

export interface BlockPeriodPayload {
  fromDate: string
  toDate: string
  reason?: string
}

export interface BlockPeriodResult {
  fromDate: string
  toDate: string
  reason?: string
  blockedSlotsCount: number
  blockedSlots: TimeSlot[]
}

// ── Disponibilités récurrentes ───────────────
export const createAvailability = (lawyerId: number, payload: CreateAvailabilityPayload) =>
  bookingAxios.post<Availability>(`/api/lawyers/${lawyerId}/availabilities`, payload)

export const getAvailabilities = (lawyerId: number) =>
  bookingAxios.get<Availability[]>(`/api/lawyers/${lawyerId}/availabilities`)

export const deactivateAvailability = (lawyerId: number, availabilityId: number) =>
  bookingAxios.delete<Availability>(`/api/lawyers/${lawyerId}/availabilities/${availabilityId}`)

// ── Créneaux ponctuels et congés ─────────────
export const createTimeSlot = (lawyerId: number, payload: CreateTimeSlotPayload) =>
  bookingAxios.post<TimeSlot>(`/api/lawyers/${lawyerId}/slots`, payload)

export const deleteTimeSlot = (lawyerId: number, slotId: number) =>
  bookingAxios.delete<void>(`/api/lawyers/${lawyerId}/slots/${slotId}`)

export const blockPeriod = (lawyerId: number, payload: BlockPeriodPayload) =>
  bookingAxios.post<BlockPeriodResult>(`/api/lawyers/${lawyerId}/slots/block`, payload)

export const unblockSlot = (lawyerId: number, slotId: number) =>
  bookingAxios.post<TimeSlot>(`/api/lawyers/${lawyerId}/slots/${slotId}/unblock`)

// ── Consultation des créneaux ──────────
export interface GetSlotsParams {
  date?: string
  fromDate?: string
  toDate?: string
  status?: SlotStatus
}

export const getSlots = (lawyerId: number, params: GetSlotsParams = {}) => {
  const query = new URLSearchParams()
  if (params.date)      query.append('date', params.date)
  if (params.fromDate)  query.append('fromDate', params.fromDate)
  if (params.toDate)    query.append('toDate', params.toDate)
  if (params.status)    query.append('status', params.status)
  const qs = query.toString()
  return bookingAxios.get<TimeSlot[]>(`/api/lawyers/${lawyerId}/slots${qs ? `?${qs}` : ''}`)
}

// ── Réservation ────────────
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface Booking {
  id: number
  clientId: number
  lawyerId: number
  timeSlotId: number
  status: BookingStatus
  reason: string
  createdAt: string
  updatedAt: string
}

export interface CreateBookingPayload {
  timeSlotId: number
  reason: string
}

// POST /api/bookings : CLIENT uniquement. Le clientId est résolu côté
// backend depuis le JWT, jamais envoyé dans le body.
export const createBooking = (payload: CreateBookingPayload) =>
  bookingAxios.post<Booking>('/api/bookings', payload)

// Version enrichie utilisée par l'historique client et le
// tableau de bord avocat, inclut la date/heure du créneau,
// résolues côté backend.
export interface BookingHistoryItem {
  id: number
  lawyerId: number
  timeSlotId: number
  status: BookingStatus
  reason: string
  date?: string       // "YYYY-MM-DD" : absent si le créneau source a été supprimé
  startTime?: string  // "HH:mm:ss"
  endTime?: string
  createdAt: string
}

// GET /api/bookings : CLIENT uniquement. Historique de ses propres
// réservations, triées du rendez-vous le plus récent au plus ancien.
export const getMyBookings = () =>
  bookingAxios.get<BookingHistoryItem[]>('/api/bookings')

// GET /api/lawyers/{lawyerId}/bookings : LAWYER uniquement. Toutes les
// réservations de l'avocat, triées du rendez-vous le plus proche au
// plus lointain (file à traiter, pas un journal).
export const getLawyerBookings = (lawyerId: number) =>
  bookingAxios.get<BookingHistoryItem[]>(`/api/lawyers/${lawyerId}/bookings`)

// PATCH /api/bookings/{id}/confirm : LAWYER uniquement.
export const confirmBooking = (bookingId: number) =>
  bookingAxios.patch<Booking>(`/api/bookings/${bookingId}/confirm`)

// PATCH /api/bookings/{id}/reject : LAWYER uniquement.
export const rejectBooking = (bookingId: number) =>
  bookingAxios.patch<Booking>(`/api/bookings/${bookingId}/reject`)

// PATCH /api/bookings/{id}/cancel : CLIENT ou LAWYER.
export const cancelBooking = (bookingId: number) =>
  bookingAxios.patch<Booking>(`/api/bookings/${bookingId}/cancel`)

// POST /api/bookings/{id}/documents - multipart, CLIENT propriétaire
// uniquement, réservation PENDING ou CONFIRMED 
export const uploadBookingDocument = (bookingId: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return bookingAxios.post(`/api/bookings/${bookingId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}