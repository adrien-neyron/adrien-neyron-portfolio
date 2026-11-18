# WAYFINDER — signature de navigation clavier

Mis en place le 18/11/2026 sur `dev`. La navigation clavier devient une expérience d'instrument de navigation outdoor, sans jamais remplacer le focus natif ni changer l'ordre du DOM.

## Où est le code

| Partie | Fichiers |
|---|---|
| A. Viseur et B. Trace (tout le site) | `utils/wayfinder.ts` (logique + fonctions pures testées), `plugins/wayfinder.client.ts` (lancement), `assets/css/wayfinder.css` (déclaré dans `nuxt.config.ts › css`) |
| Couleurs de l'accueil | `assets/loop/loop.source.css` : `html{--wf-c:var(--wpt);--wf-halo:var(--bg);--wf-bg:var(--card);--wf-fg:var(--fg)}` |
| C. Altitude (accueil) | `assets/loop/loop.html` (`#railCur` dans `.altrail`), `assets/loop/loop.js` (`railMark`, appelé par `announce`), `assets/loop/loop.source.css` |
| Tests | `tests/unit/wayfinder.test.ts`, `tests/unit/loopTokens.test.ts` (contraste `--wpt`), `tests/unit/loopMarkup.test.ts` (rail), `tests/e2e/wayfinder.spec.ts` |

## Règles de cohérence (revue du 18/11/2026)

Revue « webdesigner » demandée par Adri : discret, fluide, homogène, sans action en double.

