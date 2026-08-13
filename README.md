# juribook-frontend

Application React du projet **JuriBook** : « Le Doctolib des avocats », interface client pour la recherche d'avocats, la consultation de profils, la réservation de rendez-vous, le suivi des réservations (client et avocat), et un **espace admin à 5 volets** : validation des profils avocats, statistiques temps réel, journal d'audit, alertes d'abus détectés, modération des avis.

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
- `auth-service` démarré sur le port **8081**
- `lawyer-service` démarré sur le port **8082**
- `booking-service` démarré sur le port **8083**
- `audit-service` démarré sur le port **8085** (nécessaire pour les 4 volets admin ajoutés : statistiques, audit, abus, avis)
- La gateway (`api-gateway`, port **8080**) doit être up et proprement configurée en CORS pour que les appels admin fonctionnent depuis le navigateur

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
VITE_API_GATEWAY_URL=http://localhost:8080
```

> ⚠️ **Deux conventions coexistent** : les appels historiques (`authApi.ts`, `lawyerApi.ts`, `bookingApi.ts`) ciblent chacun directement leur microservice via une variable dédiée (`VITE_AUTH_API_URL`, etc.). Les fichiers API ajoutés, (`analyticsApi.ts`, `auditApi.ts`, `adminUserApi.ts`, `reviewModerationApi.ts`) passent tous par la gateway via `VITE_API_GATEWAY_URL`, cohérent avec le fait que ces 4 volets admin appellent des services (`audit-service`, et des routes admin d'`auth-service`/`lawyer-service`) qui ne sont exposés qu'à travers elle. `AdminDashboard.tsx` (validation avocats, Sprint 2.6+) pointe lui directement sur `auth-service:8081` en dur dans le code, sans passer par la gateway ni par une variable d'environnement, incohérence identifiée mais non corrigée à ce stade (cf. Notes techniques).

## Lancer en développement

```bash
npm run dev
```

Application disponible sur [http://localhost:5173](http://localhost:5173)

## Structure du projet

```
src/
├── api/
│   ├── axiosInstance.ts        # Instance axios générique (intercepteur 401 → /login)
│   ├── authApi.ts              # Appels auth-service (register, login) - direct, pas via gateway
│   ├── lawyerApi.ts            # Appels lawyer-service (search, specialties, profil) - direct
│   ├── bookingApi.ts           # Appels booking-service (dispos, créneaux, réservations, historique, tableau de bord) - direct
│   ├── notificationApi.ts      # Appels notifications in-app (notification-service) - existe, jamais documenté en détail ici (cf. Limites connues)
│   ├── analyticsApi.ts         # Appels audit-service /analytics/** - via gateway
│   ├── auditApi.ts             # Appels audit-service /api/audit/** - via gateway
│   ├── adminUserApi.ts         # Appels auth-service /api/admin/users/** - via gateway
│   └── reviewModerationApi.ts  # Appels lawyer-service /api/reviews/** modération - via gateway
├── context/
│   └── AuthContext.tsx         # Provider d'authentification - token + rôle en localStorage
├── pages/
│   ├── HomePage.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterClientPage.tsx
│   │   └── RegisterLawyerPage.tsx
│   ├── search/
│   │   └── SearchPage.tsx           # Recherche paginée avec filtres (specialty, city, query, maxRate)
│   ├── lawyer/
│   │   ├── LawyerDetailPage.tsx     # Profil complet + réservation (sélection créneau, motif, confirmation)
│   │   ├── AvailabilityCalendarPage.tsx  # Gestion des disponibilités récurrentes (avocat)
│   │   └── LawyerBookingsPage.tsx        # Tableau de bord avocat - demandes à traiter, confirmer/refuser
│   ├── client/
│   │   └── ClientBookingsPage.tsx        # Historique client - onglets à venir/passés/annulés
│   └── admin/
│       ├── AdminDashboard.tsx            # Validation/refus des profils avocats, stats, filtres par statut
│       ├── AdminAnalyticsPage.tsx        # Statistiques temps réel - KPIs, graphiques
│       ├── AdminAuditPage.tsx            # Journal d'audit - recherche par utilisateur ou réservation
│       ├── AdminAbuseAlertsPage.tsx      # Comptes suspendus automatiquement, déblocage
│       └── AdminReviewModerationPage.tsx # Modération des avis - masquer/démasquer/supprimer
├── components/
│   ├── NotificationBell.tsx       # Cloche de notifications in-app, badge non-lu - existe, jamais documenté en détail ici
│   ├── ReviewsList.tsx            # Affichage des avis d'un avocat - existe, jamais documenté en détail ici
│   └── DocumentUpload.tsx         # Upload de documents liés à une réservation - existe, jamais documenté en détail ici
├── test/
│   └── pages/                  # Tests unitaires Vitest + Testing Library
│       ├── LoginPage.test.tsx
│       ├── RegisterClientPage.test.tsx
│       └── RegisterLawyerPage.test.tsx
├── App.tsx                     # Routing (React Router) : 5 routes /admin/** protégées ADMIN
└── vite-env.d.ts               # Typage des variables d'environnement VITE_*

