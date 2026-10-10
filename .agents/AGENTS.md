# ECC (Everything Claude Code) — Harness Multi-Agents FCT Automobile

Ce harnais d'agents spécialisés supervise le projet **FCT — Franchise Conseils Trading (Douala Automobile)** pour garantir la robustesse, la sécurité, la haute fidélité métier et l'absence de régression.

## Principes Directeurs ECC

1. **Sécurité d'Abord (Security-First)** : Validation systématique de toutes les entrées (schémas Zod), contrôle d'accès RBAC obligatoire (`hasPermission`), isolation des secrets API (jamais de clés privées exposées au client).
2. **Immutabilité Strict (Immutability)** : Ne jamais muter l'état directement ; toujours produire de nouveaux objets et tableaux lors des mises à jour (`dbStore`, `React.useState`).
3. **Chasse aux Erreurs Silencieuses (Silent-Failure Hunting)** : Tout bloc `catch` doit consigner l'erreur et informer l'utilisateur via une alerte d'action visuelle explicite.
4. **Zéro Donnée Factice en Production (No Fake Data)** : Pas d'images d'exemples ni d'URLs Unsplash hardcodées dans les flux de création. Seuls les fichiers réels importés ou téléversés sont valides.
5. **Validation par Tests Automatisés (Test-Driven Reliability)** : Chaque modification critique doit être validée par la suite de tests Vitest et une compilation TypeScript stricte (`0 erreur`).

## Rôles des Agents ECC

| Agent | Rôle & Périmètre | Actions Clés |
| :--- | :--- | :--- |
| **security-reviewer** | Audit des règles Firestore, authentification, clés d'API et permissions | Examine `firestore.rules`, `.env`, `hasPermission()`, téléversements Cloudinary. |
| **code-architect** | Cohérence du modèle de données et des flux inter-modules | Valide la chaîne Véhicules ➔ Locations ➔ Contrats ➔ Factures ➔ Caisse ➔ Stock. |
| **silent-failure-hunter** | Élimination des erreurs étouffées et promesses non gérées | Audite les appels asynchrones, ajoute états de chargement et retours d'erreurs UI. |
| **react-reviewer** | Performance et réactivité de l'interface React | Prévient les doubles exécutions, gère les clés uniques, nettoie les écouteurs. |
| **typescript-reviewer** | Intégrité des types et contrats d'API | Valide `packages/shared-types`, `packages/business-rules`, garantit `0 erreur tsc`. |
| **tdd-guide** | Couverture de tests unitaires et d'intégration | Maintient et étend la suite Vitest pour tester les cas limites monétaires et métiers. |
