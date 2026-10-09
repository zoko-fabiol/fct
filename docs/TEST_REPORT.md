# RAPPORT DE TESTS AUTOMATISÉS — FCT ERP & CRM AUTOMOBILE
**Franchise Conseils Trading (FCT)** — Douala, Cameroun
**Suite de Tests :** Vitest v5.0.3 | **Environnement :** Node.js / TypeScript 5.8

---

## 1. Résumé Global d'Exécution
- **Fichiers de tests exécutés :** 2
- **Nombre total de tests :** 12
- **Tests réussis :** 12 (100%)
- **Tests en échec :** 0
- **Durée totale d'exécution :** < 1s

---

## 2. Détail des Suites de Tests

### Suite 1 : `tests/business-rules.test.ts` (8 tests)
- ✓ Formate correctement les montants entiers en Francs CFA (XAF) avec séparateur officiel.
- ✓ Calcule la durée de location avec minimum garanti de 1 jour.
- ✓ Génère un numéro séquentiel certifié selon les normes FCT (`CTR-2026-xxxx`, `FAC-2026-xxxx`, `REC-2026-xxxx`).
- ✓ Détecte et refuse les chevauchements de dates pour un même véhicule (détection de collision d'intervalles).
- ✓ Valide la disponibilité pour une période postérieure sans conflit.
- ✓ Bloque la location ou la vente d’un véhicule en maintenance mécanique à Douala.
- ✓ Bloque toute opération sur un véhicule déjà vendu.
- ✓ Accorde et refuse rigoureusement les permissions selon la matrice granulaire des 8 rôles RBAC.

### Suite 2 : `tests/validation.test.ts` (4 tests)
- ✓ Valide avec succès un véhicule conforme aux spécifications (VIN, immatriculation, tarifs).
- ✓ Rejette un véhicule avec VIN trop court ou tarifs négatifs.
- ✓ Rejette un contrat de location dont la date de fin est antérieure à la date de début.
- ✓ Valide une écriture de caisse obligatoirement en espèces (`CASH`).

---

## 3. Critères d'Acceptation de Clôture
1. **Compilation Production :** `npm run build` exécuté sans warning bloquant.
2. **Typecheck Stricte :** `npm run typecheck` validé à 100% sans erreur.
3. **Immutabilité de Caisse :** Règles Firestore et tests unitaires confirment l'interdiction de modification en place et l'obligation de contre-passation.
4. **Offline First :** Cache local IndexedDB et file d'attente Outbox opérationnels.
