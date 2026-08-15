<div align="center">

# ⚖️ JuriBook - Frontend

### Le Doctolib des avocats

**Application React 19 / TypeScript déployée en production**

[![Live](https://img.shields.io/badge/🌐_Live-juribook.fr-4F46E5?style=for-the-badge)](https://juribook.fr)
[![Cypress](https://img.shields.io/badge/Cypress-43_tests_✅-17202C?style=for-the-badge&logo=cypress)](./cypress/e2e)
[![React](https://img.shields.io/badge/React_19-TypeScript-61DAFB?style=for-the-badge&logo=react)](https://juribook.fr)

</div>

---

## 🔗 Liens

| | |
|---|---|
| 🌐 **Application live** | https://juribook.fr |
| 🔧 **API Gateway** | https://api.juribook.fr |
| 📦 **Repo K8s / Terraform** | [juribook-k8s-manifests](https://github.com/Matfen2/juribook-k8s-manifests) |
| 🔐 **Auth Service** | [juribook-auth-service](https://github.com/Matfen2/juribook-auth-service) |
| ⚖️ **Lawyer Service** | [juribook-lawyer-service](https://github.com/Matfen2/juribook-lawyer-service) |
| 📅 **Booking Service** | [juribook-booking-service](https://github.com/Matfen2/juribook-booking-service) |
| 🔔 **Notification Service** | [juribook-notification-service](https://github.com/Matfen2/juribook-notification-service) |
| 📋 **Audit Service** | [juribook-audit-service](https://github.com/Matfen2/juribook-audit-service) |
| 🌐 **API Gateway** | [juribook-api-gateway](https://github.com/Matfen2/juribook-api-gateway) |

---

## 🏗️ Architecture

JuriBook est une plateforme **microservices event-driven** composée de 6 services Spring Boot 4 / Java 21 communiquant via **Apache Kafka KRaft** (asynchrone) et REST (synchrone), exposés via une **Spring Cloud Gateway** centralisant la validation JWT.

```
https://juribook.fr          https://api.juribook.fr
      │                               │
  [Frontend]                    [API Gateway]
  React 19                    Spring Cloud Gateway
  Nginx / K8s                   JWT validation
                                      │
              ┌───────────────────────┼───────────────────────┐
              │               │               │               │
        [auth-service]  [lawyer-service] [booking-service] [notif-service]
         Java 21          Java 21          Java 21          Java 21
         Spring Boot      Spring Boot      Spring Boot      Spring Boot
         PostgreSQL       PostgreSQL       PostgreSQL       PostgreSQL
                                  │
                            [Kafka KRaft]
                                  │
                          [audit-service]
                           Java 21 / PG
```

**Infrastructure :** Scaleway Kapsule (Kubernetes), RDB PostgreSQL, provisionné via Terraform, CI/CD GitHub Actions → GHCR → Kapsule, SSL Let's Encrypt via cert-manager.

---

## ✨ Fonctionnalités

### Rôle CLIENT
- Inscription / connexion avec JWT (access 24h + refresh 7j rotatif)
- Recherche d'avocats par spécialité, ville, tarif
- Consultation des profils et créneaux disponibles
- Réservation en ligne avec motif
- Historique des rendez-vous (onglets À venir / Passés / Annulés)
- Upload de documents sur une réservation
- Dépôt d'avis après consultation terminée
- Notifications in-app avec badge de non-lu

### Rôle AVOCAT
- Inscription (statut PENDING → validation admin)
- Gestion des disponibilités récurrentes par créneau
- Tableau de bord : demandes à traiter, confirmer ou refuser

### Rôle ADMIN - 5 volets
- **Validation** des profils avocats (Valider / Refuser)
- **Analytics** temps réel : KPIs réservations, taux d'annulation, spécialités, heures de pointe
- **Audit** : journal des événements Kafka par utilisateur ou réservation
- **Alertes d'abus** : comptes suspendus automatiquement (>5 annulations/7j ou >3 avis 1★/24h)
- **Modération des avis** : masquer / démasquer / supprimer

---

## 🧪 Tests

### 43 tests Cypress E2E ✅

| Spec | Tests | Parcours |
|---|---|---|
| `auth-flow.cy.ts` | 8 | Inscription, connexion, déconnexion, routes protégées |
| `search-to-detail.cy.ts` | 6 | Recherche → fiche avocat |
| `booking-confirmation-flow.cy.ts` | 3 | Réservation → confirmation/refus/conflit 409 |
| `document-upload.cy.ts` | 6 | Upload documents sur réservation |
| `reviews.cy.ts` | 4 | Avis sur fiche avocat |
| `notifications-flow.cy.ts` | 4 | Notifications in-app |
| `admin-flow.cy.ts` | 6 | Dashboard admin - validation avocats |
| `error-pages.cy.ts` | 6 | Pages 404 / 403 / 500 |
| **Total** | **43** | **Tous parcours critiques** |

```bash
npm run cypress:open   # mode interactif
npm run cypress:run    # mode headless (CI)
```

### 40 tests unitaires Vitest

```bash
npm run test
npm run test:coverage
```

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Framework | React 19 / TypeScript / Vite |
| Routing | React Router 7 |
| Style | Tailwind CSS v4 / Framer Motion |
| HTTP | Axios |
| Tests E2E | Cypress 13 |
| Tests unitaires | Vitest + Testing Library |
| Conteneur | Docker multi-stage (Node 20 → Nginx Alpine) |
| CI/CD | GitHub Actions → GHCR → Scaleway Kapsule |

---

## 🚀 Démarrage local

```bash
npm install
cp .env.example .env
npm run dev
```

```env
# .env
VITE_API_GATEWAY_URL=http://localhost:8080
```

> Les services backend doivent tourner localement ou pointer vers l'environnement de staging.
> Voir [GETTING_STARTED.md](https://github.com/Matfen2/juribook-k8s-manifests) pour démarrer l'ensemble de la stack.

---

## 📁 Structure

```
src/
├── api/              # Clients Axios par service
├── context/          # AuthContext (JWT + rôle)
├── pages/
│   ├── auth/         # Login, Register client/avocat
│   ├── search/       # Recherche avec filtres
│   ├── lawyer/       # Profil, disponibilités, bookings avocat
│   ├── client/       # Historique réservations client
│   ├── admin/        # 5 volets admin
│   └── error/        # Pages 403 / 404 / 500
└── components/       # NotificationBell, DocumentUpload, ReviewsList

cypress/
└── e2e/              # 43 tests répartis en 8 specs
```

---

## 👤 Auteur

**Mathieu Fenouil** - Développeur Full-Stack (Java / Spring Boot + React / TypeScript)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mathieu-fenouil-développeur-full-stack/)
[![GitHub](https://img.shields.io/badge/GitHub-000?style=flat&logo=github)](https://github.com/Matfen2)
[![Email](https://img.shields.io/badge/Email-EA4335?style=flat&logo=gmail&logoColor=white)](mailto:matfen3.05@gmail.com)