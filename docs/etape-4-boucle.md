# Étape 4 — l'accueil « boucle infinie » dans le dépôt Nuxt (branche feat/ascension)

Statut (01/10/2026) : **intégration faite et testée sur une copie du dépôt GitHub public** (branche `feat/ascension-boucle`, un commit, `nuxt build` réussi, navigation `/boucle` ↔ `/projects` sans fuite de styles). **Non poussé** : mon environnement n'a pas d'identifiants GitHub. Fichiers fournis : `0001-feat-boucle-accueil-en-boucle-infinie.patch` (à appliquer avec `git am`) et `feat-ascension-boucle.bundle`. La documentation du dépôt est dans `docs/ascension-boucle.md` (livrée dans le commit). Le dossier `nuxt-integration/` ci-dessous est l'ancienne livraison, remplacée par le commit.

## Ce qui est livré (dossier `nuxt-integration/`)
| Fichier à copier | Destination dans le dépôt | Rôle |
|---|---|---|
| `assets/loop/loop.html` | `assets/loop/loop.html` | Balisage de la boucle (19 Ko) : tout le texte est en HTML, rendu côté serveur |
| `assets/loop/loop.css` | `assets/loop/loop.css` | Styles (33 Ko), chargés seulement sur les pages de la boucle |
| `assets/loop/loop.js` | `assets/loop/loop.js` | Module `initLoop(THREE)` (162 Ko) : 3D, parcours guidé, sons, qualité adaptative ; renvoie `{destroy()}` |
| `components/loop/LoopHome.vue` | `components/loop/LoopHome.vue` | Monte la boucle (SSR du balisage, 3D au montage, nettoyage au démontage) |
| `layouts/loop.vue` | `layouts/loop.vue` | Mise en page sans en-tête ni pied de page du site |
| `pages/boucle.vue` | `pages/boucle.vue` | Route de test `/boucle` ; l'accueil actuel `/` reste inchangé |

## Vérifié
- Les trois fichiers découpés, chargés dans une page de simulation Nuxt (balisage injecté, styles, module ES, three r128 en module) dans un vrai navigateur sans interface : même rendu que le prototype, aucune erreur ; **démontage** (`destroy`) : DOM vidé, `overflow` et `data-q` remis à zéro ; **remontage** : la boucle redémarre (547 éléments) sans erreur.
- Les trois fichiers Vue compilent (`@vue/compiler-sfc`).
- **Non vérifié** : `npm run dev` / `nuxt build` du dépôt, le rendu serveur réel, l'ordre des feuilles de style avec Tailwind 4, la mémoire et les contextes WebGL après plusieurs allers-retours de navigation.

## Points d'attention (à traiter par Claude Code, dans cet ordre)
1. **Three.js r128 en alias** : `npm i three-r128@npm:three@0.128.0`. Le prototype dépend de l'API et de l'éclairage de r128 ; avec une version récente (≥ r155) les lumières ponctuelles et les couleurs changent. Ne pas toucher au `three` du reste du site (TresJS est désactivé, cf. audit étape 1).
2. **Styles globaux** (`html`, `body`, `:root`, variables `--bg`, `--fg`, `--acc`) : ils ne doivent pas rester chargés hors de la boucle. `useHead` les retire au démontage ; vérifier en naviguant de `/boucle` vers `/projects` et retour. Tailwind 4 range son préflight dans `@layer base` : les styles sans couche de `loop.css` l'emportent ; à confirmer visuellement (boutons, titres).
3. **Polices** : la boucle utilise Fraunces, Space Grotesk et JetBrains Mono (lien Google Fonts dans `LoopHome.vue`). Le dépôt utilise DM Serif Display et Inter : **décision d'Adri à prendre** (garder les deux familles seulement sur la boucle, ou aligner tout le site). À terme, auto-héberger les polices (RGPD, performance) plutôt que Google Fonts.
4. **Mode nuit** : la boucle a son propre bouton « Mode nuit » (clé de stockage `asc-…`) ; le site a `ThemeToggle` (`.dark`, `@nuxtjs/color-mode`). Règle déjà décidée : la préférence du visiteur l'emporte toujours. Brancher l'un sur l'autre (lire `useColorMode()` au démarrage, écrire au clic).
5. **Pages légales** : les fenêtres « Mentions légales » et « Déclaration d'accessibilité » du prototype contiennent des champs à renseigner (SIRET, adresse, e-mail légal, état de conformité après audit RGAA). Les remplacer par de vraies pages `/mentions-legales` et `/accessibilite`.
6. **Contenu réel** : constante `CONTACT` (e-mail, LinkedIn, lien de rendez-vous) à renseigner ; liste réelle des projets (`PROJECTS`, en début du module du parcours) à brancher sur le store `stores/projects.ts` (Mongo) au lieu des six blocs provisoires ; pile technique de la DGFiP ; chiffres à valider (« −50 % », « 7 langues ») ; CV PDF dans `public/cv-adrien-neyron.pdf`.
7. **Parité avec /projects** (relevé du 30/09/2026, voir design_boussole-boucle.md) : filtres par catégorie, compteur, message vide, fiche topo et titres du site avaient été ajoutés puis **annulés** à la demande d'Adri ; à reprendre si besoin.
8. **Son** : le prototype synthétise ses sons ; le site a `NATURE.mp3` (bouton « Move It »). Décider lequel garder.
9. **Une seule scène à la fois** : le module crée 5 contextes WebGL qui s'activent selon la scène visible. Mesurer sur un téléphone de milieu de gamme ; le mode économe se déclenche seul sous 30 images par seconde.

