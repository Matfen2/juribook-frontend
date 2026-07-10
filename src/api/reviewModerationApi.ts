import axios from 'axios'

// Cohérent avec les autres *Api.ts : passe par l'api-gateway.
// /api/reviews/** est déjà routé vers lawyer-service (application.yaml).
const reviewModerationAxios = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

reviewModerationAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface AdminReview {
  id: number
  lawyerId: number
  clientId: number
  bookingId: number
  rating: number
  comment?: string
  visible: boolean
  createdAt: string
}

export interface AdminReviewPage {
  content: AdminReview[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface GetModerationParams {
  visible?: boolean // omis = tous, true = visibles uniquement, false = masqués uniquement
  page?: number
  size?: number
}

// GET /api/reviews/moderation, trié pire note d'abord (pas de vrai
// signalement côté client, cf. backend)
export const getReviewsForModeration = (params: GetModerationParams = {}) => {
  const query = new URLSearchParams()
  if (params.visible != null) query.append('visible', String(params.visible))
  query.append('page', String(params.page ?? 0))
  query.append('size', String(params.size ?? 20))
  return reviewModerationAxios.get<AdminReviewPage>(`/api/reviews/moderation?${query.toString()}`)
}

export const hideReview = (id: number) =>
  reviewModerationAxios.patch<AdminReview>(`/api/reviews/${id}/hide`)

export const unhideReview = (id: number) =>
  reviewModerationAxios.patch<AdminReview>(`/api/reviews/${id}/unhide`)

// ⚠️ Irréversible côté backend, contrairement à hide/unhide.
export const deleteReview = (id: number) =>
  reviewModerationAxios.delete<void>(`/api/reviews/${id}`)