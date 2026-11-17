# Écran d'accueil « accroche en éclats »

> **Retiré le 06/11/2026** : l'écran d'accroche, sa transition en éclats et GSAP n'existent plus. L'accueil arrive directement sur la montre : le titre s'affiche dès le premier rendu, l'aiguille de préchargement tourne pendant que la 3D charge. Document gardé pour l'historique ; les parties « aiguille » et « relais » restent valables.

> **Courbes filaires retirées le 17/11/2026** (`feat/hero-sans-courbes`) : sur le fond de gorge, le massif en fil de fer (`mtnMesh`) et la nappe de vagues du premier plan (`nearMesh`, `buildScenery` dans `assets/loop/loop.js`) ne sont plus ajoutés à la scène ; le fond photographique `#hphoto` porte seul le décor derrière la montre, dans les deux thèmes, au hero et à « S'équiper ». Les objets restent créés, sans effet. La carte des étapes (`PARC`) garde ses courbes de niveau : ce sont des données, pas un décor. Pour les rétablir, remettre `scenery.add(...)` sur les deux maillages. Vérifié : rendu Chrome headless, nuit et jour. Non mesuré : Lighthouse, e2e, vrai téléphone.

Écran d'attente affiché avant la montre : la phrase d'accroche (« Beaucoup ont le cap. Peu connaissent le sentier. ») en grandes capitales serif sur fond uni nuit ou jour, le lien « Passer l'intro » (aucun bouton central : l'écran s'ouvre seul, ou au clic n'importe où). Il se fissure et tombe en éclats pour révéler la montre 3D (voir `docs/intro-craquelure.md`).

Modèle visuel : capture fournie par Adri (accroche en capitales, éclats, montre au centre). La corde en C d'origine a été retirée en octobre 2026.

## Fichiers
- `assets/loop/loop.html` : section `#gate` (accroche `.gate-tag`, lien `#gateSkip`) + `<noscript>` qui la masque sans JavaScript.
- `assets/loop/loop.source.css` / `loop.css` : bloc « Écran d'accueil » en fin de fichier (recompiler `loop.css` avec `scripts/scope-loop-css.cjs`).
- `components/loop/LoopHome.vue` : fonction `setupGate()`.

## Fonctionnement
Principe : **pas d'écran de chargement**. Le chargement se joue à l'écran, sur la montre GPS (la montre 3D se met en place, l'aiguille tourne puis se cale sur le nord), comme prévu à l'origine dans la boucle.

1. Dès le premier affichage, l'écran est dans le HTML (il masque la boussole 2D de secours du hero). S'il a déjà été vu dans la session (`sessionStorage` : `cordee-gate-vu`), un petit script d'en-tête pose `html.gate-seen` avant le premier rendu : l'écran n'apparaît pas.
2. Pendant l'écran : le reste de la page est `inert` (clavier, lecteurs d'écran) et le défilement est bloqué (`html.gate-on`). Le focus est sur « Passer l'intro ».
3. **Préchargement** : 1,5 s après l'affichage (ou au premier geste), les modules (three.js, loop.js, chargeur 3D, contenu admin) sont téléchargés, sans rien démarrer (`prepare()` dans `LoopHome.vue`).
4. **Ouverture automatique (aucun clic exigé)** : dès 1,5 s la boucle démarre (`start()`), et l'écran s'ouvre **tout seul** dès que la montre 3D est prête (logo visible au moins 1,8 s), au plus tard 4,5 s après l'affichage, quelle que soit la connexion (`auto()` dans `setupGate()`). Un **clic n'importe où** sur l'écran reste un accélérateur : l'ouverture est immédiate ; la boucle démarre tout de suite (`start()`), donc sous l'écran qui se dissout la montre 3D arrive déjà. L'écran s'efface en fondu quand la montre est en place (`html.loop-live`) et que l'animation est finie, 4 s au plus.
5. Sans écran d'accueil (session déjà vue) : la boucle démarre d'elle-même 1,2 s après l'affichage, sans attendre de geste.
6. Annonce pour les lecteurs d'écran : « L'ascension commence. » (zone `#live`).
7. L'écran n'est montré qu'une fois par session ; « Recommencer l'aventure » ne le réaffiche pas.

Compromis performance : le préchargement après 1,5 s remplace le démarrage « au premier geste » ; il charge ~250 Ko de JavaScript quelques instants après le premier affichage. À surveiller avec Lighthouse mobile.

