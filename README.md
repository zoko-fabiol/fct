# FCT ERP & CRM AUTOMOBILE — Franchise Conseils Trading

Système intégré de gestion automobile de niveau entreprise conçu pour **Franchise Conseils Trading (FCT)**, agence située à **Bonamoussadi, Carrefour Santa Barbara, Douala, Cameroun**.

---

## Fonctionnalités Principales & 18 Modules Déployés
1. **Dashboard & KPIs :** Taux d'occupation de la flotte, recettes en espèces, alertes de retour et de maintenance en temps réel.
2. **Parc Automobile :** Flotte FCT (SUV, 4x4, Pick-up, Berlines, Luxe), immatriculation CEMAC, VIN, kilométrage et fiches techniques.
3. **Stock & Inventaire :** Consommables, lubrifiants Total Quartz, filtres et pièces d'usure avec seuils de réapprovisionnement automatiques.
4. **Locations & Contrats :** Détection automatique des chevauchements de dates, inspections départ/retour (jauge 8/8, état carrosserie), cautions et pénalités.
5. **Ventes Véhicules :** Pipeline commercial en 6 étapes, bons de commande, encaissement d'acomptes et procès-verbaux de livraison.
6. **CRM & Répertoire Clients :** Particuliers et grandes entreprises de Douala, contacts, NIU fiscal et historique des locations.
7. **Réservations :** Prises de réservation (agence, WhatsApp, téléphone, web) avec conversion directe en contrats.
8. **Facturation & Devis :** Factures proforma, définitives et reçus avec TVA Cameroun (19.25%) et impression officielle.
9. **Caisse Certifiée (Espèces XAF) :** Sessions avec comptage physique d'ouverture/clôture, journal immuable et contre-passation (contre-écritures).
10. **Maintenance & Garages :** Immobilisation mécanique, partenaires agréés (CFAO Motors Douala, ateliers spécialisés), pièces consommées et coûts.
11. **Chauffeurs Professionnels :** Conducteurs FCT, suivi de validité des permis et visites médicales, affectations aux missions.
12. **Coffre-fort Numérique (Documents) :** Cartes grises, assurances Activa/AXA, contrôles techniques et pièces d'identité (Cloudinary Vault).
13. **Notifications & EmailJS :** Modèles transactionnels bilingues FR/EN (réservation, rappel de restitution, quittance d'encaissement, contact).
14. **Rapports & Exports :** Valorisation du parc, flux nets de trésorerie et exports CSV en un clic (Parc et Caisse).
15. **Utilisateurs & RBAC :** Gestion des collaborateurs selon les 8 rôles avec sélecteur interactif et connexion Firebase Auth.
16. **Paramètres FCT :** Identité légale, RCCM, NIU, adresse Carrefour Santa Barbara et règles de numérotation.
17. **Journal d'Audit & Sync Hors-ligne :** Traçabilité intégrale, clés d'idempotence et gestion de la file Outbox pour les coupures réseau à Douala.
18. **Centre d'Aide & SOP :** Procédures opérationnelles standardisées pour le personnel et contacts d'assistance locale.

---

## Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement en développement (Port 3000)
```bash
npm run dev
```

### 3. Exécution des tests automatisés
```bash
npm run test
```

### 4. Build de production & Vérification des types
```bash
npm run typecheck
npm run build
```

---

## Architecture & Sécurité
- **Firebase :** Projet `fct-cmr` avec règles Firestore Zero-Trust, authentification par email/mot de passe et gestion des profils collaborateurs.
- **Offline-First :** Moteur IndexedDB Outbox avec mise en file d'attente des mutations et réconciliation automatique lors de la reconnexion.
- **Dossier `/website/` indépendant :** Le futur site web public dispose de son propre `package.json` et de son cycle de déploiement distinct.
