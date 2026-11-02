# Fiche projet : refonte (30/10/2026)

`pages/projects/[id].vue`. Demande d'Adri : retirer le « grain skate » et rendre la fiche plus belle. Constats avant : photo d'ambiance noire et grenue, liens d'action cachés tout en bas, fiche technique en bandeau plat, sections empilées identiques, profil dont les étiquettes chevauchaient la courbe, aucune suite après la lecture.

## Changements
- **Grain skate retiré** : `.grain-photo` supprimé de `assets/css/main.css` ; cartes (`UiProjectCard`), aperçus de l'admin (`ProjectForm`) et fiche affichent la photo **en couleur**. La base stocke toujours l'original (aucune migration). `.gps-tag` conservé.
- **En-tête en deux colonnes** (une seule colonne sans visuel) : titre, accroche, « résultat clé » de l'étape (filet d'accent), boutons **Voir le site / Voir le code dès le haut** (44 px) | visuel : photo d'ambiance en couleur (décorative, `alt=""`, crédit en légende), sinon la capture dans un cadre de navigateur. Si photo **et** capture existent, la capture apparaît dans « Départ ».
- **Fiche technique** : une carte par information (2 colonnes en mobile, 5 en bureau).
- **Profil du sentier** (`TrailElevationProfile`) : dans une carte ; les étiquettes sont rangées **sous** la courbe, reliées au point par un fil pointillé (plus de chevauchement). Équivalent texte inchangé (`figcaption`). Étiquettes toujours masquées sous 640 px.
- **Sentier vertical** : ligne pointillée reliant des balises numérotées 1 à 4 (sections présentes seulement), sommaire à numéros identiques, résultats chiffrés en cartes à filet d'accent, stack avec son libellé.
- **Fin de fiche** : « Une étape à écrire ensemble ? » → `/contact` (voir `docs/audit-ux-projets-contact.md`), puis cartes précédent / suivant.
- **Contrastes corrigés au passage** : `.button-accent` et `.button-empty:hover` en nuit (texte `--color-bg` au lieu de blanc : 3,0 → ≈ 6:1) ; `UiTechBadge` `featured` (texte `--color-text`, 4,3 → ≥ 4,5:1).

## Vérifié / non vérifié
Vérifié : tests unitaires, captures clair / sombre, bureau / mobile, axe (WCAG 2.1 A/AA) sur deux fiches, 0 violation hors `.identity` (menu `TrailNav`, dette connue). Page ajoutée à `tests/e2e/a11y.spec.ts` (baseline 1 pour `.identity`). Non vérifié : Lighthouse, photos Unsplash réelles (réseau coupé ici : cadre vide dans les captures), navigation clavier à la main, autres fiches que DGFiP / Click2SellSite.