cypress/
├── e2e/
│   ├── search-to-detail.cy.ts          # Parcours E2E : recherche → fiche détail avocat
│   ├── booking-confirmation-flow.cy.ts # Parcours E2E : recherche → réservation → confirmation (client + avocat)
│   ├── document-upload.cy.ts           # Parcours E2E : upload de document sur une réservation
│   └── reviews.cy.ts                   # Parcours E2E : avis client sur un avocat
├── fixtures/                   # Réponses API mockées (JSON fidèle aux DTOs Java)
├── support/
│   ├── e2e.ts
│   └── commands.ts             # Commande personnalisée getByCy()
└── tsconfig.json
```

> ⚠️ **`NotificationBell.tsx`, `ReviewsList.tsx`, `DocumentUpload.tsx`, `notificationApi.ts`, `ClientBookingsPage.tsx`, `LawyerBookingsPage.tsx` existent réellement en code** (vus en contexte à plusieurs reprises) **mais n'ont jamais été documentés en détail dans une mise à jour de ce README**, contrairement aux 5 pages admin ci-dessous, dont je connais précisément le contenu pour les avoir écrites. Si une documentation plus fine de ces fichiers est utile, il faudra me les repasser en entier.

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
| `/admin/analytics` | Statistiques temps réel | ADMIN |
| `/admin/audit` | Journal d'audit | ADMIN |
| `/admin/abuse-alerts` | Alertes d'abus détectés | ADMIN |
| `/admin/reviews` | Modération des avis | ADMIN |

Les 5 pages admin partagent la même barre d'onglets de navigation (Avocats / Statistiques / Audit / Abus / Avis) dans leur en-tête, permettant de circuler entre elles sans repasser par un menu.

---

## Les 5 volets admin

### `AdminDashboard.tsx` - Validation des profils avocats

Liste filtrable par statut (Tous/En attente/Validés/Refusés), actions Valider/Refuser, compteurs stats. Appelle `auth-service` **directement** sur `localhost:8081`, sans passer par la gateway, incohérence par rapport aux 4 pages suivantes (cf. Notes techniques).

### `AdminAnalyticsPage.tsx` - Statistiques temps réel

KPIs (réservations, taux d'annulation, spécialité la plus réservée, heure de pointe), graphiques custom en CSS/divs (pas de librairie de charts, aucune trace de dépendance de ce type ailleurs dans le projet, choix pour ne pas en ajouter une sans certitude qu'elle soit déjà installée). Sélecteur de plage (7/30/90 jours) pour les métriques temporelles ; les classements (spécialités, villes) sont cumulatifs depuis toujours, sans filtre de plage. Affiche côte à côte les spécialités les plus **réservées** et les plus **recherchées**, deux signaux distincts côté backend (`specialty_popularity` vs `searched_specialty_stats`).

### `AdminAuditPage.tsx` - Journal d'audit

Bascule "Par utilisateur" (recherche paginée, filtrable par plage de dates) / "Par réservation" (timeline chronologique complète, non paginée). Payload JSON brut de chaque événement dépliable à la demande.

### `AdminAbuseAlertsPage.tsx` - Alertes d'abus détectés

Liste des comptes actuellement suspendus **automatiquement** par détection d'abus (`suspensionSource=ABUSE_DETECTION`, distinct d'une désactivation manuelle ou d'un refus de profil avocat), avec motif et date de suspension, action "Débloquer" en un clic.

### `AdminReviewModerationPage.tsx` - Modération des avis

Liste triée par note croissante (les moins bien notés en premier, aucun vrai mécanisme de signalement côté client, ce tri sert de proxy objectif), filtrable Tous/Visibles/Masqués. Actions Masquer (réversible)/Démasquer/Supprimer (**irréversible**, confirmation navigateur avant l'appel).

---

## Tests unitaires (Vitest)

```bash
npm run test          # exécution unique
npm run test:watch    # mode watch
npm run test:coverage  # avec rapport de couverture
```

```
Tests run: 40 - LoginPage (13), RegisterClientPage (15), RegisterLawyerPage (12)
```

Pas encore de tests Vitest pour `LawyerDetailPage`, `ClientBookingsPage`, `LawyerBookingsPage`, ni pour les 5 pages admin — leur couverture bout en bout passe par Cypress (`booking-confirmation-flow.cy.ts`) pour les pages client/avocat ; **aucune couverture Cypress pour les 5 pages admin à ce stade**, testées manuellement (Postman + navigateur).

## Tests E2E (Cypress)

Les appels au lawyer-service et au booking-service sont interceptés via `cy.intercept()` avec des fixtures JSON fidèles aux DTOs réels (`LawyerSearchResponse`, `TimeSlot`, `Booking`, `BookingHistoryResponse`), aucun backend Java requis pour faire tourner les tests.

```bash
npm run cypress:open   # mode interactif (debug visuel)
npm run cypress:run    # mode headless
npm run e2e             # démarre Vite automatiquement puis lance Cypress
```

### `search-to-detail.cy.ts` : 7 scénarios
- Affichage des résultats au chargement de `/search`
- Filtrage par ville → nouvelle requête déclenchée
- État vide quand aucun avocat ne correspond
- Navigation recherche → fiche détail au clic sur une carte
- Retour à la recherche depuis la fiche détail
- CTA de réservation désactivé si l'avocat est indisponible
- Message d'erreur si le lawyer-service est injoignable

> ⚠️ Le scénario "CTA désactivé si indisponible" référence `[data-cy="lawyer-detail-book-button"]`, qui n'existe plus dans `LawyerDetailPage.tsx` depuis l'ajout du vrai formulaire de réservation en ligne (la section réservation est directement affichée, il n'y a plus de bouton séparé qui l'ouvre). Ce scénario est à corriger.

### `booking-confirmation-flow.cy.ts` : 3 scénarios
Parcours bout en bout, côté client **et** avocat, session simulée par injection directe de `token`/`role` dans `localStorage` (pas de vrai passage par `/login`, puisque toutes les requêtes sont de toute façon interceptées) :
- Un client cherche un avocat, réserve un créneau (motif + confirmation), la demande apparaît "à traiter" côté avocat, qui la confirme → bascule dans "Confirmés"
- L'avocat refuse une demande → bascule dans "Annulés", le compteur "à traiter" redescend
- Créneau réservé entre-temps par quelqu'un d'autre → message d'erreur explicite (409), créneau retiré de la grille

> ⚠️ Piège apostrophes : les messages d'erreur du composant utilisent des apostrophes typographiques (`'`, U+2019), qui ne matchent pas une apostrophe droite (`'`, U+0027) dans une assertion `cy.contains()`, Cypress fait un match texte strict. Préférer cibler un fragment du message sans apostrophe plutôt que de dupliquer le bon caractère Unicode dans le test.
>
> Convention de sélecteur : tous les éléments testés en E2E portent un attribut `data-cy="..."`, indépendant du texte affiché ou des classes CSS, pour des tests stables dans le temps.

Aucun scénario Cypress dédié aux 4 pages admin ajoutées aux sprints 7.6-7.9 (analytics, audit, abus, avis) à ce stade.

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

`lawyerApi.ts` et `bookingApi.ts` utilisent chacun leur propre instance axios (`lawyerAxios`, `bookingAxios`), ciblant directement leur microservice respectif (ports 8082 et 8083), chacune avec son propre intercepteur de token. Les 4 fichiers API (`analyticsApi.ts`, `auditApi.ts`, `adminUserApi.ts`, `reviewModerationApi.ts`) suivent le même principe d'instance dédiée, mais ciblent toutes la gateway (`VITE_API_GATEWAY_URL`) plutôt qu'un microservice direct.

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `VITE_AUTH_API_URL` | URL de base de l'auth-service | `http://localhost:8081` |
| `VITE_LAWYER_API_URL` | URL de base du lawyer-service | `http://localhost:8082` |
| `VITE_BOOKING_API_URL` | URL de base du booking-service | `http://localhost:8083` |
| `VITE_API_GATEWAY_URL` | URL de l'api-gateway | `http://localhost:8080` |

