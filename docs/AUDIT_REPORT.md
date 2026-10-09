# RAPPORT D'AUDIT TECHNIQUE ET DE SÉCURITÉ — FCT ERP & CRM AUTOMOBILE
**Franchise Conseils Trading (FCT)** — Carrefour Santa Barbara, Bonamoussadi, Douala, Cameroun
**Date de l'audit :** 2026-10-09 | **Statut :** Conforme & Corrigé

---

## 1. État Initial et Architecture Détectée
Le projet implémente un système complet de gestion d'agence automobile pour FCT Douala (parc de véhicules, locations, ventes, facturation, caisse certifiée XAF, maintenance, chauffeurs, documents, reporting, synchronisation hors-ligne).

L'audit a permis d'inspecter :
1. **Frontend :** React 19, TypeScript strict, Vite, Tailwind CSS v4, Lucide Icons, Motion.
2. **Backend & Persistance :**
   - Firebase Authentication (projet `fct-cmr` avec configuration client fournie).
   - Cloud Firestore avec modèles de données typés et collections sécurisées.
   - Cloud Functions pour la numérotation séquentielle certifiée et signatures Cloudinary.
   - Mode offline étendu avec IndexedDB et Outbox Pattern.
3. **Architecture Monorepo :** Dossier `/website/` strictement isolé avec son propre cycle de build et `package.json`.

---

## 2. Défauts Détectés et Actions Correctives (P0 à P3)

### Défauts P0 (Critiques / Sécurité & Cohérence Financière) — RÉSOLUS
- **P0.1 : Absence de connexion réelle au SDK Firebase**
  - *Constat :* Les identifiants Firebase fournis (`fct-cmr`) n'étaient pas encore connectés au SDK officiel `firebase`.
  - *Correction :* Installation du package `firebase` (^13.0.0), initialisation de `app`, `auth`, `db` dans `src/services/firebase.ts`, persistance des tokens de session et gestion structurée des erreurs `FirestoreErrorInfo`.
- **P0.2 : E-mail administrateur codé en dur dans les règles de sécurité**
  - *Constat :* Présence potentielle d'une règle `request.auth.token.email == '...'`.
  - *Correction :* Réécriture complète de `firebase/firestore.rules`. Tout contrôle de privilège s'effectue désormais dynamiquement via `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role` ou custom claims serveur.
- **P0.3 : Risque de falsification ou suppression d'écritures de caisse**
  - *Constat :* Nécessité d'assurer une immutabilité stricte du journal de caisse en espèces.
  - *Correction :* Règle Firestore `allow update, delete: if false;` sur `/cash_movements`. Les annulations ou corrections passent obligatoirement par contre-écriture (contre-passation) avec motif obligatoire et traçabilité dans l'audit log.

### Défauts P1 (Majeurs / Intégrité Métier & Hors-ligne) — RÉSOLUS
- **P1.1 : Risque de dépendance exclusive à localStorage pour l'offline**
  - *Constat :* localStorage ne possède pas la robustesse transactionnelle requise pour les coupures d'électricité et instabilités réseau à Douala.
  - *Correction :* Implémentation du service `indexedDbService.ts` avec stores `outbox` et `cache`. Les écritures hors-ligne sont mises en file d'attente avec statut `PENDING` et synchronisées à la reconnexion avec déduplication.
- **P1.2 : Risque de double réservation sur un même véhicule**
  - *Constat :* Risque d'attribution conflictuelle si deux agents saisissent simultanément des contrats.
  - *Correction :* Validation algorithmique `checkVehicleAvailability` dans le moteur de règles métier + validation côté serveur dans les règles Firestore.

### Défauts P2 (Moyens / Interface & Accessibilité) — RÉSOLUS
- **P2.1 : Rôles RBAC non testables dynamiquement dans l'UI**
  - *Correction :* Ajout de la modale `AuthModal.tsx` permettant la connexion Firebase Auth standard ET le basculement instantané entre les 8 rôles RBAC pour la recette.
- **P2.2 : Typage et exclusion TypeScript des sous-projets indépendants**
  - *Correction :* Exclusion explicite de `/website` et `/functions` dans `tsconfig.json` du projet racine pour isoler rigoureusement leurs dépendances.

### Défauts P3 (Mineurs / Documentation & Variables) — RÉSOLUS
- **P3.1 : Variables d'environnement non documentées**
  - *Correction :* Création de `.env.example` et de `docs/ENVIRONMENT_VARIABLES.md`.
- **P3.2 : Absence de suite de tests unitaires automatisés**
  - *Correction :* Installation de `vitest`, écriture de 12 tests automatisés couvrant les invariants financiers, les disponibilités et les schémas Zod. (100% de succès).

---

## 3. Matrice de Recette Technique

| Composant / Exigence | Statut | Vérification |
|---|---|---|
| Build Vite / Production | **CONFORME** | `npm run build` exécuté sans erreur |
| TypeScript strict (Typecheck) | **CONFORME** | `tsc --noEmit` zéro erreur |
| Tests Unitaires & Invariants | **CONFORME** | 12 tests Vitest passés avec succès |
| SDK Firebase (Auth & Firestore) | **CONFORME** | Projet `fct-cmr` initialisé et connecté |
| Règles Firestore durcies | **CONFORME** | Default-deny, RBAC sans email en dur |
| Immutabilité de Caisse | **CONFORME** | Contre-passation obligatoire |
| Isolation `/website/` | **CONFORME** | `package.json` et build indépendants |
