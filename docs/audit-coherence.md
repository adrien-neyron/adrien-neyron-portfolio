# Audit de cohérence : boucle d'accueil ↔ pages du site

19/10/2026, branche `audit/coherence`. Constat : l'accueil (`/`, boucle « L'ascension », `assets/loop/*`, layout `loop`) et les autres pages (layout `default` : `TrailNav`, `AppFooter`, `main.css`) sont deux sites qui se suivent sans se ressembler. Chaque écart ci-dessous est vérifié dans le code.

## 1. Identité visuelle (priorité haute)

| Sujet | Boucle | Pages | Écart |
|---|---|---|---|
| Jetons | `--bg --fg --muted --line --acc --acc-text --card --brand…` (`loop.source.css`, `docs/charte-graphique.md`) | `--color-bg --color-text --color-accent --color-surface…` (`main.css`) | deux systèmes de rôles, deux noms |
| Jour | fond froid `#F4F8FA`, texte ardoise `#12222B`, accent texte `#B23F27` | fond beige `#F5F0E8`, texte brun `#2C2416`, accent `#A84E20` | deux palettes de jour |
| Nuit | bleu nuit `#050811`, cuivre `#E26D3B` | brun `#1A1410`, orange `#E07840` (bleu nuit seulement sur /contact) | deux palettes de nuit |
| Titres | Cormorant Garamond (« Cordée Serif ») | DM Serif Display | deux serifs |
| Texte courant | JetBrains Mono | Inter | deux familles de texte |
| Fond | scènes 3D, ciel, relief en courbes | photo `bivouac-light.png` voilée + `TrailContourBackground` | deux ambiances |

## 2. Préférences du visiteur (priorité haute, bug d'usage)

- **Thème** : la boucle lit/écrit `localStorage['asc-theme']` + `html[data-theme]` ; les pages `localStorage['color-mode']` + `html.dark` (@nuxtjs/color-mode). Choisir « Nuit » sur l'accueil n'a aucun effet sur /projects, et inversement.
- **Son** : la boucle a son propre son (Web Audio, `#tgSoundTop`) ; les pages un autre lecteur (`BackgroundMusic.vue`, MP3). Deux réglages indépendants.
- **Mouvement / vue statique** : `asc-static`, `asc-eco` n'existent que dans la boucle ; les pages suivent seulement `prefers-reduced-motion`.

## 3. Navigation et architecture (priorité haute)

| Boucle (menu « Étapes ») | Pages (`TrailNav`) |
|---|---|
| Se repérer · Accueil | 01 Se repérer → `/` |
| S'équiper · Atelier | 02 Monter → `/projects` |
| Monter · Expériences | 03 Persévérer → `/carnet` |
| Persévérer · À propos et carnet | 04 S'équiper → `/ai-tools` |
| Se poser · Contact | 05 Se poser → `/contact` |

