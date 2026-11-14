# Performance : mesurer avec Lighthouse

Objectif du projet : **performance ≥ 90** (mobile) et **accessibilité 100** sur les pages publiques (`CLAUDE.md`). Jusqu'ici il n'y avait aucune mesure consignée ; cette page donne la méthode et sert de journal.

## Méthode (à refaire après chaque changement important)

Toujours mesurer le **build de production**, jamais `nuxt dev` (non optimisé).

```
npm run build
npm run preview            # http://localhost:3000
# dans un autre terminal, une page à la fois :
npx lighthouse http://localhost:3000/            --preset=perf --form-factor=mobile --output=json --output-path=./lh-home.json --quiet --chrome-flags="--headless"
npx lighthouse http://localhost:3000/projects    --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo --output=html --output-path=./lh-projects.html --quiet --chrome-flags="--headless"
```

Pages à mesurer : `/`, `/about`, `/projects`, `/projects/click2sellsite`, `/carnet`, `/contact`, `/outils/allure-denivele`. Mobile (émulation par défaut de Lighthouse : réseau « Slow 4G », CPU ralenti ×4), **3 passes, on garde la médiane**.

Mesurer aussi la production : <https://adrien-neyron-portfolio.vercel.app/> via PageSpeed Insights, qui donne en plus les données réelles de visiteurs (CrUX) quand le trafic le permet.

## Points d'attention connus

- **Accueil (boucle 3D)** : Three.js (≈ 600 Ko) est chargé en différé au premier geste (`LoopHome.vue`) et le JS d'entrée est retardé après `load` (`server/plugins/home-low-priority-js.ts`). Le LCP est donc le texte du premier écran, pas le canvas.
- **Images** : fonds et visuels en WebP (`bivouac*.webp`, `sculpture.webp`, couvertures de projets).
- **Audio** : `preload="none"` sur le lecteur d'ambiance ; le MP3 de feu est compressé (≈ 7 Mo, mono 48 kbit/s), chargé seulement à la lecture.
- **Polices** : locales (`public/fonts`), préchargées.
- **Base de données** : `/api/loop-content` est mis en cache CDN 60 s ; si la base est en pause, l'accueil garde ses textes par défaut.

## Journal des mesures

| Date | Page | Perf | A11y | Bonnes pratiques | SEO | LCP | CLS | TBT | Remarque |
|---|---|---|---|---|---|---|---|---|---|
| _à remplir_ | | | | | | | | | |

Règle : toute régression de plus de 5 points de performance sur une page entre deux mesures est analysée avant publication (rapport HTML, onglet « Opportunités »).
