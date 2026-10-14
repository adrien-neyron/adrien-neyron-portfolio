# Tests — filet de sécurité avant la production

Objectif : qu'une erreur (régression, route admin non protégée, page cassée, contraste, etc.) soit détectée **avant** le déploiement.

## Lancer les tests

| Commande | Rôle | Prérequis |
|---|---|---|
| `npm test` | Tests unitaires (Vitest), ~quelques secondes | `npm install` |
| `npm run test:watch` | Idem, en continu | |
| `npm run test:coverage` | Unitaires + couverture (plancher bloquant : 50 % lignes, à relever progressivement) | |
| `npm run test:e2e` | Navigateur réel (Playwright) + accessibilité (axe) | `npm run build` puis `npx playwright install chromium` |
| `npm run test:all` | Les deux | |

Les e2e démarrent eux-mêmes le serveur de production (`node .output/server/index.mjs`, port 3100) **sans base de données** (`MONGODB_URI` et `POSTGRES_URL` vides) : ils vérifient donc aussi le mode dégradé (repli sur les données statiques). Il faut donc **reconstruire (`npm run build`) avant `test:e2e`**.
**Important** : `runtimeConfig` est figé au build avec les valeurs de ton `.env`. Le serveur de test les neutralise via `NUXT_MONGODB_URI` / `NUXT_POSTGRES_URL` vides (`playwright.config.ts`) ; sans cela les tests se connecteraient à la vraie base (et attendraient 30 s son délai de connexion). Si tu ajoutes un secret dans `runtimeConfig`, neutralise-le de la même façon.
Si un test échoue en masse : un ancien serveur est peut-être resté actif sur le port 3100 (`lsof -ti :3100 | xargs kill`). Le serveur n’est plus réutilisé par défaut (`E2E_REUSE_SERVER=1` pour le permettre).
Variables utiles : `CHROMIUM_PATH` (navigateur Chromium déjà installé), `E2E_SERVER_LOGS=1` (affiche les logs du serveur).

## Ce qui est couvert

### Unitaire (`tests/unit/`)
- `trail`, `badges`, `data` : logique et données statiques (cohérence, champs obligatoires).
- `allure` : calculateur d'allure (`utils/allure.ts`) — formules, formats, entrées vides/invalides.
- `loopMarkup` : injection des textes admin dans `loop.html` (contrat avec les balises, échappement HTML / pas d'injection).
- `loopContent` : API `/api/loop-content` (fusion, repli).
- `requireAuth` + **`apiGuards`** : chaque fichier de `server/api/admin/**` doit appeler `await requireAdminWrite(event)` **avant** tout accès base/corps ; les routes d'écriture hors admin sont dans une liste blanche (seulement `visitors.post.ts`). Une nouvelle route admin non protégée fait échouer le test.
- `projectCover`, `stores` : stores Pinia (repli sur données statiques en cas d'erreur API) et utilitaires serveur.
- `introShatter` : maillage de la transition d'intro (couverture exacte de l'écran, convexité, déterminisme, format).
- `loopTokens` : symétrie jour/nuit des variables CSS de la boucle, contrastes AA des tokens, `loop.css` = résultat du script `scripts/scope-loop-css.cjs`.

### E2E (`tests/e2e/`)
- `smoke` : 8 pages publiques (titre, `lang=fr`, un seul `h1`, aucune erreur JS/console, aucune ressource du site en 4xx), 404, slug de carnet inconnu, polices et glb servis. Aussi lancé en mobile (Pixel 7).
- `api` : `/api/loop-content` ; 13 routes admin d'écriture → 401 sans session ; `GET /api/admin/projects` → 401 ; aucune écriture publique.
- `home` : écran d'accueil — ouverture automatique sans clic, « Passer l'intro » (clavier, ferme l'écran sans attendre la 3D, vue statique mémorisée), « Dénouer la corde » (accélérateur), économiseur de données / 2G.
- (`home` couvre aussi la transition en éclats : canvas `.intro-shatter` créé puis retiré, repli sans canvas en `prefers-reduced-motion`.)
- `calculator` : calculateur d'allure (valeur par défaut, saisie, champ vide sans `NaN`, `aria-pressed` au clavier).
- `admin` : `/admin*` redirige vers la connexion.
- `a11y` : axe-core (WCAG 2.1 A/AA) sur 8 pages × thème clair/sombre.

## Accessibilité : politique « cliquet »
- Toute règle axe **autre que `color-contrast`** doit être à **0** violation.
- `color-contrast` : dette connue suivie dans `tests/e2e/a11y-baseline.json` (nombre maximal de nœuds par page/thème). Le test échoue si ça **augmente** ; quand on corrige, **baisser** la valeur. Objectif : tout à 0 puis supprimer le fichier.
- axe n'attrape qu'une partie des critères RGAA : l'audit manuel (clavier, lecteur d'écran, zoom 200 %) reste nécessaire (voir `docs/audit-ux-ui.md`).

## CI
`.github/workflows/ci.yml` : sur chaque PR et push sur `main` → `npm ci`, `test:coverage`, `build`, `test:e2e`. Le rapport Playwright est conservé 7 jours en cas d'échec.
**À faire côté GitHub** : Settings → Branches → règle sur `main` → « Require status checks to pass » avec les jobs *Tests unitaires + couverture* et *Build + e2e + accessibilité*. Sans cela, Vercel déploie même si la CI est rouge.

## Ajouter un test
- Nouvelle route `server/api/admin/**` : rien à faire pour la garde (testée automatiquement) ; ajouter la route à la liste de `api.spec.ts`.
- Nouvelle page publique : l'ajouter à `PAGES` dans `smoke.spec.ts` et `a11y.spec.ts` (+ une entrée à 0 dans la baseline).
- Logique pure : l'extraire dans `utils/` (comme `allure.ts`, `loopMarkup.ts`) pour la tester sans Nuxt.

## Limites connues
- Pas de test avec une vraie base (Mongo/Postgres) : les handlers sont testés avec des modèles simulés.
- Les e2e ne couvrent pas la connexion Auth0 (service tiers).
