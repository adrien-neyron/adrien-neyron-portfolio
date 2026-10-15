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

## Cairns (blocs des projets sur la carte)

Chaque projet est un cairn sobre posé **sur** la trace, en une seule matière (pierre mate, `STONE` ; les `mat` cuir / pierre / métal ne servent plus, `paintBlock` peint toujours la pierre) : 2 galets facettés sous le wire, un jeu de `GAP` = 0,28 unité (≈ 3 px à l'arrêt) où passe le wire, 2 galets au-dessus, puis la pierre gravée au contour irrégulier (`stoneShape`) qui porte le texte. **Cairn du Départ (étape 00)** : le Départ a aussi son cairn, à t = 0, avec les mêmes pierres : gravé « Étape 00 · Grandes Platières · 2009–2021 », « Départ », « Éducateur, formateur et directeur dans le sport » (version courte qui tient sur 2 lignes ; le texte complet reste sur la plaque) et Management / Formation / Outdoor. Il n'a pas de fiche projet (pas de « Voir la fiche » ni de résumé d'étape). Il n'est **pas sous l'aiguille** mais à côté, pour une image nette : la pointe de l'aiguille marque seule le départ de la trace, et le cairn est décalé dans `placeBlocks` (`depOff`) de `DEP_SIDE` = 17 unités à gauche de la trace sur écran large, ou de `DEP_BACK` = 20 unités derrière l'aiguille sur écran étroit (`cam.aspect < 0,9`, sinon il sortirait de l'image). Le wire ne le traverse donc pas. Rien n'existant avant la trace, sa pierre est orientée vers le prolongement de la trace en arrière, et la boule et sa perle se posent juste **après** lui. Vu de dessus pendant le Départ (vue alignée sur le cadran), il est lisible de face. **Pointe de l'aiguille = départ de la trace** : pendant la plongée dans le verre, l'aiguille indique le nord et le départ de la trace (`P[0]`) est placé exactement sous sa pointe nord, pas au centre du cadran. Le centre du cadran correspond au point `C0`, reculé de `TIP = RFIN × NEEDLE_TIP / DIAL_R` (≈ 9,8 unités) dans l'axe de la trace (`hd`) ; `C0` sert à la fois au relief gravé dans le verre (`topoInfo`) et à la caméra de dessus (`rig`), donc les courbes restent superposées. Quand l'aiguille grandit en s'effaçant, elle grandit vers l'arrière : sa pointe ne bouge pas. Les galets ont dessus et dessous plats (`rockGeo`), donc le jeu reste net ; tout est placé dans `placeBlocks()`.

États (réglés dans `rig()`) : cairn actif à 100 %, la boule posée devant lui faisant la perle ; cairns passés à 80 % avec un petit point ; cairns à venir à 30 %, sans perle. Les cairns à 30 % passent sous 3:1 de contraste : c'est acceptable parce que la même information (étapes, étape courante) est donnée en texte par la liste des étapes, la plaque et l'annonce `#live`. Au survol ou à l'arrêt, la pierre gravée se soulève légèrement. Pas d'anneau au sol.

## Fiche d'étape (résumé automatique)

À l'arrêt sur un cairn (caméra posée depuis 0,5 s, `updateCard()` appelé par `updateUi`), un résumé compact `#stopCard` apparaît à droite (en bas sur téléphone) : étape · lieu, Km et altitude, titre, chiffres clés, accroche sur 3 lignes, 4 technos au plus, bouton « Fiche complète » (ouvre la fenêtre `#dlgTool`) et bouton « Masquer les résumés d'étape » (mémorisé pour la session, `sessionStorage` `asc-card-off` ; le bouton « Voir la fiche » revient). Il remplace le bouton « Voir la fiche » et les étiquettes flottantes tant qu'il est affiché, et disparaît en repartant.

Ce n'est **pas** une fenêtre modale : une modale à chaque arrêt bloquerait le défilement et volerait le focus (changement de contexte non demandé, RGAA 7.4 / WCAG 3.2.2). C'est un `aside` étiqueté par son titre, sans prise de focus ; l'étape est déjà annoncée par `#live`. Sur téléphone, chiffres clés et technos sont masqués (2 lignes d'accroche). Hors vue statique uniquement ; mouvement réduit : simple fondu.

