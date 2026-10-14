# Transition d'intro « craquelure et chute »

À l'ouverture de l'écran d'accueil (clic, délai automatique, ou clavier), il (`#gate`) se fissure depuis le centre, se brise en éclats qui s'écartent, ondulent et tombent vers la caméra, et révèle la scène 3D (la montre, le terrain en fil de fer).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `utils/introShatter.ts` | Moteur : découpe de Voronoï (`buildShards`), maillage (`buildMesh`), shaders GLSL (`VERTEX_SHADER`, `FRAGMENT_SHADER`), classe `ShatterRenderer` (`render(p)`, `dispose()`). WebGL 1 brut, sans three.js. |
| `utils/introSnapshot.ts` | Capture l'écran `#gate` en canvas 2D (fond, accroche, bouton) pour servir de texture. |
| `components/loop/IntroTransition.vue` | Composant : `play(gate, { isReady, maxWait })`, timeline GSAP, nettoyage. Rendu via `<Teleport v-if>`. |
| `components/loop/LoopHome.vue` | Appelle `play()` dans `untie()` ; retombe sur le fondu CSS si `play()` renvoie `false`. |

## Principe

1. **Capture** : `snapshotGate` dessine l'écran d'intro à l'identique dans un canvas 2D. Le thème jour/nuit vient des jetons CSS (`--gate-bg`, etc.), donc la capture suit le thème automatiquement.
2. **Éclats** : ~95 cellules de Voronoï calculées une fois en JS (graines plus serrées au centre, une passe de relaxation de Lloyd, découpe de Sutherland–Hodgman : les polygones recouvrent l'écran exactement, sans trou).
3. **Vertex shader** : tout le mouvement dépend d'un seul uniform, `uProgress` (0→1). Sans état : on peut rejouer ou remonter l'animation.
   - 0 → ~0,34 : le front de fissure part de l'impact et court dans le réseau (front déformé par du bruit simplex : irrégulier, organique).
   - dès 0,10 : les éclats se détachent anneau par anneau depuis le centre (délai croissant avec la distance) ; chacun s'écarte, ondule (sinus), tombe (gravité), tourne, grossit vers la caméra, puis s'efface.
4. **Fragment shader** : fissure fine selon la distance au bord de l'éclat, lueur (braise la nuit, bleu de roche le jour via `uMode`), réfraction « verre brisé » près des bords (lecture de la texture décalée par du bruit), reflet d'arête.
5. **Timeline GSAP** : `p: 0 → 1`, 4,6 s, `power3.inOut` (démarrage lent, accélération franche, retombée douce ; constante `DURATION`).
6. **Nettoyage** : timeline tuée, buffer / texture / programme supprimés, contexte WebGL perdu (`WEBGL_lose_context`), canvas retiré du DOM (`v-if`), lissage de lag GSAP restauré.

Uniforms : `uProgress`, `uMode` (0 jour / 1 nuit), `uAspect`, `uR`, `uPx` (taille d'un pixel écran, remplace `uResolution`), `uTex`. Le bruit est calculé en GLSL (simplex 2D), pas de texture de bruit à charger.

## Réglages

Dans `introShatter.ts` : nombre d'éclats (`count`), exposant de densité dans `buildShards`, `delay` / durée de chute (vertex shader), épaisseur et couleur de fissure (fragment shader). Durée : `DURATION` dans `IntroTransition.vue`.

## Accessibilité

- Le canvas est `aria-hidden="true"`, sans interaction ; il n'est jamais focalisable.
- Le DOM de `#gate` reste la version de référence. Il n'est masqué (`visibility:hidden` + `aria-hidden`) qu'une fois l'image identique affichée, puis la fin de l'ouverture (`close()`) le retire. Le focus est géré par `LoopHome` comme avant.
- `prefers-reduced-motion: reduce` : `play()` renvoie `false` immédiatement, aucun canvas, simple fondu CSS.
- Sans WebGL, en cas d'exception ou de perte de contexte : repli sur le fondu CSS (le DOM est restauré avant).
- Fin garantie : lissage de lag GSAP désactivé pendant la transition et filet à `DURATION` + 1,5 s ; un appareil lent saute des images mais ne retient pas le visiteur.
- Le bouton « Passer l'intro » reste disponible avant et pendant toute la phase d'attente.
- Message `aria-live` « L'ascension commence. ».

## Tests

- `tests/unit/introShatter.test.ts` : couverture exacte de l'écran (aire = 4·aspect), polygones convexes, déterminisme, format du maillage.
- `tests/e2e/home.spec.ts` : le canvas `.intro-shatter` apparaît puis est retiré ; `prefers-reduced-motion` → aucun canvas.
- Le rendu visuel n'est pas testé automatiquement : à vérifier à l'œil sur un vrai GPU (aperçu Vercel).

## Charte graphique et polices
Aucune couleur ni police propre à la transition : tout vient des jetons de la charte (`docs` projet « charte-graphique »).
- Fond et texte de l'écran : `--gate-bg`, `--gate-fg` ; lien : `--gate-tag`, `--gate-focus` ; police `--serif` (Cormorant Garamond, « Cordée Serif ») pour l'accroche, JetBrains Mono pour le lien d'interface.
- Fissures : `--brand` (cuivre la nuit, ardoise le jour) ; lueur autour des fissures : `--acc`. `IntroTransition.vue` lit ces jetons à chaque lancement (`tokenRgb`) et les passe au shader (`uBrand`, `uAcc`) : un changement de charte suit sans toucher au GLSL.

## Point d'impact
`ShatterRenderer.setEpicenter(x, y)` place le point d'où partent les fissures (uniform `uEpi`) et règle la portée du front (`uR`). Par défaut : juste au-dessus du centre. Quand l'accueil large est actif (`html.hero-split` : montre à droite), `IntroTransition.vue` le déplace sur la montre (x = 0,4 × aspect).
