# Règle ECC : Zéro Régression & Validation Continue

1. **Compilation Stricte** :
   - Le code doit systématiquement passer `npx tsc --noEmit` avec exactement **0 erreur**.

2. **Validation des Tests** :
   - La suite de tests `npx vitest run` doit être exécutée après chaque modification majeure et afficher **100% de réussite**.
   - Aucun test ne doit être désactivé ou supprimé sans justification explicite.

3. **Protection des Données Existantes** :
   - Les migrations de schéma doivent être rétro-compatibles (champs optionnels avec valeurs par défaut).
   - Les données du magasin hors-ligne IndexedDB ne doivent jamais être écrasées arbitrairement.
