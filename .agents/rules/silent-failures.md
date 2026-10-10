# Règle ECC : Chasse aux Erreurs Silencieuses (Silent-Failure Hunting)

1. **Aucun `try/catch` Muet** :
   - Il est formellement interdit d'avoir un bloc `catch (e) {}` vide ou ne contenant qu'un simple `console.log`.
   - Tout échec doit obligatoirement informer l'utilisateur via une notification visuelle (`setActionAlert({ type: 'error', message: ... })`).

2. **États de Chargement Obligatoires** :
   - Tout appel asynchrone (Firestore, Cloudinary, EmailJS) doit désactiver le bouton déclencheur et afficher un indicateur de chargement (`Loader2`) pour éviter les doubles clics ou blocages invisibles.

3. **Fallback UI** :
   - Si une donnée est manquante (image, document, relation), afficher un placeholder élégant ou un message explicatif plutôt qu'un plantage ou un écran blanc.
