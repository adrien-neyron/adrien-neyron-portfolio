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
| Projets | `order` | ordre de lecture des projets ajoutés en plus |
| Outils IA | nom, accroche | carte « Équipement IA » (nombre d'outils, liste, étiquettes) |
| Carnet | titre, extrait, catégorie, date | liste du carnet (du plus récent au plus ancien), filtres |

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
