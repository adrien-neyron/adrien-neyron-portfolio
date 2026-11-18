# WAYFINDER — signature de navigation clavier

Mis en place le 18/11/2026 sur `dev`. La navigation clavier devient une expérience d'instrument de navigation outdoor, sans jamais remplacer le focus natif ni changer l'ordre du DOM.

## Où est le code

| Partie | Fichiers |
|---|---|
| A. Viseur et B. Trace (tout le site) | `utils/wayfinder.ts` (logique + fonctions pures testées), `plugins/wayfinder.client.ts` (lancement), `assets/css/wayfinder.css` (déclaré dans `nuxt.config.ts › css`) |
| Couleurs de l'accueil | `assets/loop/loop.source.css` : `html{--wf-c:var(--wpt);--wf-halo:var(--bg);--wf-bg:var(--card);--wf-fg:var(--fg)}` |
| C. Altitude (accueil) | `assets/loop/loop.html` (`#railCur` dans `.altrail`), `assets/loop/loop.js` (`railMark`, appelé par `announce`), `assets/loop/loop.source.css` |
| Tests | `tests/unit/wayfinder.test.ts`, `tests/unit/loopTokens.test.ts` (contraste `--wpt`), `tests/unit/loopMarkup.test.ts` (rail), `tests/e2e/wayfinder.spec.ts` |

## A. Le viseur

- Quatre équerres de 10 px (2 px d'épaisseur) à 6 px autour de l'élément actif, un cran de visée au milieu du bord haut (jamais sur le texte de l'élément), couleur de repérage orange `--wf-c` ; liseré `--wf-halo` en ombre portée pour rester lisible sur la photo et la 3D.
- Suit **le vrai élément actif** (`document.activeElement`) : événement `focusin`, puis suivi image par image tant qu'il a le focus (défilement, montre 3D qui bouge, carte qui glisse). Masqué si l'élément sort de l'écran ou devient invisible (`checkVisibility`).
- Glisse d'un élément au suivant en 0,2 s (`cubic-bezier(.2,.8,.2,1)`), puis colle à l'élément sans retard.
- Nom de la destination (« → NOM », 11 px, `--wf-fg` sur `--wf-bg`) pendant 1,8 s après l'arrivée, au-dessus du viseur (dessous en haut de page, aligné à droite près du bord). Nom calculé comme un nom accessible simplifié : `aria-labelledby`, `aria-label`, `<label>`, texte, `title`, `alt`, `placeholder` ; 40 caractères au plus.
- **Le focus natif reste** : le contour `:focus-visible` des pages (`main.css`) et de l'accueil (`loop.css`) n'est pas touché. Sans JavaScript, sans animation ou en contraste élevé (`forced-colors`, calque masqué), il reste seul et suffit.

## B. La trace

- À chaque déplacement, un tronçon pointillé (courbe douce, écart 18 % de la distance, plafonné à 60 px, comme une courbe de niveau) relie l'ancien waypoint (petit rond) au nouveau, puis s'efface en 1,6 s ; 4 tronçons au plus.
- Décorative et secondaire : sous le viseur, fine (1,5 px), transparente (≤ 75 %), jamais cliquable. Elle relie seulement deux positions réelles successives du focus : aucun ordre simulé.
- Coupée sous `prefers-reduced-motion` (et le viseur saute sans glisser).

## C. Altitude (barre de droite de l'accueil)

- La barre `.altrail` reste la progression de défilement ; son curseur suit la scène **réellement affichée** (`announce` ← `sceneIndex(p)`).
- Au clavier (`html.wf-kb`), un repère vertical posé sur le trait, sous le curseur (au-dessus quand le curseur est bas) : « 02 / 05 S'ÉQUIPER ». Numéro et total viennent des 5 étapes du menu « Étapes » (total connu, pas de pourcentage inventé). Au clavier, la barre reste visible dès le premier écran.
- Au survol de la barre : le nom de chaque repère (« 01 La trace » … « 05 Le bivouac »), l'actif encadré, les passés atténués, le **suivant** signalé « · suivant ». Échap masque ces noms jusqu'à ce que la souris quitte la barre (WCAG 1.4.13) ; ils restent affichés tant que la souris est dessus.
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
- 238 tests unitaires ; e2e `wayfinder.spec.ts` (4/4) sur le build de production ; reste de la suite e2e : pas de nouvel échec (les 7-8 échecs de la vue statique de l'accueil existaient déjà en prod, voir CLAUDE.md).

## Non vérifié

VoiceOver / NVDA (le calque est `aria-hidden`, rien ne devrait changer), Safari et Firefox (API `popover` : Safari 17+, Firefox 125+), un vrai téléphone avec clavier, mode nuit en capture, Lighthouse.
