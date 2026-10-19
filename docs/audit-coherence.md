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