## Accessibilité (WCAG / RGAA)
- Titre `h2` « Cordée » (visuellement masqué, lu par les lecteurs d'écran) ; l'accroche est un paragraphe, le canvas des éclats est `aria-hidden`.
- Pas de bouton central : l'écran s'ouvre seul (4,5 s au plus). Le seul contrôle est le bouton natif « Passer l'intro » (≥ 44 px, focus visible, focalisé à l'ouverture) ; le clic sur l'écran n'est qu'un accélérateur souris/tactile.
- `prefers-reduced-motion` : simple fondu, aucun éclat.
- `forced-colors` : fond aux couleurs système.
- Sans JavaScript : l'écran est masqué, le contenu reste accessible.

## Préchargement : l'aiguille
L'aiguille de la boussole qui tourne (`#preload`, animation `preSpin`) n'apparaît **que sans l'écran de la corde** (déjà vu dans la session, classe `html.gate-seen`) et seulement avant la 3D. Elle n'est jamais affichée par-dessus l'écran de la corde : pendant celui-ci, la montre se charge dessous, sans aiguille.
- Avant la 3D, elle tourne **au centre de l'écran**. Quand la montre 3D apparaît, `preSync` (`loop.js`) la fait glisser du centre de l'écran au centre du cadran en 0,9 s (`PRE_TRAVEL`, lissage `k²(3−2k)`), en prenant peu à peu la taille, la rotation et la perspective de l'aiguille 3D. L'aiguille 3D reste masquée pendant le trajet (`preTraveling()`), puis réapparaît dessous et l'aiguille HTML s'efface.
- Si le visiteur quitte le premier écran pendant ce trajet (clic sur une étape, défilement rapide), `preEnd()` retire aussitôt l'aiguille HTML : avant ce correctif, elle restait figée au centre de l'écran par-dessus la carte.
- Elle a la forme de celle du cadran (orange au nord, blanche au sud).
- Mouvement réduit : aiguille fixe, pas de trajet. Sans JavaScript : le `<noscript>` masque ce préchargement.
- Décoratif (`aria-hidden`) ; l'état est annoncé par `#live`.

## Relais préchargement → scène 3D (anti-sursaut)

Trois causes possibles d'un « sursaut » au relais, toutes traitées :
- **Coupe franche de la scène 3D** : `#compassCanvas` et `#aurora` apparaissent en fondu (`sceneIn`, 1,2 s) dès `html.loop-live`, désactivé en `prefers-reduced-motion`. Le logo Cordée, le titre et le lien « Projets », déjà affichés, sont exclus de ce fondu : ils ne doivent jamais repasser par 0 (test `home`).
- **Saut de vitesse de l'aiguille** : l'aiguille HTML tournait à 3,7 rad/s, la 3D à 7–15 rad/s. `updateCompass` fait monter la vitesse de 3,7 vers celle du chargement sur ~0,9 s (lissage `k²(3−2k)`).
- **Relais aiguille/scène** : classe `fade` sur `#preload` à l'arrivée de l'aiguille au centre du cadran (0,95 s) ; elle disparaît en 0,3 s au-dessus de l'aiguille 3D réapparue.

Mesure (localhost) : canvas 0,43 → 1 pendant que l'aiguille HTML reste à 1, puis l'aiguille tombe à 0 : aucune image où les deux sont partiellement transparentes.

## Aucune inscription pendant le préchargement
**Remplacé le 06/11/2026** : `#head1` (surtitre, titre, accroche) s'affiche dès le premier rendu, à sa place finale (mesuré : sur mobile en connexion lente simulée, le titre restait invisible 18 s, et le plus grand élément affiché passe au `h1` à environ 2 s). Le reste de ce paragraphe vaut pour les autres éléments.

Pendant le préchargement (`html:not(.loop-live)`), seule l'aiguille est visible : en-tête, titre et accroche (`#head1`), pied de page, règle d'altitude, HUD, indice et bouton « Visite guidée » sont à `opacity:0`. Ils restent dans le DOM (pas de `display`/`visibility`), donc lecteurs d'écran et clavier ne sont pas affectés. Ils réapparaissent en fondu (`sceneIn` 0,8 s, décalé de 0,25 s) quand la scène 3D est visible ; pas d'animation en `prefers-reduced-motion`.


## Passer l'intro et appareils limités (octobre 2026)

Pour qu'un visiteur pressé (recruteur) ou un appareil limité ne soit jamais bloqué par l'intro 3D :

