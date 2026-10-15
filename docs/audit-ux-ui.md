# Audit UX/UI : corrections appliquées (octobre 2026)

Audit réalisé en largeur mobile (~500 px). Les trois premières actions sont faites ; les suivantes restent à traiter.

## Fait
1. **Accroche du hero** : sous le titre, une ligne lisible dit le métier et la valeur (titre « Beaucoup ont le cap. Peu connaissent le sentier. », sous-texte « Développeur front-end Vue 3 / TypeScript, spécialisé RGAA et WCAG. J’ai appris à guider des équipes avant d’apprendre à guider des utilisateurs. » ; même titre sur l'écran de la corde, `.gate-tag`). Le surtitre devient « Adrien Neyron · Développeur front-end ». Balisage : `#head1 .lede` dans `assets/loop/loop.html`.
2. **Un seul départ, accès recruteur** : le bouton de la visite automatique n'est plus « Commencer l'expédition » (doublon avec l'écran de la corde) mais « Lancer la visite guidée » (« Visite guidée » sur mobile). **CV** et **Contact** sont des boutons nommés et toujours visibles dans le pied de page (`footer.perma .ico.lbl`).
3. **Contrastes** : menu du haut, titres, accroche, `Km / D+` et cartes de l'atelier utilisent désormais les variables de la palette (`--fg`, `--bg`) pour le texte et le halo, au lieu d'un texte blanc et d'un halo noir fixes. Les cartes d'outils ont un flou d'arrière-plan et un texte secondaire plus contrasté. Avant le démarrage de la boucle, la palette sombre n'est plus forcée en thème clair.

## Reste à faire (par ordre de priorité)
- État de chargement ou image de repli pour les scènes 3D (flaque, bivouac) à la première visite.
- Lien direct vers la liste des projets et fin de parcours orientée action (contact, CV).
- Transition nuit (écran de la corde) → jour plus progressive.
- Unifier le style des boutons (corde, « Voir la fiche », visite guidée).
- Légende ou mini-chronologie dans les vides de la carte.
- Contrôle automatisé d'accessibilité (axe) sur chaque scène, et test en largeur bureau.

Fichiers : `assets/loop/loop.html`, `loop.source.css` (bloc « Audit UX/UI » en fin de fichier), `loop.css` (recompilé avec `scripts/scope-loop-css.cjs`).

_Bureau (≥ 900 px) : le sous-texte du hero s'étend (`max-width` 64ch, 17–20 px) pour tenir sur deux lignes ; mobile inchangé (34ch)._

## Revue d'accessibilité du mode jour (12/10/2026)
Méthode : script de contraste sur les éléments à fond uni, mesure sur capture pour le texte posé sur la 3D, puis calcul des contours et des anneaux de focus. Cibles : texte 4,5:1, contours de boutons et de champs, icônes et focus 3:1 (WCAG 1.4.3, 1.4.11, 2.4.7).

| Problème (avant) | Correction (après) |
|---|---|
| Fiches « Profil » et « Outil » : paragraphe d'accroche sombre sur fond sombre, **1:1** | texte clair `#E6F4F1` (15,3:1) |
| Anneau de focus des fiches sombres 2,98:1 | `#FFB48A` (10:1) |
| Pastilles CV / Contact : contour à 55 % ≈ 2,3:1 | contour plein `--acc-text` (5,0:1) |
| Champs du formulaire du bivouac : contour à 60 % ≈ 2,8:1 | contour plein `#A8401B` (6,2:1) ; puces de contact idem (5,1:1) |
| « Voir la fiche » : texte sombre sur pêche, anneau de focus blanc invisible | fond `#B23F27`, texte blanc (5,8:1), focus sombre |
| « Visite guidée » : texte nu sur le sable (≈ 4,8:1, aucune forme) | (15/10/2026, à la demande d'Adrien) sans fond ni contour : texte `--fg`, halo dense `--brand-halo`, une seule ligne, focus `--focus`. Contraste mesuré sur les pixels réels du fond (rochers compris) : ≥ 4,85:1 en 390, 1280, 1440 et 820 px de large |
| Ligne d'altitude / météo illisible sur le sol sombre du bivouac | pastille claire, texte 14:1 |
| Indicateur « Boussole prête » gris sur le sable | pastille claire, texte sombre |
| Bouton « Envoyer le message » : texte 4,6:1 au début du dégradé | dégradé éclairci, 5,8:1 |
| Cartes de l'atelier : contour pâle ≈ 1,5:1 | contour `#6B8089` (3,6:1) |

### Menus « Étapes » et « Outils » (13/10/2026)
Les onglets du haut avaient un style jour, mais pas les panneaux qu'ils ouvrent : fond nuit avec texte sombre (`var(--fg)`), donc illisibles. Bloc « Mode jour : menus » en fin de `loop.source.css` :

| Élément | Jour (après) |
|---|---|
| Panneau | fond clair, contour `#A8401B`, ombre douce |
| Titres d'étapes / libellés | `#1B2A24` sur `#E8EEEB` : 12,7:1 ; sous-titres et « Instruments » 5,5:1 |
| Numéros, icônes, flèche, étape courante | `--acc-text` (#A63C15) |
| Interrupteurs (Pause, Nuit, Son) | piste grise `#6B8089` (≥ 3:1), actif `#A8401B`, pastille blanche |
| Survol | voile sombre 8 % |

Vérifié au navigateur (mobile) : les deux menus sont lisibles, focus clavier inchangé (contour 3 px `--acc-text`).

Reste à vérifier : fiches de projet réelles (contenu admin), carnet, réglages, largeur bureau, et un passage `axe` automatisé.

