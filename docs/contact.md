# Formulaire de contact : envoi réel (30/10/2026)

Avant : le formulaire du Bivouac n'envoyait rien (`mailto:` pré-rempli, perdu sans messagerie) et `/contact` passait par EmailJS avec des identifiants en dur. Voir `docs/audit-ux-projets-contact.md`.

Maintenant : **une seule route**, `POST /api/contact` (`server/api/contact.post.ts`), appelée par le formulaire du Bivouac (`loop.js`, `#cntForm`) et par `pages/contact.vue`.

- **Service** : Resend, offre gratuite (100 mails/jour, 3 000/mois), appelé en HTTP (`fetch`), aucune dépendance. `@emailjs/browser` retiré.
- **Variables d'environnement** (Vercel › Settings › Environment Variables) :
  - `RESEND_API_KEY` : obligatoire (resend.com › API Keys). Absente → l'API répond 503 « L'envoi n'est pas configuré ».
  - `CONTACT_TO` : destinataire (défaut : `ADMIN_EMAIL`).
  - `CONTACT_FROM` : expéditeur (défaut `Portfolio <onboarding@resend.dev>`). **Sans domaine vérifié chez Resend, cet expéditeur ne peut écrire qu'à l'adresse du compte Resend** : créer le compte Resend avec l'adresse de réception (`CONTACT_TO`). Pour un expéditeur à ton nom, vérifier un domaine dans Resend.
- **Validation** (`utils/contactMessage.ts`, testée) : nom, e-mail valide, message ; longueurs bornées ; sujet sans saut de ligne (pas d'injection d'en-tête). `reply_to` = e-mail du visiteur : répondre au mail répond au visiteur.
- **Anti-spam** : champ piège `site` (invisible, hors tabulation, `aria-hidden`) : rempli → réponse « ok » sans envoi ; 5 envois / 10 min / IP, au mieux (mémoire de l'instance serverless).
- **Retour honnête** : « Envoi en cours… », « Message envoyé », ou l'erreur du serveur + « Vous pouvez aussi écrire à <adresse> » ; le texte saisi n'est jamais effacé en cas d'échec ; bouton désactivé pendant l'envoi. Statut en `role="status"` (Bivouac) / SweetAlert (`/contact`).
- **Changer de service** : seule la fonction `fetch` de `contact.post.ts` change ; formulaires et validation restent.
- **À faire** : fusionner les textes de `/contact` et du Bivouac (source unique profil admin), voir l'audit.
