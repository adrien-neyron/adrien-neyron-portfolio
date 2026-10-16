# Charte graphique — jetons de couleur jour / nuit

Source : `assets/loop/loop.source.css` (bloc de jetons en tête de fichier, juste avant `html{scroll-padding-top…}`) ; compilé dans `loop.css` par `scripts/scope-loop-css.cjs`. Les palettes dynamiques du jour et de la nuit (`E_DAY`, `E_NIGHT` dans `loop.js`) posent `--bg --fg --muted --line --acc --acc-text --card`.

## Règle de symétrie
Chaque rôle existe dans **les deux thèmes** avec la même clé. Un composant cite un rôle (`var(--brand)`), jamais une couleur brute. Ajouter un besoin = ajouter un rôle des deux côtés, pas une exception d'un seul thème. Le thème est posé sur `<html data-theme="light|dark">` très tôt (script d'en-tête, `localStorage asc-theme` ou `prefers-color-scheme`).

## Jetons de base
| Jeton | Nuit (`E_NIGHT`) | Jour (`E_DAY`) |
|---|---|---|
| `--bg` | `#070A0E` / ciel `#050811` | `#F4F8FA` / ciel `#EBC39C` |
| `--fg` | `#E6F4F1` | `#12222B` (> 10:1) |
| `--muted` | `#9DB0C8` | `#435862` (≥ 4,5:1) |
| `--line` | `#222E42` | `#BCD0DA` |
| `--acc` | `#E26D3B` | `#DF6C4F` |
| `--acc-text` | `#E26D3B` | `#B23F27` |
| `--card` | `#121B2B` | `#E3ECF1` |

Le repli CSS de `:root` reprend désormais les valeurs du jour (l'ancien `--muted:#56615B` n'atteignait que 3,9:1).

## Jetons de marque et d'interface
| Jeton | Nuit | Jour | Usage |
|---|---|---|---|
| `--brand` | `#EE9468` cuivre | `#27465C` ardoise (6,3:1) | logo, « Cordée » |
| `--brand-hover` | `#F5B08C` | `#16303F` | survol |
| `--brand-fill` | `#1A0E08` | `#F2EEE6` | mousqueton |
| `--brand-halo` | transparent | `rgba(252,247,238,.9)` | halo du texte |
| `--sep` | `rgba(226,140,100,.5)` | `#27465C` | séparateur Étapes │ Outils |
| `--underline` | `#E26D3B` | `#27465C` | soulignement des boutons |
| `--focus` | `#E26D3B` | `#1B1712` | contour de focus de la marque |
| `--ft` | `5,8,17` | `235,195,156` | dégradé du pied de page |

## Jetons de la porte de chargement et de l'aiguille
| Jeton | Nuit | Jour |
|---|---|---|
| `--gate-bg` | dégradé `#0E1A2C → #03050A` | dégradé `#FFFCF7 → #EBDFCF` |
| `--gate-fg` / `--gate-rest` / `--gate-tag` | `#F3E3CF` / `#E9B48C` / `#D9C3AE` | `#2C2825` / `#8F2F1B` / `#4E200E` |
| `--gate-focus` | `#FFD9C2` | `#1B1712` |
| `--gate-topo` / `--gate-mtn` | `#E26D3B` / — | `#27465C` / `#CFD9DE` |
| `--needle-1…4` | `#F59A5C #D4581F #DDE3E7 #9AA3AA` | `#D2672B #A8401B #4A4F55 #23272B` |
| `--needle-pivot` | `#0B0D10` | `#1B1712` |

## Jetons du panneau d'instrument (fiche projet)

La fiche projet (`#dlgTool.is-proj`) reste sombre dans les deux thèmes ; ses rôles ont donc la même valeur jour et nuit (`:root`).

| Rôle | Valeur | Usage |
|---|---|---|
| `--panel-glass` | `rgba(10,15,26,.8)` | fond en verre sombre (flou 16 px) |
| `--panel-ink` | `#E6F4F1` | titre et texte (14,6:1 sur le pire fond) |
| `--panel-muted` | `#B9C6CC` | libellés, légende (9,5:1) |
| `--brass-hi` / `--brass` / `--brass-lo` / `--copper` | `#F3DDA6` / `#C79A52` / `#7C5526` / `#D9824E` | liseré laiton brossé, cadre de la photo, lignes de fuite ; `--brass-hi` porte aussi la ligne de coordonnées et les chiffres clés (12,4:1) |
| `--steel-hi` / `--steel` / `--steel-lo` | `#F2F5F7` / `#AEB7BE` / `#59636B` | bouton de fermeture en métal (icône 8:1, bord 8:1 sur le panneau) |
| `--panel-cut` | `28px` | biseau des coins opposés (18 px sur téléphone) |

## Accessibilité (WCAG 2.1 AA / RGAA)
Texte ≥ 4,5:1 ; éléments graphiques et focus ≥ 3:1 ; focus visible 3 px sur la marque et la porte, dans les deux thèmes ; la couleur ne porte jamais seule l'information.

## Reste à migrer
Le bouton « Lancer la visite guidée » n'utilise que des rôles en mode jour (`--fg`, `--brand-halo`, `--brand-hover`, `--focus`, sans fond). Cartes, menu, autres boutons CTA et formulaire de contact portent encore des couleurs du jour en dur (`#A8401B`, `#8F2F1B`, `#4E200E`…). Prochaine étape : les remplacer par des rôles (`--cta-bg`, `--cta-fg`, `--surface-border`…).

## Historique
- Essai du logo en `#0066FF` : abandonné, retour à l'ardoise (le jour) et au cuivre (la nuit).
