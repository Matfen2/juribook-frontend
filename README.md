# juribook-frontend

Application React du projet **JuriBook** : « Le Doctolib des avocats », interface client pour la recherche d'avocats, la consultation de profils, la réservation de rendez-vous, le suivi des réservations (client et avocat), et le dashboard de validation administrateur.

## Stack

- React 19 · TypeScript · Vite
- React Router 7
- Tailwind CSS v4
- Framer Motion (animations)
- Axios (appels API)
- Vitest + Testing Library (tests unitaires)
- Cypress (tests E2E)
- Tabler Icons (`ti ti-*`)

## Prérequis

- Node.js ≥ 22
- auth-service démarré sur le port **8081**
- lawyer-service démarré sur le port **8082**
- booking-service démarré sur le port **8083**

## Installation

```bash
npm install
cp .env.example .env
```

Le fichier `.env` configure les URLs des microservices :

```env
VITE_AUTH_API_URL=http://localhost:8081
VITE_LAWYER_API_URL=http://localhost:8082
VITE_BOOKING_API_URL=http://localhost:8083
```

## Lancer en développement

```bash
npm run dev
```

Application disponible sur [http://localhost:5173](http://localhost:5173)

## Structure du projet

```
src/
├── api/
│   ├── axiosInstance.ts       # Instance axios générique (intercepteur 401 → /login)
│   ├── authApi.ts             # Appels auth-service (register, login)
│   ├── lawyerApi.ts           # Appels lawyer-service (search, specialties, profil)
│   └── bookingApi.ts          # Appels booking-service (dispos, créneaux, réservations, historique, tableau de bord)
├── context/
│   └── AuthContext.tsx        # Provider d'authentification — token + rôle en localStorage
├── pages/
│   ├── HomePage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterClientPage.tsx
│   │   └── RegisterLawyerPage.tsx
│   ├── search/
│   │   └── SearchPage.tsx     # Recherche paginée avec filtres (specialty, city, query, maxRate)
│   ├── lawyer/
│   │   ├── LawyerDetailPage.tsx          # Profil complet + réservation (sélection créneau, motif, confirmation)
│   │   ├── AvailabilityCalendarPage.tsx  # Gestion des disponibilités récurrentes (avocat)
│   │   └── LawyerBookingsPage.tsx        # Tableau de bord avocat — demandes à traiter, confirmer/refuser
│   ├── client/
│   │   └── ClientBookingsPage.tsx        # Historique client — onglets à venir/passés/annulés
│   └── admin/
│       └── AdminDashboard.tsx    # Validation/refus des profils avocats, stats, filtres par statut
├── test/
│   └── pages/                 # Tests unitaires Vitest + Testing Library
│       ├── LoginPage.test.tsx
│       ├── RegisterClientPage.test.tsx
│       └── RegisterLawyerPage.test.tsx
├── App.tsx                    # Routing (React Router)
└── vite-env.d.ts              # Typage des variables d'environnement VITE_*

cypress/
├── e2e/
│   ├── search-to-detail.cy.ts           # Parcours E2E : recherche → fiche détail avocat
│   └── booking-confirmation-flow.cy.ts  # Parcours E2E : recherche → réservation → confirmation (client + avocat)
├── fixtures/                  # Réponses API mockées (JSON fidèle aux DTOs Java)
├── support/
│   ├── e2e.ts
│   └── commands.ts            # Commande personnalisée getByCy()
└── tsconfig.json
```

## Routes

| Route | Page | Accès |
|---|---|---|
| `/login` | Connexion | Public |
| `/register` | Inscription client | Public |
| `/register/lawyer` | Inscription avocat (statut PENDING) | Public |
| `/search` | Recherche d'avocats avec filtres | Public |
| `/lawyers/:id` | Fiche détail d'un avocat + réservation | Public |
| `/client/dashboard` | Dashboard client | CLIENT |
| `/client/bookings` | Historique des rendez-vous (à venir/passés/annulés) | CLIENT |
| `/lawyer/dashboard` | Dashboard avocat | LAWYER |
| `/lawyer/availabilities` | Gestion des disponibilités récurrentes | LAWYER |
| `/lawyer/bookings` | Tableau de bord des réservations (à traiter/confirmés/annulés) | LAWYER |
| `/admin/dashboard` | Validation des profils avocats | ADMIN |

## Tests unitaires (Vitest)

```bash
npm run test           # exécution unique
npm run test:watch     # mode watch
npm run test:coverage  # avec rapport de couverture
```

```
Tests run: 40 - LoginPage (13), RegisterClientPage (15), RegisterLawyerPage (12)
```

Pas encore de tests Vitest pour `LawyerDetailPage`, `ClientBookingsPage` et `LawyerBookingsPage` — leur couverture bout en bout passe pour l'instant par Cypress (`booking-confirmation-flow.cy.ts`) plutôt que par des tests de composant isolés.

## Tests E2E (Cypress)

Les appels au lawyer-service et au booking-service sont interceptés via `cy.intercept()` avec des fixtures JSON fidèles aux DTOs réels (`LawyerSearchResponse`, `LawyerProfileResponse`, `TimeSlot`, `Booking`, `BookingHistoryResponse`), aucun backend Java requis pour faire tourner les tests.

```bash
npm run cypress:open   # mode interactif (debug visuel)
npm run cypress:run    # mode headless
npm run e2e            # démarre Vite automatiquement puis lance Cypress
```

### `search-to-detail.cy.ts` — 7 scénarios
- Affichage des résultats au chargement de `/search`
- Filtrage par ville → nouvelle requête déclenchée
- État vide quand aucun avocat ne correspond
- Navigation recherche → fiche détail au clic sur une carte
- Retour à la recherche depuis la fiche détail
- CTA de réservation désactivé si l'avocat est indisponible
- Message d'erreur si le lawyer-service est injoignable

> ⚠️ Le scénario "CTA désactivé si indisponible" référence `[data-cy="lawyer-detail-book-button"]`, qui n'existe plus dans `LawyerDetailPage.tsx` depuis l'ajout du vrai formulaire de réservation (la section réservation est directement affichée en ligne, il n'y a plus de bouton séparé qui l'ouvre). Ce scénario est à corriger.

### `booking-confirmation-flow.cy.ts` — 3 scénarios
Parcours bout en bout, côté client **et** côté avocat, session simulée par injection directe de `token`/`role` dans `localStorage` (pas de vrai passage par `/login`, puisque toutes les requêtes qui en dépendent sont de toute façon interceptées) :
- Un client cherche un avocat, réserve un créneau (motif + confirmation), la demande apparaît "à traiter" côté avocat, qui la confirme → bascule dans "Confirmés"
- L'avocat refuse une demande → bascule dans "Annulés", le compteur "à traiter" redescend
- Créneau réservé entre-temps par quelqu'un d'autre → message d'erreur explicite (409), créneau retiré de la grille

> ⚠️ Piège apostrophes : les messages d'erreur du composant utilisent des apostrophes typographiques (`’`, U+2019), qui ne matchent pas une apostrophe droite (`'`, U+0027) dans une assertion `cy.contains()` — Cypress fait un match texte strict. Préférer cibler un fragment du message sans apostrophe plutôt que de dupliquer le bon caractère Unicode dans le test.

> Convention de sélecteur : tous les éléments testés en E2E portent un attribut `data-cy="..."`, indépendant du texte affiché ou des classes CSS, pour des tests stables dans le temps.

## Build production

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Authentification

Le token JWT et le rôle sont stockés en `localStorage` (`token`, `role`) via `AuthContext`. L'intercepteur axios dans `axiosInstance.ts` ajoute automatiquement le header `Authorization: Bearer <token>` et redirige vers `/login` en cas de 401.

`lawyerApi.ts` et `bookingApi.ts` utilisent chacun leur propre instance axios (`lawyerAxios`, `bookingAxios`), ciblant directement leur microservice respectif (ports 8082 et 8083), chacune avec son propre intercepteur de token.

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `VITE_AUTH_API_URL` | URL de base de l'auth-service | `http://localhost:8081` |
| `VITE_LAWYER_API_URL` | URL de base du lawyer-service | `http://localhost:8082` |
| `VITE_BOOKING_API_URL` | URL de base du booking-service | `http://localhost:8083` |

> Le fichier `.env` est ignoré par Git (`.gitignore`). Utiliser `.env.example` comme modèle.

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`) sur push `develop` et pull request vers `main` :

1. **build-and-unit-tests** : lint, build, tests Vitest
2. **e2e-tests** : tests Cypress (dépend du job précédent), captures d'écran uploadées en cas d'échec

## Notes techniques

- **CSS-in-JS inline** : `SearchPage.tsx`, `LawyerDetailPage.tsx`, `ClientBookingsPage.tsx`, `LawyerBookingsPage.tsx` et `AdminDashboard.tsx` utilisent des styles inline plutôt que Tailwind, pour un contrôle fin de la palette indigo/violet (dégradés, ombres colorées) difficile à exprimer avec les classes utilitaires par défaut.
- **Pagination & recherche** : `SearchPage` utilise un pattern `useRef` + compteur de déclenchement (`triggerSearch`) pour éviter les appels `setState` synchrones dans le corps d'un `useEffect` (règle ESLint `react-hooks/set-state-in-effect`).
- **Patch partiel** : les formulaires d'inscription (`RegisterClientPage`, `RegisterLawyerPage`) déclarent leurs champs et étapes (`FIELDS`, `STEPS`) en constantes hors composant pour éviter leur recréation à chaque render.
- **`name` potentiellement absent côté avocat** : `SearchPage.tsx` et `LawyerDetailPage.tsx` traitent `lawyer.name` comme optionnel (repli `'?'` pour les initiales de l'avatar, `'Avocat'` pour l'affichage) — certaines réponses (et fixtures de test) ne le renseignent pas systématiquement, mieux vaut ne jamais supposer sa présence côté front.
- **Enrichissement inter-services côté front** : `ClientBookingsPage` récupère l'historique via `bookingApi.getMyBookings()` (qui ne connaît que `lawyerId`), puis résout les noms d'avocats via `lawyerApi.getLawyerById()`, dédoublonnés par avocat pour éviter un appel par ligne d'historique. `LawyerBookingsPage` n'a pas d'équivalent côté client (pas d'endpoint public pour résoudre un `clientId` en nom), affiche `Client #<id>` en attendant.
- **Résolution `lawyerId` propre à l'avocat connecté** : `AvailabilityCalendarPage` et `LawyerBookingsPage` appellent `lawyerApi.getMyProfile()` (`GET /api/lawyers/profile`) pour résoudre `authUserId → lawyerId` avant tout appel au booking-service, plutôt que de coder un id en dur.