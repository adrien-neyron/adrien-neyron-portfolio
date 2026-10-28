# Cohérence des informations : étape → projet → fiche

Constat (28/10/2026) : une même information est saisie à plusieurs endroits (étape et projet) et affichée sur quatre supports. Ce document sert de carte. Il est établi à partir des modèles (`server/models/stage.ts`, `project.ts`) et de la doc existante ; les affichages n'ont pas été revérifiés dans un navigateur.

## Les quatre supports

| Support | Rôle | Alimenté par |
|---|---|---|
| Stèle (cairn 3D) | accroche gravée, décorative (`aria-hidden`) | **Étape** |
| Card (panneau d'étape) | aperçu : résumé, images, chiffre clé, liens | **Étape** (+ images des projets liés) |
| Liste `/projects` | catalogue des projets publiés, classés par étape | **Projet** + étape (libellé, chiffre clé) |
| Fiche `/projects/[id]` | détail : problème, solution, résultat | **Projet** |

## Doublons étape ↔ projet

| Information | Côté étape | Côté projet | Proposition |
|---|---|---|---|
| Titre | `title`, `steleTitle` | `title` | Garder : l'étape est un chapitre de parcours, le projet un livrable. Pas de doublon à supprimer. |
| Résumé | `summary` | `tagline`, `description` | **Doublon principal.** Deux textes courts qui disent la même chose. Décision à prendre : la card reprend `tagline` du projet lié quand `summary` est vide. |
| Période | `period`, `stelePeriod` | `startDate`, `duration` | Garder `period` (étape) ; `startDate` ne sert qu'à la fiche technique. |
| Lieu | `place` | `place` | Saisir sur le projet, l'étape le reprend si vide. |
| Chiffre clé | `figure`, `figureLabel` | `stats`, `impact`, `result` | Le chiffre clé de l'étape = premier élément de `stats` du projet quand il est vide. |
| Technos | `steleTags` | `technologies` | La ligne du cairn reprend `technologies` quand `steleTags` est vide (c'est déjà l'esprit du repli actuel). |
| Images | `images` | `image`, `cover` | Déjà ordonné : capture admin, repli, ambiance, puis images d'étape. Pas de changement. |
| Étapes du parcours | — | `milestones` | Vérifier s'il est utilisé ; sinon à retirer du formulaire. |
| Type, statut, catégorie | — | `type`, `status`, `category`, `difficulty` | À réduire : `type` (publication) et `status` suffisent. |

## Règle proposée

1. **Le projet est la source** pour tout ce qui le décrit (résumé court, lieu, technos, chiffres).
2. **L'étape ne stocke que ce qui est propre au parcours** : titre/période du chapitre, ordre, km, D+, altitude, images de contexte, lien principal.
3. Un champ d'étape vide **reprend** celui du projet lié ; renseigné, il prime. Même logique que `steleTitle` → `title` aujourd'hui.
4. Peu de fiches : seuls les projets publiés (`isListedProject`) ont une fiche ; les autres n'ont qu'une card.

Rien n'est appliqué : ce sont des propositions à valider champ par champ avant de toucher aux modèles et à l'admin.
