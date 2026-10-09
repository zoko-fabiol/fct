# ARCHITECTURE TECHNIQUE & SYSTÈME — FCT ERP & CRM AUTOMOBILE
**Franchise Conseils Trading (FCT)** — Carrefour Santa Barbara, Bonamoussadi, Douala, Cameroun

---

## 1. Vue d'Ensemble du Système
L'application FCT ERP / CRM est conçue selon une architecture **Offline-First**, **Zero-Trust** et **Event-Driven**, spécialement adaptée aux conditions d'exploitation de l'agence automobile de Douala (instabilités électriques et réseau, forte proportion de règlements en espèces en Francs CFA, traçabilité fiscale et douanière).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FCT CLIENT APPLICATION (React 19 / Vite)                 │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│  18 Modules Métier   │  Bilingual Engine    │  Offline Outbox / IndexedDB   │
│  (Parc, Loc, Caisse) │  (FR / EN instant)   │  (Idempotency & Auto-Retry)   │
└──────────┬───────────┴──────────┬───────────┴───────────────┬───────────────┘
           │                      │                           │
           ▼                      ▼                           ▼
┌──────────────────────┐┌──────────────────────┐┌───────────────────────────────┐
│ Firebase Auth        ││ Cloud Firestore      ││ Cloud Functions & Cloudinary  │
│ (Tokens & RBAC)      ││ (fct-cmr Database)   ││ (Signatures & Numérotation)   │
└──────────────────────┘└──────────────────────┘└───────────────────────────────┘
```

---

## 2. Découpage Modulaire & Monorepo
1. **Application Principale (`/src`, `/packages`) :**
   - `packages/shared-types/` : Contrats d'interfaces et énumérations TypeScript.
   - `packages/validation/` : Validateurs Zod (plaques LT-xxxx, téléphones Cameroun +237, montants positifs).
   - `packages/business-rules/` : Moteur de calcul des tarifs, cautions, pénalités et détection de conflits.
   - `src/services/firebase.ts` : Pont SDK officiel Firebase avec gestion d'erreurs normalisée.
   - `src/services/indexedDbService.ts` : Cache local et file Outbox transactionnelle IndexedDB.
   - `src/services/dbStore.ts` : Repository réactif central orchestrant l'optimistic UI et la synchronisation Firestore.
2. **Backend Serverless (`/functions`) :**
   - Numérotation séquentielle atomique (`getNextDocumentSequence`).
   - Signature sécurisée Cloudinary (`generateCloudinarySignature`).
   - Rapprochement de caisse serveur (`reconcileAndCloseCashSession`).
3. **Sécurité Déclarative (`/firebase`) :**
   - `firestore.rules` : 12 collections sécurisées, refus par défaut, restriction des chauffeurs à leurs missions.
   - `firestore.indexes.json` : Index composites pour les requêtes complexes.
4. **Site Public Isolé (`/website`) :**
   - Dossier autonome pour le futur site vitrine avec son propre `package.json` et build indépendant.

---

## 3. Invariants Métier & Intégrité Financière
- **Monnaie :** Tous les montants financiers sont stockés sous forme d'entiers stricts en Francs CFA (XAF), évitant tout artefact d'arrondi à virgule flottante.
- **Journal de Caisse Immuable :** Aucune écriture de caisse (`cash_movements`) ne peut être modifiée ni supprimée. Toute correction s'effectue via une contre-passation (contre-écriture opposée) avec mention obligatoire du motif et de l'auteur.
- **Anti-Chevauchement :** Deux locations ne peuvent pas se recouper sur le même véhicule. Les dates sont analysées selon l'intervalle `[startDate, endDate]`.
- **Incompatibilité Flotte :** Un véhicule avec le statut `MAINTENANCE` ou `SOLD` est automatiquement verrouillé et ne peut faire l'objet d'un nouveau contrat.

---

## 4. Stratégie Offline-First (IndexedDB Outbox Pattern)
1. **Mutation Locale Optimiste :** Lorsqu'un agent crée un contrat ou enregistre un mouvement de caisse, l'opération est immédiatement enregistrée dans l'état local et dans le store `outbox` d'IndexedDB avec une clé d'idempotence unique (`idemp-timestamp-rand`).
2. **Indicateur d'État :** L'opération est marquée `PENDING` (en attente). Un badge visuel signale au personnel que l'opération est locale et non encore confirmée par le serveur.
3. **Réconciliation Réseau :** Dès que l'événement `window.ononline` se déclenche, le service déclenche `triggerSync()`, transmet les données à Firestore et marque les éléments `SYNCED`.
