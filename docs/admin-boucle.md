# Admin → accueil « L'ascension »

L'accueil (boucle 3D, `components/loop/LoopHome.vue` + `assets/loop/loop.js`) lit désormais le contenu saisi dans `/admin`. Mis à jour le 19/10/2026 (trace en étapes, voir « Étapes de la trace »).

## Principe

- Le balisage `assets/loop/loop.html` et les tableaux de `loop.js` (`TOOLS`, `TOOL_INFO`, `PROJECT_INFO`, `PROJECTS`, `ARTICLES`, `CONTACT`) restent la version **de repli** : ils s'affichent sans JavaScript, tant que la 3D n'a pas démarré, si l'API échoue ou si un champ admin est vide.
- À la première interaction, `LoopHome.vue` appelle `GET /api/loop-content` en parallèle du chargement de three.js (3 s maximum, jamais bloquant) et passe le résultat à `initLoop(THREE, { GLTFLoader, content })`.
- `server/api/loop-content.get.ts` n'envoie que ce qui est réellement saisi en base. Réponse mise en cache 60 s côté CDN (`stale-while-revalidate` 5 min) : une modification dans l'admin apparaît en moins d'une minute. En erreur : `{}` avec `no-store`.
- Toute chaîne venue de l'admin passe par `esc()` avant `innerHTML`, et les liens par `okUrl()` (http, https, mailto uniquement).

## Qui alimente quoi

