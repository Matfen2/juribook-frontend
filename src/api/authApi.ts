import axios from 'axios';

// Instance axios pointant vers auth-service.
// URL configurable via VITE_AUTH_API_URL (suite à la review d'Abdelhadi, mentor :
// ne jamais coder une baseURL en dur, passer par une variable d'environnement
// pour permettre des valeurs différentes en dev/staging/prod sans toucher au code).
const api = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL,
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

// ─── Réponses succès (données reçues du backend) ──────────────────────────────
// Séparées des réponses d'erreur, suite à la review d'Abdelhadi (mentor) :
// ne jamais mélanger statut succès et statut erreur dans le même type.
// Une 2xx retourne toujours un message de confirmation ; une erreur HTTP
// (400/404/409/500) retourne un ApiErrorResponse distinct, lu côté catch.
export interface RegisterSuccessResponse {
  message: string;       // message de confirmation, ex: "Inscription réussie"
}

export interface LoginResponse {
  message: string;
  token: string;         // JWT signé (HS256, 24h)
  role: string;          // CLIENT | LAWYER | ADMIN
}

// ─── Réponse d'erreur (toujours via un code HTTP non-2xx) ─────────────────────
// Jamais renvoyée avec un statut 200 - uniquement dans le corps d'une
// réponse 400/404/409/500, lue dans le bloc catch des appels API.
export interface ApiErrorResponse {
  message: string;                    // message d'erreur lisible
  errors?: Record<string, string>;    // erreurs de validation par champ, si 400
}

// ─── Appels API ───────────────────────────────────────────────────────────────
// POST /api/auth/register - inscription client, retourne 201 + RegisterSuccessResponse
export const registerClient = (data: RegisterClientPayload) =>
  api.post<RegisterSuccessResponse>('/api/auth/register', data);

// POST /api/auth/register/lawyer - inscription avocat, statut PENDING, retourne 201
export const registerLawyer = (data: RegisterLawyerPayload) =>
  api.post<RegisterSuccessResponse>('/api/auth/register/lawyer', data);

// POST /api/auth/login - login, retourne 200 + JWT + rôle
export const login = (data: LoginPayload) =>
  api.post<LoginResponse>('/api/auth/login', data);