- **Ordre différent** (S'équiper 2ᵉ dans la boucle, 4ᵉ sur les pages) et sens différent (« Persévérer » = À propos + carnet dans la boucle, Carnet seul sur les pages).
- **`/about` absent de `TrailNav`** : la page « Le Randonneur » n'est atteignable que par le pied de page.
- `TrailNav` n'affiche que la métaphore (« Monter ») sans libellé explicite, contrairement à la règle du CLAUDE.md (« Sentiers · Projets ») et à la boucle (« Monter · Expériences »).
- **La boucle ne mène à aucune page** sauf `/projects` (lien ajouté le 19/10), `/admin` et `/outils/allure-denivele` : ni `/about`, ni `/carnet`, ni `/ai-tools`, ni `/contact`.
- **Fil d'Ariane** des pages : « Camp de Base » → `/`, alors que `/` est la boucle et que « Camp de Base » est l'ancien accueil (`/camp-de-base`, toujours en ligne, orphelin : aucun lien n'y mène).
- **Marque** : « Cordée » + mousqueton dans la boucle ; « Adrien Neyron » en texte sur les pages ; titre de l'onglet « Adri — développeur front-end… » sur l'accueil, « … | Adrien Neyron » ailleurs.

## 4. Pied de page (priorité moyenne)

- Boucle : CV (PDF) · Contact (ouvre la scène bivouac) · Mentions légales · Accessibilité (fenêtres) · Admin ; « © 2026 Adrien Neyron · Front-End Dev × Accessibilité Numérique ».
- Pages : Accueil · Projets · IA · À propos · Contact ; « Camp de Base © 2025 » (année périmée).
- **Mentions légales et déclaration d'accessibilité absentes des pages** (RGAA : la déclaration doit être accessible depuis chaque page).

## 5. Contenus en double ou contradictoires (priorité moyenne)

- **Lien CV cassé** : la boucle pointe par défaut vers `/cv-adrien-neyron.pdf`, qui n'existe pas dans `public/` (seul `/2025_CV_AdrienNEYRON.pdf` existe, celui du profil). Corrigé seulement quand la 3D démarre et reçoit `cvUrl` de l'admin ; sans JS ou avant la 3D, le lien renvoie une 404.
- **Deux formulaires de contact** : la boucle ouvre la messagerie (`mailto:`) ; `/contact` envoie via EmailJS.
- **Qualités** : boucle = Résilience, Écoute active, Stabilité, Ouverture d'esprit ; `/about` = L'Endurance, La Précision, La Vision.
- **Parcours** : étapes de la trace = sept. 2010 – oct. 2021 (UCPA / Decathlon) ; `/about` = « 2011 – 2021 », puis « 2021 – 2023 transition », « 2023 – Aujourd'hui » ; ancien `CV_FACTS` = sept. 2009 – mai 2021. Trois versions.
- **« 17 ans d'expérience »** (cadran, boucle, /about, /camp-de-base) : avec un départ en septembre 2010, on arrive à 16 ans en octobre 2026. Chiffre à confirmer.
- **Vocabulaire** : « Expériences » / « Atelier » (boucle) vs « Sentiers » / « Équipement » (pages) pour les mêmes contenus.

## 6. Accessibilité transversale (à garder)

- Les deux côtés ont lien d'évitement, focus visible, `aria-live`. À harmoniser : libellés (« Aller au contenu » vs « Aller au contenu principal »), contour de focus (`--focus` vs `--color-accent`).

## Plan proposé, une branche courte par étape

1. **Correctifs immédiats** : lien CV par défaut, année et texte du pied de page, fil d'Ariane « Accueil ».
2. **Une seule préférence de thème** (et de son) partagée entre la boucle et les pages.
3. **Une seule navigation** : même ordre, mêmes métaphores + libellés, `/about` présent, liens de la boucle vers chaque page.
4. **Une seule charte** : jetons communs (pages alignées sur la charte cible), typographie, fond.
5. **Pied de page commun** + pages Mentions légales et Accessibilité.
6. **Contenus** : une source pour qualités, parcours et chiffres (profil admin / étapes), un seul formulaire de contact, sort de `/camp-de-base`.

Chaque étape : tests, axe, contrastes, Lighthouse, mise à jour de ce fichier et du CLAUDE.md.

## Décisions (19/10/2026)

- **Charte de référence** : celle de la boucle (Cordée : Cormorant Garamond + JetBrains Mono, rôles de `docs/charte-graphique.md`). Les pages s'alignent dessus.
- **Navigation** : ordre de la boucle partout : Se repérer · Accueil → S'équiper · Équipement → Monter · Sentiers → Persévérer · Le Randonneur et Carnet → Se poser · Bivouac.
- **`/camp-de-base`** : redirection 301 vers `/`.
- **Expérience** : plus de « 17 ans » ; formulation d'Adri : **5 ans de développement, 12 ans de formation et de management**.

## Suivi

- [x] Étape 1 — correctifs immédiats (branche `fix/coherence-etape-1`) :
  - liens CV de la boucle : fichier existant par défaut (`/2025_CV_AdrienNEYRON.pdf`, attribut `data-cv`), remplacés côté serveur par le CV de l'admin (`applyLoopContent`, `https://` ou chemin du site seulement) et par `loop.js` pour **tous** les liens (le pied de page ne suivait pas l'admin) ;
  - « 17 ans » remplacé partout par 12 ans de formation et de management + 5 ans de développement (boucle, cadran par défaut, /about, description de l'accueil, aide de l'admin) ; le cadran en ligne affiche déjà les valeurs de l'admin (« EXP-DEV · 5 ANS ») ;
  - fil d'Ariane des Sentiers : « Accueil » au lieu de « Camp de Base » ;
  - pied de page des pages : « © année · Front-End Dev × Accessibilité Numérique », comme la boucle ;
  - `/camp-de-base` : redirection 301 vers `/` (`routeRules`), page mise à la corbeille, tests smoke et axe ajustés.
  - Reste signalé : l'étape Départ couvre sept. 2010 – oct. 2021 (11 ans), le texte dit 12 ans ; à trancher à l'étape 6 (parcours).
- [ ] Étape 2 — préférences partagées (thème, son)
- [ ] Étape 3 — navigation unique
- [ ] Étape 4 — charte unique
- [ ] Étape 5 — pied de page commun, mentions légales, accessibilité
- [ ] Étape 6 — contenus (qualités, parcours, formulaire, chiffres)

## Ménage du 26/10/2026 (branche `chore/menage-composants`)

Inventaire fait par recherche des références dans `components/`, `pages/`, `layouts/`, `composables/`, `stores/`, `utils/`, `assets/loop/`, `tests/`. Non exécuté : build, tests, Lighthouse (voir « Reste à vérifier »).

### Code mort supprimé
- `components/ui/TextDecrypt.vue` et `composables/useTextDecrypt.ts` : aucune page ne les utilise depuis que l'accueil est la boucle (`pages/index.vue` ne rend que `LoopHome`). Aucun test ne les cite. CLAUDE.md mis à jour (la règle « pas d'`aria-label` sur un `<div>` » est conservée).
- Les 21 autres composants, les 5 autres composables, les 6 stores et les `utils/` sont tous référencés. `layouts/loop.vue` (accueil) et `pages/callback.vue` (retour Auth0) sont utilisés.

