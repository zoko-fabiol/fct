# Matrice des Rôles et Permissions (RBAC) - FCT ERP

| Module | Super Admin | Directeur | Agent Commercial | Agent Location | Comptable / Caissier | Gestionnaire Flotte | Chauffeur | Observateur |
|---|---|---|---|---|---|---|---|---|
| **Tableau de Bord** | CRUD + Approve + Export | Read + Export | Read | Read | Read + Export | Read | Read | Read |
| **Parc Automobile** | Full | Read/Create/Update/Export | Read | Read | Read | Read/Create/Update/Export | Read | Read |
| **Stock & Inventaire** | Full | Read/Export | Read | Read | Read | Full | Non | Read |
| **Locations** | Full | Read/Create/Update/Approve | Read | Read/Create/Update/Export | Read | Read | Read | Read |
| **Ventes & Devis** | Full | Read/Create/Update/Approve | Full (sauf delete) | Non | Read | Non | Non | Read |
| **CRM & Prospects** | Full | Full (sauf delete) | Full (sauf delete) | Full (sauf delete) | Read | Read | Non | Read |
| **Réservations** | Full | Full | Read/Create | Full | Read | Read | Non | Read |
| **Facturation** | Full | Full | Read/Create | Read/Create | Full | Read | Non | Read |
| **Caisse & Espèces** | Full | Read/Approve/Export | Read | Read/Create (Acomptes) | Full (Contre-écritures) | Non | Non | Read |
| **Maintenance** | Full | Read/Approve/Export | Non | Read | Read/Export | Full | Create (Signalement) | Read |
| **Chauffeurs** | Full | Read/Create/Update | Read | Read/Update | Read | Full | Read (ses missions) | Read |
| **Documents / Coffre** | Full | Full | Read/Create | Read/Create | Read/Create/Export | Full | Read | Read |
| **Journal d'Audit** | Full | Read/Export | Non | Non | Read (Caisse) | Non | Non | Read |
| **Paramètres FCT** | Full | Read/Update | Non | Non | Read | Non | Non | Read |
