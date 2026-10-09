# MODÈLE DE DONNÉES & SCHÉMA FIRESTORE — FCT ERP & CRM
**Franchise Conseils Trading (FCT)** — Douala, Cameroun

---

## 1. Vue d'Ensemble des Collections Firestore

| Collection | Description | Règle d'Immutabilité |
|---|---|---|
| `users` | Profils collaborateurs, rôles RBAC et statut de compte | Modifiable par Super Admin |
| `vehicles` | Fiches véhicules, kilométrage, tarifs et coûts d'acquisition | Modifiable par Gestionnaire Flotte / Directeur |
| `customers` | Répertoire clients particuliers et grands comptes entreprises | Modifiable par Agents / Directeurs |
| `rental_contracts` | Contrats de location, inspections départ/retour, cautions | Verrouillé après clôture |
| `reservations` | Réservations préalables et acomptes | Cycle de vie : PENDING -> CONFIRMED -> CONVERTED |
| `sales` | Commandes et pipeline de vente de véhicules | Étapes de négociation à livraison |
| `invoices` | Factures proforma, définitives et reçus | Numérotation séquentielle certifiée |
| `cash_sessions` | Sessions d'ouverture et clôture de caisse | Verrouillé à la clôture |
| `cash_movements` | Flux d'encaissements et décaissements en espèces | **STRICTEMENT IMMUABLE (Contre-écritures uniquement)** |
| `stock` | Pièces détachées, fluides et seuils d'alerte | Décrémentation lors des révisions |
| `maintenance` | Dossiers de réparation et immobilisation flotte | Lié aux garages partenaires CFAO/Akwa |
| `drivers` | Chauffeurs certifiés FCT, permis et visites médicales | Suivi de validité des dates |
| `documents` | Métadonnées des pièces jointes et coffre-fort Cloudinary | Privé / Public selon classification |
| `audit_logs` | Traçabilité des actions sensibles et clés d'idempotence | Append-only immuable |
| `document_counters` | Compteurs atomiques pour la numérotation serveur | Incrémentation transactionnelle |

---

## 2. Types de Données Spécifiques
- **Montants monétaires :** Entiers stricts en XAF (`rentalDailyRate`, `securityDepositXAF`, `amountXAF`).
- **Dates :** Format ISO `YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ssZ`, normalisé sur le fuseau horaire `Africa/Douala`.
- **Clés d'idempotence :** Chaînes préfixées `idemp-timestamp-entropy` pour garantir l'absence de doublons en cas de retry réseau.
