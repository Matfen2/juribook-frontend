import axios from 'axios'

// Cohérent avec analyticsApi.ts/auditApi.ts : passe par l'api-gateway.
// ⚠️ Contrairement à AdminDashboard.tsx qui pointe en dur sur
// localhost:8081 (incohérence déjà signalée, non corrigée
// sans confirmation), ce nouveau fichier suit le pattern gateway
// standard des autres *Api.ts du projet.
const adminUserAxios = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

adminUserAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export type Role = 'CLIENT' | 'LAWYER' | 'ADMIN'
export type LawyerStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
// Sprint 7.8
export type SuspensionSource = 'MANUAL' | 'ABUSE_DETECTION' | 'LAWYER_REJECTION'

export interface AdminUser {
  id: number
  name: string
  email: string
  phone?: string
  role: Role
  enabled: boolean
  barNumber?: string
  specialty?: string
  city?: string
  lawyerStatus?: LawyerStatus
  suspendedReason?: string
  suspendedAt?: string
  suspensionSource?: SuspensionSource
  createdAt: string
}

export interface AdminUserPage {
  content: AdminUser[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface SearchUsersParams {
  role?: Role
  enabled?: boolean
  city?: string
  suspensionSource?: SuspensionSource
  page?: number
  size?: number
}

export const searchUsers = (params: SearchUsersParams = {}) => {
  const query = new URLSearchParams()
  if (params.role) query.append('role', params.role)
  if (params.enabled != null) query.append('enabled', String(params.enabled))
  if (params.city) query.append('city', params.city)
  if (params.suspensionSource) query.append('suspensionSource', params.suspensionSource)
  query.append('page', String(params.page ?? 0))
  query.append('size', String(params.size ?? 20))
  return adminUserAxios.get<AdminUserPage>(`/api/admin/users?${query.toString()}`)
}

export const activateUser = (id: number) =>
  adminUserAxios.patch<AdminUser>(`/api/admin/users/${id}/activate`)

export const deactivateUser = (id: number, reason?: string) =>
  adminUserAxios.patch<AdminUser>(`/api/admin/users/${id}/deactivate`, reason ? { reason } : undefined)