### Signalé, pas supprimé (décision d'Adri)
| Sujet | Constat | Pourquoi pas supprimé |
|---|---|---|
| `heroTitle`, `headerSubtitle` du profil | éditables dans `/admin/profile`, affichés nulle part | champs en base ; supprimer l'input ou les brancher |
| `public/malt.svg`, `public/an-logo.svg`, `public/NIGHT.mp3` | aucune référence dans le code | une image peut être saisie dans l'admin (Mongo) : vérifier |
| `public/recentprojects/` : `aspirationSport.png`, `aspirationSport copie.png` (même taille : doublon), `cpaie-*`, `dressmeup*`, `morning`, `portfam`, `portfolio-*`, `Project.png` | non cités dans le code (seuls coachflow, runfit, tyredating, dgfip le sont, via `data/projects.ts`) | chemins possibles dans les projets en base (`image.light` / `image.dark`) |
| `content/sample_….glb` (10 Mo) | reste de `@nuxt/content`, retiré du projet | à retirer s'il est suivi par git |
| `Claude outputs/` (patch, bundle git, 3 `.webp` en doublon de `public/recentprojects/`) | fichiers de travail | à sortir du dépôt s'ils sont suivis |
| `models-src/` | sources (GLB d'origine, polices) | légitime, garder |

Vérifier ce qui est suivi : `git ls-files content "Claude outputs" models-src public | head -50`.

### Couleurs brutes (règle CLAUDE.md « jamais de couleur brute »)
Hex ou `rgba()` dans le code des pages et composants (hors boucle) : `TrailNav.vue` 24, `SettingsGear.vue` 17, `AppBackground.vue` 6, `ProfileForm.vue` 3, `ContourBackground.vue` 2, `pages/projects/[id].vue` 2, `pages/admin/index.vue` 2, `pages/admin/carnet/index.vue` 2, et 1 dans chacun de `CarnetForm`, `FileUpload`, `pages/admin/ai-tools`, `pages/admin/profile`, `pages/admin/stages` (dont `#e53e3e` pour les erreurs). À traiter avec l'étape 4 (charte unique) : un jeton « erreur » manque dans `main.css`.

### Écran de chargement (« Montée au sommet 0 → 2 480 m »)
- Rôle : masquer le temps que la scène 3D s'installe et bloquer le défilement (`overflow: hidden`) tant que `loaded` est faux ; à la fin, la boussole se cale sur le nord (`finishLoad`), le lecteur d'écran entend « Boussole calée sur le nord. Faites défiler pour explorer. ».
- **La barre est fictive** : elle suit le temps (`LOAD_MS`), pas le chargement réel. 2,6 s à la première visite, 0,45 s ensuite (`localStorage asc-seen`), 0,45 s avec `prefers-reduced-motion`. Le chargement réel des scènes est progressif (`prewarm`, `requestIdleCallback`) et ne dépend pas de cette barre.
- Bouton « Passer le chargement » : présent. Pistes (à décider) : raccourcir à ~1 s ; ou adosser la fin au 1er rendu 3D réel plutôt qu'à un minuteur.

### Défilement entre les projets
- Cause trouvée par simulation du filtre de molette (`utils/wheelStep.ts`) : après chaque pas, toute la transition (0,6 s) et tous les événements à moins de 280 ms les uns des autres étaient absorbés. Résultat mesuré : 6 crans de molette à 350 ms d'intervalle → 3 projets ; un 2ᵉ geste de pavé juste après la queue d'inertie du 1ᵉʳ → 0 projet.
- Correctif : verrou court (0,3 s) puis reconnaissance d'un nouveau geste (pause, demi-tour, delta qui remonte, cran de molette). Même résultat chiffré : 6 crans → 6 projets, 2ᵉ geste pris en compte. 13 tests unitaires (dont 6 nouveaux).
- Autre cause possible, **non modifiée** : le panneau d'étape (`#stopCard`, 80 vh max) défile d'abord s'il déborde et que le curseur est dessus ; il faut alors un cran de plus.
- Non testé : sur un vrai pavé tactile et une vraie molette (simulation seulement).

### Reste à vérifier
`npm test`, `npm run build && npm run test:e2e`, Lighthouse mobile (perf ≥ 90, a11y 100), essai à la molette et au pavé sur l'accueil.
