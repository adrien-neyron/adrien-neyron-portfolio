# L'ascension — accueil en boucle infinie

Route : `/` (accueil), ancien accueil conservé sur `/camp-de-base`. Branche : `feat/ascension-boucle`.
Prototype d'origine et décisions de design : `design_boussole-boucle.md` (hors dépôt, dans le projet Claude « Portfolio »).

## Ce que c'est
Une page de scroll infini en cinq scènes : montre GPS (aurore, massif en fil de fer) → instruments (« S'équiper ») → plongée dans le verre puis relief des projets (« Monter ») → flaque et basket de trail, avec deux choix, Le Randonneur et Le Carnet (« Persévérer ») → bivouac et contact (« Se poser ») → retour à la montre (« Jour 2 »). Le bouton « Commencer l'expédition » lance un parcours guidé de 12 étapes (pause, étape suivante, arrêt, reprise en main à la molette, au toucher ou au clavier).

## Fichiers
| Fichier | Rôle |
|---|---|
| `pages/index.vue` | Accueil, mise en page `loop` |
| `layouts/loop.vue` | Mise en page sans en-tête ni pied de page du site (la boucle a les siens) |
| `components/loop/LoopHome.vue` | Rend le balisage côté serveur (SEO, lecteurs d'écran, sans JavaScript), démarre la 3D au montage, nettoie au démontage |
| `assets/loop/loop.html` | Balisage complet (navigation, scènes, fenêtres, pied de page) ; **tout le texte est en HTML** |
| `assets/loop/loop.source.css` | Styles d'origine (source à modifier) |
| `assets/loop/loop.css` | Styles **générés** : toutes les règles sont cantonnées derrière `html.loop-on` |
| `scripts/scope-loop-css.cjs` | Génère `loop.css` : `node scripts/scope-loop-css.cjs` (après chaque modification de `loop.source.css`) |
| `assets/loop/loop.js` | Module `initLoop(THREE)` : 5 contextes WebGL, parcours guidé, sons, qualité adaptative ; renvoie `{ destroy() }` |

## Choix techniques
- **Three.js r128 en alias** (`three-r128` = `three@0.128.0`) : le prototype dépend de l'éclairage et de l'API de cette version. Le reste du site garde `three ^0.178`.
- **Styles cantonnés** : `loop.css` vise `html` et `body`. La classe `loop-on` est posée sur `<html>` au rendu serveur (`useHead`) puis retirée au démontage ; sans elle, aucune règle de la boucle ne s'applique. Les styles restent chargés après navigation (environ 36 Ko) mais sont inertes.
- **Neutralisation de `main.css`** : la photo de bivouac (`body::before`) et le fond beige de `html` sont masqués sur la boucle (fin de `loop.source.css`).
- **Nettoyage** : `destroy()` annule les écouteurs de la fenêtre (AbortController), arrête la boucle d'animation et la minuterie, libère les contextes WebGL (compas, aurore, parcours, chaussures, bivouac) et ferme l'AudioContext.
- **Qualité adaptative** (3 niveaux) : choisie selon l'appareil puis abaissée automatiquement si la moyenne dépasse 30 ms par image pendant 2,5 s ; bouton « Mode économe » dans Réglages (mémorisé).
- **Chargement** : la 3D est importée dynamiquement au montage, donc après le contenu.

## Accessibilité (WCAG 2.1 AA / RGAA)
Texte toujours présent dans le HTML ; 3D décorative (`aria-hidden`) ; lien d'évitement ; vrais boutons et champs, cibles ≥ 44 px, focus visible ; boutons Pause, Son (coupé par défaut), Mode nuit, Réglages ; vue statique (activée par `prefers-reduced-motion`) ; annonces `aria-live` pour les scènes et les étapes du parcours ; navigation clavier de toutes les scènes ; fenêtres natives `<dialog>`. **Audit RGAA complet non fait** : la déclaration d'accessibilité du prototype est un brouillon.

## Vérifié (01/10/2026, build de production, navigateur sans interface avec rendu logiciel)
- `nuxt build` : réussi. `/boucle` : HTTP 200, titre, texte et classe `loop-on` présents dans le HTML serveur.
- Navigateur : accueil identique au prototype ; parcours guidé qui avance d'étape en étape ; navigation `/boucle` → `/projects` → `/boucle` : classe retirée puis remise, aucune règle de la boucle appliquée sur `/projects`, 8 canevas au retour, aucune erreur JavaScript.
- Seule erreur de console : `GET /api/visitors` 500 (compteur de visites du layout par défaut, sans variables d'environnement de base de données) ; sans lien avec la boucle.
- **Non vérifié** : appareil réel (Pixel 8), fluidité réelle (60 images par seconde), Lighthouse, lecteur d'écran, Safari, mémoire après de nombreux allers-retours, `npm run lint`.

## À faire avant de remplacer `/`
1. Polices : la boucle charge Fraunces, Space Grotesk et JetBrains Mono (lien Google Fonts) ; le site utilise DM Serif Display et Inter. **Décision à prendre**, puis auto-héberger les polices.
2. Mode nuit : relier le bouton de la boucle (`asc-…`) à `@nuxtjs/color-mode` (la préférence du visiteur l'emporte toujours).
3. Contenu : constante `CONTACT` (e-mail, LinkedIn, rendez-vous) ; liste réelle des projets (`PROJECTS`) à brancher sur `stores/projects.ts` ; pile technique de la DGFiP ; chiffres à valider (« −50 % », « 7 langues ») ; CV PDF (`public/2025_CV_AdrienNEYRON.pdf` existe déjà : mettre à jour le lien du pied de page).
4. Pages légales : remplacer les fenêtres « Mentions légales » et « Accessibilité » par de vraies pages ; renseigner SIRET, adresse, e-mail légal, état de conformité après audit.
5. Son : le prototype synthétise ses sons ; le site a `NATURE.mp3`, `FEU_DE_CHEMINEE.mp3`, `NIGHT.mp3` : décider lesquels garder.
6. Parité avec `/projects` : filtres par catégorie, compteur, fiche topo (annulés dans le prototype à la demande d'Adri).

## Bracelet de la montre : boucle et passants

`buildStrapRing` (`assets/loop/loop.js`). La boucle et les deux passants ne sont plus des pavés : ce sont des cadres à bords arrondis et biseautés (`ExtrudeGeometry` d'un rectangle arrondi percé), perpendiculaires à la sangle. Leurs dimensions intérieures sont calculées à leur position exacte sur la sangle (`stackAt` : épaisseurs présentes et largeur), plus un jeu de `RING_GAP` = 0,02 de chaque côté : aucune face ne traverse ni ne touche le maillage des sangles (pas de clipping ni de z-fighting).

- **Boucle à ardillon (fermoir), assemblée comme une vraie montre** :
  - la **sangle sans trous** (patte haute) s'arrête dans la **barre de charnière** (`sA`), un tube d'acier plus épais que la sangle qui enveloppe son extrémité (embouts arrondis) : plus d'extrémité nue ni de marche sous la boucle ;
  - le **cadre** (tube en rectangle arrondi) est rigide et plan, accroché à cette barre dans le prolongement de la sangle, jusqu'à la barre d'extrémité (`s1`) ;
  - la **sangle percée** (patte basse) passe **sous** la barre d'extrémité, traverse le plan du cadre (à `sx`, calculé par dichotomie sur son profil `offB`), passe **au-dessus** de la charnière puis recouvre la sangle sans trous jusqu'à sa queue, tenue par les deux passants ;
  - l'**ardillon**, articulé sur la charnière, est droit dans le plan du cadre, traverse le trou situé exactement à `sx` (les trous sont calculés à partir de ce point, tous les 0,42) et repose sur la barre d'extrémité.
- **Côté visible** : depuis la caméra, on voit l'arrière de l'anneau par l'intérieur. La sangle percée, la boucle et l'ardillon sont donc sur la face intérieure de l'anneau (`D = −1`), celle qui fait face au visiteur.
- **Matière de la boucle** : acier brossé `steelBuckle` (`MeshStandardMaterial`, metalness 0,8, roughness 0,3, carte de brossage, reflets d'environnement atténués à 0,35). Les teintes orange et cyan venaient des reflets cuivre et cyan de l'environnement sur l'acier poli `orPoli` (roughness 0,14, reflets ×1,7) ; il reste réservé aux poussoirs et aux vis. - **Passants** : `keeperM`, le même caoutchouc mat que la sangle, dont la couleur suit le thème (`strapApply` : noir de jour, blanc de nuit, comme la sangle).
