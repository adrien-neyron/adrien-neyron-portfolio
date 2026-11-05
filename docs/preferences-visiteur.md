# Préférences du visiteur : vue statique et « Passer l'intro »

Mis à jour le 05/11/2026.

| Choix du visiteur | Où il est mémorisé | Durée |
|---|---|---|
| Bouton « Vue statique » (menu de l'accueil) | `localStorage['asc-static']` (`1` / `0`) | Durable : revient à chaque visite |
| « Passer l'intro » (écran de la corde) | `sessionStorage['asc-static-visit']` | Cette visite seulement (onglet) |
| Mouvement réduit de l'appareil (`prefers-reduced-motion`) | réglage système | Automatique |
| Appareil léger / économie de données (`LOADERS.lite`) | décidé par la page | Automatique |

## Pourquoi

« Passer l'intro » écrivait auparavant `localStorage['asc-static'] = '1'` : un seul clic privait le visiteur de la 3D à toutes ses visites suivantes, sans qu'il le sache. Le choix durable est désormais réservé au bouton « Vue statique », explicite.

## Code

- `components/loop/LoopHome.vue` : gestionnaire de `#gateSkip` (écrit la clé de session).
- `assets/loop/loop.js` : `prefStatic` lit les deux clés ; le bouton `#tgStatic` efface la clé de session quand le visiteur choisit lui-même.

## Pour retrouver la 3D en développement

`localStorage.removeItem('asc-static'); sessionStorage.clear(); location.reload()` dans la console. Le `localStorage` est propre à chaque origine : localhost et la prod ont des réglages distincts.

## Mise en page de la vue statique

Depuis le 05/11/2026, la vue statique est une page éditoriale à part entière, pas la boucle figée. Styles : fin de `assets/loop/loop.source.css` (à modifier là, puis `node scripts/scope-loop-css.cjs`).

- **Tout est dans le flux**, dans une colonne de 1 040 px (`--gut`) : rien n'est coupé à faible hauteur ni à 400 % de zoom. Le pied de page n'est plus fixe et ne recouvre plus rien.
- **La 3D reste décorative, en bandeaux** : la carte ouvre « L'ascension » (`--band`, `staticView()` cadre toute l'emprise de la trace), la flaque ferme « Le randonneur » (`--band3`), le feu reste à côté du formulaire. Le texte n'est jamais sur un canvas 3D : cartes et formulaire ont un fond plein, qu'axe peut mesurer. Seule exception : en mode nuit, l'accroche et « S'équiper » restent sur le fond étoilé de la scène 1, très sombre, qu'axe ne mesure pas.
- **Étapes** : la liste `#pList` suit un sentier pointillé, comme les chapitres de la fiche projet, avec le chiffre clé à droite (dessous sur téléphone).
- **Le randonneur** : les cartes sont toujours affichées (la règle « au survol seulement » ne s'applique pas). Les zones `#sideL` / `#sideR` sont retirées : sans 3D interactive elles n'ont ni libellé ni focus visible, et les boutons des cartes font le même travail. La consigne « posez le pied » est retirée aussi.
- **Focus** : `staticGo()` (`loop.js`) fait suivre le focus jusqu'au titre de la scène (menu « Étapes », Contact, liens profonds, « Recommencer »). `scroll-padding-top` garde les éléments focalisés hors de l'en-tête fixe. `main` et les titres ciblés n'ont pas de contour : ce sont des cibles, pas des commandes.
- **Ordre du DOM** : le lien `#eqMore` suit la liste `#tools` et le titre de la carte précède `#pList`, pour que lecture et tabulation suivent l'affichage.
- **Aucune animation** : toutes les animations CSS sont coupées dans `main` et l'en-tête, y compris si le visiteur a choisi la vue statique sans mouvement réduit.

Sélecteurs : les règles de titre passent par `:is(#head1,#head2,#s2 .head,#s3 .head)`, car les styles de la boucle ciblent ces identifiants et gagneraient sinon. Tests : `tests/e2e/home.spec.ts`, « Accueil : vue statique ».
