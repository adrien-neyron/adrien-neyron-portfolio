# Référencement et partage (SEO)

Mis en place le 03/11/2026 (audit `dev/audit-complet-2026-11`, P0 n° 1 et 2).

## Ce qui existe

| Élément | Fichier | Rôle |
|---|---|---|
| `robots.txt` | `server/routes/robots.txt.ts` | Interdit `/admin`, `/api/`, `/callback` ; indique le sitemap. |
| `sitemap.xml` | `server/routes/sitemap.xml.ts` | Pages fixes + projets publiés (`isListedProject`) + articles du carnet. Si la base est indisponible, seules les pages fixes sont listées. |
| Balises par page | `composables/usePageSeo.ts` | Titre, description, canonical, Open Graph, Twitter. Appelé par chaque page publique. |
| Page d'erreur | `error.vue` | 404 / erreurs en français, lien de retour. |
| Données structurées | `pages/index.vue` | JSON-LD `WebSite` + `Person` (accueil uniquement). |
| Accueil | `components/loop/LoopHome.vue` | Pose ses propres balises (la boucle a sa mise en page). |

Image de partage d'un projet : la photo de couverture de sa fiche (`cover`). Autres pages : portrait `/profile.png`.

## Changer de domaine

Une seule valeur à modifier : la variable d'environnement `SITE_URL` (Vercel › Settings › Environment Variables), sans barre finale, par exemple `https://adrienneyron.fr`. Elle alimente le canonical, Open Graph, le sitemap, `robots.txt` et le JSON-LD. Valeur par défaut : `https://adrien-neyron-portfolio.vercel.app`.

Après le changement : redéployer, puis vérifier `/robots.txt`, `/sitemap.xml` et le canonical d'une fiche projet. Si l'ancien domaine `*.vercel.app` reste actif, le rediriger vers le nouveau (Vercel › Domains) pour éviter le contenu dupliqué.

## Ajouter une page

Dans son `<script setup>` : `usePageSeo({ title: "Titre | Adrien Neyron", description: "…" })`. Pour qu'elle figure dans le sitemap, l'ajouter à `STATIC_PATHS` dans `server/routes/sitemap.xml.ts`.

## Vérifier

- `/robots.txt` et `/sitemap.xml` répondent en production.
- Aperçu de partage : coller l'URL d'une fiche projet dans un outil de prévisualisation (LinkedIn Post Inspector, par exemple).
- Données structurées : validateur de balisage Schema.org sur l'accueil.