| Admin | Champ | Endroit sur l'accueil |
|---|---|---|
| Profil | `loopEyebrow` | surtitre du premier écran |
| Profil | `loopTitle` | titre (h1) du premier écran **et** accroche de l'écran de la corde |
| Profil | `loopLede` | sous-texte du premier écran |
| Profil | `loopDialName`, `loopDialRole` | cadran de la montre : nom (vide → « ADRIEN NEYRON ») et ligne de titre (vide → « DÉVELOPPEUR × TRAILEUR × FORMATEUR »), réduits automatiquement s'ils sont trop longs |
| Profil | `loopDialXpLabel`, `loopDialXpValue` | cadran : libellé et valeur d'expérience (vides → « EXPÉRIENCE: » / « 17 ANS ») |
| Profil | `loopToolsEyebrow`, `loopToolsTitle`, `loopToolsLede` | texte de l'étape « S'équiper » (vides → texte de `loop.html`) ; injecté côté serveur dans `#head2` |
| Profil | `loopLead` (« Accueil » → accroche) | fiche « Profil » : paragraphe d'accroche |
| Profil | `loopFacts` | fiche « Profil » : phrase de synthèse |
| Profil | `cvUrl` | bouton « Télécharger le CV » |
| Profil | `email` | bouton e-mail et formulaire de contact du bivouac |
| Profil | réseaux (LinkedIn, GitHub) | boutons LinkedIn et GitHub du bivouac |
| Profil | `bookingUrl` | bouton « Prendre rendez-vous » (masqué tant qu'il est vide) |
| **Étapes** | `kind`, `order`, `period`, `title`, `place`, `summary`, `figure`, `figureLabel`, `projects` | **la trace de la carte** : cairns, stèles, panneau d'étape, liste statique `#pList`, annonces `#live` (voir « Étapes de la trace ») |
| Profil | `trailStats` | bandeau de chiffres sous le titre de `/projects` (un chiffre vide n'est pas affiché) |
| Projets | `type` (`mission` / `perso`) | filtre « Missions / Projets perso » de `/projects` ; vide → repli par slug (`DEFAULT_PROJECT_TYPES`) |
| Projets | `title`, `tagline`, `technologies`, `place` | carte de l'atelier, titre des liens « Fiche … » des étapes |
| Projets | `description`, `challenge`, `solution`, `result`, `impact`, `technologies`, `link`, `code` | fiche détaillée (Défi / Solution / Résultat / Impact, liens) |
| Projets | `stats` (fiche topo → chiffres clés) | fiche détaillée : chiffres clés sous le titre (3 au plus). Vide → ceux de `data/projects.ts` s'il y en a, sinon aucun bloc (rien d'inventé) |
| Projets | `cover`, `coverCredit`, `coverCreditUrl` (photo d'ambiance) | fiche détaillée : photo sous verre (inclinaison 3D au survol de la souris, coupée en mouvement réduit) et crédit. Vide → photo de `data/projects.ts` s'il y en a, sinon pas de photo |
| Projets | `order` | ordre des fiches renvoyées par `/api/loop-content` (n'agit plus sur la trace) |
| Outils IA | nom, accroche | carte « Équipement IA » (nombre d'outils, liste, étiquettes) |
| Carnet | titre, extrait, catégorie, date | liste du carnet (du plus récent au plus ancien), filtres |

## Étapes de la trace (source unique, octobre 2026)

La trace n'a plus un cairn par projet : elle suit des **étapes** éditables dans `/admin/stages` (collection Mongo `Stage`, repli `data/stages.ts`). Ordre chronologique, tracé continu (pas une boucle) :

| Rang | Type | Période | Titre | Chiffre | Fiches liées |
|---|---|---|---|---|---|
| 0 | Départ | sept. 2010 – oct. 2021 | UCPA / Decathlon | 500+ personnes formées | — |
| 1 | Étape 01 | oct. 2021 – déc. 2023 | Développeur web freelance (Haute-Savoie) | 3 missions pour des PME locales | StockPulse, C+Paie, HelloStay (lien dès que la fiche existe) |
| 2 | Étape 02 | déc. 2023 – oct. 2025 | DGFiP, mission via BeTeam (Paris) | −50 % de temps de traitement | OCTAVE |
| 3 | Bivouac | oct. 2025 – mai 2026 | Projets personnels | — | RunFit Advisor, CoachFlow |
| 4 | Étape 03 | mai – oct. 2026 | Mission Tyredating / YepGarage (Lyon) | 30 → 52 % de conformité RGAA · 100+ sites corrigés | YepGarage |
| 5 | Cairn final | — | Étape à écrire ensemble | — | lien vers `/contact` |

- **Un seul calcul** : `utils/stages.ts` → `buildStageView(stages, projets)` donne le libellé (« Départ », « Étape 01 », « Bivouac », « Cairn final »), le numéro, l'abscisse `t`, les km et le D+, le résultat clé (`figure` + `figureLabel`, vide sans chiffre : **rien n'est inventé**) et les liens (seulement vers les fiches qui existent : pas de lien mort). Il sert à `/api/loop-content` (`stages`), à la liste serveur de l'accueil, à `loop.js`, à `/projects`, à la fiche et à la liste admin.
- **Jalons** : Départ, étapes et cairn final se partagent la trace à intervalles égaux (`TRAIL_TOTAL` ≈ 180 km et 10 200 m D+ → 0, 45, 90, 135, 180 km ; 2 550 m de D+ par étape). Le bivouac se pose entre ses deux voisins (km 113), sans numéro, en **petit marqueur** (stèle et cairn à `SMALL_K` = 0,62, point réduit sur le rail). Le D+ est maintenant linéaire (`gainAtT`), comme les km : la liste serveur et la stèle affichent les mêmes chiffres.
- **Liens sans 3D** : `utils/loopMarkup.ts` (`renderStageList`) écrit côté serveur toutes les étapes dans `#pList` : étiquette et période, titre, lieu, résumé, chiffre, km / D+ et **vrais `<a href>`** vers `/projects/<slug>` (`/contact` pour le cairn final). La liste est affichée en vue statique et donc en `prefers-reduced-motion` (qui démarre en vue statique). `loop.js` ne la reconstruit plus.
- **Carte 3D** : le panneau `#stopCard` affiche étiquette · période, titre, résumé, le chiffre (s'il existe) et un lien par fiche liée (`.sc-cta` puis `.sc-code`) ; « Fiche complète » est masqué. Le bouton du bas, `#plMore`, est devenu un **lien** vers la première fiche (« Écrire la suite : Contact » au cairn final). Un clic sur la stèle de l'étape affichée suit le même lien.
- **Annonces** : chaque changement d'étape est annoncé dans `#live` (« Étape 02 : DGFiP, mission via BeTeam, Déc. 2023 – Oct. 2025, −50 % de temps de traitement. Kilomètre 90, … »). En entrant sur la carte, l'annonce de scène et celle de l'étape sont jointes (`sceneSay`) au lieu de s'écraser.
- **Trace qui se dessine** : plus de point ni de triangle qui parcourt la trace. Le triangle de l'aiguille n'existe qu'au Départ (relais de l'aiguille du cadran pendant la plongée) et s'efface entre `NEEDLE_OUT` = 0,004 et 0,03 ; la lueur part du départ (`uV0` = 0 pour le passage lumineux) et s'arrête à l'abscisse atteinte. Le câble mat garde le tronçon jusqu'au prochain cairn.
- **En-tête** : lien « Projets » (`.top-link`, `/projects`) entre les deux menus, seul élément de l'en-tête visible avant le démarrage de la 3D (`html:not(.loop-live)`), cible 44 px.
- **Admin** : `/admin/stages` (liste dans l'ordre de la trace avec libellé, km et résultat clé calculés), « Importer les étapes par défaut » (insertion seulement, par `key`), `components/admin/StageForm.vue` (prop `readonly` comme les autres formulaires). Fiches liées : cases à cocher parmi les projets publics, plus « Autres slugs » pour une fiche pas encore créée (HelloStay). API : `GET /api/stages`, `GET/POST /api/admin/stages`, `PUT/DELETE /api/admin/stages/[id]`, `POST /api/admin/stages/seed` (toutes derrière `requireAdminWrite`, champs filtrés par `normalizeStage`).
- **Saisie d'une étape (nouvelle / modification)** : le **numéro ne se saisit pas**, il découle de l'emplacement. Le formulaire propose un select « Emplacement sur la trace » (« Après « Étape 01 · … » », « Après « Bivouac · … » », « Au tout début » tant qu'il n'y a pas de Départ ; jamais après le cairn final) et affiche en direct « Cette étape sera : Étape 03 · km 90 · D+ 5 100 m » avec la précision que les suivantes sont renumérotées. Départ et cairn final n'ont pas d'emplacement à choisir (toujours premier / dernier). Le rang `order` est calculé (`orderForPlacement` : milieu entre l'étape choisie et la suivante, donc aucune autre étape n'est réécrite) ; en modification, un emplacement inchangé garde son rang. La clé est proposée d'après le type et le titre (`stageKeyFromTitle`) et reste modifiable.
- **Réorganiser la trace** (`/admin/stages`) : chaque étape se déplace par **glisser-déposer** (poignée, HTML5 natif, trait épais au point de dépose) **et** par les boutons « Monter / Descendre » (cibles 44 px, `aria-label` avec le titre, désactivés aux bornes) : le clavier et le tactile ont donc l'équivalent. Le Départ reste premier et le Cairn final dernier (`isPinnedStage`, `moveWithinTrace`, `traceOrderError` dans `utils/stages.ts`). L'affichage change tout de suite, puis `PUT /api/admin/stages/reorder` (`{ ids }` = toutes les étapes dans le nouvel ordre) renumérote les rangs 0, 1, 2… avec un seul `bulkWrite` ; 409 si la liste a changé entre-temps, 422 si l'ordre viole la règle Départ / Cairn final. En cas d'échec l'ordre revient à l'état précédent et un message explicite s'affiche (`role="alert"`) ; chaque déplacement réussi est annoncé (« … est en position 3 sur 6 : Étape 02, kilomètre 90 »). Le numéro, les km et le D+ se recalculent partout par `buildStageView` ; l'accueil (`/api/loop-content`, cache CDN 60 s) et `/projects` suivent en une minute environ.
- **Erreurs explicites** : `validateStage` (`utils/stages.ts`, même fonction côté formulaire et côté serveur) renvoie un message par champ qui dit ce qui ne va pas et quoi faire (titre ou clé manquants, format de clé, clé déjà portée par « telle étape », un seul Départ / cairn final, emplacement disparu). Le formulaire affiche un récapitulatif `role="alert"` focalisé avec un lien vers chaque champ, plus le message sous le champ (`aria-invalid`, `aria-describedby`) ; `novalidate` pour ne pas dépendre des bulles du navigateur. `POST`/`PUT /api/admin/stages` répondent 422 (liste des champs), 409 (clé en double) ; `utils/apiError.ts` (`apiErrorMessage`) transforme 401 / 403 / 404 / 409 / 422 / 5xx / réseau en phrase actionnable. Les erreurs ne reposent pas sur la couleur seule (texte + bordure 2 px, token `--color-accent`).
- **Aperçus d'image du panneau d'étape** : une image par projet lié (capture saisie dans /admin, sinon repli `data/projects.ts`, sinon photo d'ambiance, sinon `data/stageImages.ts` par slug), puis les images de l'étape elle-même (champ `images` de l'étape, saisi dans /admin › Étapes, valeur par défaut dans `data/stages.ts` ; 3 aperçus au plus, affichés avant ceux des projets liés). Le Départ (« UCPA / Decathlon ») n'a pas de fiche projet : il affiche les captures de ucpa.com/formations (passage texte, sans visage reconnaissable) et de la page du magasin Decathlon de Villebon-sur-Yvette ; C+Paie (`Service-Gestion de paie`) montre une capture de cpluspaie.vercel.app. Fichiers dans `public/recentprojects/` (webp, 16:10), captures du 27/10/2026 à refaire si les sites changent. Les marques appartiennent à leurs propriétaires : les images sont décoratives (`alt=""`) et n'illustrent que le parcours.
- **Mise en ligne** : tant que la collection est vide, les étapes de `data/stages.ts` s'affichent. Pour les éditer, cliquer une fois « Importer les étapes par défaut » dans `/admin/stages`.

## Fiche projet (carte des projets)

Ouverte par « Voir la fiche » à un arrêt de la carte (`openStop` → `openProject` → `showSheet`, classe `is-proj` sur `#dlgTool`) : surtitre complété par le kilomètre et l'altitude de l'étape sur la trace (`Km … · Altitude … m`, mêmes calculs que la carte), titre en Cormorant italique, chiffres clés (`#toolStats`), photo sous verre (`#toolM`), badges techno gravés (lueur cuivre en cascade à l'ouverture, coupée en mouvement réduit). Pendant l'arrêt, le relief autour du bloc du projet s'allume en rouge cuivré (uniformes `uF` / `uFk` du shader du terrain, réglés dans `rig()`).

### Panneau d'instrument (habillage de la fiche projet)

La fiche projet est habillée comme un instrument d'expédition (`#dlgTool.is-proj`, fin de `loop.source.css`) :

- **Forme** : coins haut gauche et bas droit coupés en biseau (`clip-path`), fond en verre sombre translucide (`--panel-glass`, `backdrop-filter: blur(16px)`). Le liseré laiton brossé (`::before`) est un cadre de 1,5 px qui suit aussi les biseaux.
- **Défilement** : c'est le corps de la fiche qui défile, pas la fenêtre. Le cadre et l'en-tête restent en place.
- **En-tête** : une seule ligne fine en monospace, `f.e · km et altitude · f.st`, par exemple « Étape 03 · Paris · Développeur Front-End · Km 46 · Altitude 2 165 m · 2023–2025 ». Elle passe à la ligne sur petit écran plutôt que de déborder. Le statut séparé (`#toolS`) est masqué.
- **Fermeture** : bouton rond en métal encastré (`.sh-xr`, 44 px, icône ✕). Son nom accessible est « Fermer la fiche (touche Échap) », avec `aria-keyshortcuts="Escape"`. Échap ferme la fiche (`<dialog>` natif) et le focus revient sur le bouton qui l'a ouverte. Le même bouton sert aux fiches de l'atelier.
- **Chiffres clés** : reliés à la photo par des micro-lignes de fuite filaires (`#toolLeads`, SVG `aria-hidden`, `drawLeads`). Chaque ligne part d'un nœud dans la marge gauche du chiffre, descend dans cette marge (elle ne traverse jamais un texte), puis rejoint un point réparti sur le haut de la photo. Elles sont recalculées à l'ouverture, au chargement de la photo et au redimensionnement (`ResizeObserver`, débranché au démontage). Elles se tracent en 0,9 s, sans animation en mouvement réduit.
- **Photo** : fenêtre d'altimètre aux quatre coins biseautés, cadre laiton fin, graduations sur le bord haut. L'inclinaison 3D et le reflet sous la souris sont conservés.

Couleurs : rôles `--panel-*`, `--brass-*`, `--steel-*` (voir `docs/charte-graphique.md`). axe : 0 violation sur la fiche ouverte, en mode jour et en mode nuit.

## Cairns (blocs des projets sur la carte)

Chaque projet est un cairn sobre posé **sur** la trace, en une seule matière (pierre mate, `STONE` ; les `mat` cuir / pierre / métal ne servent plus, `paintBlock` peint toujours la pierre) : 2 galets facettés sous le wire, un jeu de `GAP` = 0,28 unité (≈ 3 px à l'arrêt) où passe le wire, 2 galets au-dessus, puis la pierre gravée au contour irrégulier (`stoneShape`). **Gravure** (`paintBlock`, canvas 768 × 576 dessiné en 512 × 384) : de haut en bas, l'étape en capitales espacées, le lieu et l'année (`yearOf` : période du projet, sinon un statut daté comme « 2026 – en cours », sinon rien) et un petit trait, le nom du projet en grand serif italique (deux lignes équilibrées si le nom est long), le kilomètre et le dénivelé cumulés (`kmLine`, ex. « KM 62 · D+ 4 350 M »), l'altitude (`altAt`), puis les technos sur une ligne séparées par des points (4 au plus ; si la ligne ne tient pas, les dernières partent). Encre pleine et arête claire décalée, comme une gravure. Le reste est dans la carte d'étape `#stopCard` : rien n'est écrit deux fois à l'écran. La stèle est décorative (`aria-hidden`) : la carte redonne aux lecteurs d'écran, en texte masqué, ce qui n'est que gravé (`h3#scT` = nom, `#scSr` = étape, lieu, année, altitude, kilomètre, dénivelé, toutes les technos). **Cairn du Départ (étape 00)** : le Départ a aussi son cairn, avec les mêmes pierres, gravé « Étape 00 », « Grandes Platières · 2009–2021 », « Départ », « KM 0 · D+ 0 M », l'altitude, Management · Formation · Outdoor. Il n'a pas de fiche projet, mais il a sa **carte d'étape** comme les autres (`#stopCard`, `fillCard` sans `PROJECT_INFO`) : « Éducateur, Formateur, Directeur dans le secteur sportif », sans bouton « Fiche complète ». Il n'est **pas sous l'aiguille** mais à côté, pour une image nette : la pointe de l'aiguille marque seule le départ de la trace, et le cairn est décalé dans `placeBlocks` (`depOff`, aussi pour le cairn de la dernière étape, à gauche de la fin de trace ou au-delà du bout sur écran étroit) de `DEP_SIDE` = 17 unités à gauche de la trace sur écran large, ou de `DEP_BACK` = 20 unités derrière l'aiguille sur écran étroit (`cam.aspect < 0,9`, sinon il sortirait de l'image). Le wire ne le traverse donc pas. Rien n'existant avant la trace, sa pierre est orientée vers le prolongement de la trace en arrière, et sa perle se pose juste **après** lui. Vu de dessus pendant le Départ (vue alignée sur le cadran), il est lisible de face. **La trace part droit dans l'axe de l'aiguille** : sur ses `START_STRAIGHT` = 18 premières unités, les points de `P` sont posés exactement sur l'axe `hd` (celui de l'aiguille, qui indique le nord pendant la plongée), puis ils rejoignent en douceur le tracé réel jusqu'à `START_BLEND` = 50 unités. L'aiguille la recouvre donc sans qu'elle sorte par un flanc. **L'aiguille recouvre le départ de la trace** : pendant la plongée dans le verre, l'aiguille indique le nord et le départ de la trace (`P[0]`) est placé sous son **pivot** (base du triangle nord) : le triangle recouvre le début de la trace. Le centre du cadran correspond au point `C0`, reculé de `PIV = RFIN × NEEDLE_PIV / DIAL_R` dans l'axe de la trace (`hd`) ; `C0` sert au relief gravé dans le verre (`topoInfo`) et à la caméra de dessus (`rig`). Calage fin : à chaque image, `rig` décale la caméra de dessus pour que `P[0]`, à sa vraie hauteur, tombe exactement sous le pivot mesuré à l'écran (`NDL.piv`), sans jour. L'aiguille grandit autour de son pivot en s'effaçant : elle recouvre un peu plus la trace. Les galets ont dessus et dessous plats (`rockGeo`), donc le jeu reste net ; tout est placé dans `placeBlocks()`.

États (réglés dans `rig()`) : **un seul repère à lire à la fois**. Le cairn de l'étape en cours est à 100 % ; le suivant (la destination) à `CAIRN_NEXT` = 35 % ; le précédent reste à 35 % le temps de le quitter, puis s'efface. Tous les autres sont masqués (`visible = false`, ombre et perle comprises) et ne réagissent pas au survol (`pick` ignore les cairns sous 10 %). Le cairn suivant passe sous 3:1 de contraste : c'est acceptable parce que la même information (étapes, étape courante) est donnée en texte par la liste des étapes, le panneau d'étape et l'annonce `#live`. Au survol ou à l'arrêt, la pierre gravée se soulève légèrement. Pas d'anneau au sol.

## Cadrage aux arrêts

À l'arrêt sur un cairn (`rig`, poids `mw`), la caméra ne reste plus derrière l'aiguille, dans l'axe moyen de la trace (dans un virage, le cairn sortait de l'image ou se collait à la caméra). Elle se place **face à la stèle**, dans l'axe où celle-ci regarde (`faceYaw`), à distance fixe : `STOP_D` = 70 unités sur grand écran, 80 sur téléphone, `STOP_H` = 26 au-dessus de la pierre, jamais à moins de 14 unités du sol. Sur grand écran, la visée est décalée vers la droite de `STOP_SIDE` = 0,35 × le recul : la stèle passe dans le tiers gauche, à l'écart de la carte d'étape. Sur téléphone, la visée descend de `STOP_LOW` = 9 unités : la stèle remonte au-dessus de la carte, en bas. Sans carte (dernière étape, ou cartes masquées), la stèle est centrée. Entre deux arrêts, la caméra revient en douceur à la vue de vol derrière l'aiguille. Le Départ garde sa vue de dessus calée sur le cadran.

## Fiche d'étape (résumé automatique)

À l'arrêt sur un cairn (caméra posée depuis 0,5 s, `updateCard()` appelé par `updateUi`), le **panneau d'étape** `#stopCard` apparaît à droite de la 3D (en bas sur téléphone). C'est un panneau en verre sombre dans les deux thèmes :
- **Dimensions et style** : 420 px de large au plus, 80 vh de haut au plus, avec défilement interne. Fond `--exp-glass` flouté à 16 px, bord cuivre `--exp-edge`, coins de 16 px, ombre douce.
- **Accessibilité** : c'est un `<aside aria-label="Détails du projet <nom>">`.
- **Contenu, de haut en bas** :
  - méta en monospace, année · catégorie (`yearOf`, catégorie `f.cat` venue de l'admin ou de `data/projects.ts`) ;
  - titre `h2` en serif ;
  - résumé (`brief`, 260 signes) ;
  - jusqu'à 3 points clés en liste `<ul>` ;
  - toutes les technos en badges.
- **Actions** :
  - « Voir le site ↗ » : bouton principal cuivre, premier lien public qui n'est pas un dépôt de code ;
  - « Code source ↗ » : bouton secondaire transparent, lien GitHub, GitLab ou Bitbucket ;
  - un lien discret « Fiche complète → » qui ouvre la fiche détaillée ; sans site ni code publics, il devient le bouton principal (classe `solo`).
- **Texte** : `--exp-ink` #F8FAFC, interligne 1,6, au moins 7:1 (AAA) même quand le verre est posé sur la page claire.
- **Fermeture** : un ✕ discret en haut à droite (cible de 44 px, `aria-keyshortcuts="Escape"`) ou **Échap** ferme le panneau pour cette étape seulement (`cardShut`). Il revient à l'étape suivante. Si le focus était dans le panneau, il passe sur « Voir la fiche ». Échap ne le ferme pas pendant la visite guidée, ni quand une fenêtre ou un menu est ouvert : son écouteur, en phase de capture, passe avant celui de la visite.
- **Lecteurs d'écran** : la stèle étant décorative, ce qu'elle seule porte (étape, lieu, altitude, km, D+) est redonné en texte masqué (`#scSr`).

Aspect : verre dépoli léger (fond `rgba(5,8,17,.7)` la nuit / `rgba(252,247,238,.8)` le jour, `backdrop-filter: blur(16px)`) ; le texte garde ≥ 4,5:1 même au-dessus d'un trait de relief cuivre.

**Titre de section** : « Chaque projet, une étape avec sa preuve » n'est plus un grand titre centré qui passait sur la stèle, mais un sur-titre discret en haut à gauche (`#s2 .head` : monospace 12,5 px, capitales espacées), toujours le `h2` de la section.

Ce n'est **pas** une fenêtre modale : une modale à chaque arrêt bloquerait le défilement et volerait le focus (changement de contexte non demandé, RGAA 7.4 / WCAG 3.2.2). C'est un `aside` étiqueté par son titre, sans prise de focus ; l'étape est déjà annoncée par `#live`. Sur téléphone, les points clés sont masqués et le panneau ne dépasse pas 46 % de la hauteur (il défile). Hors vue statique uniquement ; mouvement réduit : simple fondu.

## Trace apaisée (lissage)

Le tracé GPS (290 points, ≈ 10 unités chacun) est lissé deux fois : `smoothPath` (fenêtre courte, ≈ 400 m) enlève le bruit du GPS, puis `calmPath` (gaussienne large, σ = `TRACE_SIGMA` = 15 points, ≈ 1,5 km) efface les lacets du sentier, en plan et en hauteur. Les extrémités restent fixes (fondu sur 4 points) : le Départ reste sous l'aiguille. Ce lissage raccourcit la trace d'environ 23 % ; elle est remise à sa longueur d'origine en plan (mise à l'échelle autour du départ), sinon les étapes se rapprochent et la caméra, 92 unités derrière l'aiguille, bute sur le cairn précédent. Le relief est reconstruit autour de la trace et la suit ; les chiffres (altitude, D+) gardent les altitudes GPS (`alt`). Résultat mesuré : −58 % de virages cumulés, mêmes pentes qu'avant (médiane 0,33).

## Étapes datées, appuyées sur le CV (historique, remplacé)

> Jusqu'au 19/10/2026, la trace avait un cairn par projet, rangé par date. Elle suit maintenant les étapes de l'admin (voir « Étapes de la trace ») ; `CV_FACTS` ne nourrit plus que les fiches de l'atelier. Section gardée pour l'historique des sources de dates.


**Ordre** : les étapes de la carte sont rangées par **date de début**, de la plus ancienne à la plus récente, puis réparties à égale distance sur la trace et renumérotées (« Étape 01 » …). La date vient du champ `startDate` de l'admin (texte libre : « Mai 2026 », « déc. 2023 », « 2023 », « 2023-12 », lu par `dateKey`). Sans date dans l'admin, elle vient de `CV_FACTS` (`assets/loop/loop.js`), tiré du CV en ligne (« CV-AdrienNeyron-DeveloppeurFrontEnd.pdf », profil de l'admin). Un projet sans aucune date se place en fin de trace, avant « À déterminer ».

**Contenu** : `CV_FACTS` donne pour chaque étape la période affichée, le rôle (repris dans le surtitre de la fiche : « Étape NN · lieu · rôle ») et les puces du CV. Ces puces passent en tête des points clés, sans répéter une puce de l'admin qui dit la même chose. La description de l'admin reste le résumé. Les chiffres du CV ne servent que si l'admin n'en a pas. Le Départ reprend la période et les deux puces UCPA / Decathlon du CV.

**Sources des dates** (octobre 2026) :

| Projet | Date | Source |
|---|---|---|
| Départ | sept. 2009 – mai 2021 | CV |
| StockPulse | 2021 – 2023 | carte d'origine (le CV le place dans le freelance, juin 2021 – oct. 2025) |
| DressMeUp | 2023 | création du dépôt public (juillet 2023) ; absent du CV. Remis en ligne en octobre 2026 (web Vercel + Expo Go SDK 57) ; fiche de repli `dressmeup` dans `data/projects.ts` |
| HelloStay | déc. 2023 – janv. 2024 | CV 2025 |
| OCTAVE (DGFiP) | déc. 2023 – oct. 2025 | CV |
| C+Paie | 2024 | premier commit du dépôt (février 2024) |
| RunFit Advisor, CoachFlow | oct. 2025 – mai 2026 | CV (« Projets personnels ») |
| L'ascension | 2026 | création du dépôt (avril 2026) |
| YepGarage (Tyredating) | mai 2026 – en cours | CV |
| Job Search Automator | sans date | à saisir dans l'admin (`startDate`) |

**Panneau** : résumé coupé à 260 signes et points à 170 signes, au mot près (`cap`). La fiche complète garde le texte entier.

## Fluidité du défilement entre les étapes

- **Caméra** : entre deux arrêts, elle glisse du cadrage de la stèle A à celui de la stèle B (`frameOf`), en arc léger (`STOP_ARC` = 18), et garde l'aiguille dans le champ à mi-trajet. Elle n'alterne plus entre une vue « derrière l'aiguille » et une vue « face à la stèle », ce qui faisait pivoter l'image jusqu'à 90° sur une courte portion du défilement.
- **Aiguille** : entre deux cairns, elle accélère puis ralentit (`param`, interpolation adoucie) au lieu de partir et s'arrêter sec.
- **Poids d'arrêt** : il monte et descend sur `STOP_RAMP`, au plus une moitié de trajet. Deux arrêts voisins ne se chevauchent plus.
- **Défilement** : il est un peu plus amorti sur la carte (6/s au lieu de 9/s), pour que la molette ne fasse plus de sauts.

**Mesure**, en défilant régulièrement sur toute la carte (navigateur de test, rendu logiciel) :

| Mesure | Avant | Après |
|---|---|---|
| Rotation de la caméra par image (99ᵉ centile) | 16° | 6,5° |
| Rotation maximale par image | 18° | 8° |
| À-coups de la visée (99ᵉ centile) | 28 | 1,1 |

## Plus de plaque de métriques

La plaque `.pl-metrics` (étape, période, intitulé) qui s'affichait sous la carte entre deux arrêts, par exemple du Départ à l'étape 01, a été supprimée : elle répétait la stèle et le panneau d'étape. Seul le bouton « Voir la fiche » reste dans `.pl-dock`. Elle était décorative (`aria-hidden`) : les lecteurs d'écran gardent la liste des étapes, le panneau et l'annonce `#live`.

## Un cran = un projet

Sur la carte des expériences, chaque geste de défilement emmène au projet suivant ou précédent, avec une transition animée de 0,6 s (`cinematicTo`, mode `out` : la carte bouge dès le cran, puis se pose en douceur). On ne s'arrête plus entre deux cairns. Pour que la réaction soit rapide :
- pendant la transition, la scène suit le défilement presque sans retard (lissage 20/s au lieu de 9/s) ;
- la caméra rejoint le cadrage en ≈ 0,1 s (lissage 9/s) ;
- le panneau d'étape s'affiche 0,12 s après l'arrêt (au lieu de 0,5 s).

Mesure, navigateur de test à 10–15 images/s : mouvement dès la première image après le cran (≈ 80 ms), projet atteint et panneau affiché en 0,73 à 1 s. Avant : transition de 1,1 s qui démarrait lentement, puis 0,5 s d'attente, soit environ 2 s avant le panneau.
- **Molette** : un cran (au moins 24 px) suffit.
- **Pavé tactile** : les petits événements d'un glissé s'additionnent jusqu'à 24 px, puis une seule transition part. Pendant la transition, et tant que la traîne d'inertie continue (un événement moins de 280 ms après le précédent), tout est absorbé : jamais deux projets pour un seul geste.
- **Doigt** : un glissé d'au moins 40 px fait passer d'un projet à l'autre ; le défilement natif est bloqué sur la carte.
- **Aux deux bouts** (avant le Départ, après la dernière étape), la page défile normalement, vers la montre ou vers la pluie et la flaque.
- **Panneau d'étape** : s'il a du contenu à faire défiler, il défile d'abord.
- **Inchangé** : clavier (flèches, Page suivante), menu « Étapes », visite guidée, fenêtres et menus ouverts, vue statique (donc mouvement réduit). Zoom avec Ctrl + molette laissé au navigateur.

Le filtre des événements de molette est une fonction pure, `utils/wheelStep.ts` (`wheelGate`), testée dans `tests/unit/wheelStep.test.ts` : crans espacés, rafale de pavé tactile de 0,7 s, inertie de 2 s, deux gestes rapprochés, crans pendant une transition, bout de carte. Son écouteur est en phase de capture et arrête la propagation, pour que l'annulation des transitions (`stopCine`) ne coupe pas la sienne.

## Un tronçon de trace à la fois

Comme les cairns, la trace ne se montre que **d'un cairn au suivant**. Le shader du câble (`FAT_F`) reçoit la fenêtre `uV0`..`uV1` (abscisse t) et ne dessine rien en dehors, avec un fondu de 6 unités (`uVF`) au-delà de chaque bout. La fenêtre est réglée dans `rig()` :
- en temps normal, du cairn où l'on est (ou que l'on vient de quitter) jusqu'au suivant ;
- à l'approche d'un cairn (12 unités), elle passe au tronçon suivant, en gardant le bout sous l'aiguille ;
- à la dernière étape, de l'avant-dernier cairn jusqu'au bout.

Elle glisse en douceur d'un tronçon à l'autre (`trWin`, lissage 3,5/s ; immédiat en mouvement réduit). Le relief, lui, reste entier.

## Câble et pulse lumineux (trace des projets, « ISO »)

La trace est un câble technique (`FAT_V` / `FAT_F`, spline lisse issue de la `CatmullRomCurve3`, traits d'épaisseur constante à l'écran), en deux passes :
- **câble inactif** sur toute la trace, 3 px, bleu ardoise mat `#1E293B` (trait plein non éclairé : la « rugosité 0,8 » n'a pas d'effet sur une ligne sans lumière). Attention : la nuit, `#1E293B` sur `#050811` donne ≈ 1,4:1, le parcours à venir est donc très discret ; c'est acceptable seulement parce que la liste des étapes, la plaque et `#live` donnent la même information. Le jour, contraste élevé ;
- **pulse actif** sur la partie parcourue (`glow`) : cyan électrique `#00F2FE` à la tête qui évolue vers le bleu glacier `#38BDF8` derrière ; couleur émissive ×2,5 (`uBoost`), cœur blanc-chaud, halo et « bloom » (trois profils gaussiens en travers du câble, 26 px) et ondes d'énergie qui courent vers la tête (`uTime`). Pas d'éclat renforcé à la tête ni d'aura dans le sol autour de la boule (retirés à la demande d'Adrien : la boule reste nette). Mélange additif la nuit ; le jour, mélange normal en `#0891B2` → `#0369A1`, sans surbrillance.
- **Bloom** : pas de post-traitement. Un `EffectComposer` + `UnrealBloomPass` demanderait d'embarquer 6 modules d'exemples r128 (comme `GLTFLoader`), un rendu supplémentaire plein écran à chaque image et ferait perdre la transparence du canevas (la carte est posée sur le ciel CSS). Le halo est donc calculé dans le shader du câble : même effet « fibre sous tension », sans coût.
- **Avancement** : `uT` (l'« uProgress » de la spec) est recalculé à chaque image depuis le défilement (`param(p)`), donc lié à 100 % au scroll, dans les deux sens. GSAP ScrollTrigger n'est pas utilisé : la boucle pilote déjà toute la scène au défilement, l'ajouter doublerait la source de vérité.
- Mouvement réduit : ondes figées (temps à 0), le pulse reste allumé. Vue statique : câble entièrement allumé.

**L'aiguille** remplace la boule (supprimée) : sur la carte, il ne reste que le **triangle nord** (braise, deux facettes, mêmes teintes de jour et de nuit que le nord de l'aiguille du cadran, arête centrale légèrement relevée), à l'échelle du sol (`RFIN / DIAL_R`) ; sa base est le pivot. Sa base et sa pointe sont toutes deux **sur** la trace (corde entre deux points de la courbe) : il la recouvre, même dans les virages, et ne dépasse jamais avant le départ. Au Départ, il recouvre le début de la trace ; ensuite sa pointe suit la tête de la progression, et à la dernière étape (t = 1) elle va exactement jusqu'au bout de la trace (pas de recul devant le cairn aux deux bouts). La lueur du câble s'arrête à la **base** du triangle (`uT` = base) : elle ne dépasse jamais sa pointe. Le câble et la lueur ne sont **jamais dessinés sous l'aiguille** : le shader écarte la portion de trace entre sa base et sa pointe (`uH0`..`uH1`), et au départ aussi le bout arrondi du câble avant la trace ; rien ne peut dépasser du triangle, même dans un virage. Elle est plus fine (18 px au lieu de 26), donc toujours plus étroite que la base du triangle. **Superposition exacte** pendant la plongée : à chaque image, la montre publie à l'écran la pointe et le pivot de son aiguille (`NDL`) ; tant que la caméra de la carte est en vue de dessus et que la trace n'a pas avancé (`t < 0,006`), et seulement tant que l'aiguille du cadran est visible (poids `NDL.w` = son fondu ; 0 quand la montre n'est plus affichée), `rig` ramène ces deux points sur le plan de la trace et y pose le triangle (position, angle et taille), puis il glisse sur la trace dès qu'elle avance. Sans passage par la montre (`NDL.ok` faux), il est directement sur la trace. Au Départ, il est dessiné devant la pierre gravée (`renderOrder` 11, sans test de profondeur, matériaux `transparent`), puis il rétrécit à 45 % en avançant. À l'arrêt sur un cairn de projet, sa pointe s'arrête 11 unités devant lui, côté caméra, et le désigne. La pierre gravée du cairn actif est dessinée au premier plan (`renderOrder` 10, sans test de profondeur) : le wire ne passe jamais sur son texte.

Supprimés : la boule (perle cuivre et ses bagues), halo émeraude, faisceau (`beam`), lueur (sprite) autour de la boule. L'ancienne carte SVG (`#mapSvg`, `pool`, `beamGlow`, `updateMap`) n'est plus appelée ; elle est conservée en attendant une décision de suppression.

## Pluie sur le dernier cairn : transition vers la flaque

Après la dernière étape (« À déterminer »), la carte ne s'éteint plus d'un coup : il se met à pleuvoir sur le cairn, puis on arrive à la flaque (« Persévérer »).

- **Progression** : `rainR = clamp((p − 0,478) / 0,062)` est passé à `PARC.update(l, dt, intro, rain)`. Bruine dès l'arrêt sur le cairn (p ≈ 0,486), averse ensuite.
- **Gouttes** : un `InstancedMesh` de 110 gouttes étirées, qui tombent dans un disque de 18 unités autour du cairn. Chaque goutte calcule son point d'impact à sa naissance (lancer de rayon sur la stèle et les pierres, sinon le sol). À l'impact, un anneau s'élargit et s'efface, orienté selon la normale de la surface.
- **Pierre mouillée** : la stèle et les pierres foncent et deviennent plus brillantes (rugosité 0,95 → 0,42). Elles reviennent à l'état sec quand on remonte.
- **Caméra** : à partir de `rainR` = 0,2, zoom avant sur la stèle (34 unités, 58 sur écran étroit), puis zoom arrière très haut au-dessus du cairn (175 unités). L'axe de vue reste celui de l'arrêt.
- **Fondu** : la carte reste visible jusqu'à 0,525 puis s'efface jusqu'à 0,555 ; la flaque apparaît de 0,53 à 0,56. Le défilement étiré (`WK_V`) va jusqu'à 0,555 : la pluie et les zooms se jouent dans la portion lente de la page.
- **Couleurs** : en mode nuit, gouttes et anneaux en eau claire (`#CFE8F2`) ; en mode jour, à l'encre de la carte (`#27465C`, rôle `--brand` du jour).
- **Mouvement réduit** : pas de gouttes ni de zoom. L'accueil passe de toute façon en vue statique.

## Textes du premier écran (rendu serveur)

Surtitre, titre et sous-texte ne passent pas par `loop.js` : `LoopHome.vue` appelle `/api/loop-content` côté serveur (`useFetch`, 2 s maximum) et remplace ces textes dans le HTML de `loop.html` avant l'envoi. Résultat : pas de clignotement entre le texte par défaut et le texte admin, et le texte reste lisible sans JavaScript (SEO, lecteurs d'écran). Champ vide, base indisponible ou délai dépassé : le texte de `loop.html` est conservé. Les valeurs sont échappées avant insertion. Après un enregistrement dans l'admin, compter jusqu'à une minute (cache CDN de l'API). Champs : Admin → Profil → « Accueil « L'ascension » » (limites : 80, 120 et 260 caractères).

## Rattachement des projets

> Ne concerne plus la trace (voir « Étapes de la trace ») : seulement les fiches de l'atelier (`PROJECT_INFO`).

Un projet admin est rattaché à un arrêt existant par mots du `slug` ou du titre (`CMS_ALIAS` dans `loop.js`) : dgfip, click2sell / c2s, hellostay, stockpulse, runfit, coachflow, job-search / automator, ascension / portfolio. Un projet qui ne correspond à aucun arrêt est **ajouté** au parcours (trois au plus), avant « L'ascension » ; les arrêts sont alors répartis à égale distance le long du tracé.

## Limites connues

- Sans JavaScript, ou avant la première interaction, on voit les textes du balisage (volontaire : SEO, lecteurs d'écran).
- Restent statiques (hors du premier écran) : les libellés des boutons de l'écran de la corde et de la visite guidée, la fiche du calculateur d'allure et de l'analyseur GPX (voir « Outils : même application ou non »), les quatre compétences de la fiche « Profil », le texte du bivouac.
- Les titres longs sont raccourcis pour les blocs 3D (texte avant « — »), la fiche garde le titre complet.

## Accessibilité

Aucun nouveau composant : les contenus injectés réutilisent les éléments existants (fiche `dialog`, listes, boutons), donc le comportement clavier, les libellés et le contraste sont inchangés. Les textes sont insérés en texte brut ou échappés.

## Outils : même application ou non

- **Calculateur d'allure** : déjà une page de cette application (`/outils/allure-denivele`), petit, sans données serveur, partage le design et l'accessibilité du site. Il reste ici.
- **Analyseur GPX** : à venir. Tant qu'il est léger (analyse côté navigateur), une page `/outils/…` convient. S'il demande un traitement lourd, des comptes ou son propre cycle de déploiement, il devient une application distincte, **intégrée par un lien**.
- Règle : l'accueil ne contient que la carte (nom, accroche, statut, lien). Pour une application externe, créer une entrée dans « Projets » (titre, accroche, `link`, `status`) comme RunFit, CoachFlow ou Job Search Automator : la carte suit l'admin sans toucher au code. Les deux cartes d'outils codées en dur dans `loop.js` pourront alors être remplacées par ce mécanisme.

## Cairn, card et liste : où s'affiche chaque information

Toute information visible à l'écran est stockée dans la collection `Stage` et modifiable dans /admin › Étapes. Le formulaire sépare « Sur le cairn » (stèle gravée, 3D décorative) et « Dans la card » (panneau), avec un aperçu texte de chacun et un tableau récapitulatif (`STAGE_DISPLAY_MAP` dans `utils/stages.ts`). La « liste » est la version HTML de l'accueil (vue statique, mouvement réduit, lecteurs d'écran).

| Information | Champ | Cairn | Card | Liste |
|---|---|---|---|---|
| Libellé (Étape 01…) | calculé de l'emplacement | oui | oui | oui |
| Titre de la card, période de la card | `title`, `period` | non (repris si les champs du cairn sont vides) | oui | oui |
| Titre du cairn, période du cairn | `steleTitle`, `stelePeriod` (vides = ceux de la card) | oui | non (redits aux lecteurs d'écran s'ils diffèrent) | non |
| Lieu | `place` | oui | lu aux lecteurs d'écran | oui |
| Kilomètre, D+ | `km`, `gain` (vide = calcul) | oui | lu aux lecteurs d'écran | oui |
| Altitude | `altitude` (vide = relevée sur le tracé) | oui | lue aux lecteurs d'écran | oui |
| Ligne du bas | `steleTags` (4 max ; vide = chiffre clé, sinon noms des fiches) | oui | non | non |
| Résumé | `summary` | non | oui | oui |
| Chiffre + libellé | `figure`, `figureLabel` | non | oui | oui |
| Images d'aperçu | `images` | non | oui | non |
| Fiches liées | `projects` | non | oui | oui |
| Texte du lien principal | `ctaLabel` (vide = « Fiche <projet> » ou « Écrire la suite ensemble ») | non | oui | oui |

Sémantique : `km`/`gain`/`altitude` à `null` = valeur calculée ; `images` absent = valeurs par défaut de `data/stages.ts`, `[]` = aucune image. « Importer les étapes par défaut » ajoute les images par défaut aux étapes existantes qui n'ont pas encore ce champ. Le compteur km/D+ continu de la carte (`#mapTot`) reste calculé. Cache de `/api/loop-content` : 60 s.

## Envoi d'images depuis l'admin (WebP)

Tout champ « Envoyer une image » (`components/admin/FileUpload.vue`) convertit l'image en **WebP** dans le navigateur avant l'envoi (`utils/imageWebp.ts` : grand côté ≤ 1600 px, qualité 0,82, jamais agrandie, nom `photo-ete.webp`). Le fichier est envoyé à `POST /api/admin/upload` (Vercel Blob) ; **l'URL obtenue est enregistrée en base Mongo** dans le champ concerné (image d'étape, capture de projet, couverture du Carnet, photo de profil). La conversion avant l'envoi évite aussi la limite de 4,5 Mo des fonctions Vercel (une photo d'appareil dépassait cette taille et l'envoi échouait). PDF (CV), SVG et GIF animés ne sont pas convertis. Si le navigateur ne sait pas encoder en WebP, l'original est envoyé. Retour visuel : message « Image envoyée en WebP : X → Y » (`role="status"`) ou erreur (`role="alert"`). Non couvert : conversion des images déjà en base (à renvoyer depuis l'admin).

### Image remplacée = ancienne image supprimée

Quand une image est remplacée par un nouvel envoi (ou retirée d'une étape avec « Supprimer »), l'ancien fichier est supprimé du Blob store **à l'enregistrement du formulaire**, pas avant : si on quitte sans enregistrer, la base pointe toujours vers l'ancienne image et rien n'est effacé (la file d'attente est vidée à chaque changement de page). Le nouvel aperçu s'affiche tout de suite à côté du champ (80 px, « Aperçu indisponible » si le fichier ne charge pas) et un message le rappelle : « L'ancienne image sera supprimée à l'enregistrement. » Seules les URLs `*.public.blob.vercel-storage.com` sont supprimables : les images du dépôt (`/recentprojects/…`) ou d'un autre site ne sont jamais touchées, ni une URL encore présente dans ce qui vient d'être enregistré. Limite connue : une image envoyée puis abandonnée sans enregistrer (formulaire fermé) reste dans le Blob store ; une image supprimée d'un projet ou d'un article entier (bouton « supprimer » des listes) n'est pas encore effacée du stockage.

### Aperçu des images d'étape dans l'admin

Dans le formulaire d'une étape, l'image envoyée apparaît tout de suite à deux endroits : en miniature dans sa ligne (« Image 1 »), et dans l'aperçu « Aperçu du texte de la card » (vignettes 16:10 avec leur titre, comme sous le résumé dans la card). Sans image d'étape, l'aperçu le dit : la card n'affiche alors que les images des projets liés.

### Mise en page du résumé (card et liste)

Le résumé d'une étape garde sa mise en page : une **ligne vide** sépare deux paragraphes, un **retour à la ligne** simple devient un saut de ligne (`summaryHtml` dans `utils/stages.ts`, utilisé par la card de `loop.js` et par la liste HTML `#pList`). Le texte reste échappé : aucun HTML saisi dans l'admin n'est interprété. Dans la card, les paragraphes sont séparés de 0,6 em (`.sc-l .par`, `loop.source.css` → `loop.css`). L'aperçu du formulaire respecte les mêmes sauts de ligne. Avant le 28/10/2026, les retours à la ligne étaient écrasés en un seul bloc.

### Défilement de la card ≠ défilement de la trace

Quand la card déborde (résumé long, beaucoup d'images) et que le curseur est dessus, la molette (ou le doigt) ne sert qu'à la faire défiler : en haut ou en bas de la card, le geste est absorbé et ne change **ni d'étape ni la position de la page** (`inScroller` dans `assets/loop/loop.js`, plus `overscroll-behavior: contain`). Pour passer à l'étape suivante, la molette se fait hors de la card (ou au clavier / menu « Étapes », inchangés). Une card qui ne déborde pas n'est pas concernée : un cran dessus change d'étape comme ailleurs. Avant le 28/10/2026, arrivé au bout de la card, le cran suivant (ou l'inertie) déplaçait la trace.

### Images de la card : sous le titre, avant le résumé

Dans le panneau d'étape, l'ordre est : meta (libellé · période), titre, **images d'aperçu** (`#scI`), résumé, chiffre clé, technologies, liens. Les images sont donc sous le titre et avant le texte descriptif ; le bouton ✕ (en haut à droite) ne passe plus sur une photo. Aucune image : le résumé suit directement le titre. Images décoratives (`alt=""`) : l'ordre dans le HTML suit l'ordre visuel.

### Inscription des technos : lave bleue qui sourd des lettres
Seules les lettres de la ligne des technos (`steleTags`) s'illuminent (`drawTags` dans `loop.js`), comme de la lave : bleu électrique tirant sur le turquoise (`#00D9FF` → `#14F0F0`, cœur plus clair), halo qui déborde de la pierre, et, très lentement, de petites coulées qui descendent des lettres. Une techno après l'autre, vague d'≈ 7 s.
- **Lisibilité** : chaque lettre repose dans une rainure gravée sombre (`#021722`, trait de 3 unités autour du glyphe) ; l'éclat clair se détache toujours d'un fond foncé (≥ 10:1 calculé), jamais de la pierre claire. À l'état éteint, la lettre est de cette même teinte sombre.
- **Bug de la « ligne au-dessus de l'écriture »** : le halo débordait de la bande restaurée (`b.strip`) et s'accumulait au-dessus à chaque image, formant un trait net. La bande couvre maintenant `TAG_Y = 280` → 352 (halo et coulées compris) et la peinture est rognée (`clip`) à cette bande.
- Seule la bande est redessinée (≈ 15 images/s), **uniquement sur la stèle de l'étape en cours** ; ailleurs état fixe à demi allumé. `prefers-reduced-motion` ou vue statique : aucun mouvement, aucune coulée.
- Décoratif (`aria-hidden`) : les technos restent dans la card et dans `#scSr`. Couleurs : turquoise/bleu électrique du wire (`0x00F2FE` voisin), pas de nouveau rôle.
