# Préférences du visiteur : vue statique et « Passer l'intro »

Mis à jour le 03/11/2026.

| Choix du visiteur | Où il est mémorisé | Durée |
|---|---|---|
| Bouton « Vue statique » (menu de l'accueil) | `localStorage['asc-static']` (`1` / `0`) | Durable : revient à chaque visite |
| « Passer l'intro » (écran de la corde) | `sessionStorage['asc-static-visit']` | Cette visite seulement (onglet) |
| Mouvement réduit de l'appareil (`prefers-reduced-motion`) | réglage système | Automatique |
| Appareil léger / économie de données (`LOADERS.lite`) | décidé par la page | Automatique |

## Pourquoi

« Passer l'intro » écrivait auparavant `localStorage['asc-static'] = '1'` : un seul clic privait le visiteur de la 3D à toutes ses visites suivantes, sans qu'il le sache. Le choix durable est désormais réservé au bouton « Vue statique », explicite.

## Code

- `components/loop/LoopHome.vue` : gestionnaire de `#gateSkip` (écrit la clé de session).
- `assets/loop/loop.js` : `prefStatic` lit les deux clés ; le bouton `#tgStatic` efface la clé de session quand le visiteur choisit lui-même.

## Pour retrouver la 3D en développement

`localStorage.removeItem('asc-static'); sessionStorage.clear(); location.reload()` dans la console. Le `localStorage` est propre à chaque origine : localhost et la prod ont des réglages distincts.
