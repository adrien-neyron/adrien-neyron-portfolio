# Architecture du site — données partagées

Copie dans le dépôt de `design/architecture-site.md` (projet claude.ai « Portfolio »), limitée à ce que le code applique. Mise à jour le 19/10/2026.

## Une source pour la trace et les sentiers

```
/admin/stages ──► Mongo « Stage » ─┐
data/stages.ts (repli) ────────────┤
                                   ▼
            utils/stages.ts : buildStageView(étapes, projets)
            libellé · numéro · t · km · D+ · résultat clé · liens
       ┌──────────────┬───────────────┬──────────────────┬───────────────┐
       ▼              ▼               ▼                  ▼               ▼
 /api/loop-content  #pList (SSR)   loop.js (3D)     /projects        /projects/[id]
                    loopMarkup.ts  cairns, panneau  cartes, filtre   en-tête « Étape 02 »
                                   #live, #plMore   bandeau          + résultat clé
```

- **Étape** (`Stage`) : `key`, `order`, `kind` (`depart` / `etape` / `bivouac` / `final`), `period`, `title`, `place`, `summary`, `figure`, `figureLabel`, `projects` (slugs). Une étape sans chiffre s'affiche sans chiffre.
- **Numéro, nom, résultat clé** viennent toujours de `buildStageView` : l'accueil, `/projects` et la fiche ne peuvent pas diverger.
- **Lien** d'une étape vers une fiche : `/projects/<slug>` (encodé), seulement si le projet existe ; le cairn final mène à `/contact`.

## /projects

- **Publication** : un projet n'apparaît sur `/projects` que s'il a un **type** (`mission` ou `perso`) et un **défi, une solution et un résultat** renseignés (`isListedProject`). Les autres restent accessibles par leur URL (liens des étapes) mais ne sont pas listés. En octobre 2026 : OCTAVE, YepGarage, RunFit Advisor, CoachFlow listés ; StockPulse attend sa solution et son résultat ; C+Paie, DressMeUp, Job Search Automator et Portfolio sont masqués.
- **Type** : champ `Project.type` (admin › Projets, « Type ») ; vide → repli par slug `DEFAULT_PROJECT_TYPES` (missions : OCTAVE, YepGarage, StockPulse ; perso : CoachFlow, RunFit Advisor).
- **Filtre** « Tous / Missions / Projets perso » : boutons `aria-pressed`, nombre de résultats dans une zone `aria-live`. Il remplace le filtre par catégorie.
- **Bandeau de chiffres** sous le titre : `Profile.trailStats` (admin › Profil › « Bandeau de chiffres »), `<dl>` ; un chiffre sans valeur n'est pas enregistré ni affiché. Repli : 30 → 52 %, 100+, −50 %, 500+.
- **Ordre des cartes** : de l'étape la plus récente à la plus ancienne ; chaque carte rappelle son étape (« Étape 02 · DGFiP, mission via BeTeam ») et son résultat clé.

## Accueil

- Lien « Projets » dans l'en-tête, visible dès le premier écran (avant la 3D).
- Liste des étapes rendue côté serveur : lisible sans 3D ni animation, affichée en vue statique et en mouvement réduit.
- Charge utile de la page d'accueil limitée à `hero`, `toolsHead` et `stages` (`useFetch` + `pick`) : la page n'est pas plus lourde qu'avant (HTML mesuré : 161 424 octets contre 161 506).

Détails de la carte 3D : `docs/admin-boucle.md`, section « Étapes de la trace ».
