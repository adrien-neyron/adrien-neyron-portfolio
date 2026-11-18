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

**Invite aux boutons** (`#eqTip`, **retirée le 18/11/2026**, voir la fin de ce fichier) : quand la souris bouge pendant que les boutons du boîtier sont actifs, « Cliquer sur les boutons de la montre » s'affiche sous la montre. Le message disparaît 2,5 s après le dernier mouvement (`EQ_TIP_MS`), quand la souris est sur un bouton ou une carte, et ne revient plus après l'ouverture d'une fiche. Il ne concerne que la souris : pas d'affichage au tactile, sur mobile ou en vue statique, et il reste `aria-hidden` car chaque bouton porte déjà son nom. Plaque `--bg` pour rester lisible sur le maillage et les rochers.
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

## Hiérarchie du hero (17/11/2026)

Ordre de lecture voulu : **titre > texte > action > montre**. La montre reste centrale dans sa moitié, mais ne domine plus le message.
- **Trois groupes** séparés par le rythme vertical : [surtitre + titre] (18 px), puis le texte (28 px au-dessus sur grand écran, 22 px ailleurs), puis l'action (40 px / 30 px). Avant : 14 / 12 / 22 px, tout semblait collé.
- **Titre** : `clamp(40px, 5vw, 76px)` sur grand écran (72 px à 1440 px, contre 60 px avant), interligne 1,04, interlettrage −0,01 em ; colonne élargie à `min(46vw, 680px)`.
- **Texte** : en retrait (opacité 0,84 la nuit, 0,8 le jour), 470 px de large au plus, `text-wrap: pretty` (pas de mot seul en dernière ligne). Contraste mesuré sur les pixels de la photo : jour 6,3:1 (5,1:1 sur mobile), nuit 11,5:1 (9,6:1 sur mobile).
- **Montre** : réduite de 14 % sur le premier écran large (`hs` dans `loop.js`, contre 8 % avant) et décalée de 7 % de plus vers la droite (`hk*1.07`) ; taille et position normales dès « S'équiper ». Les zones cliquables du cadran suivent.
- Mêmes règles avant et après le démarrage de la boucle (`html:not(.loop-live)` / `html.hero-split`) : rien ne bouge à l'arrivée de la 3D.
**Vérifié** : axe 0 violation (jour, nuit, mobile) ; captures 1920 × 1080, 1440 × 900, 1024 × 768, 375 × 812 ; 221 tests unitaires.

## Indication d'accueil sur le cadran (17/11/2026)

