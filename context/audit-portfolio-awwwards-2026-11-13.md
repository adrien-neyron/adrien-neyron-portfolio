# Audit front-end — adrienneyronportfolio.vercel.app
**Référentiel : critères Awwwards (Design, Usability, Creativity, Content + Developer Award)**
Date de l'audit : 13/11/2026 · Auditeur : Claude · Périmètre : site en ligne, vu dans un navigateur réel (desktop + émulation mobile 375 × 812), sans accès au code source pour cet audit.

---

## 0. Lire d'abord : méthode et limites

| Élément | Détail |
|---|---|
| Ce qui a été fait | Chargement réel de `/`, mesures dans le navigateur (Performance API, DOM, en-têtes HTTP), lecture des pages `/projects` et `/about`, tests de `/robots.txt`, `/sitemap.xml`, `/mentions-legales`, `/accessibilite`, `/contact`, `/carnet`, `/ai-tools`, d'une URL inexistante, capture d'écran desktop et mobile. |
| Ce qui n'a **pas** été fait | Lighthouse / PageSpeed (non lancé), WebPageTest, lecteur d'écran (NVDA/VoiceOver), parcours clavier complet de la visite guidée, test sur vrai téléphone, calcul de contraste de chaque nœud (axe non exécuté), `/projects/[id]` et `/carnet` lus en détail. |
| Mesures de performance | Une seule charge, machine de développement, réseau non limité. Ce sont des **indications**, pas un score de laboratoire. |
| Sites Awwwards de référence | Les pages `awwwards.com/sites/...` sont fermées aux robots : je n'ai **pas pu les ouvrir** et je ne décris donc pas leur fonctionnement interne. La comparaison s'appuie sur la grille officielle de notation, sur les sous-critères du Developer Award affichés par Awwwards, sur des articles de jurés, et sur la liste des sites primés en 2026 (section 9). |
| Notes /10 | Estimations d'auditeur, **pas** une prédiction de score Awwwards. Le jury applique sa propre grille (minimum 18 jurés, les trois notes les plus éloignées de la moyenne sont retirées). |
| Étiquettes | **[mesuré]** = relevé sur le site en ligne aujourd'hui · **[lu]** = texte lu sur la page · **[à vérifier]** = non confirmé. |

---

## 1. Synthèse

Le site est **sérieux, cohérent avec son message** (front-end Vue 3 / accessibilité) et **nettement plus abouti que l'audit interne du 03/11/2026**. Plusieurs points P0 de cet audit sont corrigés en ligne : `robots.txt`, sitemap, JSON-LD, page 404 à la charte, pages Mentions légales et Accessibilité, `lang="fr"`, honeypot anti-spam.

Pour viser une distinction Awwwards, trois écarts dominent :

