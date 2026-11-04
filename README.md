# Portfolio d'Adrien Neyron — « L'ascension »

Portfolio de développeur front-end (Vue 3, TypeScript, accessibilité RGAA/WCAG). L'accueil est une boucle 3D (Three.js) qui se parcourt au défilement ; les autres pages (projets, parcours, carnet, outils, contact) sont des pages Nuxt classiques. Une vue 2D statique existe pour les appareils modestes et pour `prefers-reduced-motion`.

Stack : Nuxt 3, Vue 3 `<script setup>`, Pinia, Tailwind 4, Three.js r128 (accueil), MongoDB (contenu éditable), Auth0 (admin), Vercel Blob (images), Resend (formulaire de contact), déploiement Vercel.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
```

Sans base de données, le site fonctionne avec les contenus statiques de `data/` (repli automatique).

## Variables d'environnement

Fichier `.env` en local, Vercel › Settings › Environment Variables en production. Toutes sont optionnelles pour un simple affichage.

| Variable | Rôle |
|---|---|
| `MONGODB_URI` | Contenu éditable (projets, étapes, profil, carnet, outils IA). |
| `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID` | Reconnaissance de l'administrateur sur `/admin`. |
| `ADMIN_EMAIL` | Seule adresse autorisée à écrire dans l'admin. |
| `BLOB_READ_WRITE_TOKEN` | Envoi d'images depuis l'admin. |
| `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` | Formulaire de contact (voir `docs/contact.md`). |
| `GEMINI_API_KEY` | Génération d'articles du carnet (admin). |
| `UNSPLASH_ACCESS_KEY` | Recherche de photos d'ambiance (admin). |
| `SITE_URL` | URL publique : canonical, Open Graph, sitemap (voir `docs/seo.md`). |
| `POSTGRES_URL` | Non utilisée aujourd'hui (le compteur de visites a été supprimé en novembre 2026). |

## Commandes

| Commande | Effet |
|---|---|
| `npm test` | Tests unitaires (Vitest). |
| `npm run build` | Build de production dans `.output/`. |
| `npm run test:e2e` | Tests navigateur (Playwright, axe) sur le build : lancer `npm run build` avant. |
| `npm run test:all` | Couverture, build, puis e2e. |

## Accessibilité

Objectif : RGAA et WCAG 2.1 AA. Chaque page est contrôlée par axe-core (`tests/e2e/a11y.spec.ts`) ; la dette de contraste restante est plafonnée dans `tests/e2e/a11y-baseline.json` et ne peut que baisser. La déclaration publique est sur `/accessibilite`.

## Documentation

Tout est dans `docs/` ; `CLAUDE.md` donne la vue d'ensemble pour les assistants de code.

| Sujet | Fichier |
|---|---|
| Architecture et pages | `docs/architecture-site.md` |
| Accueil (boucle 3D) | `docs/ascension-boucle.md`, `docs/admin-boucle.md` |
| Préférences visiteur (vue 2D) | `docs/preferences-visiteur.md` |
| Référencement et domaine | `docs/seo.md` |
| Formulaire de contact | `docs/contact.md` |
| Administration en lecture seule | `docs/admin-lecture-seule.md` |
| Cohérence des contenus | `docs/coherence-informations.md` |
| Charte graphique, typographie | `docs/charte-graphique.md`, `docs/typographie.md` |
| Tests | `docs/tests.md` |
| Audits | `docs/audit-coherence.md`, `docs/audit-ux-ui.md`, `docs/audit-ux-projets-contact.md` |

## Contact

Mentions légales : `/mentions-legales`. Contact : voir la page `/contact`.
