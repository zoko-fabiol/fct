# Règle ECC : Immutabilité des États (Immutability)

1. **Aucune Mutation Directe** :
   - Ne jamais faire `array.push()`, `delete object.prop`, ou `object.prop = value` sur les états partagés (`DatabaseState`).
   - Toujours créer de nouveaux tableaux et objets avec le spread operator (`[...items]`, `{ ...entity }`).

2. **Mises à Jour dans `dbStore`** :
   - `setState` doit toujours retourner un nouvel objet d'état complet sans modifier les références précédentes.
   - Les modifications doivent être historisées dans le journal d'audit (`auditLogs`).

3. **Collections et Listes** :
   - Les tris et filtres doivent toujours être exécutés sur des copies : `[...items].sort(...)`.