1. **Deux domaines en concurrence** : le site audité (`adrienneyronportfolio.vercel.app`) déclare partout un autre domaine comme canonique (`adrien-neyron-portfolio.vercel.app`). Un jury, un moteur de recherche et un partage LinkedIn verront deux sites.
2. **Le premier écran sur mobile** : après 4 s en émulation, la vue mobile montre un titre puis un grand vide avec une aiguille ; la montre 3D n'apparaît pas (peut-être due à l'émulation, **[à vérifier]** sur appareil réel). Or Awwwards pèse l'usage mobile et pénalise les animations lentes à charger.
3. **Des chiffres et durées contradictoires** (10 / 11 / 12 ans ; « 5 ans de code » vs « 2023–aujourd'hui »), sur un site dont l'argument est la rigueur. Le critère Content (10 %) et la crédibilité en pâtissent.

**Estimation globale (indicative)** : niveau « Honorable Mention » (seuil officiel du jury : 6,5/10) plausible ; Site of the Day demande un travail supplémentaire sur la finition visuelle, le mobile et la preuve de performance.

| Critère Awwwards | Poids | Note estimée | Résumé |
|---|---|---|---|
| Design | 40 % | 7,5 | Direction artistique forte et cohérente (nuit, aurore, montre 3D, typographie serif + mono). Reste à prouver en mobile et à resserrer la hiérarchie. |
| Usability | 30 % | 6,5 | Bons réflexes d'accessibilité, mais navigation à métaphores, hero mobile vide, cibles tactiles petites, accès aux projets surtout par la 3D. |
| Creativity | 20 % | 8,0 | Concept « L'ascension / Cordée » original et lié au parcours. Point fort. |
| Content | 10 % | 6,5 | Message clair ; chiffres contradictoires, preuves non sourcées, fiches projet inégales. |
| Developer (indicatif) | — | 7,0 | Sémantique, SEO et accessibilité solides ; performance non prouvée ; mobile à confirmer. |

---

## 2. Rappel : comment Awwwards note

- Grille du jury : **Design 40 %, Usability 30 %, Creativity 20 %, Content 10 %**. Honorable Mention à partir de **6,5**. Le Developer Award exige un score **supérieur à 7**. Source : page d'évaluation Awwwards.
- Sous-critères Developer affichés sur les fiches de sites primés : **WPO (performance), Responsive Design, Semantics / SEO, Markup / Meta-data, Animations / Transitions, Accessibility**.
- Lecture de jurés : Design + Usability = 70 % du score ; les sites perdent le plus souvent sur l'usage, pas sur la créativité ; les animations lourdes et les menus décoratifs trop petits sont des motifs de notes basses ; l'absence de focus visible et de gestion de `prefers-reduced-motion` est une perte d'usabilité « facile à éviter ».

Ces points structurent la suite.

---

## 3. Constats mesurés sur le site en ligne

### 3.1 Performance et chargement (Developer : WPO) — **[mesuré]**

| Indicateur | Valeur | Lecture |
|---|---|---|
| TTFB | 125 ms | Bon |
| DOMContentLoaded / load | ≈ 1,13 s / ≈ 1,23 s | Correct pour une page à scène 3D |
| LCP (1 charge, desktop) | ≈ 2,4 s | Limite haute du « bon » (seuil Google 2,5 s) ; à confirmer en mobile throttlé |
| CLS | ≈ 0,005 | Très bon |
| Requêtes / poids transféré | 35 / ≈ 547 ko | Léger pour le contenu ; un module JS de 153 ko |
| Compression | Brotli | Bon |
| HTML | `cache-control: public, max-age=0, must-revalidate` | Normal sur Vercel |
| Polices préchargées | Inter, JetBrains Mono, Cormorant Garamond italique | Bon ; 3 familles : à garder sous contrôle |
| Image principale | 1 `<img>` sans `loading="lazy"` | Acceptable si c'est l'image du premier écran |

Ce que cela ne prouve pas : le poids total après interaction (chargement de three.js et des modèles 3D à la première action), le comportement 4G, l'INP. **Action : lancer Lighthouse mobile et consigner les résultats** (section 8).

### 3.2 Sémantique, SEO, méta-données (Developer : Semantics/SEO, Markup/Meta-data) — **[mesuré]**

| Point | État |
|---|---|
| `lang` | `fr` ✔ |
| `<title>` | « Adrien Neyron — développeur front-end · Vue 3, TypeScript, accessibilité » ✔ |
| `h1` | Un seul, visible : « Beaucoup ont le cap. Peu connaissent le sentier. » ✔ |
| Titres | 10 `h2`, 14 `h3` sur l'accueil |
| Repères | `main` ×1, `nav` ×3, `header` ×1, `footer` ×1 ✔ |
| JSON-LD | Présent (`WebSite` + `Person`, relié par `@graph`) ✔ |
| `robots.txt` | Présent : autorise `/`, interdit `/admin`, `/api/`, `/callback`, déclare un sitemap ✔ |
| `sitemap.xml` | Présent, liste `/`, `/projects`, `/about`, `/carnet`, `/ai-tools`, `/contact`… ✔ |
| Page 404 | Personnalisée : « Sentier introuvable \| Adrien Neyron », avec `h1` ✔ |
| Mentions légales, Accessibilité | Pages dédiées en HTTP 200 ✔ |
| Open Graph / Twitter | Présents ; image = `profile.png` ; carte Twitter `summary` (vignette carrée) |
| `theme-color`, manifest | Absents (secondaire) |
| **Canonical, OG, JSON-LD, sitemap, robots** | **Tous pointent `adrien-neyron-portfolio.vercel.app`**, pas le domaine audité ✘ |

### 3.3 Accessibilité (Developer : Accessibility ; Usability) — **[mesuré]** sauf mention

| Mesure | Résultat |
|---|---|
| Lien d'évitement | « Aller au contenu » → `#main` ✔ |
| Canvas 3D | 8 `canvas`, tous `aria-hidden="true"` ✔ |
| Dialogues | 5 éléments `dialog` natifs ✔ |
| Annonces | 1 zone `aria-live` ✔ |
| Focus | 84 règles `:focus-visible` dans les feuilles de style ✔ |
| Mouvement réduit | 38 règles `prefers-reduced-motion` ✔ ; réglage « Vue statique » **[lu]** ✔ |
| Sans JavaScript | Texte, titres, listes, liens lisibles ; message explicite pour la 3D **[lu]** ✔ |
| Images | Aucune `<img>` sans attribut `alt` ✔ ; vignettes projets en `alt=""` (décoratives) **[lu]** |
| Liens / boutons sans nom | 0 / 0 ✔ |
| Champ sans étiquette | 1 : `input name="site" tabindex="-1"` = honeypot anti-spam. Acceptable, mais ajouter `aria-hidden="true"` sur son conteneur pour qu'aucun lecteur d'écran ne l'annonce |
| Cibles tactiles (mobile 375 px) | 7 éléments interactifs sur 47 visibles font moins de 44 px ✘ (WCAG 2.2 : minimum 24 px respecté en desktop, 0 cible < 24 px) |
| Contrastes | **Non mesuré par moi** ; l'audit interne du 03/11 signalait une dette (32 nœuds). À reverifier avec axe |

### 3.4 Responsive et mobile — **[mesuré]** + **[à vérifier]**

- Pas de défilement horizontal à 375 px ✔.
- Titre `h1` : 43 px en desktop, 32 px en mobile ✔ (lisible).
- Capture mobile (4 s après chargement) : en-tête « PROJETS », surtitre, titre, sous-texte, puis **grand espace vide** avec une aiguille de boussole ; ni montre, ni bouton « Visite guidée », ni CV / Contact visibles dans la première vue. **[à vérifier]** sur appareil réel : si l'état est durable, c'est le point le plus coûteux pour le score Usability/mobile.

### 3.5 Sécurité et en-têtes (hors grille Awwwards, mais visible d'un développeur) — **[mesuré]**

HSTS présent ✔. Pas de `Content-Security-Policy` ✘. `X-Content-Type-Options` non relevé. Les autres en-têtes (Referrer-Policy, Permissions-Policy) n'ont pas été testés.

---

## 4. Audit par critère Awwwards

### 4.1 Design (40 %) — 7,5 / 10

**Points forts**
- Direction artistique **unique et cohérente** : fond nuit avec aurore, montre GPS 3D, courbes de niveau, typographie serif (Cormorant / « Cordée Serif ») associée à une police mono pour les données, accent cuivre. C'est ce que le jury appelle une identité reconnaissable.
- Hiérarchie du premier écran claire en desktop : surtitre → accroche en italique serif → sous-texte → bouton principal → CV et Contact en pastilles toujours visibles.
- Cohérence entre pages : mêmes pieds de page, même fil d'Ariane, même logo « Cordée » **[lu]**.
- Palette gérée par jetons jour / nuit / aube / heure dorée selon la page (`data-time`) : bonne idée narrative **[mesuré]**.

**Écarts avec les sites primés**
1. **Première impression mobile** (voir 3.4) : un site primé montre sa signature visuelle dès la première vue sur téléphone.
2. **Lisibilité sur fond 3D** : le sous-texte (petite taille, fort contraste sur fond sombre en desktop) passe devant une scène animée ; vérifier le contraste réel pendant l'animation et sur le mode jour.
3. **Rythme et respiration** : la page d'accueil enchaîne dix `h2` et quatorze `h3` ; les sites primés proposent des sections plus rares, plus grandes, avec un seul message par écran.
4. **Micro-interactions** : non évaluées (curseur, survols, transitions de page, retour d'état des boutons). Elles font partie du critère Design/Creativity ; à documenter par vidéo courte.
5. **Cartes projet** : vignettes décoratives (`alt=""`) ; la preuve visuelle (capture nette, avant/après) manque pour convaincre un client **[lu]**.

### 4.2 Usability (30 %) — 6,5 / 10

**Points forts**
- Lien d'évitement, focus visible, `dialog` natifs, annonce `aria-live`, mode « Vue statique », « Pause », « Mode économe », son coupé par défaut **[lu/mesuré]**.
- Contenu lisible sans JavaScript, avec message explicite **[lu]**.
- Pages classiques à côté de la boucle 3D : un recruteur pressé peut contourner l'animation **[lu]**.
- Contact : adresse e-mail, LinkedIn, GitHub, rendez-vous, « réponse sous 48 h », formulaire avec anti-spam **[lu]**.

**Points faibles (ce qui coûte des points en jury)**
1. **Navigation par métaphores** : « Étapes · Projets · Outils » en haut, mais l'accès à « Le Randonneur » (profil/CV) et au « Carnet » passe par la scène ou le pied de page. Un menu qui n'aide pas à trouver l'information est le motif de pénalité Usability le plus cité par les jurés.
2. **Mobile** : hero vide (3.4) et 7 cibles < 44 px.
3. **Chemin recruteur** : accueil → fiche projet → CV → contact doit tenir en 3 clics sans animation. Le CV et le Contact sont visibles en pied ; un lien « Voir les projets » direct en première vue serait plus court.
4. **Liens projets** : les liens vers les fiches existent dans le HTML **[lu]** (amélioration par rapport à l'audit du 15/10, qui signalait des boutons seuls).
5. **`/outils` répond 404** alors que le menu affiche « Outils » et que le sitemap contient une entrée commençant par `/out…` ; l'outil vit sur `/ai-tools` et probablement `/outils/allure-denivele` **[à vérifier]**. Un lien ou une entrée de sitemap qui mène à un 404 est un défaut d'usage et de SEO.
6. **Lien « Admin »** dans la navigation publique et le pied de page **[lu]** : inutile pour un visiteur, signale une zone sensible et distrait la lecture.

### 4.3 Creativity (20 %) — 8,0 / 10

- Le concept **« L'ascension » / « Cordée »** relie l'identité visuelle au parcours (sommet → missions → bivouac) et à l'accroche. Il ne ressemble pas à un thème de portfolio standard : c'est le principal atout face au jury.
- Outils embarqués (calculateur d'allure / dénivelé, analyseur GPX annoncé) : preuve de savoir-faire utile, dans l'univers du trail **[lu]**.
- Limite : la créativité ne compense pas une usabilité faible (Awwwards pèse 30 % vs 20 %). Ne pas ajouter d'effets avant d'avoir résolu les points 3.4 et 4.2.

### 4.4 Content (10 %) — 6,5 / 10

**Points forts** : accroche mémorable, ton sobre, fiches projets structurées (Départ, Passages délicats, Itinéraire, Arrivée) **[lu]**, page À propos claire avec modes de collaboration et zones **[lu]**.

**Écarts relevés** — **[lu]**

| # | Contradiction ou fragilité | Où |
|---|---|---|
| 1 | Durée de formation / management : « 12 ans » (description de l'accueil), « 11 ans » (héros et valeurs de `/about`), « 10 ans » (chronologie 2010–2021) | Accueil, `/about` |
| 2 | « 5 ans de développement » (héros `/about`) vs « 2023–aujourd'hui développeur front-end » (chronologie) ; l'étape 2021–2023 est décrite comme transition et premiers projets freelance | `/about` |
| 3 | Chiffres forts sans source ni date : « 30 → 52 % de conformité RGAA », « 100+ sites corrigés », « −50 % de temps de traitement », « 500+ personnes formées », « management jusqu'à 25 personnes » | Accueil, `/projects` |
| 4 | « Fullstack » encore présent dans le texte et la pile (Node, Express, Mongo, Stripe, Midjourney, Perplexity), alors que le positionnement annoncé est front-end Vue 3 / accessibilité | `/about` |
| 5 | Statuts de projets inégaux : StockPulse « statut non indiqué », mélange Vue 3 / React 18 / Symfony-PHP-Twig sur 5 fiches | `/projects` |
| 6 | Mention d'applications « reliées à des classes Java » dans la section Outils de l'accueil | Accueil, à relire **[à vérifier]** |
| 7 | Noms publics à unifier (ex. client / projet : YEPGARAGE vs Click2SellSite vs Tyredating) | Accueil, `/projects` |

**Droit de citer** : DGFiP, Amiltone / BeTeam, Euromaster, Tyredating / YepGarage apparaissent nommément. À confirmer par écrit avant d'aller plus loin (déjà signalé dans les audits internes).

---

## 5. Audit « Developer Award » (sous-critères Awwwards)

| Sous-critère | Constat | Note indicative /10 |
|---|---|---|
| WPO (performance) | Chargement initial léger (547 ko, CLS ≈ 0), LCP ≈ 2,4 s ; chargement 3D différé ; mesure mobile et poids après interaction **non prouvés** | 7 |
| Responsive Design | Pas de débordement horizontal ; hero mobile à vérifier ; 7 cibles < 44 px | 6,5 |
| Semantics / SEO | `lang`, `h1` unique, repères, JSON-LD, robots, sitemap, 404 : bons ; **canonical sur un autre domaine** ; `twitter:card=summary` | 7 |
| Markup / Meta-data | Titres de page distincts, descriptions, OG par page ; URLs absolues sur un domaine différent | 7 |
| Animations / Transitions | Pause, vue statique, réduit-mouvement (38 règles), mode économe ; qualité fluide de la 3D **non mesurée** (FPS, INP) | 7,5 |
| Accessibility | Très bon socle (voir 3.3) ; contrastes et cibles tactiles à clore ; déclaration publiée | 7,5 |

Seuil Awwwards pour le Developer Award : supérieur à 7. **Le site est à la frontière** ; trois corrections (domaine, mobile, preuve Lighthouse) suffisent à passer clairement au-dessus.

---

## 6. Comparaison aux sites primés

Sites de portfolio / développeurs distingués en 2026 (liste Awwwards, **non ouverts un par un**, voir section 0) : Pacôme Pertant Portfolio (Louis Bocquet, SOTD du 20/06/2026, Portfolio Honors), MERSI (FLOT NOIR, Portfolio Honors, SOTD), Juan Mora (SOTD du 26/05/2026), Ravi Klaassens (SOTD du 17/04/2026), Artem Shcherban Portfolio (SOTD du 06/04/2026), Emilie Aubry (Studio Size, SOTD du 11/02/2026).

Ce que les jurés et les analyses de gagnants mettent en avant, mis en regard de votre site :

| Attente d'un site primé | Votre site aujourd'hui | Écart |
|---|---|---|
| Idée créative unique, cohérente avec le sujet | « L'ascension / Cordée », montre GPS, aurore | **Aucun** (point fort) |
| Fondamentaux impeccables (Design + Usability = 70 %) | Bon socle desktop ; mobile à confirmer | Moyen |
| Performance perçue : contenu avant 3D, pas d'attente longue | JS différé, 3D chargée après le contenu **[lu dans l'audit interne]** ; LCP ≈ 2,4 s | Faible à moyen |
| Navigation lisible, menu utile | Menu à métaphores, accès partiel au profil | Moyen |
| Gestion du mouvement réduit, focus visible | Présents | **Aucun** |
| Contenu réel, sans incohérence ni texte provisoire | Chiffres contradictoires, fiches inégales | Moyen |
| Mobile aussi soigné que desktop | Hero vide en émulation, cibles petites | **Élevé** |
| Preuve de qualité (scores consignés) | Aucune mesure publiée | Moyen |
| Micro-interactions et transitions de page soignées | Non évalué | Inconnu |

---

## 7. Plan d'action priorisé

### P0 — avant de soumettre à Awwwards (ordre conseillé)

1. **Choisir le domaine unique** et aligner canonical, `og:url`, `og:image`, JSON-LD, sitemap, robots ; rediriger l'autre domaine en 301. *Critère : Semantics/SEO.*
2. **Corriger le hero mobile** : montre ou visuel de remplacement visible en < 2 s, bouton « Visite guidée » et accès aux projets sans défilement ; tester sur un vrai téléphone. *Critères : Usability, Responsive.*
3. **Porter toutes les cibles tactiles à ≥ 44 px** sur mobile (7 éléments). *Critère : Usability, Accessibility.*
4. **Unifier les durées et dates** (10 / 11 / 12 ans ; 2021 vs 2023) dans une source unique, puis la reprendre partout. *Critère : Content.*
5. **Sourcer ou retirer les chiffres** (30 → 52 %, 100+, −50 %, 500+, 25 personnes) : date, périmètre, accord de citation. *Critère : Content ; risque de crédibilité.*
6. **Réparer `/outils`** (redirection vers la bonne page) et vérifier toutes les entrées du sitemap (aucune URL en 404). *Critère : Usability, SEO.*
7. **Lancer Lighthouse mobile + desktop** sur la version déployée et consigner les scores (« non mesuré à ce jour » tant que ce n'est pas fait). *Critère : WPO.*

### P1 — fort impact

8. Menu : ajouter « Le Randonneur · À propos » et « Carnet » au menu principal avec des libellés explicites (métaphore + mot clair).
9. Retirer « Admin » de la navigation publique (garder l'accès par URL).
10. Fiches projet orientées client : problème → action → résultat chiffré (3 maximum) → « pour votre projet » + visuel net.
11. Positionnement : reformuler les intitulés « Full-Stack », ranger la pile backend en second plan.
12. Ajouter `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` et une CSP progressive (en mode « report-only » d'abord).
13. Passer la carte Twitter / OG en grande image (1200 × 630) dédiée, par page et par projet.
14. Vérifier les contrastes avec axe sur chaque scène et dans les deux thèmes ; viser 0 dette.
15. Honeypot : masquer le conteneur avec `aria-hidden="true"`.

### P2 — finition

16. `theme-color` et manifest (sensation d'application, secondaire).
17. Vidéo de 20 s des micro-interactions et de la transition de page (utile pour la soumission et LinkedIn).
18. Dossier de soumission : 5 captures nettes, texte de 400 caractères, liste des choix techniques (3D chargée après le contenu, repli sans JavaScript, contenu en HTML pour lecteurs d'écran).
19. Mesurer l'INP et les FPS de la scène 3D sur un appareil milieu de gamme.

---

## 8. Mesures à relever avant soumission (cases à cocher)

- [ ] Lighthouse mobile (Performance, Accessibilité, Bonnes pratiques, SEO) sur `/`, `/projects`, `/projects/[fiche]`, `/about`, `/contact`
- [ ] LCP < 2,5 s, INP < 200 ms, CLS < 0,1 en mobile throttlé 4G
- [ ] axe-core : 0 violation, deux thèmes, sept pages
- [ ] Parcours clavier complet (visite guidée, dialogues, menus), VoiceOver iOS et NVDA
- [ ] Test sur iPhone Safari et un Android milieu de gamme
- [ ] Toutes les URL du sitemap en 200
- [ ] Un seul domaine en 200, l'autre en 301
- [ ] Chiffres : source datée pour chacun

---

## 9. Sources

- Awwwards, évaluation : https://www.awwwards.com/about-evaluation (pondérations, seuils HM 6,5 et Developer > 7)
- Awwwards, fiche d'un site primé, sous-critères Developer : https://www.awwwards.com/sites/jomor-design-2 (extrait vu en résultat de recherche ; page non ouvrable par l'outil)
- Awwwards, listes de sites primés 2026 : https://www.awwwards.com/inspiration_search/transitions/ et https://www.awwwards.com/inspiration_search/webflow/
- Hon Tran (juré), critères Awwwards 2026 : https://www.hontran.dev/blog/awwwards-judging-criteria
- Utsubo, ce que cherchent les jurés : https://www.utsubo.com/blog/award-winning-website-design-guide
- UX Planet, analyses de sites primés : https://uxplanet.org/best-website-designs-of-2021-and-what-they-have-in-common-5a49e3c972fa
- Site audité (mesures du 13/11/2026) : https://adrienneyronportfolio.vercel.app/ , `/projects`, `/about`, `/robots.txt`, `/sitemap.xml`, `/mentions-legales`, `/accessibilite`
- Audit interne de référence : `dev/audit-complet-2026-11.md` (03/11/2026) et `design/audit-projets-clients.md` (15/10/2026)

## 10. Points à confirmer par Adri

1. Quel domaine est la production : `adrienneyronportfolio.vercel.app` ou `adrien-neyron-portfolio.vercel.app` ?
2. Durée exacte : 10, 11 ou 12 ans de formation / management ; début du développement : 2021 ou 2023 ?
3. Sources des chiffres : 30 → 52 %, 100+, −50 %, 500+, 25 personnes.
4. Droit de citer DGFiP, Amiltone / BeTeam, Euromaster, Tyredating.
5. Le hero mobile vide est-il reproductible sur ton téléphone ?
6. Que doit répondre `/outils` ?
7. La mention « classes Java » dans la section Outils de l'accueil est-elle voulue ?
