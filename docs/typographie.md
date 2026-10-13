# Typographie de l'accueil : deux familles seulement

Règle (12/10/2026) : **deux familles au maximum**.

| Usage | Famille | Où |
|---|---|---|
| Titres et récit | **Cordée Serif** (Cormorant Garamond, romain et italique) | `h1`, `h2`, `h3`, titres de cartes (`.chip b`, `.tip b`, `.skills b`), nom de marque, « ordée » de l'écran de la corde |
| Tout le reste (technique et interface) | **JetBrains Mono** (variable, 400 à 700) | surtitres, sous-titres et accroche, boutons, menus « Étapes » et « Outils », pied de page, fiches, chiffres clés, cadran et textes de la montre 3D |

L'ancienne sans-serif (Inter) n'est plus utilisée sur l'accueil (elle reste celle des autres pages du site).

## Mise en œuvre
- `assets/loop/loop.source.css` : toutes les déclarations `'Inter'` sont remplacées par `'JetBrains Mono',ui-monospace,monospace` ; `loop.css` est recompilé (`scripts/scope-loop-css.cjs`).
- Accroche du hero (`#head1 .lede`) : monospace légère, `letter-spacing` 0,02 em, interligne 1,65 (mobile 11,5 à 14 px, bureau 14 à 16 px, 72 caractères au plus). Elle prend l'allure d'un affichage d'instrument plutôt que d'un bloc de texte de site classique.
- Sous-titres des scènes (`.head p.sub`) : même traitement, resserrés (la monospace est plus large) pour tenir sur 3 à 4 lignes sans passer derrière la montre. Bloc « Typographie » en fin de `loop.source.css`.
- Chiffres de données (`.mcard .proof b`, `.pl-metrics b`) et noms d'étapes du menu (`.menu ol .m`) passent en monospace (ce sont des données ou de l'interface, pas des titres).
- Cadran de la montre (`assets/loop/loop.js`, textures canvas) : les polices `"Inter"` deviennent `"JetBrains Mono"`, avec des tailles réduites d'environ 15 % pour la même emprise.
- `assets/css/fonts.css` : la plage de graisses déclarée de JetBrains Mono passe de 400-500 à 400-700 (police variable), pour éviter un faux gras.
- `nuxt.config.ts` : JetBrains Mono est préchargée avec Inter, car c'est le texte du premier affichage de l'accueil.

## Accessibilité
- Tailles mini : 11,5 px sur très petit écran (texte d'accroche), 12 px et plus ailleurs ; zoom du texte à 200 % : les lignes passent à la ligne sans coupure horizontale (vérifié : aucun débordement).
- Les contrastes ne changent pas (couleurs inchangées).
- Une monospace fatigue davantage sur les longs paragraphes : l'accroche reste courte (deux phrases) et les textes longs gardent un interligne de 1,6 à 1,8.
