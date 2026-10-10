---
name: ecc-audit-fct
description: Compétence d'audit complet de la plateforme FCT ERP & CRM Automobile (Architecture, Sécurité, Résolution des bugs, Conformité des règles métiers).
---

# ECC Audit Protocol — FCT Automobile Douala

Cette compétence permet d'exécuter un protocole d'inspection complet sur l'application FCT.

## Étapes de l'Audit

### 1. Sécurité et Contrôle d'Accès
- Vérifier les règles Firestore dans `firebase/firestore.rules`.
- Contrôler que chaque opération sensible passe par `hasPermission(currentUserRole, module, action)` défini dans `packages/business-rules`.
- S'assurer qu'aucune clé privée n'est exposée dans les bundles clients.

### 2. Intégrité des Données et Immutabilité
- Les écritures dans le `dbStore` doivent respecter le typage strict défini dans `packages/shared-types`.
- Chaque opération financière dans `cashMovements` ou `invoices` doit être append-only avec traçabilité d'audit.

### 3. Gestion des Erreurs et Expérience Utilisateur
- Interdiction des erreurs silencieuses : chaque action asynchrone doit avoir un retour d'état (succès/erreur).
- Les composants doivent gérer les états de chargement (`isUploading`, `isSubmitting`).
- Pas d'images d'exemples ni d'URLs non vérifiées lors de la création de données.

### 4. Validation Continue
- Exécuter systématiquement :
  ```bash
  npx tsc --noEmit
  npx vitest run
  ```
