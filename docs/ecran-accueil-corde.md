# Écran d'accueil « corde en C »

Écran d'attente affiché avant la montre : un grand **C** en corde tressée cuivrée (initiale de *Cordée*), « ordée » à sa droite, la phrase d'accroche et le bouton **Dénouer la corde pour commencer l'ascension**. Il remplace le premier contact direct avec la montre ; la montre apparaît une fois la corde dénouée.

Inspiration : image générée avec Gemini (C en corde, lueur de feu, montagnes nocturnes, courbes de niveau).

## Fichiers
- `assets/loop/loop.html` : section `#gate` (SVG de la corde, fond topographique, montagnes, braises) + `<noscript>` qui la masque sans JavaScript.
- `assets/loop/loop.source.css` / `loop.css` : bloc « Écran d'accueil corde en C » en fin de fichier (recompiler `loop.css` avec `scripts/scope-loop-css.cjs`).
- `components/loop/LoopHome.vue` : fonction `setupGate()`.

## Fonctionnement
Principe : **pas d'écran de chargement**. Le chargement se joue à l'écran, sur la montre GPS (la montre 3D se met en place, le nord se cale, l'altimètre monte), comme prévu à l'origine dans la boucle.

1. Dès le premier affichage, l'écran est dans le HTML (il masque la boussole 2D de secours du hero). S'il a déjà été vu dans la session (`sessionStorage` : `cordee-gate-vu`), un petit script d'en-tête pose `html.gate-seen` avant le premier rendu : l'écran n'apparaît pas.
2. Pendant l'écran : le reste de la page est `inert` (clavier, lecteurs d'écran) et le défilement est bloqué (`html.gate-on`). Le focus est sur le bouton.
3. **Préchargement** : 1,5 s après l'affichage (ou au premier geste), les modules (three.js, loop.js, chargeur 3D, contenu admin) sont téléchargés, sans rien démarrer (`prepare()` dans `LoopHome.vue`).
4. **Clic ou Entrée** : la corde se retire et le nœud se défait (≈ 1,1 s) ; la boucle démarre tout de suite (`start()`), donc sous l'écran qui se dissout la montre 3D arrive déjà. L'écran s'efface en fondu quand la montre est en place (`html.loop-live`) et que l'animation est finie, 8 s au plus.
5. Sans écran de la corde (session déjà vue) : la boucle démarre d'elle-même 1,2 s après l'affichage, sans attendre de geste.
6. Annonce pour les lecteurs d'écran : « Corde dénouée : l'ascension commence. » (zone `#live`).
7. L'écran n'est montré qu'une fois par session ; « Recommencer l'aventure » ne le réaffiche pas.

Compromis performance : le préchargement après 1,5 s remplace le démarrage « au premier geste » ; il charge ~250 Ko de JavaScript quelques instants après le premier affichage. À surveiller avec Lighthouse mobile.

## La corde
Trois brins sinusoïdaux (`#st0` à `#st2`, 7 torsions) tracés sur un arc de 270°. Un second passage en pointillés fait repasser chaque brin « dessus » : effet de tresse sans image. Régénérer les brins avec un script si la forme change (rayon 100, amplitude 9,5).

## Accessibilité (WCAG / RGAA)
- Titre `h2` « Cordée » (lu en entier par les lecteurs d'écran ; les éléments décoratifs sont `aria-hidden`).
- Bouton natif, ≥ 48 px, focus visible (contour 3 px), contraste du texte sombre sur cuivre supérieur à 5:1 ; textes clairs sur fond nuit supérieurs à 9:1.
- `prefers-reduced-motion` : pas de lueur pulsante ni de braises ; le bouton ferme l'écran sans animation.
- `forced-colors` : fond et bouton aux couleurs système.
- Sans JavaScript : l'écran est masqué, le contenu reste accessible.

## Préchargement : logo et aiguille
Quand la montre n'est pas encore prête, la seule chose visible est le logo Cordée (le mousqueton) **au-dessus** de l'aiguille de la boussole qui tourne (`#preload`, balayage puis calage sur le nord, animation `preSpin`).
- L'aiguille a la forme de celle du cadran de la montre (orange au nord, blanche au sud) et se place au centre du cadran (`top: 49,2 %`, 18 × 80 px). Quand la boucle démarre, le préchargement s'efface en fondu de 1 s pendant que la montre 3D arrive : les deux aiguilles se confondent.
- La **boussole 2D de secours a été supprimée** (`#compassFallback` : balisage, CSS et appel dans `loop.js`). Si la 3D n'est pas disponible, la page montre le titre et l'accroche sans cadran.
- Le logo apparaît aussi au-dessus de l'écran de la corde si, après l'animation, la montre n'est pas prête (classe `html.gate-waiting`, réseau lent).
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
