# GUIDE DE DÉPLOIEMENT & EXPLOITATION — FCT ERP & CRM AUTOMOBILE
**Franchise Conseils Trading (FCT)** — Douala, Cameroun (Projet Firebase: `fct-cmr`)

---

## 1. Prérequis & Environnement
- **Node.js :** Version 20 LTS ou supérieure.
- **Firebase CLI :** `npm install -g firebase-tools`
- **Projet Firebase configuré :** `fct-cmr` (Google Cloud / Firebase Console).

---

## 2. Déploiement du Frontend (PWA Back-Office)
```bash
# 1. Cloner et installer les dépendances
npm install

# 2. Vérification statique et tests
npm run typecheck
npm run test
npm run lint

# 3. Build de production optimisé
npm run build

# 4. Déploiement sur Firebase Hosting (ou Cloud Run / Vercel)
firebase deploy --only hosting
```

---

## 3. Déploiement des Règles Firestore et Index
```bash
# Déploiement des règles de sécurité durcies
firebase deploy --only firestore:rules

# Déploiement des index composites nécessaires
firebase deploy --only firestore:indexes
```

---

## 4. Déploiement des Cloud Functions
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

---

## 5. Procédure de Provisionnement Sécurisé du Premier Super Administrateur
Conformément aux exigences de sécurité, le premier compte super-administrateur ne doit **JAMAIS** être créé via une inscription publique non restreinte.

1. **Création du compte d'authentification :**
   Accéder à la console Firebase > Authentication > Utilisateurs > Ajouter un utilisateur :
   - E-mail : `rapidetravel2@gmail.com` (ou l'adresse officielle de la direction FCT)
   - Générer un mot de passe fort d'au moins 16 caractères.
2. **Attribution du rôle dans Firestore :**
   Dans Firestore > Collection `users` > Créer un document avec l'UID du compte créé :
   ```json
   {
     "id": "<UID_FIREBASE>",
     "email": "rapidetravel2@gmail.com",
     "fullName": "Direction Générale FCT (Super Admin)",
     "phone": "+237 699 45 88 12",
     "role": "super_admin",
     "isActive": true,
     "createdAt": "2026-10-09T08:00:00Z"
   }
   ```
3. Une fois ce document présent, la règle `isSuperAdmin()` dans `firestore.rules` s'applique immédiatement et de façon inviolable.

---

## 6. Sauvegardes, Restauration & Plan de Continuité d'Activité (PCA/PRA)
- **Sauvegarde Quotidienne Automatique :**
  Activer l'export Firestore géré par Google Cloud dans un bucket Cloud Storage sécurisé :
  ```bash
  gcloud firestore export gs://fct-cmr-backups/daily-$(date +%Y%m%d)
  ```
- **Restauration en Cas d'Incident :**
  ```bash
  gcloud firestore import gs://fct-cmr-backups/daily-<DATE_DESIREE>
  ```
- **Résilience Hors-ligne Locale :**
  En cas de coupure Internet ou électrique à Bonamoussadi, l'agence FCT continue d'enregistrer les contrats, les sorties et les encaissements en espèces sur les postes locaux via IndexedDB. Les données se synchronisent automatiquement dès le rétablissement de la fibre ou du réseau 4G.