> Le fichier `.env` est ignoré par Git (`.gitignore`). Utiliser `.env.example` comme modèle.

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`) sur push `develop` et pull request vers `main` :

1. **build-and-unit-tests** : lint, build, tests Vitest
2. **e2e-tests** : tests Cypress (dépend du job précédent), captures d'écran uploadées en cas d'échec

---

## Notes techniques

- **CSS-in-JS inline** : `SearchPage.tsx`, `LawyerDetailPage.tsx`, `ClientBookingsPage.tsx`, `LawyerBookingsPage.tsx`, `AdminDashboard.tsx` **et les 5 pages admin** utilisent des styles inline plutôt que Tailwind, pour un contrôle fin de la palette indigo/violet (dégradés, ombres colorées) difficile à exprimer avec les classes utilitaires par défaut.
- **Pagination & recherche** : `SearchPage.tsx` utilise le pattern `useRef` + compteur de déclenchement (`triggerSearch`) pour éviter les appels `setState` synchrones dans le corps d'un `useEffect` (règle ESLint `react-hooks/set-state-in-effect`). Les 4 pages admin ajoutées depuis le 7.6 utilisent un pattern plus direct (`useCallback` + `useEffect` simple), sans ce détour, cf. leur code.
- **Patch partiel** : les formulaires d'inscription (`RegisterClientPage`, `RegisterLawyerPage`) déclarent leurs champs et étapes (`FIELDS`, `STEPS`) en constantes hors composant pour éviter leur recréation à chaque render.
- **`name` potentiellement absent côté avocat** : `SearchPage.tsx` et `LawyerDetailPage.tsx` traitent `lawyer.name` comme optionnel (repli `'?'` pour les initiales de l'avatar), certaines réponses (et fixtures de test) ne le renseignent pas systématiquement, mieux vaut ne jamais supposer sa présence côté front.
- **Enrichissement inter-services côté front** : `ClientBookingsPage` récupère l'historique via `bookingApi.getMyBookings()` (qui ne connaît que `lawyerId`), puis résout les noms d'avocats via `lawyerApi.getLawyerById()`, dédoublonnés par avocat pour éviter un appel par ligne d'historique. `LawyerBookingsPage` n'a pas d'équivalent côté client (pas d'endpoint public pour résoudre un `clientId` en nom), affiche `Client #id` en attendant.
- **Résolution `lawyerId` propre à l'avocat connecté** : `AvailabilityCalendarPage` et `LawyerBookingsPage` appellent `lawyerApi.getMyProfile()` (`GET /api/lawyers/profile`) avant tout appel au booking-service, plutôt que de coder un id en dur.
- **Deux conventions d'accès aux microservices coexistent** (cf. Installation ci-dessus) : direct par variable dédiée (historique) vs via gateway. `AdminDashboard.tsx` déroge même à ces deux conventions en pointant sur `http://localhost:8081` en dur dans le code, sans variable d'environnement du tout, identifié comme une incohérence, jamais corrigé depuis faute de confirmation explicite pour y toucher.

