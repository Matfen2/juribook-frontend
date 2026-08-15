import axios from 'axios'

// Instance axios pointant vers l'api-gateway, plus directement vers
// notification-service depuis l'introduction de la gateway (port unique 8080).
const notificationAxios = axios.create({
  baseURL: 'https://api.juribook.fr',
  headers: { 'Content-Type': 'application/json' },
})

notificationAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export type NotificationType =
  | 'BOOKING_CREATED' | 'BOOKING_CONFIRMED' | 'BOOKING_REMINDER' | 'SLOT_RELEASED'

export interface AppNotification {
  id: number
  type: NotificationType
  message: string
  bookingId?: number
  read: boolean
  createdAt: string
}

// GET /api/notifications, toutes mes notifications, plus récente en premier
export const getMyNotifications = () =>
  notificationAxios.get<AppNotification[]>('/api/notifications')

// GET /api/notifications/unread-count, endpoint léger dédié au polling du badge
export const getUnreadCount = () =>
  notificationAxios.get<{ count: number }>('/api/notifications/unread-count')

// PATCH /api/notifications/{id}/read
export const markNotificationAsRead = (id: number) =>
  notificationAxios.patch<void>(`/api/notifications/${id}/read`)