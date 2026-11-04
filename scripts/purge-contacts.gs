/**
 * Purge des messages du formulaire de contact du portfolio (RGPD : conservation 3 ans maximum).
 *
 * Cible : les mails dont l'objet commence par « Contact portfolio : » (voir utils/contactMessage.ts)
 * et dont le dernier message a plus de 3 ans. Ils vont à la corbeille Gmail, qui les supprime
 * définitivement au bout de 30 jours.
 *
 * Installation : docs/purge-contacts.md
 */
var REQUETE = 'subject:"Contact portfolio :" older_than:3y';
var TAILLE_LOT = 100;

function purgerContacts() {
  var total = 0;
  var fils;
  do {
    fils = GmailApp.search(REQUETE, 0, TAILLE_LOT);
    if (fils.length) GmailApp.moveThreadsToTrash(fils);
    total += fils.length;
  } while (fils.length === TAILLE_LOT);
  console.log('Contacts de plus de 3 ans mis à la corbeille : ' + total);
}

/** À lancer une seule fois : programme la purge le 1er de chaque mois, vers 4 h. */
function installerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'purgerContacts') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('purgerContacts').timeBased().onMonthDay(1).atHour(4).create();
}