## Câble et pulse lumineux (trace des projets, « ISO »)

La trace est un câble technique (`FAT_V` / `FAT_F`, spline lisse issue de la `CatmullRomCurve3`, traits d'épaisseur constante à l'écran), en deux passes :
- **câble inactif** sur toute la trace, 3 px, bleu ardoise mat `#1E293B` (trait plein non éclairé : la « rugosité 0,8 » n'a pas d'effet sur une ligne sans lumière). Attention : la nuit, `#1E293B` sur `#050811` donne ≈ 1,4:1, le parcours à venir est donc très discret ; c'est acceptable seulement parce que la liste des étapes, la plaque et `#live` donnent la même information. Le jour, contraste élevé ;
- **pulse actif** sur la partie parcourue (`glow`) : cyan électrique `#00F2FE` à la tête qui évolue vers le bleu glacier `#38BDF8` derrière ; couleur émissive ×2,5 (`uBoost`), cœur blanc-chaud, halo et « bloom » (trois profils gaussiens en travers du câble, 26 px) et ondes d'énergie qui courent vers la tête (`uTime`). Pas d'éclat renforcé à la tête ni d'aura dans le sol autour de la boule (retirés à la demande d'Adrien : la boule reste nette). Mélange additif la nuit ; le jour, mélange normal en `#0891B2` → `#0369A1`, sans surbrillance.
- **Bloom** : pas de post-traitement. Un `EffectComposer` + `UnrealBloomPass` demanderait d'embarquer 6 modules d'exemples r128 (comme `GLTFLoader`), un rendu supplémentaire plein écran à chaque image et ferait perdre la transparence du canevas (la carte est posée sur le ciel CSS). Le halo est donc calculé dans le shader du câble : même effet « fibre sous tension », sans coût.
- **Avancement** : `uT` (l'« uProgress » de la spec) est recalculé à chaque image depuis le défilement (`param(p)`), donc lié à 100 % au scroll, dans les deux sens. GSAP ScrollTrigger n'est pas utilisé : la boucle pilote déjà toute la scène au défilement, l'ajouter doublerait la source de vérité.
- Mouvement réduit : ondes figées (temps à 0), le pulse reste allumé. Vue statique : câble entièrement allumé.

**L'aiguille** remplace la boule (supprimée) : sur la carte, il ne reste que le **triangle nord** (braise, deux facettes, mêmes teintes de jour et de nuit que le nord de l'aiguille du cadran, arête centrale légèrement relevée), à l'échelle du sol (`RFIN / DIAL_R`) ; sa base est le pivot. Il est couché sur la trace, pointe vers l'avant (`lookAt` sur la tangente), et c'est sa **pointe** qui est sur la trace : le wire parcouru s'arrête sur elle (`uT` = position de la pointe). **Superposition exacte** pendant la plongée : à chaque image, la montre publie à l'écran la pointe et le pivot de son aiguille (`NDL`, calculés comme `DIAL` juste avant le rendu) ; tant que la caméra de la carte est en vue de dessus et que la trace n'a pas avancé (`t < 0,006`), `rig` ramène ces deux points sur le plan de la trace et y pose le triangle (position, angle et taille). Il recouvre donc exactement le nord de l'aiguille du cadran, même quand elle tourne, clignote ou grandit, puis il glisse sur la trace dès qu'elle avance. Sans passage par la montre (`NDL.ok` faux), il est directement sur la trace. Au Départ, il est dessiné devant la pierre gravée (`renderOrder` 11, sans test de profondeur, matériaux `transparent` pour être triés avec la pierre), puis il rétrécit à 45 % en avançant. À l'arrêt sur un cairn de projet, sa pointe s'arrête 11 unités devant lui, côté caméra, et le désigne. La pierre gravée du cairn actif est dessinée au premier plan (`renderOrder` 10, sans test de profondeur) : le wire ne passe jamais sur son texte.

Supprimés : la boule (perle cuivre et ses bagues), halo émeraude, faisceau (`beam`), lueur (sprite) autour de la boule. L'ancienne carte SVG (`#mapSvg`, `pool`, `beamGlow`, `updateMap`) n'est plus appelée ; elle est conservée en attendant une décision de suppression.

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
