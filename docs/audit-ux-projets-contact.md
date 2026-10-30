# Audit UX/UI : pages Projets et Contact face à l'accueil (30/10/2026)

Périmètre : `/projects`, `/projects/[id]`, `/contact`, et leur rapport avec la boucle d'accueil (carte des étapes, scène Bivouac). Constats vérifiés dans le code (`pages/`, `assets/loop/loop.js`, `loop.html`). **Non vérifié** : parcours réels sur appareil, analytics, rendu en production (site injoignable depuis l'environnement de travail). Complète `docs/audit-coherence.md` (qui traite surtout la charte et la navigation).

## 1. Contact : trois chemins pour le même geste, dont un qui échoue

| Chemin | Mécanisme | Problème |
|---|---|---|
| Bivouac, boutons « E-mail » | `mailto:` | dépend d'une messagerie installée |
| Bivouac, formulaire « Envoyer le message » | `mailto:` pré-rempli (`#cntForm`, `loop.js`) | **le libellé promet un envoi, rien n'est envoyé** : sans client mail (cas courant sur ordinateur), il ne se passe rien, le message saisi est perdu, et le statut « Votre messagerie s'ouvre » est faux |
| Page `/contact` | EmailJS (identifiants en dur dans `pages/contact.vue`) | autre mécanisme, autres champs (`name` / `nom`), autre texte |

Écarts de contenu entre les deux destinations : bivouac « Disponible pour de nouveaux projets… 48 h », `/contact` « projets freelance, missions et collaborations dans le secteur sport et outdoor » ; le lien de rendez-vous n'existe que dans le bivouac ; LinkedIn / GitHub viennent de deux sources (`CONTACT` dans `loop.js`, `profile.profiles`).

`/contact` est quasi orpheline : le pied de page de l'accueil ouvre la scène Bivouac, pas la page. Elle ne sert que de repli (sans JS, lien direct, SEO) mais diverge de la destination principale.

**Recommandation (une seule voie)** :
1. Une route serveur `POST /api/contact` (validation, anti-spam par champ piège, envoi par un service transactionnel gratuit, ex. Resend) appelée par les **deux** formulaires ; clé en variable d'environnement, plus rien en dur.
2. Retour honnête dans `role="status"` : « Message envoyé » ou « Échec, écrivez-moi à adresse@… » avec le texte conservé ; le `mailto:` reste en secours explicite, jamais présenté comme un envoi.
3. `/contact` = même contenu et même formulaire que le bivouac (source unique : profil admin), ou redirection vers `/#bivouac` si on accepte de perdre le repli sans JS.

## 2. Projets : la page double la carte sans la prolonger

- **Rôle** : `/projects` est la version lisible, partageable et sans 3D de la carte (même calcul `buildStageView`). C'est utile (SEO, RGAA, lien direct) mais rien ne le dit au visiteur.
- **Ordre inversé** : la carte va du Départ (2010) vers l'arrivée ; `/projects` trie du plus récent au plus ancien. Deux lectures du même parcours dans des sens opposés.
- **Contenus différents** : la carte montre toutes les étapes (dont Départ UCPA / Decathlon, sans projet) ; `/projects` ne liste que les fiches « publiées » (type + défi + solution + résultat renseignés). Le visiteur voit N cairns d'un côté, M cartes de l'autre, sans explication.
- **Vocabulaire** : menu de la carte « Monter · Expériences », page « Sentiers · Projets » ; le filtre « Missions / Projets perso » n'existe pas dans la carte.
- **Impasse** : ni `/projects` ni `/projects/[id]` n'ont d'appel à l'action vers le contact (aucune occurrence de « contact » dans ces pages ; le seul chemin est le pied de page). Le visiteur convaincu par une fiche n'a pas de suite naturelle.
- **Chemin depuis l'accueil** : lien d'en-tête « Projets » et « Voir la fiche » ; bon, mais le lien par défaut du panneau pointe vers la liste et non vers la fiche du cairn tant qu'aucune étape n'a de projet lié.

**Recommandations** :
1. Chapeau court sur `/projects` : « La même trace que sur l'accueil, en lecture directe », avec lien « Voir sur la carte ».
2. Même ordre que la carte (chronologique) ou, au minimum, indiquer l'ordre (« du plus récent… ») ; afficher aussi les étapes sans fiche (non cliquables) pour que les comptes concordent.
3. Un bloc de fin commun aux deux pages : « Une étape à écrire ensemble » + bouton vers le bivouac / formulaire.
4. Libellés alignés sur la décision du 19/10 (ordre et vocabulaire de la boucle).

## 3. Priorités

1. Corriger l'envoi (route `/api/contact`, état honnête) : bloquant, c'est le seul objectif de conversion du site.
2. Fusionner `/contact` et le bivouac (une source, un texte).
3. CTA de fin sur `/projects` et les fiches.
4. Ordre, comptes et vocabulaire alignés carte ↔ liste.

Choix à confirmer par Adri : service d'envoi (Resend / autre), sort de `/contact` (repli identique ou redirection), liste = ordre chronologique ou récent d'abord.
