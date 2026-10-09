# VARIABLES D'ENVIRONNEMENT — FCT ERP & CRM AUTOMOBILE
**Franchise Conseils Trading (FCT)** — Douala, Cameroun

---

## 1. Variables Frontend Client (`.env.local` / CI/CD)

Toutes les variables accessibles au client Vite doivent obligatoirement commencer par le préfixe `VITE_`.

| Variable | Description | Exemple |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Clé API publique du projet Firebase Web | `AIzaSyDOrL2WTMbKmo...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine d'authentification Firebase | `fct-cmr.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Identifiant du projet Google Cloud / Firebase | `fct-cmr` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket Cloud Storage pour les documents | `fct-cmr.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID Firebase Cloud Messaging | `11946393528` |
| `VITE_FIREBASE_APP_ID` | Identifiant unique de l'application Web | `1:11946393528:web:...` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Nom du compte Cloudinary FCT | `fct-automobile-douala` |
| `VITE_CLOUDINARY_UPLOAD_PRESET_PUBLIC` | Preset d'upload pour les photos de véhicules | `fct_public_vehicles` |
| `VITE_EMAILJS_SERVICE_ID` | Identifiant du service EmailJS | `service_fct_douala` |
| `VITE_EMAILJS_PUBLIC_KEY` | Clé publique EmailJS pour envoi sécurisé | `fct_public_key` |
| `VITE_APP_TIMEZONE` | Fuseau horaire normalisé | `Africa/Douala` |
| `VITE_APP_CURRENCY` | Devise canonique | `XAF` |

---

## 2. Secrets Backend Cloud Functions (Variables Sécurisées Server-Side)

Ces variables ne doivent **JAMAIS** être exposées au frontend ni versionnées dans Git :
- `CLOUDINARY_API_SECRET` : Clé secrète de signature d'upload pour les documents privés.
- `EMAILJS_PRIVATE_KEY` : Clé API pour la validation et l'orchestration des modèles sensibles.
