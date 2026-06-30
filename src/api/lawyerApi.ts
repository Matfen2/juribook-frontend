import axios from 'axios'

const lawyerAxios = axios.create({
  baseURL: 'http://localhost:8082',
  headers: { 'Content-Type': 'application/json' },
})

lawyerAxios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Types ────────────────────────────────────────────────

export interface Specialty {
  id: number
  name: string
  slug: string
  description?: string
}

export interface Address {
  street?: string
  city: string
  postalCode?: string
  department?: string
  region?: string
}

// Version allégée — liste de recherche
export interface LawyerSearchResult {
  id: number
  barNumber: string
  bioExcerpt?: string
  hourlyRate?: number
  yearsExperience?: number
  languages?: string
  available: boolean
  averageRating?: number
  reviewCount: number
  address: Address
  specialties: Specialty[]
}

// Version complète — page détail
export interface LawyerProfile {
  id: number
  authUserId: number
  barNumber: string
  bio?: string
  hourlyRate?: number
  yearsExperience?: number
  languages?: string
  available: boolean
  averageRating?: number
  reviewCount: number
  address: Address
  specialties: Specialty[]
  createdAt?: string
  updatedAt?: string
}

export interface LawyerSearchPage {
  content: LawyerSearchResult[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface SearchFilters {
  specialty?: string
  city?: string
  query?: string
  maxRate?: number
  page?: number
  size?: number
}

// ── API calls ────────────────────────────────────────────

export const searchLawyers = (filters: SearchFilters = {}) => {
  const params = new URLSearchParams()
  if (filters.specialty) params.append('specialty', filters.specialty)
  if (filters.city)      params.append('city', filters.city)
  if (filters.query)     params.append('query', filters.query)
  if (filters.maxRate)   params.append('maxRate', String(filters.maxRate))
  params.append('page', String(filters.page ?? 0))
  params.append('size', String(filters.size ?? 20))
  return lawyerAxios.get<LawyerSearchPage>(`/api/lawyers?${params.toString()}`)
}

export const getSpecialties = () =>
  lawyerAxios.get<Specialty[]>('/api/specialties')

// Retourne le profil complet (bio non tronquée, createdAt, updatedAt)
export const getLawyerById = (id: number) =>
  lawyerAxios.get<LawyerProfile>(`/api/lawyers/${id}`)

// Retourne le profil de l'avocat actuellement connecté (résout authUserId → lawyerId)
export const getMyProfile = () =>
  lawyerAxios.get<LawyerProfile>('/api/lawyers/profile')