Au chargement de la montre, **le cercle de la zone « Expérience »** pulse (`.hot.hint`) : c'est le même cercle que celui du focus clavier et du survol (`--acc`), animé par une onde (`hotPulse`, ombre qui s'élargit). Une **micro-carte** (`#dhint`) apparaît juste à côté :
« EXPLORER L'INSTRUMENT » / « Certains éléments du cadran révèlent mon univers. » / « BOUGEZ POUR DÉCOUVRIR · CLIQUEZ POUR EXPLORER » (« TOUCHEZ POUR EXPLORER » sur écran tactile, `hover: none` ou `pointer: coarse`). Tout est en français (le waypoint orange séparé et les textes anglais ont été retirés le 17/11/2026 à la demande d'Adri).
- **Position** : posée par `placeHot` (loop.js), à droite et en dessous du cercle `exp`, gardée dans l'écran ; elle suit la montre et s'efface avec les zones du cadran.
- **Durée** : une fois par visite (`sessionStorage['cordee-hint']`) ; disparaît (carte et pulsation) au premier clic, touche, molette, toucher ou survol d'une zone du cadran, sinon après 8 s (`HINT_MS`). Le simple mouvement de la souris ne la ferme pas.
- **Accessibilité** : carte décorative (`aria-hidden`, classe `decor` pour FIELD MODE) ; les zones du cadran ont leur propre nom accessible. Sous `prefers-reduced-motion`, le cercle reste fixe (pas d'onde). Absente en vue statique.
**Vérifié** : cercle animé et carte affichés à l'arrivée, disparition à la première interaction et après 8 s, pas de débordement du texte, axe 0 violation, captures jour / nuit 1440 et 1024, mobile tactile 375.

## Cadran : infobulle holographique et verre saphir (17/11/2026)

**Infobulle des zones du cadran** (`#tip`, toujours `role="tooltip"`, texte HTML) : panneau de verre dépoli (`--card` à 86 % la nuit, 90 % le jour, `backdrop-filter: blur(14px) saturate(1.4)`), liseré `--holo-edge`, reflet irisé (`--holo-a` cuivre, `--holo-b` bleu) dont la position `--sx` suit la souris, filet qui la relie à la zone survolée. Elle **pivote avec le cadran** : `--rx` / `--ry` reprennent l'orientation réelle de la montre (`stand.rotation`, ×0,6, bornée à ±12° / ±16° pour rester lisible), posées par `placeHot`. Apparition par léger déplacement + fondu (0,25 s), fondu seul sous mouvement réduit.
Contraste : pire cas calculé (verre sur la zone la plus défavorable) titre ≥ 10:1, description ≥ 5,6:1 la nuit ; ≥ 11:1 le jour (la description passe en `--fg` le jour : `--muted` descendait à 4,1:1 sur le verre clair au-dessus du cadran blanc).

**Verre saphir** (`sapMat`, `loop.js`) : couche additive au-dessus des reflets peints du verre (`z = .165`). La lumière se reflète à l'opposé du curseur (parallaxe) : bande de reflet en diagonale décomposée en rouge / vert / bleu légèrement décalés (dispersion, effet de réfraction ; l'écart grandit quand la lumière s'éloigne du centre), reflet secondaire fin, liseré de Fresnel côté lumière, petit point lumineux. Pilotée par le ressort de la souris (`tiltS`), donc immobile sans souris ; intensité 0,55 le jour (cadran clair) ; s'efface avant la plongée dans le verre (`p` .19 → .24). Volontairement discrète : le texte du cadran reste lisible.

**Mouvement réduit** : l'accueil passe en vue statique (pas de 3D) ; zones du cadran, infobulle et verre n'existent pas, leur contenu est dans le HTML. **Vérifié** : axe 0 violation (jour, nuit, focus clavier sur une zone), captures Chrome jour / nuit souris à gauche et à droite.

## Cadran : approche d'une zone à la souris (17/11/2026) — retirée

Essayée puis **retirée le même jour** à la demande d'Adri : les zones du cadran sont trop proches les unes des autres, l'illumination à l'approche (`--pk`, rayon 90 px), le cercle de ciblage (`.hot::before`) et l'ouverture de l'annotation à distance (`nearKey`) faisaient clignoter plusieurs cercles à la fois. Les cercles ne réagissent plus qu'au survol direct, au clic et au focus clavier. Le léger pivot de la montre vers l'utilisateur pendant la visée d'une zone (`aimK`) est conservé : il ne se déclenche qu'au survol, au focus ou au clic.

## Cadran épuré (17/11/2026, piste 1 retenue)

Trois pistes ont été étudiées : (1) cadran épuré, (2) cadran altimètre lié au défilement, (3) écran qui change (identité → altimètre → boussole au bivouac). **Piste 1 retenue** par Adri. Raisons : la plus lisible et la plus rapide ; la montre du hero n'est visible qu'au premier écran et sur « S'équiper » (elle disparaît dans la plongée vers la carte vers p = .30), ce qui limitait l'intérêt d'un altimètre ; le site a déjà un altimètre (rail à droite, « ALT … m » en bas à gauche) ; la montre du bivouac est un autre objet 3D.
- **Sur le cadran** (`makeDial`) : graduations, N E S O, le nom, la ligne de métier (jusqu'à 46 px sur 860 px de large, contre 31 px / 800 avant) et l'aiguille. Retirés : intercardinaux (NE, SE, SO, NO), degrés (30, 60…), expérience (`xpLabel` / `xpValue`) et qualités (Résilience, Écoute, Stabilité, Curiosité).
- **Où sont passées les valeurs** : dans le HTML. Chaque zone du cadran garde son nom accessible (`aria-label`), l'infobulle holographique les affiche au survol, à l'approche et au focus, le paragraphe `sr-only` du hero les liste, et la visite guidée les parcourt.
- **Zone de lecture** (`drawReadout`) : elle ne répète plus le texte des zones du cadran (doublon de l'infobulle) ; elle garde l'aperçu des outils au survol des boutons du boîtier dans « S'équiper ».
- **Admin › Profil › Cadran de la montre** : les champs « Libellé d'expérience » et « Valeur » sont retirés du formulaire (sans effet désormais) ; les données restent en base et dans `/api/loop-content` (`dial.xpLabel`, `dial.xpValue`), rien n'est perdu. Nom et ligne de titre restent modifiables.

**Ligne de métier retirée (17/11/2026, demande d'Adri)** : le cadran ne porte plus « DÉVELOPPEUR × MANAGEUR × FORMATEUR ». Restent graduations, N E S O, le nom et l'aiguille. Le repère « ATELIER » s'affiche encore à cette place au survol d'un bouton du boîtier dans « S'équiper » (avec le nom de l'outil). Le champ « Ligne de titre » est retiré d'Admin › Profil › Cadran (la donnée `loopDialRole` reste en base et dans l'API). Le métier est dit par le surtitre et le texte du hero.

**Zones et métier (17/11/2026, demande d'Adri)** :
- Le cadran ne garde que **quatre zones interactives**, les points cardinaux (`HOT` : N Résilience, E Écoute active, S Stabilité, O Ouverture d'esprit). Les zones « Adrien Neyron » (centre) et « Expérience » sont retirées, avec leurs infobulles.
- **« DÉVELOPPEUR - MANAGER - FORMATEUR »** est peint sous l'aiguille en **arc qui suit la courbure du cadran** (`makeDial` : chaque lettre posée sur un cercle de rayon 330 autour du centre, haut des lettres vers le centre, lecture de gauche à droite ; arc ≤ 2,3 rad ≈ 130°, police jusqu'à 36 px réduite pour tenir dans l'arc, interlettrage 8 %, orange `P.N`). Ses extrémités restent à ~160 px de O et E, et le bas à ~30 px au-dessus du S. Texte fixe dans le code (le champ admin `loopDialRole`, qui contenait « MANAGEUR », n'est plus utilisé).
- **Indication d'accueil** : le cercle qui pulse est celui de « Écoute » (E). La carte se place à droite du cercle s'il y a la place, sinon sous le cadran (sous le cercle « S ») : elle ne masque jamais le cadran.

## Infobulle HUD des zones du cadran (17/11/2026)

Demande d'Adri : l'infobulle `#tip` des quatre zones cardinales devient une **infobulle HUD flottante**.

- **Verre sombre identique jour et nuit** (c'est un instrument, pas une carte de page) : voile pierre `rgba(var(--hud-bg), var(--hud-a))` = stone-900 à 60 %, fines lignes de balayage (`--hud-fg` à 4 %) pour la texture, reflet holographique `--holo-a` qui suit la souris, flou `backdrop-filter: blur(24px) saturate(1.3) brightness(.62)`. Sans `backdrop-filter`, le voile monte à 88 %.
- **Bordure cuivre subtile** `--hud-edge` (cuivre à 30 %), **ombre portée profonde** `--hud-shadow` (deux couches), **lueur cuivrée** `--hud-glow` quand la zone est survolée, a le focus ou est épinglée (l'infobulle elle-même reste `pointer-events: none` pour ne pas voler le survol de la zone).
- **Badge** en haut : depuis le 17/11/2026 au soir, il affiche la valeur du cadran sous la zone (« N · Nord », « E · Est », « S · Sud », « O · Ouest », champ `c` de `HOT`, écrit dans `#tipK`) au lieu de « Expérience » ; (mono, majuscules, `--hud-badge`) avec un **voyant pulsé** `--hud-dot` (`hudPing`, 1,6 s ; fixe sous `prefers-reduced-motion`). Le badge est `aria-hidden` : la zone annonce déjà son nom.
- **Trait lumineux horizontal sur bureau** (largeur ≥ 1000 px) : `placeHot` pose `.side-r` ou `.side-l`, l'infobulle se place à 40 px (`TIP_LEAD` = `--lead`) de l'anneau, centrée verticalement, reliée par un trait cuivré lumineux. « O » s'ouvre vers la gauche, N / E / S vers la droite (repli de l'autre côté si la place manque). Sur mobile : sous la zone, filet vertical.
- **Contrastes** : pire cas analytique (fond blanc assombri par le filtre) titre ≥ 7:1, description ≥ 5,4:1, badge ≥ 5,3:1 (test `loopTokens`) ; mesuré sur le rendu Chrome : ≥ 5,8:1 en jour, ≥ 10:1 en nuit.
- Jetons `--hud-*` déclarés dans les deux palettes (mêmes valeurs).

### Contenu de l'infobulle : titre, phrase, exemple (17/11/2026)

Demande d'Adri : le badge porte le **titre** de la zone (« Résilience », « Écoute active », « Stabilité », « Ouverture d'esprit ») ; dessous, la **phrase** en serif (« Cap fixe face aux bugs. »…) ; puis, séparé par un filet cuivré, un **exemple court** préfixé « Ex. » (champ `x` de `HOT` dans `loop.js`, textes fixes, pas dans /admin). Les exemples sont des propositions à valider par Adri : aucun chiffre ni nom de client.

- Accessibilité : le bouton de zone a pour nom le titre seul ; la phrase et l'exemple sont lus via `aria-describedby="tip"` au focus (plus de répétition).
- Placement sur bureau : le trait part de l'anneau de la zone et **sort de la lunette** (longueur variable, `--lead` posé par `placeHot`, rayon `TIP_DIAL_R` = 2,3) pour que l'infobulle ne recouvre jamais le cadran : E à droite, O à gauche, N et S à droite (sinon à gauche). Infobulle 230 px de texte au plus. S'il n'y a pas la place (E sur un écran de 1280 px), l'infobulle passe sous la zone avec le filet vertical.

## Cadran : azimut en direct et signature d'horloger (17/11/2026)

Demande d'Adri (« en tant que web designer ») : remplacer le texte du cadran par de la donnée vivante ou symbolique.

- **Azimut en direct** à la place du nom : « 066° ENE » (degrés sur 3 chiffres en `P.val`, 104 px ; point de la rose des vents en français sur 16 secteurs en `P.N`, `AZ16`, agrandi de 52 à 80 px le 18/11/2026 car peu lisible ; l'ensemble est réduit s'il dépasse 490 px). Dessiné dans la plaque de lecture `readCanvas` (512 × 256, `drawReadout`), placée en haut du cadran (`roMesh.position.y` .70) ; elle redescend au centre (−.32) pour la description d'un outil dans « S'équiper », où le nom de l'outil et « ATELIER » reviennent en haut. L'angle vient de l'aiguille sans son léger tremblement (`nRot`), donc les chiffres ne clignotent pas ; la texture n'est redessinée que quand le degré entier change. L'aiguille suit la souris (ou la boussole du téléphone) et pointe la zone visée : l'azimut affiche alors 000° N, 090° E, 180° S, 270° O.
- Choix fait : l'azimut plutôt que le nom de l'étape (01 · CAP…), parce que c'est la donnée que l'aiguille montre réellement.
- **Signature en arc** (remplace « DÉVELOPPEUR - MANAGER - FORMATEUR ») sur **deux arcs** depuis le retour d'Adri (« illisible » sur une seule ligne, ≈ 7 px à l'écran) : `DIAL_SIG` = « CALIBRE AN-01 » (46 px sur 1024, rayon 290) puis « RGAA 4.1 · WCAG 2.1 AA » (38 px, rayon 340, le haut du « S » est à ~359), interlettrage .12, couleur des lettres E/S/O (`P.card`). À 1440 px : ≈ 12 px et 10 px à l'écran ; sur mobile (cadran ≈ 150 px), ça reste petit. Pas de coordonnées GPS ni de lieu : aucune n'est vérifiée dans la trace (règle « ne pas inventer de coordonnées »). « RGAA-2.1 » proposé dans la demande n'existe pas : le RGAA en vigueur est la 4.1, qui s'appuie sur WCAG 2.1.
- Le champ /admin « Nom » du cadran est retiré du formulaire (sans effet désormais) ; `loopDialName` reste en base et dans l'API.
- Le cadran est décoratif (`aria-hidden`) : l'azimut n'est pas annoncé.

### Bas du cadran : l'étape en cours, en texte droit (17/11/2026)

Demande d'Adri : l'écriture du bas n'est plus courbe et ne porte plus la signature « CALIBRE AN-01 · RGAA 4.1 · WCAG 2.1 AA » (retirée, `DIAL_SIG` supprimé) ; elle affiche **l'étape en cours**, droite : numéro en orange (`P.N`) + nom (`P.val`), 50 px sur 1024 (réduit au-delà de 600 px de large), à 222 px sous le centre depuis le 17/11/2026 au soir (« remonte l'indicatif » : il était à 292, collé au « S ») ; il répond à l'azimut placé au-dessus du centre, et la queue de l'aiguille pointée au sud ne le touche pas.

- `DIAL_STEPS` (`loop.js`) reprend les noms du menu « Étapes » : 01 LA TRACE, 02 S'ÉQUIPER, 03 L'ASCENSION, 04 LE RANDONNEUR, 05 LE BIVOUAC. Si un nom change dans `data/navigation.ts`, le changer ici aussi.
- `update()` calcule l'étape où la montre est visible (`p < CSP` → 01, jusqu'à la carte → 02, au bivouac → 05) et ne redessine le cadran (`makeDial`) que quand elle change.
- Vérifié : « 01 LA TRACE » au premier écran, « 02 S'ÉQUIPER » via `/#equiper`. Le bivouac (05) n'a pas été vérifié.

## « Le cadran se montre » — étape 1 : balises et secteurs (17/11/2026)

Brief harmonisé avec Adri (trois étapes séparées : 1. balises + secteurs, 2. amorce automatique + micro-légende, 3. viseur). Principe : on vise un point cardinal, l'aiguille s'y cale, sa carte HUD s'ouvre ; un seul signal actif à la fois.

- **Secteurs** (`sectorAt` / `updateSector`, `loop.js`) : 4 quarts de 90° couvrent tout l'écran de la montre (souris et stylet). Angles mesurés vers les boutons de zone projetés (l'inclinaison de la montre est prise en compte). Zone neutre au centre (`SECT_DEAD` 18 % du rayon : on garde le secteur en cours) et tolérance de 6° aux frontières (`SECT_HYST`) : vérifié, des allers-retours de ±3° autour de la frontière N/E ne basculent qu'une fois. Réévalué à chaque image (la montre pivote sous une souris immobile). Hors du cadran : rien d'actif. Clic dans un secteur = épingle sa carte (comme le bouton), Échap désépingle. Les boutons `.hot` ne réagissent plus au survol eux-mêmes ; ils restent pour le clavier (focus = même état) et le toucher.
- **Point actif** : la lettre du cadran passe en orange et grossit de 12 % (`dialAimK`, `makeDial` redessiné seulement au changement) ; plus d'anneau au survol ni à l'épinglage. L'anneau `--acc` reste **au focus clavier** (WCAG 2.4.7).
- **Balises** (`.hot::after`) : point `--hud-dot` de 4 px en haut à droite de chaque lettre, lueur `--hud-glow`, respiration 3,2 s décalée de 0,8 s par point (`--bd`). Quand un point est visé, les trois autres baissent (.25) et la balise active reste allumée. Le premier secteur visé arrête la respiration pour la visite (`sessionStorage['cordee-beacon']`, classe `.beacons-still`). Fixes sous `prefers-reduced-motion`. Décoratives (pseudo-élément d'un bouton déjà nommé).
- Clic sonore discret (`tickSoft`) à chaque changement de secteur, seulement si le son est actif et hors mouvement réduit.
- En attente de l'étape 2 : l'ancienne indication (pulse sur « E » + carte « Explorer l'instrument ») est encore là ; l'amorce la remplacera.

### Révision du 18/11/2026 : lettres qui s'éclairent, cartes à l'azimut des points

Proposition d'Adri, appliquée : **plus de balises** (points cuivrés retirés, CSS `.hot::after` et `sessionStorage['cordee-beacon']` supprimés) et **plus de secteurs de 90°**.

- L'aiguille suit la souris et l'azimut défile en direct. Quand la souris passe **à l'azimut d'un point cardinal** (±12° autour de N, E, S, O, vu du centre du cadran : `AZ_IN`), l'aiguille s'y cale, **la lettre s'éclaire** (orange, +12 %, halo `shadowBlur` sur le cadran) et la carte HUD s'ouvre. On ne quitte le point qu'au-delà de ±18° (`AZ_OUT`) : pas de bascule. Entre deux points, aucune carte.
- Zone utile : **tout autour de la montre**, jusqu'à 2,6 rayons d'écran (`AZ_REACH`, ≈ 300 px à 1440 px), hors du centre (18 %). Première version limitée à l'écran + lunette (1,18 rayon) : « en pratique ça ne marche pas » (Adri), car on tourne la souris autour du boîtier, pas dans le petit écran. Balayage vérifié à 0,6 / 1 / 1,4 / 2 / 2,5 rayons : les 4 cartes s'ouvrent à leur azimut, rien entre ; à 3 rayons, plus rien (la colonne de texte n'est pas concernée). Clic quand un point est visé = épingle. Clavier et toucher inchangés (boutons `.hot`, anneau au focus clavier).
- Vérifié (nuit et jour) : 45° rien, 80–100° Écoute active, 112–135° rien, 180° Stabilité, 200° rien, 270° Ouverture d'esprit, 355–0° Résilience.

### Fermeture des cartes à l'étape suivante (18/11/2026)

Règle d'Adri : les cartes HUD du cadran se ferment **obligatoirement** quand on passe à l'étape suivante. Dans `placeHot`, dès que les zones du cadran ne sont plus disponibles (`sectorOn` faux : « S'équiper », carte, vue statique), l'épinglage, le survol et le point visé sont effacés, la carte se ferme et le focus quitte le bouton de zone. Vérifié dans Chrome : carte épinglée au clic, ouverte à l'azimut avec la souris immobile, ouverte au clavier → fermée après défilement dans les trois cas.

### Portée sur toute la page (18/11/2026)

Demande d'Adri : le rayon d'action des points cardinaux couvre **toute la page** (`AZ_REACH = Infinity`, avant 2,6 rayons d'écran). Seule reste la zone neutre au centre du cadran (18 %). Conséquence assumée : la souris sur la colonne de texte à gauche est à l'azimut d'« O » (≈ 270°), donc la carte « Ouverture d'esprit » s'ouvre quand on lit le titre ; en haut à gauche ou sur le bouton « Lancer la visite guidée », on est entre deux points, rien ne s'ouvre. Vérifié dans Chrome (1440 × 900) : haut de page → Résilience, bord droit → Écoute active, bas → Stabilité, titre à gauche → Ouverture d'esprit, coin haut-gauche et bouton → rien.

## Survol jour des boutons « CV » et « Contact » (18/11/2026)

Demande d'Adri : un survol harmonieux en mode clair pour les deux pastilles du pied de page. Avant : remplissage rose délavé (cuivre 22 % sur `--card`). Maintenant (jour seulement, `loop.source.css`) : la pastille se remplit du cuivre de la charte `--acc-text`, bordure assortie, texte et icône en `--brand-fill` (contraste 5,0:1), élévation de 1 px et ombre teintée cuivre ; transition 0,25 s ; même état au focus clavier (plus l'anneau de focus) ; sans élévation sous `prefers-reduced-motion`. Mode nuit inchangé. Vérifié dans Chrome (couleurs calculées au survol).

## Pastille « Cliquer sur les boutons de la montre » retirée (18/11/2026)

Demande d'Adri : à l'étape 02 (« S'équiper »), la pastille `#eqTip` qui apparaissait sous la montre quand la souris bougeait est supprimée : élément HTML, styles `.eq-tip`, minuterie et variables de `loop.js` (`EQ_TIP_MS`, `eqMoved`, `eqOff`, `pushUsed`). Les boutons du boîtier et les cartes d'outils fonctionnent comme avant. Retour arrière possible par git (commit précédent `633058f`). Vérifié dans Chrome via `/#equiper` : plus de pastille, aucune erreur JavaScript.

## Brouillard de « S'équiper » identique à celui de l'accueil (18/11/2026)

Demande d'Adri : à l'étape 02, un effet brouillard sur la moitié droite, comme celui de la moitié gauche à l'étape 01. Le voile existait déjà (`.hphoto::before`, `--ph-r`, même dégradé que `::after` en miroir), mais il était **invisible en pratique** : un pseudo-élément `::before` est peint avant les enfants, et à `z-index: 1` le canvas du relief au curseur (`.hrelief`, z 1, opaque) le recouvrait ; `::after`, peint après, restait au-dessus (d'où le brouillard à gauche seulement). Correctif : les deux voiles à `z-index: 2`. Vérifié dans Chrome (1440 × 900, jour et nuit) : la moitié droite de « S'équiper » est maintenant voilée comme la gauche de l'accueil ; l'accueil est inchangé.

## Clignotement de l'aiguille : au moment du zoom (18/11/2026)

À la demande d'Adri, l'aiguille du cadran ne clignote plus dès l'arrivée sur « S'équiper » : le clignotement (et le halo qu'il dessine, `transW` / `needleBlink` / `drawNeedleHalo` dans `loop.js`) commence quand le défilement se tourne vers le cadran, c'est-à-dire avec le zoom (`zi = sm(.20,.30,p)`) et le retour de la montre au centre. Fenêtre : apparition de p = .20 à .235 (avant : .10 à .15), plein jusqu'à .285, disparition à .32 (inchangé). Pendant « S'équiper » (arrêt du menu à p = .155), l'aiguille reste donc fixe et n'attire plus l'œil loin des boutons du boîtier.

## « Explorer l'inventaire complet » à la place de la pilule (18/11/2026)

À la demande d'Adri, la pilule centrée en bas de l'écran « Voir tout l'équipement → » (`p.scene-more#eqMore`, `a.cnt`) est **supprimée**. Le lien vers `/ai-tools` prend place dans la hiérarchie de « S'équiper » : dans le bloc `#head2`, juste sous le paragraphe, aligné à gauche avec le texte (grand écran : colonne de droite).

- Style : le même que « Lancer la visite guidée » (`.cta`) : fond transparent, texte `--fg` en capitales JetBrains Mono, flèche ↗ orange `--cta-line` (SVG décoratif, `aria-hidden`), voile `--cta-tint` au survol / focus avec la flèche qui glisse de 2 px en diagonale (immobile sous `prefers-reduced-motion`), contour de focus `--focus` 3 px, cible 48 px de haut. Classe `.eq-cta`, conteneur `.eq-more`.
- Intitulé (RGAA 6.1, lien explicite) : « Explorer l'inventaire complet (n outils) ». Le nombre est **le vrai nombre d'outils de la page `/ai-tools`**, jamais saisi à la main : `aiToolCount` de `/api/loop-content` (outils en base), sinon la liste de secours `data/ai-tools.ts` (6 aujourd'hui, comme le fait `stores/aiTools.ts`). Il est posé côté serveur par `applyLoopContent` (`toolCount`, `utils/loopMarkup.ts`) : lisible sans JavaScript. Le balisage par défaut de `loop.html` porte le nombre de la liste de secours (testé). Le groupe « (n outils) » est insécable.
- Visible et focalisable avec le titre (`.on` quand l'opacité de `#head2` > .5, `visibility:hidden` sinon) ; toujours visible en vue statique.
- Ordre du DOM : paragraphe → lien → cartes d'outils (`tests/e2e/home.spec.ts`).
- Les règles `.scene-more` (seul ce lien les utilisait) sont retirées ; `body.static #s1 #eqMore` aussi.
- Le brief proposait « 12 outils » : le site n'en affiche que 6 en local (base vide, liste de secours) ; le nombre suit la base dès que des outils y sont saisis dans /admin › Outils IA.

## « S'équiper » : HUD connecté, étape 1 (18/11/2026)

Fini le survol « à l'aveugle » des poussoirs. Choix d'Adri : **6 outils, 6 crans** (les outils réels, aucun texte inventé), **les 6 cartes remplacées par une carte HUD**, travail **en 2 étapes**. Étape 1 faite ; étape 2 (la montre pivote légèrement, le poussoir 3D s'enfonce) à venir.

- **Repères sur les poussoirs** : chaque poussoir (`.push`, 44 px) porte un point cuivré `.pb-dot` (`--cta-line`) et son numéro `.pb-n` (01 à 06) posé vers l'extérieur du boîtier (`--ox` / `--oy`, calculés dans `placePush`), sur une pastille de verre sombre (texte `--hud-muted`, `--hud-fg` actif). Le poussoir actif pulse (`hudPing`) ; au survol, le point grossit.
- **Carte HUD** `#eqHud` : même verre que l'infobulle du cadran (`--hud-*`, `backdrop-filter … brightness(.62)`, contraste couvert par le test `loopTokens`), avec le badge « Outil 01 / 06 », le nom (serif), la phrase de l'outil (`TOOLS[i].d`) et « Ouvrir la fiche → » (`openTool`, même fiche qu'avant ; absent pour l'Analyseur GPX « À venir », le panneau devient alors focalisable). Grand écran : dans la colonne du texte, sous « Explorer l'inventaire complet ». Écran étroit : en bas, au-dessus du pied de page (version compacte, sans badge sous 900 px).
- **Fil cuivré** `#eqWire` (SVG 1 px, `--cta-line`, lueur `--hud-glow`) : du poussoir actif vers un anneau autour du boîtier, qu'il suit en arc jusqu'en face de la carte, puis jusqu'à la carte ; il se redessine à chaque changement (0,45 s, sans animation sous mouvement réduit).
- **Sélection** (`eqSel`, `eqSelect` dans `loop.js`) : 01 à l'arrivée sur l'étape ; clic sur un poussoir, clic sur un onglet, ou Tab puis ← → Début Fin dans le sélecteur (onglets ARIA `role=tab`, `aria-selected`, tabulation itinérante, activation automatique). L'outil sélectionné s'affiche aussi sur l'écran de la montre (`toolAim`, comme le survol avant) et l'aiguille pointe vers lui.
- **Accessibilité** : les poussoirs sont des raccourcis souris / tactile (`aria-hidden`, `tabindex=-1`) ; clavier et lecteurs d'écran passent par les onglets (nom accessible « 01 Calculateur d'allure »…, numéro visible inclus) et le panneau (`aria-labelledby` sur l'onglet actif). Onglets et bouton : 44 px. La carte se masque (et rend le focus) en quittant l'étape. axe : 0 violation sur la carte et les poussoirs, jour et nuit.
- Les 6 cartes `#tools` ne sont plus affichées hors vue statique (`body:not(.static) #s1 #tools{display:none}`) ; la vue statique (et donc le mouvement réduit) garde la liste complète, sans HUD ni fil.

## « S'équiper » : HUD connecté, étape 2 (18/11/2026)

Validée par Adri après l'étape 1, avec une consigne : que les repères s'harmonisent naturellement avec les boutons de la montre.

- **La lumière est sur le bouton 3D** : chaque poussoir porte une LED cuivrée posée sur son dessus (`pushCaps[i].led`, disque `MeshBasicMaterial` #F08A4B, enfant du poussoir) avec un halo additif (`glow`, texture radiale `ledTex`). En veille : LED à 45 %, sans halo ; poussoir actif : LED pleine qui respire (≈ 2 s) et halo ; éteintes hors de l'étape. Le point HTML `.pb-dot` de l'étape 1 est retiré : le bouton 44 px, son numéro et le départ du fil sont maintenant projetés sur la LED (`PUSH_Z` = .07, face avant du poussoir) au lieu du centre du poussoir.
- **Numéros façon lunette** : petite plaque rectangulaire gris boîtier (`.pb-n`, radius 4 px, texte `--hud-muted`), cuivrée (`--hud-badge`) pour l'outil actif. Contraste : verre à 72 % assombri par `brightness(.62)`, ≥ 7:1 dans le pire cas (fond blanc).
- **Le poussoir s'enfonce** : à chaque sélection (poussoir, onglet cliqué, flèches du clavier), `PRESS[i]` = 1 : le poussoir rentre de 0,08 dans le boîtier tout de suite, puis ressort sur ~0,4 s (décroissance exponentielle) ; le poussoir actif reste engagé de 0,015. La remise à 01 à l'arrivée sur l'étape n'enfonce rien.
- **La montre pivote** : ressort amorti `eqRot` ajouté aux rotations du boîtier (`stand.rotation`) : la pression la repousse un instant, puis elle se tourne légèrement vers le poussoir actif (≈ 4° en lacet, 3° en tangage) ; retour à 0 en quittant l'étape. Calcul dans `eqAnim(dt)` (`loop.js`).
- Mouvement réduit : la page est en vue statique (pas de 3D) ; par sécurité `eqAnim` ne fait ni recul ni respiration si `reduce`.

## Plus de descriptif d'outil sur le cadran (18/11/2026)

À la demande d'Adri, l'écran de la montre n'affiche plus la phrase de l'outil sélectionné dans « S'équiper » (branche « outil » de `drawReadout`, `loop.js`, laissée vide). Restent sur le cadran : le nom de l'outil et « ATELIER » (`makeDial`, `dialOver`), et l'étape en bas (« 02 S'ÉQUIPER »). La phrase reste dans la carte HUD `#eqHud`. L'accueil (azimut en direct) ne change pas.

### Plus de numéros autour des poussoirs (18/11/2026)

À la demande d'Adri, les petites plaques 01 à 06 posées autour des poussoirs de la montre (`.pb-n`) sont retirées (HTML injecté par `loop.js`, règles CSS, calcul `--ox` / `--oy` dans `placePush`). Chaque poussoir garde sa LED cuivrée 3D, sa zone cliquable de 44 px (`.push`, `aria-hidden`, hors tabulation) et le fil cuivré vers la carte. Les numéros restent dans les onglets de la carte HUD (`#eqTabs`), qui sont l'accès clavier et lecteur d'écran. Les mentions de `.pb-n` plus haut dans ce document décrivent l'état antérieur.

### Le pied de page glisse vers la droite (18/11/2026)

À la demande d'Adri, entre l'étape 1 et l'étape 2, les liens du pied de page (CV, Contact, mentions, accessibilité, admin) ne sautent plus du centre vers la droite : ils glissent en 0,8 s (`cubic-bezier(.22,.8,.24,1)`).

- **Déclencheur** : la classe `at-hero` sur `<html>` (posée par `initHeroClean`, `utils/heroRelief.ts`, tant que le défilement est sous 60 % de la hauteur d'écran). Inchangé.
- **Technique** : `justify-content` ne s'anime pas. Le pied de page garde donc toujours sa mise en page « copyright à gauche, liens à droite » (`space-between`) et, au premier écran, `translateX(calc(50% - 50cqw))` ramène le groupe de liens au centre (`50%` = sa demi-largeur, `50cqw` = la demi-largeur du pied de page, déclaré `container-type: inline-size`). En quittant le haut, la translation revient à 0 avec une transition.
- **Limites** : écrans ≥ 900 px seulement (en dessous, les liens restent centrés comme avant) ; pas d'animation sous `prefers-reduced-motion` ; aucun décalage en vue statique.
- **Mesuré (Chrome, 1440 px)** : centre du groupe à 720 px au premier écran, 1126 px à 200 ms, 1250 px à 900 ms (bord droit à 1420 px, comme avant) ; retour au centre en remontant. À 1024 px, le groupe est centré au premier écran.

### Plus de carte « Explorer l'instrument » au cadran (18/11/2026)

À la demande d'Adri, la micro-carte d'explication de l'étape 1 posée à côté du cadran (`#dhint` : « Explorer l'instrument · Certains éléments du cadran révèlent mon univers · Bougez pour découvrir · Cliquez pour explorer ») est retirée : HTML (`loop.html`), styles `.dhint` / `.dh-*` (`loop.source.css`) et son placement dans `placeHot` (`loop.js`). Elle était décorative (`aria-hidden`), donc rien ne manque au lecteur d'écran : les zones du cadran gardent leur nom accessible.

Reste inchangé : le cercle de la zone « E » pulse une fois par visite au chargement (`.hot.hint`), s'arrête à la première interaction ou après 8 s, et reste fixe sous `prefers-reduced-motion`. Les mentions de `#dhint` plus haut dans ce document décrivent l'état antérieur.

### Plus de sous-titre « ATELIER » au cadran (18/11/2026)

À la demande d'Adri, le sous-titre « ATELIER » peint sous le nom de l'outil sur l'écran de la montre (`makeDial`, branche `dialOver`, `loop.js`) est retiré. En « S'équiper », le cadran n'affiche plus que le nom de l'outil sélectionné (en haut), N E S O, l'aiguille et « 02 S'ÉQUIPER ». Le nom, la phrase et le lien vers la fiche restent dans la carte HUD (`#eqHud`). Rien ne change pour le lecteur d'écran : le cadran est un canvas décoratif.

### La carte HUD part avec le bloc « S'équiper » (18/11/2026)

À la demande d'Adri, en défilant vers la suite, la carte `#eqHud`, le fil cuivré `#eqWire` et les zones cliquables des poussoirs s'effacent **en même temps** que le bloc « S'équiper » (`#head2` : surtitre, titre, paragraphe, lien inventaire). Avant, ils restaient jusqu'à `CEND` (p .26 → .29 en grand écran), alors que le titre était déjà parti à .17 → .20.

- **Technique** : `eqVis(p)` dans `loop.js`, utilisé par `placeHud` et `placePush` : le minimum entre leur propre apparition (`trap(p, CSP, CSP+.03, CEND…)`) et l'opacité de `#head2`, une fois l'apparition terminée (l'arrivée de la carte ne change pas). La carte redevient visible en remontant.
- **Mesuré (Chrome)** : à 1440 px et à 768 px, opacités de `#head2`, de la carte et du fil identiques à chaque pas de défilement (1 → .9 → .69 → .14 → 0 en grand écran), carte en `visibility:hidden` dès 0.

### « Explorer l'inventaire complet » part avec le paragraphe (18/11/2026)

À la demande d'Adri, le lien `#eqMore` ne disparaît plus d'un coup à mi-fondu : il est dans `#head2` et suit donc déjà son opacité, mais `loop.js` le passait en `visibility:hidden` dès que `#head2` descendait sous 0,5 (pour qu'il ne reste pas atteignable au clavier quand il est presque invisible). Le seuil est maintenant de 5 %, celui des textes de scène (`crisp`) : le lien s'efface dans la continuité du paragraphe et n'est retiré (plus de focus possible) qu'une fois invisible. Mesuré (Chrome 1440) : visible à 0,71, 0,44 et 0,17 d'opacité, retiré à 0, comme le paragraphe.

### Le cadran annonce l'étape 3 avant la plongée (18/11/2026)

À la demande d'Adri, quand le paragraphe « S'équiper » (`#head2`) a disparu au défilement, le bas du cadran passe de « 02 S'ÉQUIPER » à « 03 L'ASCENSION », avant la plongée dans le cadran vers la carte des étapes. `dialStep` (`loop.js`, à côté du calcul de l'aiguille) vaut 2 dès que `p > CSP + .03` et que l'opacité de `#head2` est sous 5 % ; en remontant, le paragraphe revient et le cadran repasse à « 02 ». Le cadran n'est redessiné qu'au changement d'étape. Vérifié en capture à 1440 px (02 pendant le fondu, 03 juste après) ; à 768 px le paragraphe part plus tard (p ≈ .28), le changement suit.

### Plus d'éléments invisibles dans l'ordre de tabulation (18/11/2026)

À la demande d'Adri (« beaucoup d'éléments invisibles passent en Tab ; supprimer ceux qui ne servent plus »).

**Inventaire** (Chrome 1440, Tab depuis chaque scène, puis relevé de tous les éléments atteignables à 61 positions du défilement, avec leur opacité réelle = produit des opacités des ancêtres) :

| Élément | Constat | Décision |
|---|---|---|
| Panneau du projet `#stopCard` (« ✕ », « Fiche … ») | atteignable à 0 % d'opacité sur une large part du défilement (p .20 → .38, .65 → .70) | garde |
| Liste des étapes `.pl-stages`, lien `#plMore` | atteignables à 0-24 % pendant l'entrée et la sortie de la carte | garde |
| Scène du randonneur `#s3` (zones `.pside`, boutons `.route`) | 0-29 % à l'entrée et à la sortie | garde (sur la scène entière : une carte est transparente tant que sa zone n'a pas le focus, Tab depuis la zone doit atterrir sur son bouton) |
| « Recommencer l'aventure » `#restart` | 0-2 % en fin de page | garde |
| Bivouac `#bivtext`, zones du cadran `.hot`, `#head1`, `#head2`, `#eqHud` | quelques instants pendant leur fondu | garde |
| « Aller au contenu » | hors écran, affiché au focus | normal (lien d'évitement) |
| `nuxt-devtools-frame` | outil de développement | absent en production |

**Aucun élément obsolète** : tous servent dans leur scène, rien n'a été supprimé.

**Garde** (`ghostGuard` dans `loop.js`, appelée par `draw`, au plus toutes les 100 ms) : pour chaque bloc de `GHOST_SEL`, si son opacité réelle est sous `GHOST_MIN` (35 %, illisible), le bloc devient `inert` (hors tabulation, hors lecteur d'écran, non cliquable) ; il redevient actif dès qu'il réapparaît. Jamais en vue statique. Testé : chaque sélecteur de `GHOST_SEL` existe dans `loop.html` (ou est créé par `loop.js`). **Un nouveau bloc interactif qui s'efface par l'opacité doit être ajouté à `GHOST_SEL`.**

**Après** : même relevé, plus aucun élément atteignable sous 30 % d'opacité (seuls restent le lien d'évitement et des liens « Fiche … » sortis du panneau défilant, ramenés à l'écran par le focus) ; parcours Tab de chaque scène (S'équiper, L'ascension, Le randonneur, Le bivouac) sans élément invisible, zone → bouton de carte du randonneur conservé.

### Soulignage du menu harmonisé (18/11/2026)

À la demande d'Adri, « Étapes » et « Outils » ont le même soulignage que « Projets ». Accueil (`loop.source.css`) : trait plein `--underline` de 1 px (avant : dégradé effacé aux bouts, 2 px le jour), aligné sur le texte, affiché au survol, **au focus clavier** (manquait) et menu ouvert. Pages (`TrailNav.vue`) : les trois avaient déjà le même style ; ajout du focus clavier et du trait aligné sur le texte à partir de 640 px (il dépassait de 4 px de chaque côté). Mesuré (Chrome) : mêmes hauteur, couleur et alignement pour les trois, jour et nuit.

### « Aller au contenu » ne double plus le logo (18/11/2026)

À la demande d'Adri : au clavier, le lien d'évitement et le logo « Cordée » menaient au même endroit (`href="#main"`, le haut de l'accueil). Le lien d'évitement saute maintenant l'en-tête et met le focus sur le **titre de la scène affichée** (`HW[curName]` : « Trouver le cap… », « Des outils construits… », « Chaque projet… », « Une foulée… », « Posons le sac. »), sans changer de scène ; le Tab suivant atterrit sur la première commande de la scène. Le logo ramène toujours au début de l'accueil. Vue statique : le premier titre de scène encore à l'écran sous l'en-tête. Sans JavaScript, `#main` reste la cible. Vérifié (Chrome 1440) : accueil → titre puis « Lancer la visite guidée » ; S'équiper → titre puis « Explorer l'inventaire » ; L'ascension → titre puis « Départ » ; Bivouac → titre puis « E-mail » ; sans défilement.
