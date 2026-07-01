import axios from 'axios'

// Instance axios dédiée au booking-service (port 8083)
const bookingAxios = axios.create({
  baseURL: import.meta.env.VITE_BOOKING_API_URL ?? 'http://localhost:8083',
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

// POST /api/bookings — CLIENT uniquement. Le clientId est résolu côté
// backend depuis le JWT, jamais envoyé dans le body.
export const createBooking = (payload: CreateBookingPayload) =>
  bookingAxios.post<Booking>('/api/bookings', payload)