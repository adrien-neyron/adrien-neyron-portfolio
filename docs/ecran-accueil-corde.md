# Écran d'accueil « accroche en éclats »

Écran d'attente affiché avant la montre : la phrase d'accroche (« Beaucoup ont le cap. Peu connaissent le sentier. ») en grandes capitales serif sur fond uni nuit ou jour, le lien « Passer l'intro » (aucun bouton central : l'écran s'ouvre seul, ou au clic n'importe où). Il se fissure et tombe en éclats pour révéler la montre 3D (voir `docs/intro-craquelure.md`).

Modèle visuel : capture fournie par Adri (accroche en capitales, éclats, montre au centre). La corde en C d'origine a été retirée en octobre 2026.

## Fichiers
- `assets/loop/loop.html` : section `#gate` (accroche `.gate-tag`, lien `#gateSkip`) + `<noscript>` qui la masque sans JavaScript.
- `assets/loop/loop.source.css` / `loop.css` : bloc « Écran d'accueil » en fin de fichier (recompiler `loop.css` avec `scripts/scope-loop-css.cjs`).
- `components/loop/LoopHome.vue` : fonction `setupGate()`.

## Fonctionnement
Principe : **pas d'écran de chargement**. Le chargement se joue à l'écran, sur la montre GPS (la montre 3D se met en place, le nord se cale, l'altimètre monte), comme prévu à l'origine dans la boucle.

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

## Préchargement : logo et aiguille
Quand la montre n'est pas encore prête, la seule chose visible est le logo Cordée (le mousqueton) **au-dessus** de l'aiguille de la boussole qui tourne (`#preload`, balayage puis calage sur le nord, animation `preSpin`).
- L'aiguille a la forme de celle du cadran de la montre (orange au nord, blanche au sud) et se place au centre du cadran (`top: 49,2 %`, 18 × 80 px). Quand la boucle démarre, le préchargement s'efface en fondu de 1 s pendant que la montre 3D arrive : les deux aiguilles se confondent.
- La **boussole 2D de secours a été supprimée** (`#compassFallback` : balisage, CSS et appel dans `loop.js`). Si la 3D n'est pas disponible, la page montre le titre et l'accroche sans cadran.
- Le logo apparaît aussi au-dessus de l'écran d'accueil si, après l'animation, la montre n'est pas prête (classe `html.gate-waiting`, réseau lent).
- Mouvement réduit : l'aiguille est fixe. Sans JavaScript : le `<noscript>` masque ce préchargement.
- Décoratif (`aria-hidden`) ; l'état est annoncé par `#live`.

## Relais préchargement → scène 3D (anti-sursaut)

Trois causes possibles d'un « sursaut » au relais, toutes traitées :
- **Coupe franche de la scène 3D** : `#compassCanvas` et `#aurora` apparaissent en fondu (`sceneIn`, 0,7 s) dès `html.loop-live`, désactivé en `prefers-reduced-motion`.
- **Saut de vitesse de l'aiguille** : l'aiguille HTML tournait à 3,7 rad/s, la 3D à 7–15 rad/s. `updateCompass` fait monter la vitesse de 3,7 vers celle du chargement sur ~0,9 s (lissage `k²(3−2k)`).
- **Relais aiguille/scène** : classe `fade` sur `#preload` à 0,55 s ; l'aiguille HTML reste opaque jusqu'à ce que la scène soit visible, puis disparaît en 0,3 s.

Mesure (localhost) : canvas 0,43 → 1 pendant que l'aiguille HTML reste à 1, puis l'aiguille tombe à 0 : aucune image où les deux sont partiellement transparentes.

## Aucune inscription pendant le préchargement
Pendant le préchargement (`html:not(.loop-live)`), seule l'aiguille est visible : en-tête, titre et accroche (`#head1`), pied de page, règle d'altitude, HUD, indice et bouton « Visite guidée » sont à `opacity:0`. Ils restent dans le DOM (pas de `display`/`visibility`), donc lecteurs d'écran et clavier ne sont pas affectés. Ils réapparaissent en fondu (`sceneIn` 0,8 s, décalé de 0,25 s) quand la scène 3D est visible ; pas d'animation en `prefers-reduced-motion`.


## Passer l'intro et appareils limités (octobre 2026)

Pour qu'un visiteur pressé (recruteur) ou un appareil limité ne soit jamais bloqué par l'intro 3D :

- **« Passer l'intro et aller au contenu »** (`#gateSkip`) : ferme l'écran tout de suite, sans attendre la 3D ni l'animation du nœud, et active la **vue statique** (toutes les scènes empilées, sans animation). Le choix est mémorisé dans `localStorage` (`asc-static` = `1`) ; le réglage « Vue statique » le désactive (`0`). Utilisable au clavier, nom accessible explicite.
- **« Passer »** (`#loadSkip`) dans le chargement « Montée au sommet » : termine l'animation d'altitude immédiatement (`finishLoad()`) et débloque le défilement.
- **Vue statique d'office** (`isLiteDevice()` dans `LoopHome.vue`, passé à `initLoop` via `lite`) : économiseur de données (`saveData`), connexion `2g` / `slow-2g`, ou 2 Go de mémoire ou moins (`deviceMemory`). Ces API n'existent pas sous Safari / Firefox : on ne présume alors rien. Mouvement réduit : déjà en vue statique.
- **Délai de l'écran** : sans clic, il s'ouvre seul (4,5 s au plus) ; après un clic, il se ferme au plus tard 4 s plus tard (au lieu de 8 s), même si la 3D n'est pas prête. Le son n'en dépend pas : il est activé uniquement par le bouton « Son » des réglages.
- **Sans WebGL** : repli 2D déjà en place (`THREE_OK`), et la qualité baisse seule si la page ralentit (`applyQuality`).

Tests : `tests/e2e/home.spec.ts` (passer l'intro au clavier, parcours normal inchangé, économiseur de données).

## Sortie en éclats (octobre 2026)

À l'ouverture, `untie()` tente d'abord la transition « craquelure et chute » (`components/loop/IntroTransition.vue`, détail dans `docs/intro-craquelure.md`). Si elle n'est pas possible (mouvement réduit, pas de WebGL, erreur), l'ancien fondu CSS (`gate-untie` → `gate-out`) prend le relais. Dans les deux cas, `close()` termine l'ouverture.

## Accueil large : texte à gauche, montre à droite (octobre 2026)
Sur grand écran (≥ 1000 px, hors vue statique), l'accueil est dès l'arrivée : accroche, nom et sous-texte à gauche (classe `html.hero-split` posée par `update()` dans `loop.js`, règles en fin de `loop.source.css`), montre à droite (`hk` dans `loop.js`, décalage `LAY.sx` = 20 % de la largeur). Au défilement, le texte s'efface et la montre passe à gauche pour « S'équiper », puis revient au centre avant le zoom. Sur mobile et en vue statique, la disposition centrée est inchangée. La transition d'intro fait partir la fissure de la montre quand `hero-split` est actif (`setEpicenter`, voir `docs/intro-craquelure.md`).

## « S'équiper » : montre à gauche, texte à droite, lisibilité
Le menu Parcours envoie « S'équiper » sur le palier stable de la scène (`data-p="0.155"`, plus 0,19 qui tombait en plein fondu) : montre à gauche, titre et sous-texte à droite, texte pleinement opaque. Pour la lisibilité sur la 3D (aurore, relief), un voile radial est posé derrière `#head1` et `#head2` à partir de 1000 px : nuit `rgba(5,8,17,.88)`, jour crème `rgba(252,247,238,.88)` ; le sous-texte et le titre passent en `--fg` (nuit `#E6F4F1`, jour `#12222B`, plus de 10:1). Eyebrow : `--acc-text` (≥ 4,5:1). Règles en fin de `loop.source.css`.
