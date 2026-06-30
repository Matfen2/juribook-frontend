# juribook-frontend

Application React du projet **JuriBook** : « Le Doctolib des avocats », interface client pour la recherche d'avocats, la consultation de profils, et le dashboard de validation administrateur.

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

## Installation

```bash
npm install
cp .env.example .env
```

Le fichier `.env` configure les URLs des microservices :

```env
VITE_AUTH_API_URL=http://localhost:8081
VITE_LAWYER_API_URL=http://localhost:8082
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
│   └── lawyerApi.ts           # Appels lawyer-service (search, specialties, profil)
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
│   │   └── LawyerDetailPage.tsx  # Profil complet d'un avocat (bio, tarif, spécialités, CTA réservation)
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
│   └── search-to-detail.cy.ts # Parcours E2E : recherche → fiche détail avocat
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
| `/lawyers/:id` | Fiche détail d'un avocat | Public |
| `/client/dashboard` | Dashboard client | CLIENT |
| `/lawyer/dashboard` | Dashboard avocat | LAWYER |
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

## Tests E2E (Cypress)

Les appels au lawyer-service sont interceptés via `cy.intercept()` avec des fixtures JSON fidèles aux DTOs réels (`LawyerSearchResponse`, `LawyerProfileResponse`), aucun backend Java requis pour faire tourner les tests.

```bash
npm run cypress:open   # mode interactif (debug visuel)
npm run cypress:run    # mode headless
npm run e2e            # démarre Vite automatiquement puis lance Cypress
```

Parcours couvert (`search-to-detail.cy.ts`, 7 scénarios) :
- Affichage des résultats au chargement de `/search`
- Filtrage par ville → nouvelle requête déclenchée
- État vide quand aucun avocat ne correspond
- Navigation recherche → fiche détail au clic sur une carte
- Retour à la recherche depuis la fiche détail
- CTA de réservation désactivé si l'avocat est indisponible
- Message d'erreur si le lawyer-service est injoignable

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

`lawyerApi.ts` utilise une instance axios séparée (`lawyerAxios`) ciblant directement le lawyer-service sur le port 8082, avec son propre intercepteur de token.

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `VITE_AUTH_API_URL` | URL de base de l'auth-service | `http://localhost:8081` |
| `VITE_LAWYER_API_URL` | URL de base du lawyer-service | `http://localhost:8082` |

> Le fichier `.env` est ignoré par Git (`.gitignore`). Utiliser `.env.example` comme modèle.

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`) sur push `develop` et pull request vers `main` :

1. **build-and-unit-tests** : lint, build, tests Vitest
2. **e2e-tests** : tests Cypress (dépend du job précédent), captures d'écran uploadées en cas d'échec

## Notes techniques

- **CSS-in-JS inline** : `SearchPage.tsx`, `LawyerDetailPage.tsx` et `AdminDashboard.tsx` utilisent des styles inline plutôt que Tailwind, pour un contrôle fin de la palette indigo/violet (dégradés, ombres colorées) difficile à exprimer avec les classes utilitaires par défaut.
- **Pagination & recherche** : `SearchPage` utilise un pattern `useRef` + compteur de déclenchement (`triggerSearch`) pour éviter les appels `setState` synchrones dans le corps d'un `useEffect` (règle ESLint `react-hooks/set-state-in-effect`).
- **Patch partiel** : les formulaires d'inscription (`RegisterClientPage`, `RegisterLawyerPage`) déclarent leurs champs et étapes (`FIELDS`, `STEPS`) en constantes hors composant pour éviter leur recréation à chaque render.