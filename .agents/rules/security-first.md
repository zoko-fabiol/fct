# Règle ECC : Sécurité d'Abord (Security-First)

1. **Variables d'Environnement & Secrets** :
   - Seules les variables préfixées par `VITE_` sont accessibles dans le code client.
   - Ne jamais placer de clés d'API secrètes (telles que `CLOUDINARY_API_SECRET` ou `EMAILJS_PRIVATE_KEY`) dans le bundle client.
   - Tout appel d'administration sensible doit passer par une Cloud Function ou un service backend signé.

2. **Règles Firestore (`firebase/firestore.rules`)** :
   - Interdiction de la lecture ou écriture publique (`allow read, write: if true`).
   - L'utilisateur doit être authentifié (`request.auth != null`).
   - Les écritures financières (Caisse, Factures) doivent vérifier les rôles (`ADMIN`, `ACCOUNTANT`, `MANAGER`).

3. **Validation des Entrées** :
   - Tout formulaire doit valider les types, longueurs et formats (immatriculation, téléphone camerounais +237, montants positifs en FCFA).
   - Les téléversements de fichiers doivent valider l'extension et la taille (< 25 Mo).
