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
- La boucle est servie sur `/` ; l'ancien accueil est sur `/camp-de-base`.
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
