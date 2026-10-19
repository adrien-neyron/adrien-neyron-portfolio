# Admin → accueil « L'ascension »

L'accueil (boucle 3D, `components/loop/LoopHome.vue` + `assets/loop/loop.js`) lit désormais le contenu saisi dans `/admin`. Mis à jour le 11/10/2026.

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
| Projets | `title`, `tagline`, `technologies`, `place` | bloc 3D du projet, liste d'étapes, carte de l'atelier |
| Projets | `description`, `challenge`, `solution`, `result`, `impact`, `technologies`, `link`, `code` | fiche détaillée (Défi / Solution / Résultat / Impact, liens) |
| Projets | `stats` (fiche topo → chiffres clés) | fiche détaillée : chiffres clés sous le titre (3 au plus). Vide → ceux de `data/projects.ts` s'il y en a, sinon aucun bloc (rien d'inventé) |
| Projets | `cover`, `coverCredit`, `coverCreditUrl` (photo d'ambiance) | fiche détaillée : photo sous verre (inclinaison 3D au survol de la souris, coupée en mouvement réduit) et crédit. Vide → photo de `data/projects.ts` s'il y en a, sinon pas de photo |
| Projets | `order` | ordre de lecture des projets ajoutés en plus |
| Outils IA | nom, accroche | carte « Équipement IA » (nombre d'outils, liste, étiquettes) |
| Carnet | titre, extrait, catégorie, date | liste du carnet (du plus récent au plus ancien), filtres |

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

## Étapes datées, appuyées sur le CV

**Ordre** : les étapes de la carte sont rangées par **date de début**, de la plus ancienne à la plus récente, puis réparties à égale distance sur la trace et renumérotées (« Étape 01 » …). La date vient du champ `startDate` de l'admin (texte libre : « Mai 2026 », « déc. 2023 », « 2023 », « 2023-12 », lu par `dateKey`). Sans date dans l'admin, elle vient de `CV_FACTS` (`assets/loop/loop.js`), tiré du CV en ligne (« CV-AdrienNeyron-DeveloppeurFrontEnd.pdf », profil de l'admin). Un projet sans aucune date se place en fin de trace, avant « À déterminer ».

**Contenu** : `CV_FACTS` donne pour chaque étape la période affichée, le rôle (repris dans le surtitre de la fiche : « Étape NN · lieu · rôle ») et les puces du CV. Ces puces passent en tête des points clés, sans répéter une puce de l'admin qui dit la même chose. La description de l'admin reste le résumé. Les chiffres du CV ne servent que si l'admin n'en a pas. Le Départ reprend la période et les deux puces UCPA / Decathlon du CV.

**Sources des dates** (octobre 2026) :

| Projet | Date | Source |
|---|---|---|
| Départ | sept. 2009 – mai 2021 | CV |
| StockPulse | 2021 – 2023 | carte d'origine (le CV le place dans le freelance, juin 2021 – oct. 2025) |
| DressMeUp | 2023 | création du dépôt public (juillet 2023) ; absent du CV |
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
