# Purge automatique des messages de contact (3 ans)

Le formulaire de contact n'enregistre rien en base : le message part par e-mail (Resend) vers la boîte Gmail du propriétaire. Les mentions légales annoncent une conservation de **3 ans maximum** après le dernier contact. Gmail n'a pas de suppression automatique par âge ; ce script Google Apps Script s'en charge.

## Fonctionnement

- Cible les mails dont l'objet commence par `Contact portfolio :` (défini dans `utils/contactMessage.ts`, fonction `buildMail`).
- Sélectionne ceux dont le dernier message a plus de 3 ans (`older_than:3y`).
- Les met à la corbeille Gmail, qui les efface définitivement après 30 jours.
- Passe le 1er de chaque mois vers 4 h.

Si l'objet du mail change dans `buildMail`, adapter la constante `REQUETE` du script.

## Installation (5 minutes)

1. Aller sur <https://script.google.com> avec le compte Gmail qui reçoit les contacts, puis « Nouveau projet ».
2. Remplacer le contenu par `scripts/purge-contacts.gs`.
3. Lancer `installerDeclencheur` une fois et accepter les autorisations Gmail.
4. Lancer `purgerContacts` à la main pour tester : le journal affiche le nombre de fils mis à la corbeille (0 tant qu'aucun contact n'a 3 ans).

## Vérifier ou arrêter

- Déclencheurs : icône horloge dans la barre latérale d'Apps Script.
- Arrêt : supprimer le déclencheur.
- Simulation : coller `subject:"Contact portfolio :" older_than:3y` dans la recherche Gmail pour voir ce qui serait supprimé.

## Droit de suppression

Sur demande d'une personne, rechercher son adresse dans Gmail et supprimer les fils concernés ; la purge ci-dessus ne remplace pas ce droit.