- **« Passer l'intro et aller au contenu »** (`#gateSkip`) : ferme l'écran tout de suite, sans attendre la 3D ni l'animation du nœud, et active la **vue statique** (toutes les scènes empilées, sans animation). Le choix est mémorisé dans `localStorage` (`asc-static` = `1`) ; le réglage « Vue statique » le désactive (`0`). Utilisable au clavier, nom accessible explicite.
- **Aucun blocage après l'écran** : le loader « Montée au sommet » (barre, compteur d'altitude, bouton « Passer ») a été retiré le 06/11/2026. Il ne mesurait rien (minuteur) et bloquait le défilement. L'aiguille tourne 1 s (0,45 s après la première visite ou en mouvement réduit) puis se cale ; le premier défilement la cale aussitôt (`finishLoad()`).
- **Vue statique d'office** (`isLiteDevice()` dans `LoopHome.vue`, passé à `initLoop` via `lite`) : économiseur de données (`saveData`), connexion `2g` / `slow-2g`, ou 2 Go de mémoire ou moins (`deviceMemory`). Ces API n'existent pas sous Safari / Firefox : on ne présume alors rien. Mouvement réduit : déjà en vue statique.
- **Délai de l'écran** : sans clic, il s'ouvre seul (4,5 s au plus) ; après un clic, il se ferme au plus tard 4 s plus tard (au lieu de 8 s), même si la 3D n'est pas prête. Le son n'en dépend pas : il est activé uniquement par le bouton « Son » des réglages.
- **Sans WebGL** : repli 2D déjà en place (`THREE_OK`), et la qualité baisse seule si la page ralentit (`applyQuality`).