## Contrôles à chaque étape (exigence d'Adri : WCAG et RGAA, site documenté)
- Lighthouse (mobile) : LCP, TBT, accessibilité ; la 3D doit se charger après le contenu (c'est le cas : import dynamique au montage).
- Audit RGAA : titre de page, lien d'évitement, focus visible, cibles ≥ 44 px, contrastes (le fond et les textes ont été choisis pour AA ; à re-mesurer sur le rendu réel), `prefers-reduced-motion` → vue statique, bouton Pause, clavier complet, annonces `aria-live`.
- Documentation : mettre à jour `CLAUDE.md` (section « Refonte L'ascension ») et ajouter `docs/ascension-boucle.md` (architecture : balisage / styles / module ; qualité adaptative ; parcours guidé ; textes ; points d'attention ci-dessus).

## Prompt pour Claude Code (à coller dans VS Code, dépôt adrien-portfolio-nuxt, branche feat/ascension)
```
Contexte : lis CLAUDE.md (section « Refonte L'ascension ») et dev/etape-4-boucle.md.
Objectif : intégrer l'accueil « boucle infinie » sur la route /boucle, sans modifier / pour l'instant.

1. Copie les fichiers de nuxt-integration/ aux emplacements indiqués dans dev/etape-4-boucle.md.
2. Installe three@0.128.0 sous l'alias three-r128 (npm i three-r128@npm:three@0.128.0). Ne change pas la version de three utilisée par le reste du site.
3. Lance npm run dev. Corrige uniquement ce qui empêche /boucle de s'afficher et de fonctionner (imports ?raw / ?url, typage, SSR). Ne réécris pas loop.js : si un correctif est nécessaire, fais le plus petit possible et note-le.
4. Vérifie en navigateur : accueil de /boucle, bouton « Commencer l'expédition » (parcours guidé de 12 étapes, pause, étape suivante, arrêt), vue statique avec « prefers-reduced-motion », navigation /boucle → /projects → /boucle (les styles de la boucle ne doivent pas fuir sur /projects ; aucune erreur console ; pas de contextes WebGL qui s'accumulent).
5. Ne touche ni à Mongo ni à Postgres ni à l'admin Auth0.
6. Mets à jour CLAUDE.md et crée docs/ascension-boucle.md. Liste à la fin ce qui reste à décider (polices, mode nuit, pages légales, contenu réel).
7. Ne committe pas : montre le résultat, je teste d'abord.
```


## Mise à jour 01/10/2026 : polices et accueil
- La boucle est servie sur `/` ; l'ancien accueil `/camp-de-base` redirige (301) vers `/` depuis le 19/10/2026.
- Polices tranchées : DM Serif Display, Inter, JetBrains Mono (patch `0002-polices-dm-serif-display-inter.patch`, à appliquer après `0001`).
- Bracelet fermé en anneau complet (patch `0003-bracelet-ferme.patch`, à appliquer après `0002`).
- Palette « Nuit Polaire & Aurore Boréale » (patch `0004-palette-nuit-polaire.patch`, à appliquer après `0003`).
- Ruban des qualités sans puces (patch `0005-sans-puces.patch`, à appliquer après `0004`).
- Transition de la plongée dans le verre en tempête de neige (patch `0006-tempete-de-neige.patch`, à appliquer après `0005`).
- Halo de la transition fait par l'aiguille qui clignote (patch `0007-aiguille-clignotante.patch`, à appliquer après `0006`).
- Halo plus discret et fil conducteur supprimé (patch `0008-halo-discret-sans-fil.patch`, à appliquer après `0007`).
- Ruban des qualités supprimé (patch `0009-sans-ruban-qualites.patch`, à appliquer après `0008`).
- Tempête de neige supprimée de la transition (patch `0010-sans-tempete.patch`, à appliquer après `0009`).
- Menus burger Étapes et Outils (patch `0011-menus-burger.patch`, à appliquer après `0010`).
- L'accueil se fond dans la carte (patch `0012-fond-accueil-vers-carte.patch`, à appliquer après `0011`).
- Courbes de niveau qui suivent la trace (patch `0013-courbes-suivent-la-trace.patch`, à appliquer après `0012`).
- Verre aligné sur la carte (patch `0014-verre-aligne-sur-la-carte.patch`, après `0013`).
- Fond minéral et nocturne (patch `0015-fond-mineral-nocturne.patch`, après `0014`).
- **Fond minéral annulé** (patch `0016-annule-fond-mineral.patch` : à appliquer seulement si `0015` l'a été ; sinon ignorer `0015` et `0016`).
- Maillage 3D au premier plan devant la montre (patch `0017-maillage-premier-plan.patch`, à appliquer après `0014` ; sans `0015` ni `0016`, ou après `0016` si `0015` a été appliqué).
- Maillage 3D de premier plan renforcé (patch `0017-maillage-premier-plan.patch`, à appliquer après `0014` ; `0015` et `0016` ne sont pas nécessaires).
- Nappe de premier plan plus lente (patch `0018-nappe-plus-lente.patch`, à appliquer après `0017`).
- Sol rocheux et profondeur de champ (patch `0019-sol-rocheux-profondeur-de-champ.patch`, à appliquer après `0018`).
- Sol rocheux photographique et profondeur de champ marquée (patch `0019-sol-rocheux-profondeur-de-champ.patch`, **1,9 Mo avec les textures**, à appliquer après `0018`). Attention : il contient les fichiers `public/loop/rock-*.jpg` (licence CC BY 4.0, crédit dans les mentions légales).
- **Sol photographique annulé** (patch `0020-annule-sol-rocheux.patch` : à appliquer seulement si `0019` l'a été ; sinon ignorer `0019` et `0020`). État final attendu : `0001` à `0014`, puis `0017` et `0018`.
- Pierres plus travaillées (patch `0021-pierres-travaillees.patch`, à appliquer après `0018` ; `0019` et `0020` ne sont pas nécessaires).
- Chaussures de trail à lampe frontale, d'après l'image de référence (patch `0022-chaussures-trail-lampe-frontale.patch`, à appliquer après `0021`).
- Mots géants de fond supprimés (patch `0023-sans-mots-geants.patch`, à appliquer après `0022`).
- Menus en médaillons d'acier : rose des vents (étapes) et roue crantée (outils) (patch `0024-menus-rose-des-vents-et-roue-crantee.patch`, à appliquer après `0023`).
- En-tête : marque Cordée (mousqueton et nom) au centre, « Étapes » à gauche et « Outils » à droite (patch `0025-entete-marque-cordee-au-centre.patch`, à appliquer après `0024`).
- Icônes de l'en-tête harmonisées avec le logo (cuivre, maillage en pointillé) (patch `0026-icones-entete-style-logo.patch`, à appliquer après `0025`).
- « Passer l'intro » supprimé et « Commencer » en élément filaire couché dans la scène (patch `0027-commencer-filaire-sans-passer-intro.patch`, à appliquer après `0026`).
- Cartes de l'atelier cliquables, avec fiche descriptive du projet (patch `0028-cartes-atelier-cliquables-fiche-projet.patch`, à appliquer après `0027`).
- Liens de tous les projets, fiches sur la carte, contact réel et bouton d'administration (patch `0029-liens-projets-et-bouton-admin.patch`, à appliquer après `0028`).
- Interface allégée (en-tête textuel, points d'étapes, bloc de données épuré) et serif Cormorant Garamond auto-hébergée (patch `0030-interface-allegee-serif-raffinee.patch`, **171 Ko avec les polices**, à appliquer après `0029`).
- Nouvelle accroche sous le titre de l'accueil (patch `0031-accroche-accueil.patch`, à appliquer après `0030`).
- Accroche « Architecte de données et de l'interface… » sous le titre de l'accueil (patch `0031-accroche-accueil.patch`, à appliquer après `0030`).
- Étapes sur la barre de progression, plaque d'étape à la place des coordonnées et texte du Départ « 2009–2021 Éducateur, Formateur, Directeur dans le secteur sportif » (patch `0032-etapes-sur-la-barre-et-depart.patch`, à appliquer après `0031`).
- Barre de progression : une flèche vers le bas à la place du point (patch `0033-fleche-barre-de-progression.patch`, à appliquer après `0032`).
- Courbes de niveau et itinéraire fluides : points GPS lissés, relief flouté et ré-échantillonné en cubique (patch `0034-courbes-et-itineraire-fluides.patch`, à appliquer après `0033`).
- La trace passe sous les blocs de projets, reste visible sur tout son tracé et se termine sur l'étape « À déterminer » (patch `0035-trace-sous-les-projets-et-suite.patch`, à appliquer après `0034`).
- Trace continue, non bouclée : la boucle GPS est ouverte par un décalage progressif (jusqu'à 4,2 km) pour que l'arrivée soit loin du départ (patch `0036-trace-continue-non-bouclee.patch`, à appliquer après `0035`).
- Chiffres de la Diagonale des Fous (≈ 180 km, ≈ 10 200 m D+) : total sous le titre de la carte et kilomètre et dénivelé cumulés à chaque étape, valeurs intermédiaires simulées (patch `0037-chiffres-diagonale-des-fous.patch`, à appliquer après `0036`).
- Ordre des projets repris du CV (Stockpulse, HelloStay, DGFiP, Tyredating/Click2SellSite, puis projets personnels), avec périodes et contenus du CV (patch `0038-ordre-des-projets-du-cv.patch`, à appliquer après `0037`).
- Compteur de km et de D+ évolutif sous le titre de la carte, sans signe d'approximation (patch `0039-compteur-km-dplus-evolutif.patch`, à appliquer après `0038`).
- Trace fine d'épaisseur constante en blanc givre avec halo émeraude, bien distincte des courbes cuivrées (patch `0040-trace-fine-blanc-givre.patch`, à appliquer après `0039`).
- Trace un peu plus marquée : traits de 4,6 px (parcouru) et 3 px (à venir), halo et lueur plus présents (patch `0041-trace-plus-marquee.patch`, à appliquer après `0040`).
- Texte technique du bas à gauche (altitude, scène, lieu) masqué pendant la traversée de la carte (patch `0042-sans-texte-technique-sur-la-carte.patch`, à appliquer après `0041`).
- Barre de progression aux couleurs de la trace : parcouru en blanc givre avec halo émeraude, reste en gris-bleu, flèche blanc givre (patch `0043-barre-de-progression-couleurs-de-la-trace.patch`, à appliquer après `0042`).
- Barre de progression : cuivre pour la boucle, blanc givre et émeraude pour la trace, en fondu avec la carte (patch `0044-barre-cuivre-boucle-et-blanc-givre-trace.patch`, à appliquer après `0043`).
- Technologies gravées sur la face des blocs de projets, plus de pastilles flottantes (patch `0045-technologies-gravees-sur-les-blocs.patch`, à appliquer après `0044`).
- Appel à l'action unique à la dernière étape (« Définir la prochaine étape », vers le contact), plaque redondante masquée, contrastes visés AAA sur les textes secondaires et sur les faces des blocs (patch `0046-cta-unique-et-contrastes-aaa.patch`, à appliquer après `0045`).
- Un seul bloc d'interaction par étape : bloc 3D touchable, bouton contextuel unique, plaque supprimée sauf au Départ (opaque), période du CV gravée sur le bloc, caméra centrée sur le bloc (patch `0047-bloc-unique-touchable-et-plaque-lisible.patch`, à appliquer après `0046`).
- Chaussure de l'étape Persévérer d'après la photo, sans lampe : tricot brun, semelle claire à strates mouchetées (patch `0048-chaussure-perseverer-d-apres-la-photo.patch`, à appliquer après `0047`).
- Rendu studio de la chaussure marron (hors site) : page `studio-chaussure.html` et image `rendu-studio-chaussure.png` ; pas de patch (le site n'est pas modifié).
- Silhouette de la chaussure affinée : profil plus bas, col creusé, bout effilé et relevé, crampons plus petits (patch `0049-silhouette-chaussure-affinee.patch`, à appliquer après `0048`).
- Chaussure : languette matelassée arquée, pointe plus fine, courbure partagée par la tige et la semelle, mousse relevée au talon (patch `0050-languette-pointe-courbure-talon.patch`, à appliquer après `0049`).
- Chaussure au plus près de la photo : languette évasée, bourrelet du col, pointe arrondie, brun neutre, semelle grise mouchetée, lignes topographiques (patch `0051-chaussure-au-plus-pres-de-la-photo.patch`, à appliquer après `0050`).

- 0052 — chaussure : languette matelassée en renflement (`tgH`, `tgA`, `tgBump`, `ysf`), lacets qui la recouvrent, semelle intérieure sombre, bourrelet de col sans moiré. Se termine après 0051 ; modifie uniquement `assets/loop/loop.js`.
- 0053 — chaussure : lacets croisés fins avec œillets (après 0052, `loop.js` seul).
- 0054 — chaussure : bord de semelle en vagues (après 0053, `loop.js` seul).
- 0055 — chaussure : semelle plus épaisse, talon plus galbé (après 0054, `loop.js` seul).
- 0056 — chaussure : languette de talon plate, attachée aux deux bouts (après 0055, `loop.js` seul).
- 0057 — chaussure : semelle blanche, vagues retirées, languette du laçage matérialisée par un panneau clair et un liseré (après 0056, `loop.js` seul).
- 0058 — chaussure : languette continue sans marche, coussin moins épais, bout de la même couleur que la tige (après 0057, `loop.js` seul).
- 0059 — chaussure : tricot en normal map + rugosité (mailles plus fines), occlusion peinte au raccord semelle, semelle EVA mate sans strates, lacets tressés (après 0058, `loop.js` seul). Bloom et profondeur de champ non faits.
- 0060 — chaussure : refonte complète d'après la Salomon Ultra Glide 4 (semelle épaisse alvéolée, mesh crème, fenêtre de languette, lacets croisés fins). Remplace buildShoe et supprime les anciennes textures du tricot (après 0059, `loop.js` seul).

## Chaussure — rapprochement de la photo (patch 0061, après 0060)

- Fichier : `assets/loop/loop.js`, fonction `buildShoe` (palette `COL`, profils `Hh`, `Wx`, `rockF`, `topM`, `tipF`).
- `topM` inclut le rétrécissement des extrémités ; la tige part de `topM - .09` (recouvrement) ; `loftS` n'applique plus de rétrécissement propre.
- Texture d'alvéoles : canevas 1040×200, motif hexagonal R = 5,2, points de rayon 1,9 estompés au-dessus de v ≈ .30–.44 ; `bumpMap` + `bumpScale .5`.
- Lumières de la scène chaussure (`init()`) : clé `0xFFE6D2`, point cuivre intensité 0,3.
- Test : balayage de défilement de la maquette (Chromium/SwiftShader), aucune erreur JS.
- Ordre des patchs : … 0052→0060 puis **0061**.

## Bivouac « Posons le sac » — refonte du rendu (octobre 2026)

Le camp 3D existant (`CAMP` dans `assets/loop/loop.js`) a été amélioré, pas remplacé par une image.

### Scène 3D
- **Flamme** : deux plans billboard (`buildFlame`) avec un shader procédural additif (cœur blanc-jaune, bord orange, scintillement lié à `stokeV`), tournés vers la caméra à chaque frame.
- **Étincelles** : 260 particules, émission 14 + 42·attisement /s, montée plus haute et durée de vie plus longue.
- **Sol** : texture de gravier sombre procédurale (`gravelTex`, bump léger) à la place de la mousse ; pierres désaturées (`color 0x948D86`) ; lumière lunaire froide (`DirectionalLight 0x7F9CD8`) pour les liserés.
- **Objets** : sac à dos marine avec sangles et bouteilles (`buildPack`), tas de bûches avec cernes (`buildLogs`), tapis de toile sous la montre (`buildCloth`), montre avec boucle de bracelet, gamelle en acier brossé.
- **Ciel** : courbes de niveau dessinées sur un canvas (`topoBg`) exposées via la variable CSS `--topo` et affichées par `#sky4::before` (couche statique, aucun repaint par frame).

### Carte de contact
- Effet verre : dégradé translucide, bordure cuivre, halo, `backdrop-filter: blur(14px)`.
- Titre ~44 px en serif italique ; pastilles E-mail / LinkedIn / GitHub contourées cuivre ; bouton « Envoyer » pleine largeur en dégradé cuivre (52 px de haut).
- Bouton « Prendre rendez-vous » masqué tant que `CONTACT.rdv` est vide (pas de bouton sans lien).

### Accessibilité (WCAG / RGAA)
- Labels **toujours présents** : `<label for>` conservés, placés après le champ dans un `.fld` et flottants (`:placeholder-shown`, `placeholder=" "`) — jamais de placeholder seul.
- Focus visible 2 px (`:focus-visible`) sur champs et bouton d'envoi ; cibles ≥ 44 px.
- `prefers-reduced-motion` : pas de transition des labels, flammes et étincelles sans oscillation.
- Canvas décoratifs `aria-hidden` ; carte en bottom-sheet défilable sous 760 px.

### Maintenance
- Après modification de `loop.source.css`, régénérer `loop.css` : `node scripts/scope-loop-css.cjs assets/loop/loop.source.css assets/loop/loop.css`.

## Bivouac — passe lumière, matières et post-traitement (11/10/2026, 2e itération)

### Feu et lumière
- `PointLight` orange `#FF7700` au centre du foyer, intensité modulée par plusieurs sinusoïdes (scintillement), plus fort quand on attise (`stokeV`).
- Étincelles ambrées : 260 particules additives qui montent en oscillant (`sSys`).
- **Bloom** : sprite additif autour du cœur de la flamme (`bloom`), opacité qui scintille. Choix délibéré : pas de `UnrealBloomPass` (dépend d'`EffectComposer`, coûteux sur mobile) ; le sprite donne le halo sans post-traitement.

### Matières PBR
- **Sol** : texture gravier 1024 px (répétition 6, grandes taches basse fréquence qui cassent le motif), `normalMap` et `roughnessMap` calculées depuis la texture (`gravelMaps`) : les cailloux clairs sont plus lisses et prennent les reflets rasants du feu.
- **Bûches** : géométrie irrégulière (`logGeo` : section bosselée, fléchissement, coupes obliques), écorce en relief, cernes sur les tranches ; bûches du foyer charbonnées (`charTex`) avec fissures qui rougeoient (carte émissive animée).
- **Tasse** : `metalness` 0,8, `roughness` 0,2, `envMap` du bivouac (cube nocturne chaud/froid) à 1,7.

### Objets
- **Montre GPS** (`buildWatchGps`) posée devant le feu : boîtier, lunette acier, bracelet, bouton, écran rétroéclairé (carte émissive) avec tracé et `ALT 277 m`.
- Sac de trail : arêtes arrondies (`roundBox`), toile mate type ripstop, flasques translucides avec liquide.

### Environnement
- `FogExp2` `#080C14`, densité 0,05 : noie l'horizon et raccorde le sol au ciel topographique.
- `.camp-fx` (loop.html / loop.source.css) : vignettage radial et grain (bruit SVG `feTurbulence`, `mix-blend-mode: overlay`), `aria-hidden`, `pointer-events: none`, statique donc compatible `prefers-reduced-motion`.
- Le ciel topographique est affiché par `#sky4::before` à 60 % d'opacité.

## Mode jour : couleurs et contrastes (11/10/2026)

- **Bracelet** : blanc en mode jour, noir en mode nuit (`strapApply` inversé).
- **Palette claire réellement utilisée** : en charte « expédition », le mode jour reprenait la palette de nuit (`LIGHT_E` n'utilisait pas `E_DAY`). `LIGHT_E` démarre maintenant sur `E_DAY` (fond #F4F8FA, texte #12222B, secondaire #435862, accent #B23F27) pour la montre et l'atelier, puis passe vite (p 0,15 → 0,19) à la palette sombre de la carte, de la forêt et du bivouac, qui sont des décors sombres : le texte y reste clair. Retour au clair en fin de boucle.
- **Contrastes mesurés** (variables CSS, fond clair) : texte 15,2:1, secondaire 7,0:1, accent 5,4:1 ; décors sombres : texte 17,7:1, secondaire 9,9:1, accent 6,2:1. Tous au-dessus du seuil AA, texte et secondaire au niveau AAA.
- **CSS** (bloc « Mode jour » en fin de `loop.source.css`, `loop.css` régénéré par `scripts/scope-loop-css.cjs`) : menu, titres, accroches, eyebrow et rail d'altitude suivent `--fg`, `--muted`, `--acc-text` ; les halos noirs derrière les textes deviennent des halos de la couleur du fond, plus larges pour rester lisibles devant la montre.
- **Relief en fil de fer** : en mode jour, les lignes passent en mélange normal et en teintes sombres (teal, cuivre foncé) ; le mélange additif les rendait invisibles sur fond clair (`sceneLt` dans la boucle de rendu).
- **Reste à faire, si souhaité** : une carte des projets claire (décor 3D actuellement sombre dans les deux modes).


## Mode jour : carte, flaque et bivouac clairs

En thème clair (`data-theme="light"`), les trois grandes scènes passent en version diurne. Les valeurs sont dans `assets/loop/loop.js` et `loop.source.css` (recompiler `loop.css` avec `scripts/scope-loop-css.cjs`).

- **Carte des projets (S2, `PARC`)** : ciel `SKYL`, lignes foncées (`parcTheme(L)`), palette de fond claire ; les textes restent lisibles (AA minimum).
- **Persévérer (S3, flaque, `SHOE`)** : uniforme `uDay` du shader de flaque, topographie atténuée (`topoSpr`), fond clair. En blending normal : l'additif est invisible sur fond clair.
- **Bivouac (S4, `CAMP`)** : ciel clair, soleil directionnel, brouillard bleuté ; **feu éteint** (bûches calcinées, aucune flamme ni étincelle, fumée du mug conservée) ; étoiles masquées. Le coefficient `fireK` coupe flamme, lueur et craquements ; `dayC` fait la transition jour/nuit. Carte de contact en verre clair (`.bivtext`).
- **Mode nuit** : inchangé (feu, étoiles).

### Points d'attention
- La scène 3D s'initialise en différé : la première visite de S3/S4 peut mettre plusieurs secondes. En cas d'échec, un `console.warn('[boucle] … indisponible')` est émis.
- Réglage possible : le gravier du bivouac est assez lumineux (soleil 1.55, hémisphère .55).
- Accessibilité : contrastes vérifiés visuellement (texte principal 15,2:1, secondaire 7,0:1, accent 5,4:1) ; un contrôle automatisé (axe) reste à faire sur S4.

## Sol de l'accueil en mode jour : dalles de sable
Le sol rocheux de l'accueil (`makeGroundTex`, cellules de Voronoï) a deux variantes : pierre bleutée la nuit, **dalles de sable** chaudes le jour (`makeGroundTex(true)`, texture créée à la première bascule en mode jour, `gtxDay`). Dans le bloc `sceneLt` de `loop.js`, le passage au jour change la texture et la teinte du matériau du sol (`gndMat`) et la couleur de la brume de la scène (`scene3.fog`, brume claire à l'horizon au lieu du bleu nuit). Les rochers restent en basalte sombre. Le bouton « Visite guidée » prend le texte sombre (`var(--fg)`) à halo clair sur ce sol plus clair.

## Bracelet de la montre en mode jour : surface lisse
En mode jour, le bracelet est blanc (texture `makeLoopStrap('blanc')` dans `assets/loop/loop.js`). Il avait un grain de points et un relief marqué (`bumpScale` 0,45) qui lui donnaient un aspect granuleux, comme mouillé. Désormais : aucun grain sur la texture claire, relief réduit à 0,08 (il ne reste que les sillons de bord et les trous de la queue) et rugosité 0,38 pour un silicone lisse et légèrement brillant. Le bracelet noir du mode nuit est inchangé (grain léger, `bumpScale` 0,5).

## Inclinaison de la montre : le sol ne coupe plus le bracelet
La montre se penche avec la souris (`stand.rotation.x` jusqu'à ≈ ±0,3 rad, `rotation.y` jusqu'à ≈ ±0,6 rad). Le bracelet formant un anneau derrière le boîtier, l'inclinaison faisait entrer sa partie basse sous le sol. `buildStrapRing` renvoie maintenant les points bas de l'anneau (`low`, mémorisés dans `strapLow`) ; à chaque image, le rendu calcule le point le plus bas après rotation (tangage puis lacet) et relève la montre de cette valeur (`stand.position.y -= m*scl`). Au maximum de l'inclinaison, la montre monte légèrement et le bracelet reste posé sur le sol, jamais coupé. Sans inclinaison, aucun décalage.

## Mode jour : fond de l'accueil « brume abricot » (12/10/2026)
Le fond du mode jour reprend l'image de référence (ciel abricot, brume gris-bleu à l'horizon, sable beige, filaire discret, bouton cuivre plein). Le mode nuit n'est pas modifié.

| Élément | Avant | Après |
|---|---|---|
| Ciel | fond clair uni + aurore menthe | dégradé fixe `body::after` : `#EBC39C` (sommet) → `#ECCDB5` → `#DDD8D4` → `#C8D7E1` → `#D2DDE3` (horizon) → `#DDE5E8`. Opacité `--sky` pilotée par `loop.js` (1 sur l'accueil, fondu avec le sol) ; `#main` passe au-dessus (`z-index:1`). Le canvas `#aurora` est masqué le jour. |
| Sol | dalles de sable orangées | sable beige craquelé, peu saturé (`makeGroundTex(true)`), joints plus sombres |
| Brume de distance | `#E4EEEA` | `#D8E0E4` : le sol se fond dans l'horizon gris-bleu |
| Filaire du relief | vert, bleu et rouge | gris-bleu `#7F95A6` / `#8E8F98`, uniform `uK` = 0,5 |
| Bouton « Visite guidée » | pastille claire à contour | bouton plein cuivre `#A8401B`, texte blanc (5,4:1), anneau supprimé ; au survol `#8F2F1B` ; focus : contour 3 px `--fg` |
| Accroche et surtitre | `--fg` et `--acc-text` | `#4E200E` (≈ 10:1 sur l'abricot) et `#7A2A0D` (≈ 6:1) |

Rappel : le ciel étant un dégradé CSS, le texte du haut doit rester foncé (zone abricot clair).

## Mode jour : cadran clair de la montre

Pour adoucir la transition entre le ciel clair « brume abricot » et la montre, le **cadran passe en clair en mode jour** (`assets/loop/loop.js`).

- **Palettes** : `DIAL_NIGHT` (fond `#050607`, traits blancs) et `DIAL_DAY` (fond papier `#F2EEE6`, traits encre `#1B1712`). `dialPal()` choisit selon `theme`.
- **Cuivre** : le N, « Résilience », l'angle et le trait de l'affichage passent à `#A8401B` (≈ 5,6:1 sur le papier). Textes secondaires `#554E43` / `#5F584D` / `#3F392F` (≥ 4,5:1).
- **Aiguille** : nord en cuivre `#D2672B` / `#A8401B`, sud en gris foncé `#4A4F55` / `#23272B`, pivot encre, pour rester visible sur le papier.
- **Application** : `applyDialTheme()` redessine le cadran, l'affichage central (cap / info au survol) et recolore l'aiguille. Elle est appelée à la création de la montre, au chargement des polices et au basculement jour/nuit.
- **Inchangé** : la lunette en acier brossé et le verre. Le mode nuit garde son cadran noir.
- **Transition clair → clair** : pendant la métamorphose (cadran → relief), `makeTopoTex()` écrit le relief sur le même papier `#F2EEE6` en mode jour (grille `rgba(60,90,120,.22)`, courbes de niveau cuivre foncé). Plus de passage par le noir. `applyDialTheme()` régénère cette texture quand le thème change (drapeau `topoDay`). En mode nuit, le fond reste `#050607`.

## Accueil : espace négatif entre le hero et la montre

Pour que le texte « respire », la composition a été allégée au centre.

- **Montre plus basse et plus petite** (`layoutTools()` dans `loop.js`) : centre du cadran à 57,5 % de la hauteur sur mobile (49 % avant) et 56 % sur ordinateur (52 % avant) ; rayon `0.33 × largeur` sur mobile (`0.375` avant) et `0.265 × min(L, H)` sur ordinateur (`0.30` avant), soit environ −12 %. Le sol, l'horizon et le massif suivent car ils dérivent de `LAY.cy` / `LAY.Rs`.
- **Hero remonté** (`loop.source.css`) : `#head1{top:calc(var(--hh) - 10px)}` (au lieu de `+ 6px`), le sur-titre, la citation et le paragraphe se rapprochent de l'en-tête. Seule la scène 1 est concernée.
- **Résultat mobile** : environ 85 px d'espace libre entre la dernière ligne du paragraphe et le haut du bracelet (le texte ne passe plus derrière la montre).
- `LAY` sert aussi à disposer les cartes de la scène « Outils » sur ordinateur : elles s'organisent autour de la montre réduite.

## Hero de l'accueil : hiérarchie, paragraphe resserré, scrim atmosphérique

Bloc ajouté à la fin de `assets/loop/loop.source.css` (section « Hero »), recompilé en `loop.css`.

- **Sur-titre** (`#head1 .who`) : 12 px, capitales, `letter-spacing:.14em`. En mode jour, cuivre brûlé `#9A4A1B`.
- **Citation** (`#head1 h1`) : serif italique, un cran au-dessus : `clamp(2rem,8.6vw,2.2rem)` sur mobile, `clamp(2.4rem,3.9vw,3.1rem)` sur ordinateur.
- **Paragraphe** (`#head1 .lede`) : monospace, `max-width:min(520px,100%)`, centré. En mode jour, anthracite `#2C2825` à 85 % d'opacité, `line-height` 1,65. Sur ordinateur : 3 lignes. Sur mobile, la largeur utile (≈ 360 px) donne 3 lignes à 14 px.
- **Scrim** (`#head1::before`, mode jour seulement) : lueur radiale crème `rgba(252,247,238,.88 → 0)`, `ellipse closest-side` pour qu'elle s'éteigne exactement au bord de la zone (aucune arête visible), `pointer-events:none`, `z-index:-1` dans un `isolation:isolate`. Aucune boîte : le texte est isolé du ciel et du sol 3D.
- **Contrastes mesurés** (scrim entre 50 et 88 % sur le ciel pêche) : paragraphe 7,4 à 8,4:1 (AAA) ; sur-titre 4,7 à 5,6:1 (AA, 12 px). `#9A4A1B` ne peut pas dépasser 7:1 sur ce fond ; il faudrait `#7A2A0D` (déjà utilisé avant).
- **Mode nuit** : couleurs inchangées, seules la taille, la casse et la largeur sont partagées.

## Accueil grand écran : disposition asymétrique (texte à gauche, montre en 3/4 à droite)

Active à partir de **1000 px de large** (hors mobile). En dessous, la composition empilée reste inchangée.

- **Texte** (`loop.source.css`, bloc `@media (min-width:1000px)`) : `#head1` ancré à gauche (`left:clamp(48px,6vw,120px)`), aligné à gauche, largeur `min(440px,34vw)`, placé à environ 16 % de la hauteur sous l'en-tête. Le paragraphe garde sa mise en forme monospace (15 px, interligne 1,65). Le scrim crème (`#head1::before`) est élargi pour suivre le bloc.
- **Montre** (`loop.js`, `layoutTools()` puis la boucle de rendu) : `LAY.sx` = décalage horizontal (20 % de la largeur). Sur l'accueil, `stand.position.x` décale la montre vers la droite et `stand.rotation.y` ajoute **−0,42 rad (≈ 24°)** : vue de trois quarts, cadran tourné vers le texte. Taille restaurée (`Rs = 0.30 × min(L, H)`, centre à 54 % de la hauteur) puisqu'il n'y a plus de chevauchement possible.
- **Chorégraphie** (grand écran seulement ; sur mobile le texte reste visible dès le départ) :
  1. **Départ** (p = 0) : la montre est seule, au centre, sans texte.
  2. **Glissement** (p 2 → 6 %) : la montre se décale à droite et pivote en 3/4 pendant que le texte du hero apparaît (`head1`, opacité 3 → 6 %).
  3. **Retour** (p 7,5 → 12 %) : le texte s'efface (7,5 → 10 %) et la montre revient au centre, de face, avant le zoom.
  4. **Texte suivant** : le titre « S'équiper » apparaît à partir de 11 % (plein à 14 %, visible jusqu'à 24 %, effacé à 28 %).
  Le facteur `hk = sm(.02,.06,p) × (1 − sm(.075,.12,p))` pilote le décalage (`stand.position.x`) et la rotation (−0,42 rad). Il vaut 0 en fin de boucle, donc la boucle recommence sur la montre centrée. Le zoom, la métamorphose en carte et les autres scènes ne changent pas.
- **Mode statique** (« réduire les animations » ou bouton) : tout est visible en même temps, donc `hk = 1` (disposition asymétrique fixe).
- **Liens avec la projection** : le centre du cadran à l'écran (`DIAL.cx`) est recalculé à chaque image, donc l'aiguille du préchargement, la nappe de relief et les zones de survol suivent la montre. L'aiguille vise maintenant le curseur depuis le vrai centre du cadran (`DIAL.cx/cy`). Le halo `#spot` suit aussi la montre.
- **Non modifié** : le bouton « Visite guidée » reste centré en bas, la barre de pied de page également.
- **Cailloux autour du bracelet** : les cinq cailloux de `sceneryNear` restent posés au sol (ils ne suivent pas la montre). En disposition asymétrique, deux d'entre eux (ceux qui se trouveraient sur le trajet de la montre ou à sa position décalée) sont placés ailleurs via `userData.alt` : un devant (`[1.9, 3.4]`), un à droite de la montre décalée (`[xs + 3.6, 0.6]`, `xs` = décalage en unités du monde). Le couloir de 0 à `xs` est ainsi libre. Les gros rochers du premier plan (`farRocks`) sont placés en coordonnées d'écran (`u` = position horizontale, `dep` = angle sous l'horizon). En disposition asymétrique, trois d'entre eux, qui tombaient sur le bracelet (`FAR_ALT` : rochers 5, 9 et 11), sont repositionnés à gauche dans `buildMountains()`. Règle à respecter : aucun rocher ne doit se trouver dans la bande de profondeur du bracelet (angles ≈ 5,5–9°) entre la position centrée de la montre (`u` ≈ −0,18 à 0,18) et sa position décalée (`u` jusqu'à ≈ 0,6).

## Pas de retour en arrière avant l'accueil

Avant : tout en haut de la page, un coup de molette vers le haut (plus de 140 px cumulés), ↑ ou Page haut renvoyait à la **fin** de la boucle (`jumpTo(.9996)`), comme si la page était circulaire dans les deux sens.

Maintenant (`loop.js`) : les écouteurs `wheel` et `keydown` qui faisaient ce saut ont été supprimés. Remonter s'arrête sur le premier écran (accueil, `scrollY = 0`). Seul le sens avant reboucle : arrivé à la fin, le défilement revient à l'accueil (`jumpTo(.0004)`), et le bouton « Recommencer » ou le logo y ramènent aussi. Vérifié : 6 coups de molette vers le haut, ↑ et Page haut à `scrollY = 0` laissent `scrollY` à 0.

## Mode jour : montagnes visibles dès le début, fils plus contrastés

- **Visibilité dès l'accueil** (`loop.js`, boucle de rendu) : en mode jour, le facteur `calm` (qui atténuait les crêtes à 18 % sur le premier écran) vaut 1. Les montagnes sont donc pleinement visibles dès p = 0. En mode nuit, l'atténuation d'origine est conservée (la montre y est en vedette).
- **Contraste des fils** : couleurs jour passées de `#7F95A6` / `#8E8F98` à **ardoise `#27465C` (gauche) et cuivre brûlé `#8A3A18` (droite)**, opacité `uK` de 0,5 à 0,95 (`mtnMat` et `nearMat`). Mélange normal conservé (le mélange additif est invisible sur fond clair).
- **Texte** : sur grand écran, les crêtes passent derrière la fin du paragraphe ; le scrim crème du hero descend plus bas (`inset` bas −96 px) pour garder le contraste du texte.
- **À surveiller** : les fils foncés sont plus présents, notamment devant le bracelet sur mobile. Si c'est trop chargé, baisser `uK` (ex. 0,8) plutôt que de revenir aux anciennes couleurs.

## Accueil : montre remontée (informations moins concentrées en bas)

`layoutTools()` dans `loop.js` : position verticale du centre du cadran (`LAY.cy`, en fraction de la hauteur) remontée pour libérer le bas de l'écran (bouton « Visite guidée », CV / Contact, altitude, indicateurs).

| Écran | Avant | Après |
|---|---|---|
| Mobile (< 900 px) | 57,5 % | **55,5 %** |
| 900 à 1000 px | 56 % | **53 %** |
| Grand écran, disposition asymétrique (≥ 1000 px) | 54 % | **50 %** |

Sur mobile, la montre ne peut pas monter davantage : le texte du hero (4 lignes) occupe le haut de l'écran, et à 54,5 % le haut du bracelet touchait la dernière ligne. À 55,5 % il reste un peu d'air. La navigation n'est pas touchée : `LAY.cy` sert aussi à placer les cartes de la scène « Outils » autour de la montre et la projection du cadran suit automatiquement.

## Liens des outils : réservés à la partie « S'équiper »

Les cartes d'outils (`#tools li`, boutons qui ouvrent les liens) ne sont ni visibles, ni cliquables, ni atteignables au clavier en dehors de la scène « S'équiper ».

- **Mécanisme** (`loop.js`, `draw`) : une carte est en `visibility:hidden` tant que son opacité est inférieure à 0,04, ce qui la retire du clic et de l'ordre de tabulation (WCAG 2.1.1 / 2.4.3, RGAA 7.3 et 12.8 : pas de contrôle invisible qui reçoit le focus).
- **Fenêtre d'apparition** : `CS` (début) et `CST` (décalage entre cartes). Grand écran en disposition asymétrique : `CS = .12`, `CST = .016` (les cartes arrivent après le retour de la montre au centre et le titre « S'équiper »). Autres écrans : `CS = .07`, `CST = STEP`. Fin commune : fondu entre 24 % et 28 %.
- **Vérifié** (1280 × 800) : cartes masquées sur le hero, pendant le glissement de la montre et après la scène ; les six sont visibles et focusables uniquement dans la fenêtre « S'équiper ».
- **Mode statique** : inchangé, tout est affiché.

## Accueil : identité sur le cadran (13/10/2026)

**Cadran** (`makeDial()` dans `loop.js`) : le texte technique (« COMPÉTENCES : Vue 3 | TypeScript ») est retiré du cadran, les technologies restent dans la scène « S'équiper ». À la place, en haut du cadran :
- le nom **ADRIEN NEYRON** (68 px sur la texture du cadran, couleur d'encre) ;
- le titre **DÉVELOPPEUR × TRAILEUR × FORMATEUR** (31 px, couleur d'accent `P.N`, contraste ≥ 4,5:1 en jour comme en nuit).
Le point d'interaction central (`HOT.stack`) s'appelle maintenant « Adrien Neyron : Développeur, traileur, formateur. ». Le texte pour lecteur d'écran (`sr-only`) conserve la liste des compétences.

**Menu radial** : testé puis retiré à la demande d'Adri (13/10/2026). La navigation reste le menu « Étapes | Outils » de l'en-tête.

## Marque « Cordée » : couleur, contraste et position (13/10/2026)

Avant : logo et nom gardaient la couleur de la nuit (`#EE9468`, environ 2:1 sur le ciel abricot) et étaient collés au bord gauche (6 px). Une première version avec badge crème a été testée puis retirée à la demande d'Adri (pas de fond).

Maintenant (`loop.source.css`, fin du fichier) :
- **Position** : à partir de 1000 px, la marque est alignée sur la marge gauche du contenu (`left:clamp(48px,6vw,120px)`, comme le texte du hero) et centrée verticalement dans l'en-tête (`top:calc((var(--hh) - 52px) / 2)`), sur la même ligne que « Étapes | Outils ». En dessous, position d'origine.
- **Mode jour** : **sans fond**, logo et nom en **ardoise `#27465C`** (mousqueton compris), la couleur du relief en jour : la charte reste cohérente (un essai en vert menthe a été retiré), nom en gras 12 px (14 px dès 900 px) avec un léger halo crème. Contraste de 6,3:1 sur le ciel abricot. Survol : `#16303F`. Focus clavier : contour de 3 px `#1B1712`.
- **Détails du mousqueton** (mode jour) : le petit portillon (rectangle) passe aussi en ardoise avec un fond papier `#F2EEE6`, ses traits en ardoise, et le reflet devient crème ; plus aucun cuivre dans le logo.
- **Sous 640 px** : seul le logo est affiché (le nom reste dans le libellé accessible).
- **Mode nuit** : couleur d'origine, seule la position change.

## Écran de la corde et préchargement : mode jour ou nuit (13/10/2026)

Avant : l'écran de la corde (`.gate`) était toujours noir, même en mode jour, et le thème n'était posé qu'une fois la boucle chargée (`loop.js`) : pendant le préchargement, le fond suivait seulement la préférence du système.

Maintenant :
- **Thème posé dès le premier rendu** : le script d'en-tête de `components/loop/LoopHome.vue` lit `localStorage` (`asc-theme`, sinon la préférence du système) et pose `data-theme` sur `<html>` avant l'affichage ; `loop.js` prend ensuite le relais sans changement visible.
- **Mode nuit** : inchangé (fond noir bleuté, corde cuivre, braises).
- **Mode jour** (`loop.source.css`, fin du fichier) : fond crème (`#FFFCF7` → `#F7EFE3` → `#EBDFCF`), courbes de niveau et montagnes en tons ardoise clair, lueur cuivre atténuée, sans braises, « ordée » en `#8F2F1B` (contraste ≥ 6:1 sur le crème), accroche en `#4E200E`, focus du bouton en `#1B1712`. La corde et le bouton cuivre gardent leurs couleurs.
- **Aiguille de préchargement** : elle se pose sur le fond du mode courant (crème ou noir), pas de flash de l'autre couleur.

**Aiguille de préchargement en mode jour** : ses facettes sont directement aux couleurs finales de l'aiguille 3D du cadran clair (`applyDialTheme()`) : nord `#D2672B` et `#A8401B`, sud `#4A4F55` et `#23272B` (au lieu du blanc et du gris clair, invisibles sur fond crème), pivot `#1B1712`. Au relais avec la montre 3D, plus de changement de teinte. Mode nuit inchangé.

**Séparateur et soulignement de l'en-tête (mode jour)** : le trait entre « Étapes » et « Outils » et le soulignement au survol ou à l'ouverture des boutons passent en ardoise `#27465C`, comme le logo (soulignement porté à 2 px) ; le bouton ouvert est en `#16303F` (il était en crème, invisible sur fond clair). Mode nuit inchangé.

**Pied de page : inscriptions centrées dans la bande** : `footer.perma` passe de 52 à 62 px de haut (`loop.source.css`, fin du fichier) et son contenu (copyright, boutons CV / Contact, icônes) est centré verticalement dans toute la bande, sans marge basse asymétrique (seule la zone de sécurité des téléphones est conservée). Les inscriptions sont ainsi 5 px plus haut qu'à l'origine, au centre exact de la bande dégradée. Une première version avec 10 px de marge basse les plaçait trop haut dans la bande, elle a été remplacée.

**Bandeau du pied de page : dégradé plus haut et couleur du fond** : le dégradé n'est plus sur `footer.perma` (52 à 62 px) mais sur son pseudo-élément `::before`, haut de `clamp(120px, 22vh, 240px)` : il part de transparent et monte en 4 paliers (0, 32, 72, 94 % d'opacité). Sa couleur reprend celle du haut du fond : nuit `#050811` (ciel bleu nuit), jour `#EBC39C` (abricot du sommet du ciel), via la variable `--ft`. Le texte de copyright passe en `#4E200E` en mode jour (le gris `--muted` tombait sous 4,5:1 sur l'abricot). `pointer-events:none` : le bandeau ne bloque aucun clic.

**« Étapes » et « Outils » en mode jour** : texte des deux boutons de l'en-tête en `#12222B` (contraste d'environ 10:1 sur le ciel abricot), y compris à l'état ouvert (le `#16303F` mis plus haut pour ce cas est remplacé). Mode nuit inchangé.

**Essai : logo en bleu `#0066FF` (mode jour)** : à la demande d'Adri, le logo et le nom « Cordée » passent de l'ardoise `#27465C` à `#0066FF` (survol `#0047B3`) pour comparer. Contraste mesuré : 2,9 à 3,2:1 sur le ciel abricot, donc suffisant pour le logo (élément graphique, 3:1) mais **sous le seuil AA du texte (4,5:1) pour le nom** à 14 px. Si le bleu est retenu, prévoir un bleu plus foncé pour le nom (ex. `#0047B3`, ≈ 5,0:1) ou un fond léger derrière. Séparateur et soulignement des boutons restent en ardoise. Retour à l'ardoise : remplacer `#0066FF` par `#27465C` dans le bloc « Marque Cordée » de `loop.source.css`.

## Jetons symétriques jour / nuit (marque, séparateur, soulignement, pied de page)

Principe : les deux thèmes déclarent **les mêmes clés** (`loop.source.css`, juste avant `html{scroll-padding-top…}`). Les composants ne citent plus de couleur brute, seulement le rôle.

| Jeton | Nuit | Jour | Usage |
|---|---|---|---|
| `--brand` | `#EE9468` (cuivre) | `#27465C` (ardoise, 6,3:1 sur l'abricot) | logo, « Cordée » |
| `--brand-hover` | `#F5B08C` | `#16303F` | survol de la marque |
| `--brand-fill` | `#1A0E08` | `#F2EEE6` | mousqueton du logo |
| `--brand-halo` | transparent | `rgba(252,247,238,.9)` | halo du texte « Cordée » |
| `--sep` | `rgba(226,140,100,.5)` | `#27465C` | séparateur Étapes │ Outils |
| `--underline` | `#E26D3B` | `#27465C` | soulignement des boutons |
| `--focus` | `#E26D3B` | `#1B1712` | contour de focus (marque, porte) |
| `--ft` | `5,8,17` | `235,195,156` | teinte du dégradé du pied de page |

- Essai `#0066FF` abandonné : retour à l'ardoise le jour ; la nuit reste cuivre.
- Reste à migrer vers des jetons (hors périmètre de cette étape) : porte de chargement, aiguille de préchargement, cartes, menu.
- Règle : on ajoute un rôle dans les deux thèmes, jamais une exception d'un seul côté.

### Complément : porte de chargement, aiguille de préchargement, `--muted`
- Porte de chargement : `--gate-bg`, `--gate-fg`, `--gate-rest`, `--gate-tag`, `--gate-focus`, `--gate-topo`, `--gate-mtn` déclarés pour les deux thèmes ; les règles du jour ne citent plus de couleur brute.
- Aiguille de préchargement : `--needle-1…4` et `--needle-pivot` ; plus d'exception `[data-theme="light"]`, les fills sont lus sur les jetons.
- `:root` : le repli reprend les valeurs du jour de `E_DAY` ; `--muted` passe de `#56615B` (3,9:1) à `#435862` (≥ 4,5:1).
- Détail complet : `docs/charte-graphique.md`.

## « S'équiper » en grand écran : disposition inversée (montre à gauche, texte à droite)

À partir de 1000 px de large (`LAY.sx > 0`, hors mode statique), l'étape « S'équiper » est le miroir de l'accueil (texte à gauche, montre à droite).

- **Montre** (`loop.js`, boucle de rendu) : `hk2 = sm(.09,.125,p) × (1 − sm(.20,.29,p))`. Position `x = (hk − hk2) × sx` : la montre traverse le centre de la droite vers la gauche (p 9 → 12,5 %), reste à gauche, puis revient au centre pendant le zoom (p 17 → 21 %). Rotation en trois quarts inversée (`+0,42 rad × hk2`), cadran tourné vers le texte.
- **Texte** (`loop.source.css`, `@media (min-width:1000px)`) : `#head2` aligné à droite (`right: clamp(48px, 6vw, 120px)`), 440 px max, aligné à gauche, remonté (`top: --hh + clamp(8px, 3vh, 40px)`) pour ne pas être recouvert par les cartes d'outils placées à droite de la montre. Variante jour : halo clair (`#head2::before`).
- **Chronologie** : `head2` apparaît entre 11 et 14 %, disparaît entre 20 et 24 % (avant, 24 → 28 %) : il s'efface quand toutes les cartes sont déployées et que le zoom commence.
- **Inchangé** : mobile et tablette (< 1000 px) gardent le titre centré ; le mode statique (`prefers-reduced-motion`) n'applique pas le décalage.
- Vérifié à 1280 × 800 (nuit). À contrôler : mode jour, 1000 px et 1920 px de large.

### Rochers et couloir de la montre (grand écran)
La montre parcourt maintenant un couloir **symétrique** (de −`sx` à +`sx`) : droite sur l'accueil, gauche sur « S'équiper ». Règle : aucun rocher ne doit se trouver dans la bande de profondeur du bracelet (angles ≈ 5,5–9°) ni sur son axe, de chaque côté.
- Gros rochers (`farRocks`) : `FAR_ALT` est vide ; les cinq rochers qui gênaient (indices 1, 5, 9, 10, 11) sont passés **en avant du bracelet** (`dep` 10,2 à 11,6°) au lieu d'être déplacés d'un seul côté.
- Cailloux (`nearRocks`) : les deux rochers de gauche reçoivent une position de repli `[-(xs + 2,4), 2,0]` et `[-(xs + 3,8), 0,6]`, symétrique de celui de droite (`[xs + 3,6, 0,6]`).
- Vérifié à 1280 × 800 : accueil, glissement et « S'équiper ».

### Halo de l'aiguille centré sur le cadran
Le halo pulsé qui accompagne l'aiguille (`drawNeedleHalo`, appelé par `drawWarp`) était centré sur `LAY.cx / LAY.cy` (centre fixe de l'écran) : en grand écran, la montre se déplace (à droite sur l'accueil, à gauche sur « S'équiper ») et le halo restait au centre. Il est désormais centré sur `DIAL.cx / DIAL.cy` (centre réel du cadran, recalculé à chaque image), avec `LAY` en repli tant que le cadran n'est pas projeté (`DIAL.r ≤ 5`). Vérifié à 1280 × 800 sur « S'équiper ».

### Boutons du boîtier : le survol change l'écran de la montre (plus de nouvelle carte)
Sur « S'équiper » avec une souris, le survol ou le focus d'un bouton du boîtier (`pushEls`) n'ouvre plus la carte de l'outil. Il change l'écran de la montre : `drawReadout` affiche le titre et la description de la carte (`TOOLS[i].n` et `.d`, mêmes textes que la carte) et l'aiguille se place sur l'angle de l'outil (`TOOLS[i].a`). Le comportement est le même que pour les zones du cadran (Résilience, Écoute, …).
- État : `toolAim` (index de l'outil survolé, −1 sinon), déclaré avec `aimKey` ; il est posé à l'entrée / au focus du bouton et remis à −1 à la sortie (délai de 120 ms contre 400 ms avant, plus besoin d'aller du bouton à la carte) et au blur.
- `cardReveal` ne dépend plus que du survol de la carte elle-même ; les cartes apparaissent toujours toutes en fin de scène (p 19 → 22 %).
- Clic sur un bouton : inchangé, ouvre la fiche. Écran tactile, mobile et vue statique : inchangés (cartes toutes visibles).
- À contrôler à la souris : le navigateur intégré de l'outil de test ne simule pas le survol.

#### Affichage au survol : titre sur le cadran, description en grand
Pour la lisibilité, au survol d'un bouton du boîtier : le **titre de l'outil remplace le nom « ADRIEN NEYRON »** en haut du cadran (68 px, réduit jusqu'à 34 px pour tenir en 760 px de large ; la ligne du dessous passe de « DÉVELOPPEUR × TRAILEUR × FORMATEUR » à « ATELIER »), et la **description s'affiche en grand dans la zone centrale** (40 px gras, au lieu de 26 px, centrée verticalement, 480 px de large au plus). `makeDial()` lit `dialOver` (outil survolé) ; `drawReadout()` redessine le cadran quand `toolAim` change (`dialTool` mémorise l'état déjà dessiné). Le survol des zones du cadran (Résilience, Écoute…) garde l'ancien affichage.

### Cartes d'outils sur les côtés de la montre, zones du cadran désactivées (grand écran)
- **Zones du cadran** (`placeHot`) : elles disparaissent dès que les boutons du boîtier apparaissent (`CSP`, 12 % du défilement sur grand écran, 7 % sinon) ; avant, elles restaient actives jusqu'à 20–24 %.
- **Cartes** (`layoutTools`, à partir de 1000 px) : deux colonnes de trois cartes, une de chaque côté de la montre (marge `max(24 px, 3 % de la largeur)`, répartition verticale égale entre l'en-tête et le pied de page). Côté droit, de haut en bas : Calculateur d'allure, RunFit Advisor, Équipement IA ; côté gauche : Analyseur GPX, CoachFlow, Job Search Automator. Elles ne dépendent plus de l'ellipse autour du cadran, qui les faisait chevaucher la montre pendant le zoom.
- **Chronologie** (grand écran) : le titre disparaît entre 17 et 20 % ; les cartes n'apparaissent qu'ensuite (souris : toutes entre 20 et 22,5 % ; tactile : en cascade à partir de 17 %, pas de 1,2 %) et s'effacent entre 26 et 29 %. Variables `CS`, `CSP`, `CREV`, `CEND` dans `loop.js` (valeurs mobile et petits écrans inchangées).
- Les boutons du boîtier (survol → écran de la montre) restent actifs dès 12 %, pendant que le titre est affiché.

- La montre revient au centre entre 17 et 21 % (`hk2`, avant : 20 → 29 %) : au moment où le titre disparaît, avant l'apparition des cartes, pour que les colonnes ne la recouvrent pas.
