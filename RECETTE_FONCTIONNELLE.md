# Recette fonctionnelle JuriBook

## Environnement de test
- Frontend : `http://localhost:5173`
- Backend : cluster Kapsule `163.172.182.227` (via proxy Vite)
- Tests automatisés : Cypress `npm run cypress:open`

---

## Lancer les tests Cypress

```bash
# Mode interactif (recommandé pour la recette)
npm run cypress:open

# Mode headless (CI)
npm run cypress:run
```

---

## Parcours couverts par les specs Cypress

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
| **Total** | **43 tests** | **Tous parcours critiques** |

---

## Checklist recette manuelle (complémentaire aux tests automatisés)

### Parcours CLIENT

- [ ] **Inscription** : `http://localhost:5173/register` → formulaire → 201 → redirect login
- [ ] **Connexion** : email + mot de passe → JWT stocké → redirect `/client/dashboard`
- [ ] **Recherche** : `/search` → spécialité + ville → résultats filtrés
- [ ] **Fiche avocat** : clic sur carte → profil complet + créneaux disponibles
- [ ] **Réservation** : sélectionner créneau → saisir motif → confirmer → toast succès
- [ ] **Mes RDV** : `/client/bookings` → onglets À venir / Passés / Annulés
- [ ] **Upload document** : sur RDV confirmé → sélectionner PDF → upload réussi
- [ ] **Notifications** : badge cloche → liste notifications → marquer lu
- [ ] **Déconnexion** : bouton → localStorage vidé → redirect login

### Parcours AVOCAT

- [ ] **Inscription avocat** : `/register/lawyer` → 201 statut PENDING
- [ ] **Connexion** : redirect `/lawyer/dashboard`
- [ ] **Profil** : créer/modifier profil (spécialité, ville, tarif, bio)
- [ ] **Disponibilités** : `/lawyer/availabilities` → calendrier semaine → créer créneau récurrent
- [ ] **Demandes** : `/lawyer/bookings` → onglet À traiter → confirmer ou refuser
- [ ] **Planning** : onglet Confirmés → voir les RDV confirmés

### Parcours ADMIN

- [ ] **Connexion admin** : redirect `/admin/dashboard`
- [ ] **Dashboard** : compteurs (pending, approved, rejected, clients)
- [ ] **Valider avocat** : bouton Valider → lawyer_status APPROVED → Kafka lawyer.approved
- [ ] **Refuser avocat** : bouton Refuser → lawyer_status REJECTED → compte suspendu
- [ ] **Analytics** : `/admin/analytics` → graphiques réservations, spécialités
- [ ] **Audit** : `/admin/audit` → journal des événements
- [ ] **Alertes abus** : `/admin/abuse-alerts` → comptes suspects
- [ ] **Modération avis** : `/admin/reviews` → masquer/démasquer/supprimer avis

### Pages d'erreur

- [ ] **404** : naviguer vers `/url-inexistante` → page stylisée + bouton retour
- [ ] **403** : CLIENT sur `/admin/dashboard` → "Accès interdit" + rôle affiché
- [ ] **500** : naviguer vers `/500` → page stylisée + bouton réessayer

---

## Données de test

### Compte client
```
Email : jean.dupont@example.com
Mot de passe : motdepasse123
```

### Compte avocat (après validation admin)
```
Email : sophie.martin@example.com
Mot de passe : motdepasse123
Barreau : 75099
Spécialité : Droit du travail
```

### Compte admin (à créer en base)
```sql
INSERT INTO users (name, email, password, role, enabled, created_at, updated_at)
VALUES (
  'Admin JuriBook', 'admin@juribook.fr',
  '$2a$10$K6Fs7CHCaGkVMfdkU4k/wuE/NyCAD4wbNBEshiBIU5CuSIkOxOGqu',
  'ADMIN', true, NOW(), NOW()
);
-- Mot de passe : motdepasse123
```

---

## Résultats attendus

| Parcours | Critère d'acceptation |
|---|---|
| Inscription client | 201 Created, redirect login |
| Connexion | JWT dans localStorage, redirect dashboard rôle |
| Recherche | Résultats filtrés, compteur correct |
| Réservation | POST 201, statut PENDING, notification avocat |
| Confirmation avocat | PATCH 200, statut CONFIRMED, notification client |
| Upload document | POST 200, fichier listé avec statut "Envoyé" |
| Validation admin | PUT 200, Kafka lawyer.approved publié |
| 404 | Page stylisée, bouton retour fonctionnel |
| 403 | Rôle affiché, bouton "Mon espace" redirige correctement |