Tests : `tests/e2e/home.spec.ts` (passer l'intro au clavier, parcours normal inchangé, économiseur de données).

## Sortie en éclats (octobre 2026)

À l'ouverture, `untie()` tente d'abord la transition « craquelure et chute » (`components/loop/IntroTransition.vue`, détail dans `docs/intro-craquelure.md`). Si elle n'est pas possible (mouvement réduit, pas de WebGL, erreur), l'ancien fondu CSS (`gate-untie` → `gate-out`) prend le relais. Dans les deux cas, `close()` termine l'ouverture.

## Accueil large : texte à gauche, montre à droite (octobre 2026)
Sur grand écran (≥ 1000 px, hors vue statique), l'accueil est dès l'arrivée : accroche, nom et sous-texte à gauche (classe `html.hero-split` posée par `update()` dans `loop.js`, règles en fin de `loop.source.css`), montre à droite (`hk` dans `loop.js`, décalage `LAY.sx` = 20 % de la largeur). Au défilement, le texte s'efface et la montre passe à gauche pour « S'équiper », puis revient au centre avant le zoom. Sur mobile et en vue statique, la disposition centrée est inchangée. La transition d'intro fait partir la fissure de la montre quand `hero-split` est actif (`setEpicenter`, voir `docs/intro-craquelure.md`).

## Bouton de la visite guidée (novembre 2026)

« Lancer la visite guidée » suit le paragraphe d'accroche dans `#head1` : même alignement que le texte, 15 à 17 px, cible de 56 px. Il apparaît avec la 3D ; caché, il garde sa place, donc le titre ne bouge pas. Sur grand écran, il s'efface avec le texte.

**Refonte du 14/11/2026** : c'est le bouton principal de l'accueil. Pilule opaque en dégradé cuivre profond (`--cta-bg-1` → `--cta-bg-2`, reflet `--cta-sheen`, bord `--cta-edge`), texte `--cta-fg`. Contrastes : texte 5,0:1 sur la partie la plus claire du dégradé (8,5:1 sur la plus foncée), bord du bouton 3,7:1 sur le fond de nuit et 3,3:1 sur le ciel pêche du jour. Opaque, il reste lisible sur le maillage et la montre à toutes les tailles (plus de halo `--bg` ni de plaque sous 1000 × 640 px). Au survol et au focus clavier : il monte de 1 px, une lueur cuivrée apparaît (`--cta-ring`, `--cta-glow`) et l'icône ▶ glisse de 3 px, le tout en 0,3 s ; rien ne bouge sous `prefers-reduced-motion`. Focus : contour 3 px `--focus` décalé de 4 px. Nom accessible : `aria-label="Lancer la visite guidée interactive du portfolio"` (il commence par le libellé visible, WCAG 2.5.3), et la description `#ctaDesc` reste en place. Le test `loopTokens` vérifie ces contrastes dans les deux thèmes. `#head1` passe au-dessus des zones cliquables de la montre (`.hot`), sinon elles captent le clic.

## Profondeur de champ de l'accueil (14/11/2026)

Le décor (sol rocheux, rochers, relief en fil de fer) est dessiné dans le même canvas WebGL que la montre : impossible de flouter l'image de fond seule avec `filter: blur()`. Un voile `.lens` (`aria-hidden`) est donc posé au-dessus du canvas et sous le texte :
- `::before` floute de 3 px le premier plan avec `backdrop-filter`, masqué par un dégradé (net jusqu'à 76 % de la hauteur, flou plein à 96 %) : les rochers du bas se fondent, la montre et le texte restent nets. Réservé aux grands écrans avec souris (`min-width: 900px` et `pointer: fine`) : sur mobile, un `backdrop-filter` sur un canvas animé coûte trop cher.
- `::after` est un vignettage radial vers `--vignette` : plus sombre la nuit, plus pâle le jour. Il va vers la couleur du fond, donc le texte gagne du contraste dans les deux thèmes.
- `loop.js` règle l'opacité du voile sur celle du sol (`fG`) : il disparaît pendant la plongée vers la carte. Il est masqué en vue statique.

Les lignes du relief en fil de fer sont plus discrètes sur le premier écran, dans les deux thèmes : facteur `calm` à 0,18 la nuit (inchangé) et 0,28 le jour (avant : 1), soit une opacité d'environ 15 à 25 %. Elles retrouvent leur pleine intensité à « S'équiper ». La nuit, elles sont en mélange additif, qui joue le rôle d'un `screen` / `soft-light` et suit la lumière du paysage. Le jour, elles sont en mélange normal, car l'additif les rend invisibles sur fond clair. Un `mix-blend-mode` CSS ne s'applique pas à une partie d'un canvas WebGL.

## « S'équiper » : montre à gauche, texte à droite, lisibilité

**Lien « Voir tout l'équipement »** (`#eqMore`) : visible avec le titre, puis tant que les cartes sont là. Il est posé au-dessus du pied de page fixe. Le voile en dégradé du bas de l'écran est dans la scène (`.stage::after`, z-index 4), sous les liens du bas : dans le pied de page, il les délavait.

**Invite aux boutons** (`#eqTip`) : quand la souris bouge pendant que les boutons du boîtier sont actifs, « Cliquer sur les boutons de la montre » s'affiche sous la montre. Le message disparaît 2,5 s après le dernier mouvement (`EQ_TIP_MS`), quand la souris est sur un bouton ou une carte, et ne revient plus après l'ouverture d'une fiche. Il ne concerne que la souris : pas d'affichage au tactile, sur mobile ou en vue statique, et il reste `aria-hidden` car chaque bouton porte déjà son nom. Plaque `--bg` pour rester lisible sur le maillage et les rochers.
Le menu Parcours envoie « S'équiper » sur le palier stable de la scène (`data-p="0.155"`, plus 0,19 qui tombait en plein fondu) : montre à gauche, titre et sous-texte à droite, texte pleinement opaque. Pour la lisibilité sur la 3D (aurore, relief), un voile radial est posé derrière `#head1` et `#head2` à partir de 1000 px : nuit `rgba(5,8,17,.88)`, jour crème `rgba(252,247,238,.88)` ; le sous-texte et le titre passent en `--fg` (nuit `#E6F4F1`, jour `#12222B`, plus de 10:1). Eyebrow : `--acc-text` (≥ 4,5:1). Règles en fin de `loop.source.css`.

## Fond minéral du hero et de « S'équiper » (15/11/2026)

Le premier écran et « S'équiper » n'ont plus de sol 3D (dalles, rochers, ombres) : une paroi minérale rendue en grand format prend sa place. Remplace le relief de grès lisse du 14/11, jugé trop « soyeux ». Objectif : profondeur et impact comparables à la version photographique du 8 novembre, texte lisible.

- **Calque** : `<div class="hphoto" id="hphoto" aria-hidden="true">` dans `#s1` (`assets/loop/loop.html`), au-dessus du ciel et de l'aurore, sous le canvas 3D et sous `.lens`. CSS dans `loop.source.css` (bloc « Fond photographique du hero »), recompiler `loop.css` (`node scripts/scope-loop-css.cjs assets/loop/loop.source.css assets/loop/loop.css`).
- **Images** : `public/loop/hero-canyon-{dark,light}.webp` (2000 × 1125, nuit 652 Ko / jour 388 Ko) et `-m.webp` (1000 × 563, 175 / 109 Ko, mobile < 900 px). Jetons `--hero-photo`, `--hero-photo-m` (une version par thème).
- **Origine** : `scripts/hero-canyon.py` (`python3 -I scripts/hero-canyon.py <dossier>`, graine fixe, ~10 s). Dalles fracturées (Voronoï anisotrope à deux échelles) à facettes inclinées, fissures, marches de strates, grain et piqûres de la roche, veines claires, taches d'oxyde, éclairage rasant avec ombres portées, brume, grain. Aucune photo tierce : pas de licence à citer. Une vraie photo libre de droits peut remplacer les quatre fichiers sans toucher au code (mêmes noms et dimensions ; recalculer les contrastes).
- **Voile de lisibilité** : `.hphoto::after` (accroche, à gauche) et `.hphoto::before` (« S'équiper », texte à droite), dégradés de `--hero-scrim` ; opacités `--ph-l` / `--ph-r` posées par `loop.js` selon `hk2` (le voile bascule d'un côté à l'autre avec la montre). Densité `--hero-a1` / `--hero-a2` : .90 / .78 la nuit, .88 / .76 le jour. Mobile : dégradé vertical, `::before` désactivé.
- **Surtitre** `#head1 .eyebrow` : `--hero-eyebrow` (`#FFB880` la nuit, `#70200F` le jour). En vue statique, retour à `--acc-text`.
- **Pilotage** (`update()` dans `loop.js`) : `phK` = 1 → 0 entre p = .18 et .27, donc la photo reste derrière « S'équiper » (arrêt du menu p = .155) et s'efface juste avant la plongée vers la carte (en sens inverse en fin de boucle). Les crêtes filaires restent à 40 % tant que la photo est visible (`1 − .6·phK`). Vue statique et `lite` : calque masqué (`body.static .hphoto`).
- **Code retiré** : sol 3D, rochers (`farRocks` / `nearRocks` ne sont plus remplis), ombres de contact et `makeGroundTex` ; `gndMat`, `rockMat`, `shadowMat` ne sont plus qu'un matériau factice invisible (`update()` règle encore son opacité). `rockGeom`, `makeRockTex`, `makeShadowTex` restent (non vérifiés comme inutilisés ailleurs, par exemple au bivouac). Les crêtes filaires (`mtnMesh`, `nearMesh`) et l'aurore sont conservées : elles deviennent le quadrillage de la carte.
- **Contrastes mesurés** (reconstitution : image en `cover` + voile, 2ᵉ / 98ᵉ centile de luminance sur la zone de texte, 1440×810, 1280×720, 1920×1080, 1024×768 ; hors montre 3D) : corps de l'accroche ≥ 7,7:1 (nuit) et ≥ 6,2:1 (jour) ; surtitre ≥ 5,0:1 (nuit) et ≥ 6,0:1 (jour) ; texte de « S'équiper » à droite ≥ 8,6:1 (nuit, jour, mesuré avec le voile à .80, donc plus faible que la valeur actuelle) ; surtitre de « S'équiper » ≥ 5,7:1 (nuit). Mobile 390×844 : corps 6,2:1 (nuit) / 6,3:1 (jour), surtitre 5,4:1 / 6,1:1.
- **Non mesuré** : Lighthouse (LCP mobile : l'image nuit fait 652 Ko, à surveiller), axe-core sur la page rendue (`color-contrast` non évaluable sur canvas), e2e Playwright, vrai téléphone, surtitre de « S'équiper » en mode jour. Rendu vérifié en Chrome headless (SwiftShader) : nuit, jour, mobile, « S'équiper ».

## Variante photo « cordée » (15/11/2026, branche `feat/hero-cordee`)

Les jetons `--hero-photo` / `--hero-photo-m` pointent sur `public/loop/hero-cordee-{dark,light}{,-m}.webp` à la place du fond minéral généré (`hero-canyon-*`, conservé dans le dépôt : revenir en arrière = changer les quatre URL dans `loop.source.css`).

- **Source** : photo de Sylvain Mauroux, Unsplash (« sylvain-mauroux-WI8phMvAEMI »), cordée de deux alpinistes sur une arête. Licence Unsplash (usage libre, crédit apprécié, non obligatoire) ; à créditer dans les mentions légales / le pied de page si tu le souhaites. Le fichier d'origine (5472 × 3648) n'est pas dans le dépôt.
- **Traitement** : `scripts/hero-photo.py <photo.jpg> <dossier>` (reproductible, ~5 s). Recadrage 16:9 qui place la première alpiniste (x ≈ .43–.55) dans l'espace libre entre le texte et la montre du hero, et entre la montre et le texte de « S'équiper » ; bande de gauche prolongée par réflexion floutée (sous le voile). Dominante rose du pic de droite ramenée vers le cuivre. **Nuit** : heure bleue, ombres marine `#06101F`, hautes lumières cuivrées, lueur, vignette. **Jour** : lumineux, ombres relevées, ciel et lointain fondus dans la crème `#F7EFE3`.
- **Poids** : 2000 × 1125 nuit 197 Ko / jour 149 Ko ; mobile 1000 × 563 nuit 49 Ko / jour 37 Ko (le fond minéral pesait 652 / 388 Ko).
- **Contrastes mesurés** (même méthode que ci-dessus, voile à .80 / .66, donc plus sévère que .90 / .78 la nuit et .88 / .76 le jour) : corps de l'accroche ≥ 11,1:1 (nuit) et ≥ 6,2:1 (jour) ; surtitre ≥ 6,3:1 / ≥ 6,7:1 ; texte de « S'équiper » ≥ 12,1:1 / ≥ 9,9:1 ; mobile 390 × 844 : 8,9:1 / 6,5:1.
- **Limites** : sur mobile, la montre masque l'alpiniste ; les crêtes filaires passent devant la photo ; Lighthouse, axe sur la page rendue, e2e et vrai téléphone non mesurés. Les images montrent des personnes identifiables (modèles Unsplash) : à valider pour un site professionnel.

## Variante « gorge » (15/11/2026, branche `feat/hero-gorge`)

Les jetons `--hero-photo` / `--hero-photo-m` pointent sur `public/loop/hero-gorge-{dark,light}{,-m}.webp` (jour : gorge dorée ; nuit : même gorge sous la Voie lactée). Les variantes `hero-canyon-*` (minéral généré) et `hero-cordee-*` (photo de cordée) restent dans le dépôt ; revenir en arrière = changer les quatre URL de `loop.source.css`.

- **Source** : deux images générées avec Gemini (1306 × 816), fournies par Adri. Pas de photo tierce, donc pas de licence Unsplash ; vérifier les conditions d'usage de l'outil pour un usage commercial.
- **Traitement** : `scripts/hero-gorge.py <jour.jpg> <nuit.jpg> <dossier>` (reproductible, ~5 s). Nuit : points blancs isolés sur la roche et petites lumières lointaines retirés (inpainting), éclat bleu de l'arête atténué ; ciel conservé en entier ; exposition relevée, noirs marine `#06101F`, roche éclairée cuivrée. Jour : ombres brun chaud, ciel et lointain fondus dans la crème. Les deux : débruitage du JPEG, agrandissement en 2400 × 1350, renforcement du micro-contraste, texture fine et grain argentique (l'aspect « lisse » typique d'une génération d'image est ainsi atténué).
- **Limite** : la source ne fait que 1306 px de large, soit environ 1,5 fois moins que l'affichage plein écran sur grand moniteur. Une version 2K ou 4K générée à nouveau donnerait plus de finesse.
- **Provenance** : ce traitement ne retire pas, et n'a pas pour but de retirer, les marqueurs de provenance invisibles que l'outil d'origine peut avoir intégrés (filigrane de type SynthID). Une image générée reste identifiable comme telle par les détecteurs ; ne pas la présenter comme une photographie.
- **Voile** : jour renforcé (`--hero-a1` .92 / `--hero-a2` .82 ; mobile vertical .86 / .78 / .56) parce que la gorge dorée est lumineuse ; nuit inchangé (.90 / .78).
- **Contrastes mesurés** (même méthode) : nuit, corps de l'accroche ≥ 13,4:1, surtitre ≥ 10,0:1, « S'équiper » ≥ 14,3:1 ; jour, corps ≥ 5,0:1, surtitre ≥ 6,2:1, « S'équiper » ≥ 10:1 ; mobile 390 × 844 : jour 6,9:1, nuit ≥ 11:1 (avant renforcement du voile mobile). Le poids : nuit 124 Ko, jour 165 Ko ; mobile 35 / 53 Ko.
- **Non mesuré** : Lighthouse, axe-core sur la page rendue, e2e, vrai téléphone. Rendu vérifié en Chrome headless (SwiftShader) : nuit et jour (desktop), jour mobile.

## Menu du haut au bivouac (14/11/2026)

Le menu « Étapes | Projets | Outils » a un halo qui doit se fondre dans ce qui est derrière l'en-tête. Au bivouac en mode jour, `--bg` passe au sable (`#F1E9DC`) alors que le haut de l'écran est le ciel bleu de `#sky4` : le halo dessinait un contour beige autour des lettres. Le halo passe maintenant par `--hdr-halo` (sur `header.top`), qui est un mélange de `--bg` et du ciel du bivouac `--sky4-top`, dosé par `--hdr-k` (l'opacité de la scène du bivouac, posée par `loop.js`). Résultat : le menu a le même aspect dans toutes les étapes, en jour comme en nuit. `--sky4-top` est aussi la couleur du haut du dégradé de `#sky4`.

**Charte « papier » (Réglages › Style expédition désactivé), mode jour** : la palette du bivouac était `NIGHT` (texte clair, cartes foncées) alors que le décor reste de jour : « Projets » devenait blanc (« Étapes » et « Outils » restaient foncés, leur couleur étant fixée), les boutons CV / Contact du pied de page, le badge ALT et la carte de contact passaient en sombre. Depuis le 14/11/2026, `LIGHT` (loop.js) utilise `E_DAYC` au bivouac, comme la charte expédition : en mode jour, le pied de page et le menu ont le même aspect à toutes les étapes. Contrastes `E_DAYC` : texte 14,3:1 (13,1:1 sur carte), secondaire 7,9:1, accent 5,1:1, icônes du pied de page sur carte 5,4:1. Le mode nuit est inchangé.
## Hero, phase 3 (14/11/2026) : instrument d'orientation

**Hiérarchie** (ordre de lecture) : surtitre (qui, métier, expertise) → titre (signature) → texte → actions → montre.
- **Textes par défaut** (`loop.html`, `data/loopTexts.ts`, testés) : surtitre « Adrien Neyron · Développeur front-end Vue 3 · Accessibilité RGAA », titre « Trouver le cap. Concevoir le chemin. », texte « Je conçois des expériences numériques où design, ingénierie et accessibilité avancent dans la même direction. ». Les textes saisis dans /admin › Profil restent prioritaires : à mettre à jour là-bas pour les voir en ligne.
- **Titre : une phrase par ligne** (`titleHtml`, `utils/loopMarkup.ts`) : le titre (par défaut ou de l'admin) est découpé après `.` `!` `?` `…`, chaque phrase échappée dans un `<span class="ln">` affiché en bloc. Aucun HTML à saisir dans /admin.
- **Action** : « Lancer la visite guidée » seulement. Le lien secondaire « Voir les projets » (`.cta2`) a été **retiré le 17/11/2026** à la demande d'Adri (les projets restent dans le menu « Projets » de l'en-tête).
- **Montre** : 8 % plus petite sur le premier écran large (`hs` dans `loop.js`), taille normale dès « S'équiper ». Elle reste à droite, centrale dans sa moitié. Sur mobile, elle descend un peu (`cy` = 57 % de la hauteur) pour dégager les actions.

**Waypoint AN** (`--wpt`, orange de signal : `#F08A4B` la nuit, `#B5481F` le jour) : losange avec un halo, repère graphique récurrent de l'identité. Il était devant le surtitre (`.who::before`) : **retiré le 17/11/2026** à la demande d'Adri. Plus aucun losange sur l'accueil ; le jeton `--wpt` reste défini pour un usage futur.

**Coordonnées** (`.hcoord`) : **retirées le 17/11/2026** à la demande d'Adri (elles étaient sous « Lancer la visite guidée » et affichaient le point le plus haut de la trace GPS, 45°56′02″ N · 6°50′16″ E · 2 521 m). Si elles reviennent : ne jamais inventer de coordonnées ; les Grandes Platières ne sont pas dans la trace.

**Courbes de niveau en trois profondeurs** (`#topo3`) : **retirées le 17/11/2026** à la demande d'Adri. Le fond de gorge se suffit (le massif filaire 3D avait déjà été retiré le même jour). Le waypoint posé au sommet du relief proche est parti avec elles ; il reste devant le surtitre. 

**Vérifié** : axe (avec contraste) 0 violation, jour et nuit, 1440 × 900 et 375 × 812 ; parcours clavier menu → bouton → « Voir les projets » → zones de la montre → pied de page, focus visible ; Lighthouse avant/après (`docs/performance.md`). **Non vérifié** : vrai téléphone, lecteur d'écran, 667 px de haut (le haut du bracelet passe sous le bouton, qui reste lisible car opaque et au-dessus).

## Bouton « Lancer la visite guidée » : bouton fantôme (17/11/2026)

Sur le fond de gorge, le bouton n'a plus de fond plein : il laisse voir la photo. C'est un **bouton fantôme**, défini par son contour.
- **Repos** : fond transparent, contour 1,5 px `--cta-line` (orange de signal, la couleur du waypoint AN : `#F08A4B` la nuit, `#A8401B` le jour), icône ▶ dans un anneau de la même couleur (32 px, 28 px sur mobile), texte `--fg` en capitales mono avec le halo de lisibilité du titre (`#head1`).
- **Survol / focus** : voile `--cta-tint`, contour visuellement à 2 px (ombre intérieure, sans décaler la mise en page), halo `--cta-ring`, l'icône avance de 3 px (0,3 s). Focus clavier : contour plein `--focus` de 3 px à 5 px du bouton. Rien ne bouge sous `prefers-reduced-motion`.
- **Contrastes mesurés sur les pixels de la photo** (lettres masquées en gardant leur halo, 2ᵉ et 98ᵉ centiles de luminance, 1440 × 900, 1024 × 768, 375 × 812) : texte ≥ 12,2:1 (jour) et ≥ 16:1 (nuit) ; contour ≥ 4,0:1 (jour) et ≥ 7,1:1 (nuit). Le test `loopTokens` vérifie `--cta-line` ≥ 3:1 et `--fg` ≥ 4,5:1 sur `--bg` dans les deux thèmes.
- Jetons retirés : `--cta-bg-1`, `--cta-bg-2`, `--cta-fg`, `--cta-edge`, `--cta-sheen`, `--cta-glow`.

## Relief au curseur et premier écran épuré (17/11/2026, `feat/hero-relief`)

- **Relief** (`utils/heroRelief.ts`, démarré par `LoopHome.vue` après `initLoop`) : un canvas WebGL (`.hrelief`) dans `#hphoto` redessine la photo du fond avec le même cadrage que le CSS. Le relief est déduit de la luminance (gradient à trois échelles), éclairé par une lumière rasante sous le curseur (arêtes face à la lumière allumées, autres ombrées, halo chaud, parallaxe légère). Nuit : l'extérieur de la lumière s'assombrit. Jour : ombrage plus discret. La lumière naît sous le curseur, s'éteint après 2,5 s d'immobilité, rendu à la demande, DPR ≤ 1,25.
- **Amélioration progressive** : rien n'est créé sans curseur fin (`pointer:fine` + `hover:hover`), sous 900 px, avec `prefers-reduced-motion`, en vue statique ou sans WebGL ; la photo CSS reste alors seule. Canvas décoratif (`aria-hidden`), contenu 100 % HTML. Aucune couleur brute ajoutée dans le CSS.
- **Épuration** : `initHeroClean()` pose `html.at-hero` tant que `scrollY < 60 %` de la hauteur ; horloge/altitude (`.hud`), rail d'altitude, grain et ligne de copyright s'effacent (fondu 0,5 s, sans transition en mouvement réduit). Les liens CV, Contact, mentions et accessibilité du pied de page restent.
- Vérifié : tests unitaires (218), captures nuit/jour à 1440 × 810 avec curseur sur le relief. **Non vérifié** : Lighthouse, e2e axe, parcours clavier, mobile réel, rendu sur GPU réel (captures en rendu logiciel), contraste du texte sous la lumière du curseur (non mesuré).

## Liseret beige en haut au défilement (17/11/2026)

**Symptôme** : au premier défilement depuis le hero, une bande abricot d'environ 16 px apparaissait tout en haut, puis se résorbait en une fraction de seconde (mesuré dans Chrome : 16 → 7 → 4 → 1 px).
**Cause** : la scène (`.stage`, `position: sticky`) prend une ou deux images de retard sur le défilement et laisse voir ce qui est derrière elle. En mode jour, c'est le ciel `body::after` (dégradé qui commence en `#EBC39C`), sans rapport avec la photo. Le gestionnaire de molette non passif de la carte (`passive: false`) fait passer le défilement par le fil principal, ce qui favorise ce retard.
**Première correction (abandonnée)** : une copie fixe de la photo derrière la scène. Elle ne se raccordait pas : le relief au curseur agrandit et décale la photo, la bande du haut montrait donc un autre cadrage (capture d'Adri du 17/11, 15 h 12).
**Correction retenue** (proposée par Adri) : la couleur du haut de l'image, `--hero-top` (mesurée sur les images : `#ECE0D0` le jour, `#182C42` la nuit, mêmes valeurs en version mobile).
- `#hback` (avant `<main>`, fixe) : aplat `--hero-top` derrière la scène ;
- `.htop` (dans `#s1`, juste après `#hphoto`, au-dessus de la photo et du relief, sous la montre) : fondu `--hero-top`, plein jusqu'à 7 % de la hauteur, nul à 24 % ;
- le vignettage `.lens::after` est masqué sur la même bande (sinon il assombrissait le haut de la scène la nuit et créait une marche) ;
- opacité `--phk` = celle de la photo du hero ; le ciel du mode jour s'efface d'autant.
Le haut de l'écran a toujours cette couleur : interstice ou non, il n'y a plus de raccord visible.
**Vérifié** : scène décalée de 90 px à la main (pire cas de la capture) dans Chrome : saut de couleur au raccord = 0, en jour et en nuit ; tests unitaires 221/221. **Limite** : le retard de la scène collée lui-même n'est pas corrigé (il vient du défilement), il est seulement rendu invisible sur le premier écran.

**Sans contour (17/11/2026, demande d'Adri)** : le bouton n'a plus de contour et l'icône plus d'anneau. Il reste le texte `--fg` (avec le halo du titre) précédé d'un triangle ▶ orange `--cta-line` (20 px, 18 px sur mobile), aligné sur la colonne de texte (marge négative égale au padding gauche). Survol / focus : voile `--cta-tint` en pilule, l'icône avance de 3 px. Focus clavier : contour `--focus` de 3 px (obligatoire, WCAG 2.4.7). La zone cliquable garde 56 px de haut. `--cta-ring` ne sert plus qu'à l'état actif (clic).
