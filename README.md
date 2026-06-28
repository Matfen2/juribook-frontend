# JuriBook - Frontend

Interface web de **JuriBook**, le Doctolib des avocats.  
Permet aux clients de trouver et réserver un avocat, et aux avocats de gérer leur agenda.

---

## Stack technique

| Outil | Rôle |
|---|---|
| React 19 + TypeScript | UI et typage |
| Vite | Bundler et dev server |
| Tailwind CSS v4 | Styles utilitaires |
| React Router v7 | Navigation SPA |
| Axios | Appels HTTP vers l'auth-service |
| Framer Motion | Animations des pages |
| Tabler Icons | Icônes (CDN) |
| Vitest + Testing Library | Tests unitaires composants |

---

## Structure du projet

```
src/
├── api/
│   └── authApi.ts              # registerClient, registerLawyer, login
├── context/
│   └── AuthContext.tsx         # Gestion session (token + rôle)
├── pages/
│   └── auth/
│       ├── LoginPage.tsx
│       ├── RegisterClientPage.tsx
│       └── RegisterLawyerPage.tsx
├── test/
│   ├── setup.ts                # Mock localStorage + jest-dom
│   └── pages/
│       ├── LoginPage.test.tsx
│       ├── RegisterClientPage.test.tsx
│       └── RegisterLawyerPage.test.tsx
├── App.tsx                     # Routes + ProtectedRoute par rôle
└── main.tsx
```

---

## Installation

```bash
npm install
```

---

## Démarrage

```bash
npm run dev
```

L'application démarre sur [http://localhost:5173](http://localhost:5173).

> Le proxy Vite redirige `/api` vers `http://localhost:8080` (api-gateway).  
> L'auth-service doit tourner sur le port `8081`.

---

## Scripts disponibles

```bash
npm run dev           # Démarrer le serveur de développement
npm run build         # Build de production (tsc + vite build)
npm test              # Lancer les tests Vitest (mode run)
npm run test:watch    # Lancer les tests en mode watch
npm run test:coverage # Rapport de couverture de code
npm run preview       # Prévisualiser le build de production
```

---

## Tests

Les tests utilisent **Vitest** + **@testing-library/react**.

```bash
npm test
```

```
Test Files  3 passed (3)
     Tests  40 passed (40)
  Duration  2.12s
```

### Couverture

| Fichier | Tests |
|---|---|
| `LoginPage.test.tsx` | 13 tests : rendu, soumission CLIENT/LAWYER/ADMIN, erreurs API, état bouton |
| `RegisterClientPage.test.tsx` | 15 tests : rendu, mise à jour champs, effacement erreur, soumission, erreurs |
| `RegisterLawyerPage.test.tsx` | 12 tests : rendu champs personnels + professionnels, soumission, erreurs |

---

## Pages auth

### `/login` - Connexion
- Formulaire email + mot de passe
- Redirection automatique selon le rôle : `CLIENT → /client/dashboard`, `LAWYER → /lawyer/dashboard`, `ADMIN → /admin/dashboard`

### `/register` - Inscription client
- Formulaire nom, email, mot de passe, téléphone (optionnel)
- Rôle `CLIENT` assigné automatiquement

### `/register/lawyer` - Inscription avocat
- Formulaire infos personnelles + professionnelles (numéro de barreau, spécialité, ville)
- Statut `PENDING` : validation manuelle par un administrateur sous 48h

---

## Connexion au backend

Le frontend communique avec l'**auth-service** (port 8081) via `src/api/authApi.ts`.

| Endpoint | Méthode | Description |
|---|---|---|
| `/api/auth/register` | POST | Inscription client |
| `/api/auth/register/lawyer` | POST | Inscription avocat |
| `/api/auth/login` | POST | Connexion - retourne JWT + refresh token |

Le token JWT est stocké dans `localStorage` via `AuthContext` (`saveUser(token, role)`).

---

## Variables d'environnement

Créer un fichier `.env.local` à la racine :

```env
VITE_API_URL=http://localhost:8081
```

> En développement, le proxy Vite gère la redirection. Cette variable est utilisée en production.