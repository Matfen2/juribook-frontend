import axios from 'axios';

// Instance axios pointant vers auth-service (port 8081)
// En production, remplacer par la variable d'environnement VITE_API_URL
const api = axios.create({
  baseURL: 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Payloads (données envoyées au backend) ───────────────────────────────────
export interface RegisterClientPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;        // optionnel
}

export interface RegisterLawyerPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;        // optionnel
  barNumber: string;     // numéro de barreau (5 chiffres)
  specialty: string;     // spécialité juridique
  city: string;          // ville d'exercice
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── Réponses (données reçues du backend) ─────────────────────────────────────
export interface AuthResponse {
  message: string;       // message de confirmation ou d'erreur
}

export interface LoginResponse {
  message: string;
  token: string;         // JWT signé (HS256, 24h)
  role: string;          // CLIENT | LAWYER | ADMIN
}

// ─── Appels API ───────────────────────────────────────────────────────────────
// POST /api/auth/register - inscription client, retourne 201
export const registerClient = (data: RegisterClientPayload) =>
  api.post<AuthResponse>('/api/auth/register', data);

// POST /api/auth/register/lawyer - inscription avocat, statut PENDING, retourne 201
export const registerLawyer = (data: RegisterLawyerPayload) =>
  api.post<AuthResponse>('/api/auth/register/lawyer', data);

// POST /api/auth/login - login, retourne JWT + rôle
export const login = (data: LoginPayload) =>
  api.post<LoginResponse>('/api/auth/login', data);