| Doublon ou incohérence constaté | Règle appliquée |
|---|---|
| Deux indicateurs sur le même élément : contour natif (ou anneau rond des zones du cadran, crochets `[ ]` de l'onglet actif) **et** viseur | Un seul à la fois : tant que le viseur est affiché, `html.wf-on` rend le contour natif transparent (il garde sa place, rien ne bouge) et masque l'anneau `.hot` et les crochets de l'onglet qui a le focus. Le viseur absent (hors écran, contraste élevé, pas de JavaScript), le contour natif revient. |
| Nom affiché par-dessus un texte déjà visible (« → ALLER AU CONTENU » au-dessus de « Aller au contenu ») ou en plus d'une infobulle (icônes du pied de page, zones du cadran qui ouvrent leur carte) | Nom seulement pour un bouton-icône sans texte visible, sans `data-tip` ni `aria-describedby` ; jamais sur un champ (son libellé est visible). |
| Longues lignes pointillées d'un bout à l'autre de l'écran, trace entre deux onglets voisins (déjà montrés par la sélection), trace qui traverse une fenêtre | Remplacé le même jour par la trace « carte topographique » (section B) : de bord à bord, coupée sur le contenu, rien dans un groupe d'onglets ni au-delà de 75 % de la diagonale, effacée à l'entrée et à la sortie d'une fenêtre. |
| Viseur sur une cible de focus programmé (titre après un changement de page, `main`), volontairement sans contour | Pas de viseur sur un élément non interactif en `tabindex="-1"`. |
| Glissement à travers tout l'écran sur un grand saut | Deux mouvements seulement : **glisser** vers un voisin, **se verrouiller** (les équerres se resserrent de 5 px en 0,18 s) après un saut lointain. |
| Tempos et plaques différents (0,2 s / 0,25 s / 1,6 s / 1,8 s ; deux styles de plaque) | Un seul tempo `--wf-t` (0,18 s) et une seule courbe `--wf-ease` ; nom 1,4 s, trace 1,2 s ; même plaque pour le nom du viseur et les repères du rail (11 px mono, `--wf-bg` / `--wf-fg`, liseré orange `--wf-c` = « ici »). |

## A. Le viseur

- Quatre équerres de 10 px (6 px sur un petit élément, 30 % de son plus petit côté ; 2 px d'épaisseur) à 6 px autour de l'élément actif, un cran de visée au milieu du bord haut (jamais sur le texte de l'élément), couleur de repérage orange `--wf-c` ; liseré `--wf-halo` en ombre portée pour rester lisible sur la photo et la 3D.
- Suit **le vrai élément actif** (`document.activeElement`) : événement `focusin`, puis suivi image par image tant qu'il a le focus (défilement, montre 3D qui bouge, carte qui glisse). Masqué si l'élément sort de l'écran ou devient invisible (`checkVisibility`).
- Glisse vers un voisin en 0,18 s (`--wf-ease`), se verrouille après un saut lointain, puis colle à l'élément sans retard.
- Nom de la destination (11 px, `--wf-fg` sur `--wf-bg`, seulement pour un bouton-icône) pendant 1,4 s après l'arrivée, au-dessus du viseur (dessous en haut de page, aligné à droite près du bord). Nom calculé comme un nom accessible simplifié : `aria-labelledby`, `aria-label`, `<label>`, texte, `title`, `alt`, `placeholder` ; 40 caractères au plus.
- **Le focus natif reste le repli** : le contour `:focus-visible` des pages (`main.css`) et de l'accueil (`loop.css`) n'est pas supprimé, il devient seulement transparent pendant que le viseur l'entoure. Sans JavaScript, en contraste élevé (`forced-colors`, calque masqué) ou quand le viseur n'est pas affiché, c'est lui qu'on voit.

## B. La trace

Revue du 18/11/2026 (demande d'Adri) : « harmonieuse, ne coupe pas d'informations, bien visible et design ». Le modèle est la carte topographique : une courbe de niveau s'interrompt là où passe une cote.

- **De bord à bord** : la trace part du bord de l'élément quitté et arrive au bord du nouvel élément, 6 px à l'extérieur (`edgeAnchor`), jamais dedans. L'élément quitté est relu à sa position actuelle (le focus a pu faire défiler la page).
- **Ne coupe aucune information** : la courbe est échantillonnée tous les 5 px (`sampleCurve`) ; chaque point est testé sur toute la pile d'éléments sous lui (`elementsFromPoint`, les calques décoratifs du dessus comme le grain ou un canvas ne masquent rien ; les textes « sans clic » comptent, le temps du test `html.wf-probe`). Un point est « couvert » s'il est sur une lettre (rectangles de ligne des nœuds texte) ou sur un contrôle / une image (`INFO_SEL`). Des deux courbes possibles (`trailCtrl`, d'un côté ou de l'autre de la ligne droite), on garde celle qui traverse le moins d'informations ; les points couverts sont effacés par un masque (`knockRuns`, 7 px de part et d'autre), et les bouts de moins de 3 pointillés entre deux coupures aussi (`dropShort`), pour ne pas laisser de miettes entre deux lignes de texte. Si tout le trajet est couvert, pas de trace. Coût mesuré : ≈ 0,04 ms par point (≈ 11 ms pour 300 points).
- **Bien visible** : sentier de points ronds de 3 px tous les 7 px en `--wf-c`, chacun cerclé d'un halo de 6 px couleur du fond (`--wf-halo`) : lisible sur la photo, la 3D et les deux thèmes ; la trace se dessine du départ vers l'arrivée en 0,32 s (`--wf-ease`) ; un repère cerclé (rond + point) marque le waypoint quitté, s'il n'est pas sur du contenu.
- **Harmonieuse** : le tronçon précédent s'estompe à 40 % quand un nouveau arrive (3 au plus) ; chaque tronçon reste 1,26 s puis s'efface en 0,54 s (1,8 s en tout) ; au défilement (> 24 px) ou au redimensionnement, la trace s'efface en 0,2 s plutôt que de rester décalée.
- **Quand** : à chaque déplacement dont l'écart bord à bord dépasse 24 px, sauf entre deux éléments d'un groupe qui montre déjà sa sélection (onglets, menus : `GROUP_SEL`) et sauf au-delà de 75 % de la diagonale de l'écran ; effacée à l'entrée et à la sortie d'une fenêtre.
- Elle relie seulement deux positions réelles successives du focus : aucun ordre simulé. Décorative (`aria-hidden`, aucun clic). Coupée sous `prefers-reduced-motion`.

## C. Altitude (barre de droite de l'accueil)

- La barre `.altrail` reste la progression de défilement ; son curseur suit la scène **réellement affichée** (`announce` ← `sceneIndex(p)`).
- Au clavier (`html.wf-kb`), un repère vertical posé sur le trait, sous le curseur (au-dessus quand le curseur est bas) : « 02 / 05 S'ÉQUIPER ». Numéro et total viennent des 5 étapes du menu « Étapes » (total connu, pas de pourcentage inventé). Au clavier, la barre reste visible dès le premier écran.
- Au survol de la barre (le repère vertical s'efface alors : pas de doublon) : le nom de chaque repère (« 01 La trace » … « 05 Le bivouac »), l'actif encadré, les passés atténués, le **suivant** signalé « · suivant ». Échap masque ces noms jusqu'à ce que la souris quitte la barre (WCAG 1.4.13) ; ils restent affichés tant que la souris est dessus.
- Décoratif (`aria-hidden`) : la même information est dans le menu « Étapes » (`aria-current`) et annoncée dans `#live`. Masquée en vue statique et sans survol (`hover: none`).

## Comportement clavier

- Rien n'est intercepté : pas de `preventDefault`, pas de `stopPropagation`, aucun `tabindex` (testé). Tab, Maj+Tab, Entrée, Espace, Échap et les flèches gardent leur rôle natif ou celui des composants (onglets de « S'équiper », menus).
- **Activation** : à la première touche Tab, ou quand le focus bouge moins de 0,4 s après une touche de navigation (flèches dans un menu, Entrée qui ouvre une fenêtre). **Extinction** : au premier clic ou toucher (`pointerdown`). La souris seule ne déclenche jamais le viseur.
- Fenêtres modales (`<dialog>`) : le calque est dans la couche supérieure (API `popover`) et repasse au-dessus d'une fenêtre ouverte après lui ; sans `popover`, il est fixe, `z-index` maximal.

## Contrastes

- `--wpt` (orange de repérage de l'accueil) sur `--bg` : ≥ 3:1 jour et nuit (testé, `loopTokens.test.ts`). Pages : `--color-accent` (4,8:1 sur `--color-bg`).
- Nom du viseur et du rail : `--fg` sur `--card` (≥ 4,5:1, déjà testé) ; pages `--color-text` sur `--color-surface`.

## Vérifié (18/11/2026)

- Chrome 1440 : accueil (en-tête, visite guidée, onglets de « S'équiper » aux flèches, pied de page), fenêtre « Mentions légales » (viseur au-dessus de la modale, retour sur le bouton après Échap), `/projects` ; viseur aligné à ±0 px sur l'élément actif ; mouvement réduit : pas de trace ; clic : tout s'éteint.
- 249 tests unitaires (revue de cohérence et trace comprises) ; e2e `wayfinder.spec.ts` (4/4) sur le build de production ; reste de la suite e2e : pas de nouvel échec (les 7-8 échecs de la vue statique de l'accueil existaient déjà en prod, voir CLAUDE.md).

## Non vérifié

VoiceOver / NVDA (le calque est `aria-hidden`, rien ne devrait changer), Safari et Firefox (API `popover` : Safari 17+, Firefox 125+), un vrai téléphone avec clavier, mode nuit en capture, Lighthouse.
