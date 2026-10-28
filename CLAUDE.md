# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

-Le projet est un portfolio design qui présente mes appétences pour le développement, l'analyse et le code javascript avec une spécialisation en vue.js

## Règles pour toute évolution du portfolio

- **Accessibilité** : WCAG 2.1 AA + RGAA. Texte ≥ 4,5:1, composants et focus ≥ 3:1, cibles ≥ 44 px, focus visible, tout au clavier, `prefers-reduced-motion` respecté, contenu 100 % HTML (la 3D reste décorative, `aria-hidden`). Un raccourci clavier a toujours un bouton équivalent.
- **Performance** : 3D chargée après le contenu, DPR ≤ 1.5, pause hors écran, pas de JS bloquant. Pas de régression Lighthouse mobile (perf ≥ 90, a11y 100).
- **Cohérence** : couleurs uniquement via les rôles (tokens) — jamais de couleur brute. Accueil (boucle) : rôles de `docs/charte-graphique.md` (`--bg`, `--fg`, `--acc`, `--brand`…). Pages Nuxt et /admin : tokens de `assets/css/main.css` (`--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-accent`, `--color-secondary`, `--color-highlight` décoratif uniquement, `--color-vue`, `--color-nuxt`). Symétrie jour/nuit. Vocabulaire de l'aventure (sentier, étape, cordée, bivouac).
- **Méthode** : un changement = une branche courte, un commit clair. Ne toucher qu'aux fichiers nécessaires.
- **Documentation** : à chaque étape, mettre à jour la doc concernée (`docs/` dans le dépôt ; `design/` / `dev/` côté projet claude.ai) et ce CLAUDE.md. Une fonctionnalité non documentée n'est pas terminée.
- **Fin d'étape** : lister ce qui a été vérifié (contrastes, clavier, Lighthouse) et ce qui n'a pas pu l'être.

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run generate   # Static site generation
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
npm test           # Unit tests (Vitest)
npm run test:coverage  # Unit tests + coverage thresholds
npm run test:e2e   # Playwright e2e + axe a11y (needs `npm run build` first)
```

## Tests

Voir `docs/tests.md`. Avant tout push : `npm test` ; avant une release : `npm run build && npm run test:e2e`. Toute route `server/api/admin/**` doit appeler `await requireAdminWrite(event)` en premier (test `apiGuards`). Accessibilité : 0 violation axe hors `color-contrast` ; la dette de contraste est dans `tests/e2e/a11y-baseline.json` et ne doit pas augmenter. La CI est dans `.github/workflows/ci.yml`.

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `MONGODB_URI` — MongoDB connection string (stores projects, profile, AI tools)
- `POSTGRES_URL` — PostgreSQL connection string (stores visitor tracking)
- `AUTH0_DOMAIN` / `AUTH0_CLIENT_ID` — Auth0 SPA app, used to recognise the admin on `/admin/**` (visitors browse it read-only without logging in)
- `ADMIN_EMAIL` — the only email allowed to write via the admin API (`requireAdminWrite`)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob store token, used by `/api/admin/upload` for image/CV uploads from the admin
- `GEMINI_API_KEY` — Gemini API key (free, no credit card — aistudio.google.com/apikey), used by `/api/admin/carnet/generate` to draft/improve Carnet articles from the admin

## Architecture

This is a **Nuxt 3 portfolio** with a Nitro backend, redesigned around a "trail/outdoor" theme. Each route is its **own bespoke page** — `pages/index.vue`, `pages/about.vue`, `pages/contact.vue`, `pages/projects/*`, `pages/ai-tools.vue` — not a single-page scroll of stacked sections.


### Frontend

- **Layout** (`layouts/default.vue`): 3D background, `NavigationTrailNav` (side nav), `AppFooter`, and a `ClientOnly` contact-access overlay. No header component — page titles/identity live inside each page.
- **Admin layout** (`layouts/admin.vue`): sidebar with Projets / Étapes / Carnet / Profil / Outils IA, used by every `/admin/**` page (`ssr: false` via `routeRules`).
- **UI components** (`components/ui/`): Reusable pieces — cards, modals, forms, animated wrappers.
- **Background** (`components/background/`): Three.js 3D scene, particle effects, and background music player.

### State Management (Pinia)

Stores in `stores/`, all following the same pattern — fetch the Mongo-backed API, fall back to a static default if it's empty/erroring (so the site still renders if Mongo is paused):
- `ui.ts` — Controls popup modal visibility
- `visitor.ts` — Fetches/increments visitor count via API
- `projects.ts` — Projects, falls back to `data/projects.ts`
- `profile.ts` — Singleton bio/contact/CV profile, falls back to `data/resume.json` + `staticProfileFallback` (used by `pages/index.vue` for the hero title/tagline, `pages/about.vue`, `pages/contact.vue`)
- `aiTools.ts` — AI tools list, falls back to `data/ai-tools.ts` (used by `pages/ai-tools.vue`)
- `carnet.ts` — Carnet (blog) articles, falls back to `data/carnet.ts` (used by `pages/carnet/index.vue` and `pages/carnet/[slug].vue`)
- `stages.ts` — trail stages, falls back to `data/stages.ts` (used by `/projects` and `/projects/[id]`; the home gets them from `/api/loop-content`)

### Composables

- `useAdminSession` (admin session + `list(entity)`), `useCarnetCategory` / `useDifficultyBadge` (icon + badge class per category / difficulty), `useBackgroundAudio` / `useSceneState` (shared state of the pages' background music and 3D background).
- `useTextDecrypt` and `components/ui/TextDecrypt.vue` were removed on 2026-10-26: no page used them any more since the home became the loop (`docs/audit-coherence.md`, « Ménage du 26/10 »).

### Backend (Nitro / `server/`)

Two databases:
- **MongoDB** (via Mongoose, `server/lib/mongodb.ts`) — Projects (`server/models/project.ts`), Stages (`server/models/stage.ts`), Profile singleton (`server/models/profile.ts`), AI tools (`server/models/aiTool.ts`), Carnet articles (`server/models/carnetArticle.ts`).
- **PostgreSQL** (via pg pool, `server/lib/pgsql.ts`) — Stores visitor count and visitor log.

Public API routes in `server/api/` (no auth): `GET /api/projects`, `GET /api/stages`, `GET /api/profile`, `GET /api/ai-tools`, `GET /api/carnet`, `GET /api/visitors`, `POST /api/visitors`, `GET /api/auth/role` (`{ role: "admin" | "lecteur" }` from the optional Bearer token, via `isAdminRequest` — never throws, UI hint only).

Admin API routes in `server/api/admin/` (all behind `requireAdminWrite` from `server/utils/requireAuth.ts` — verifies the Auth0 JWT and checks the email against `ADMIN_EMAIL`):
- Projects: `GET/POST /api/admin/projects`, `PUT/DELETE /api/admin/projects/[id]`, `POST /api/admin/seed` (imports the static list into Mongo, upsert-only-on-insert)
- Profile: `PUT /api/admin/profile` (upsert — first save creates the singleton doc)
- AI tools: `GET/POST /api/admin/ai-tools`, `PUT/DELETE /api/admin/ai-tools/[id]`, `POST /api/admin/ai-tools/seed`
- Stages: `GET/POST /api/admin/stages`, `PUT/DELETE /api/admin/stages/[id]`, `POST /api/admin/stages/seed` (insert-only by `key`)
- Carnet: `GET/POST /api/admin/carnet`, `PUT/DELETE /api/admin/carnet/[id]`, `POST /api/admin/carnet/seed`, `POST /api/admin/carnet/generate` (Gemini API — see below)
- Uploads: `POST /api/admin/upload` — accepts `multipart/form-data` with a `file` field, pushes it to Vercel Blob, returns `{ url }`. Used by `components/admin/FileUpload.vue` for project images, the profile picture, the CV PDF, and Carnet cover photos. Images are converted **in the browser** to WebP (≤ 1600 px, quality .82, `utils/imageWebp.ts`) before the upload — lighter, and under Vercel's 4.5 MB function body limit; PDF, SVG and GIF are sent as-is. The component shows a « WebP : 3,2 Mo → 210 Ko » status (`role=status`) or an error (`role=alert`). Only the resulting Blob URL is stored in Mongo. **Replaced images are deleted**: `FileUpload` queues the previous URL (`composables/useBlobTrash.ts`) and the save pages call `commit(payload, token)` after a successful save → `DELETE /api/admin/upload` (`{urls}`, `requireAdminWrite`, Blob-store URLs only, `utils/blobTrash.ts`); nothing is deleted before saving, the queue is dropped on navigation (`plugins/blob-trash.client.ts`), and a URL still present in the saved payload is kept. A new save page with an image field must call `commit` too.

### Admin backoffice (`/admin/**`)

**Readable by everyone, writable only by `ADMIN_EMAIL`** (details: `docs/admin-lecture-seule.md`). `middleware/admin.ts` never forces a login: it picks up an existing Auth0 session and asks `GET /api/auth/role`; `composables/useAdminSession.ts` exposes `isAdmin`, `getToken`, `login`/`logout` and `list(entity)` (admin → `/api/admin/*` with the token, visitor → the public `GET` routes, same data, `id` mapped from `_id`). Visitors get a « Visite en lecture seule » banner (`layouts/admin.vue`), no create/import/delete actions, a « Consulter » link per row, `*/new` redirected to the list, and every `components/admin/*Form.vue` takes a `readonly` prop that wraps the form in `<fieldset class="admin-form-body" disabled>` (values kept at text contrast, submit button removed, `onSubmit` returns early). The UI is cosmetic — the real lock is `requireAdminWrite` on every `server/api/admin/**` route. New admin forms must take `readonly` too. Each managed entity follows the same pattern: Mongoose model → public `GET` → admin CRUD → Pinia store with fallback → admin list/form page(s) → `components/admin/*Form.vue`. When adding a new manageable entity, copy the Projects implementation (`server/models/project.ts`, `server/api/admin/projects/*`, `stores/projects.ts`, `pages/admin/projects/*`, `components/admin/ProjectForm.vue`) rather than inventing a new pattern.

### Carnet (blog) — `/carnet/**`

Follows the standard Mongo-backed pattern above — **not** Nuxt Content: articles are edited live from `/admin/carnet` (title, slug, excerpt, category, date, cover photo via `AdminFileUpload`/Vercel Blob, an optional `data` block for D+/FC/allure on trail-outing posts, and a Markdown `content` body), not git-committed Markdown files. This was a deliberate pivot — an earlier version used `@nuxt/content` with articles as `.md` files in `content/carnet/`, but that's incompatible with "editable from the backoffice" since Vercel's serverless functions have a **read-only filesystem in production**, so an admin API route can never write a `.md` file there. `@nuxt/content` and `better-sqlite3` were removed accordingly.

- `pages/carnet/[slug].vue` renders the Markdown `content` field with `marked` (`v-html`, no separate sanitization step — content is written exclusively by the authenticated admin, not public input).
- **AI-assisted writing**: `components/admin/CarnetForm.vue` has two buttons calling `POST /api/admin/carnet/generate` (Gemini API via `@google/genai`, model alias `gemini-flash-latest`, free tier — needs `GEMINI_API_KEY`): "Générer un brouillon" (`mode: "draft"` — full title/excerpt/content from a topic + optional notes, uses `responseMimeType: "application/json"`) and "Améliorer avec l'IA" (`mode: "improve"` — rewrites the current `content` textarea per an optional instruction). Both show the AI's output in a preview card with "Utiliser ce texte" / "Ignorer" before it overwrites the form — never applied silently.
  - Chosen over Claude (paid) and Groq (free, but weaker French output — and Groq had already dropped Llama from its free tier once, in favor of `gpt-oss` models, showing the free-model lineup there isn't stable). Gemini Flash writes noticeably better French than Groq's `gpt-oss-120b` for this use case, still free with no credit card.
  - Deliberately pinned to the `gemini-flash-latest` **alias**, not a dated version like `gemini-2.5-flash`: Gemini's model numbering moved fast through 2026 (2.5 → 3.8 within the year) and access to older pinned versions can become restricted to accounts with prior usage of that exact model — the alias always resolves to Google's current default Flash model instead. Free-tier limits as of writing: ~15 RPM / ~1500 requests per day / ~1M TPM — verify current numbers at `ai.google.dev/gemini-api/docs/rate-limits` if generation starts failing with a quota error.
- `composables/useCarnetCategory.ts` maps the `Trail` / `Dev` / `Coulisses` category to an icon and a fixed-hex badge class (`.badge-carnet-trail` / `-dev` / `-coulisses` in `assets/css/main.css`), same convention as `useDifficultyBadge.ts`.

### Styling

- **Tailwind CSS 4** with custom design tokens in `assets/css/main.css`
- Accent color: `#A84E20` (light) / `#E07840` (dark) — via `--color-accent`
- Highlight color: `#E8A838` (light) / `#F0C050` (dark) — via `--color-highlight` (decorative use only — not contrast-checked for text, see the comment in `main.css`)
- `--color-vue` / `--color-nuxt` — tech-stack badge colors used in `components/AppFooter.vue`, darkened in light mode (`#065F46` / `#166534`) to clear 4.5:1 contrast against `--color-bg`; full brand brightness (`#41B883` / `#00C16A`) in dark mode, where contrast against the dark background is already sufficient. Never hardcode the raw Vue/Nuxt brand hexes directly in a template — go through these tokens so contrast stays correct in both modes.
- Dark mode: `@nuxtjs/color-mode` puts `.dark` on `<html>` (localStorage key `color-mode`, `preference: "system"` → follows the device until the visitor changes it in `SettingsGear`). Tailwind's `dark:` variant is redefined in `main.css` with `@custom-variant` so it follows that class instead of Tailwind 4's default `prefers-color-scheme` media query.
- Page moment (`data-time` on `<html>`, set in `layouts/default.vue` from the route): `dawn` (/about), `day` (default: /, /projects, /ai-tools, /outils), `golden` (/carnet), `night` (/contact). Only `--color-bg` / `--color-surface` change (text/accent/muted keep their values, contrast re-checked ≥ 4.5:1 on every bg and surface). The visitor's Jour / Nuit choice always wins: `night` is a light "dusk" palette in light mode and the concept's blue night only in dark mode — never force dark mode on a page (the toggle must keep working everywhere). When adding a route, add it to `TIME_BY_SECTION`.

### Static Data (fallbacks only — not the source of truth once Mongo has data)

- `data/resume.json` — original profile/contact seed data, superseded by the `Profile` collection
- `data/ai-tools.ts` — original AI tools seed data, superseded by the `AiTool` collection
- `data/projects.ts` — original projects seed data, superseded by the `Project` collection
- `data/carnet.ts` — seed/fallback article for the Carnet, superseded by the `CarnetArticle` collection

### Key Nuxt Modules

`@pinia/nuxt`, `@nuxtjs/color-mode`, `@nuxt/image`, `@vueuse/motion/nuxt` (Three.js r128 is loaded only by the home page, as `three-r128`)

### Accessibility

Components follow WCAG AA / RGAA patterns: semantic HTML, `:focus-visible` styles, and `prefers-reduced-motion` support throughout.

- `<html lang="fr">` is set via `app.head.htmlAttrs` in `nuxt.config.ts`.
- Every page sets a page-specific `<title>` via `useHead({ title: ... })` (see the top of each `pages/*.vue`); the homepage is the loop (`components/loop/LoopHome.vue`). The old home `/camp-de-base` redirects (301) to `/` (`routeRules`).
- Rule kept from the removed `UiTextDecrypt`: never put `aria-label` on a `<div>` (no implicit ARIA role → WCAG 4.1.2 / RGAA 7.1.1, axe `aria-prohibited-attr`); expose the real text through a `.sr-only` span and mark animated copies `aria-hidden="true"`.
- Footer tech badges go through the `--color-vue` / `--color-nuxt` tokens (see Styling above) so their contrast passes WCAG AA / RGAA 3.2 in both color modes instead of using the raw brand hexes directly (those fail ~2:1 against the light background).
- **Photo signature « grain skate »** (`feat/ascension`, replaces the duotone idea, which Adri rejected): each project has an optional mood photo `cover` (+ `coverCredit`, `coverCreditUrl`) shown on `UiProjectCard` (prop `cover`) and as a banner under the fiche header. It gets the `.grain-photo` treatment from `main.css`: high-contrast B&W, vignette, and an SVG `feTurbulence` film grain that jitters 6×/s like a 16 mm skate video (animation off under `prefers-reduced-motion`; grain/vignette are pseudo-elements, badges and `.gps-tag` sit above at z-index 2). Pure CSS, so it also applies to any photo uploaded later from /admin (« Photo d'ambiance » fieldset). Screenshots (`image.light`) stay sharp and ungrained in the fiche's « Départ » section. Mood photos are decorative (`alt=""`, the card title carries the information); the fiche shows a « Photo : <credit> » link. Default covers are Unsplash photos (Unsplash licence, hotlinked from `images.unsplash.com` — not optimised by `@nuxt/image` since the domain isn't whitelisted) set in `data/projects.ts`; `stores/projects.ts` (`withDefaultCover`) fills a missing Mongo `cover` from the fallback by slug, and a cover typed in /admin always wins. `components/ui/DuotoneFilterDefs.vue` is now unused (candidate for deletion). A `.gps-tag` (place · coordinates, fixed dark text on light plate, 12:1) is shown on the photo when the project has `place` / `coords`.
- **Mood photos stored in Mongo, admin first** (`server/utils/projectCover.ts`). Priority: (1) a photo typed/uploaded in /admin → `coverSource: "admin"`, never replaced automatically (a legacy `cover` without `coverSource` counts as admin); (2) an Unsplash photo stored in the DB → `coverSource: "unsplash"` + `coverUnsplashId`, `coverQuery`; (3) front-end fallbacks (`withDefaultCover` from `data/projects.ts`, then the screenshot, then `/projectsoon.png`). A project without `cover` gets one once: on admin create/update (`findCoverFor(..., { force: true })`), on `POST /api/admin/projects/covers` (backfill all), or lazily in `GET /api/projects` (failed searches not retried for 24 h via `coverCheckedAt`). Search order: hand-picked default for the slug in `data/projects.ts` → `coverQuery` typed in /admin → 2-4 English keywords from Gemini (title + description, "no screens/no text") → a per-category map. Unsplash API: `search/photos` landscape + `content_filter=high`, stored URL = `urls.raw` cropped 16:9 1600 px (hotlinked, as the API guidelines require), credit + UTM link, `download` endpoint pinged when a photo is kept. `POST /api/admin/projects/cover-suggestions` returns 6 candidates for the « Photo d'ambiance » fieldset (radio grid previewed with `.grain-photo`, « Autres photos » excludes ids already shown). Needs `UNSPLASH_ACCESS_KEY` (runtimeConfig `unsplashAccessKey`, server only); without it nothing is searched and the defaults apply. The filter is never baked into the file: `.grain-photo` treats every source the same.
- `UiProjectCard`: status badge text colours darkened (`-800` / blue `-700`) in light mode — the original `-600` failed AA (2.4–4.2:1); verified ≥ 4.5:1 on every page-moment surface, light and dark. Card title level set by the `headingLevel` prop (default `h3` under the home's h2; `h2` on `/projects`, right under the page h1) so no heading level is skipped.
- Audited with Lighthouse (2026-09); fixed as a result: `aria-prohibited-attr` (TextDecrypt), `color-contrast` (footer badges), `document-title` (homepage was missing one), `html-has-lang`.

## Refonte « L'ascension » (branche `feat/ascension`)

Redesign in progress, decided in the claude.ai « Portfolio » project (docs `design/home-ascension.md`, `design/architecture-site.md`, `dev/etape-1-audit-code.md`). Prototypes: 3D home https://claude.ai/artifact/6gugNaV3KuPngLuDh74JVK · inner pages https://claude.ai/artifact/RP2eUZAUKrBVk1VA2ucJQt · Figma https://www.figma.com/design/QYD86pMLGOMrM6IAyrgCkn

- **Concept**: the home is a map with a GPS trace from the summit (Grandes Platières, 2 480 m) to the missions — Paris (DGFiP) then Lyon (Click2SellSite) — ending at the Bivouac (contact). 2D map view at each stop, 3D flight in between. The map is the sitemap: summit → Le Randonneur, stops → Sentiers, viewpoint → Équipement, refuge → Carnet, bivouac → Contact.
- **Architecture**: "single page" feel, multi-URL. One persistent map scene in the layout (never unmounted); each route moves the camera and the page content slides over it. Keep real URLs for sharing, SEO and RGAA.
- **Colours**: two independent axes — `data-time` (page moment, narrative) and `.dark` (visitor preference, always wins — no page forces dark mode). Existing fonts kept (DM Serif Display / Inter / JetBrains Mono).
- **3D**: do NOT use TresJS for the map (see the version conflict in `components/background/AppBackground.vue`); use `three` directly in a client-only component, like the prototype.
- **Content stays in Mongo + /admin** (no Nuxt Content). Project fiche sections map to existing fields: `challenge` → « Passages délicats », `solution` → « L'itinéraire choisi », `result` → « Arrivée ». Topo fields added in step 2 (all optional, backward compatible): `place`, `coords {lat, lon}`, `startDate`, `cover` / `coverCredit` / `coverCreditUrl` (mood photo, see « grain skate »), `profile` (numbers 0–100; empty → deterministic profile generated from the slug), `milestones [{label, detail}]`, `stats [{value, label}]` — in the model, admin POST/PUT, store, static fallback and `components/admin/ProjectForm.vue` (« Fiche topo » fieldset). Existing Mongo docs don't have them until edited in /admin (the seed is insert-only).
- **Steps**: 1. foundations (colour axes, nav « métaphore · libellé », accessible route changes, project page via store) ✅ · 2. Sentiers (index + topo fiche) ✅ in progress · 3. Le Randonneur, Bivouac, Équipement · 4. persistent 3D map · 5. Carnet launch (making-of article). Lighthouse + RGAA check at each step.
- **Accessible route changes** (`layouts/default.vue`): after client navigation, focus moves to the page `h1` (tabindex -1, no visible outline) and « Page : <title> » is announced in an `aria-live` region.
- **Trail components** (`components/trail/`, auto-imported as `Trail*`) + pure helpers in `utils/trail.ts` (deterministic, SSR-safe — no `Math.random`):
  - `TrailContourBackground` — decorative static contour-line SVG (seeded), `aria-hidden`, fades out on the left so text stays readable.
  - `TrailElevationProfile` — race-bib style elevation profile (`points` 0–100, optional `milestones` spread evenly). Decorative (`aria-hidden`); the parent must give the text equivalent (figcaption listing the milestones). Milestone labels are hidden under 640px.
- **Sentiers pages**: `/projects` loads projects, stages and profile server-side, lists only **published** projects (`isListedProject`: a `type` — `mission` / `perso`, admin field or `DEFAULT_PROJECT_TYPES` by slug — and `challenge`, `solution`, `result` all filled; others stay reachable by URL), filter « Tous / Missions / Projets perso » (`aria-pressed`, count in `aria-live`), a figures strip under the h1 (`Profile.trailStats`, admin › Profil), cards sorted by stage (most recent first) with their stage heading and key result (`UiProjectCard` props `stage`, `keyResult`). The fiche shows its stage label instead of « Sentier NN » plus « Étape NN · titre · période » and the key result; neighbours cycle over published projects. `/projects/[id]` is the topo fiche: breadcrumb, « Sentier NN · place — coords », fiche technique `<dl>`, profile figure, sticky « Itinéraire » TOC (only sections present), sections Départ (`description`) / Passages délicats (`challenge`) / Itinéraire (`solution`) / Arrivée (`result` + `stats` + stack + links), previous/next neighbours. Texts are split into paragraphs on blank lines (`toParagraphs`).
- **Trail shoe on the home loop (`assets/loop/loop.js`, `SHOE`)**: a real 3D model `public/models/trail-shoe.glb` (generated for free with Microsoft TRELLIS from a photo of Adri's own shoe, then `npx @gltf-transform/cli optimize … --compress false --simplify-ratio 0.5 --texture-compress false`) replaces the procedural shoe (`buildShoe`) as soon as it loads; missing/broken file → procedural shoe stays. `fitModel` auto-orients any GLB (yaw = narrowest width, toe = lower end → +x, then sole plane levelled from down-facing normals, scaled to `SHOE_GLB.len`); overrides in `SHOE_GLB` (`toe`, `right`). The left foot is the right one mirrored. `GLTFLoader` is vendored as `assets/loop/GLTFLoader.r128.js` because the package's copy imports `'three'` (the site's 0.178) instead of `three-r128`. Don't quantize/Draco/meshopt-compress the GLB: r128 + `fitModel` read raw attributes. Only free tools/assets.
- **Navigation** (`TrailNav.vue`): metaphor + explicit label always visible (« Sentiers · Projets »), `aria-current` (`page` / `true` for a parent section); desktop nav from `xl`, burger below.

### Coherence loop ↔ pages
Audit and step plan: `docs/audit-coherence.md` (decisions: the loop's charter is the reference, loop navigation order everywhere, `/camp-de-base` → 301, experience = 12 years training/management + 5 years dev — never « 17 ans »). Tick the step there when it is done. CV links in the loop carry `data-cv`: default `/2025_CV_AdrienNEYRON.pdf`, replaced server-side and in `loop.js` by the admin `cvUrl`.

### Known gaps (not fixed as part of the backoffice work)

- `npm run lint` fails — no `eslint.config.js` in the repo (ESLint v9 expects flat config).
- ~~`pages/projects/[id].vue` read `data/projects.ts` directly~~ — fixed on `feat/ascension`: it now goes through `stores/projects.ts` (slug or `_id`), and `challenge` / `solution` / `result` were added to the store type and fallback.

`job1` / `job2` / `summary` / `about` / `heroTitle` on the `Profile` model are now displayed live:
- `heroTitle` and `job1`/`job2` used to feed the homepage hero. Since the home is the loop (`pages/index.vue` only renders `LoopHome`), **no page displays `heroTitle` any more** (nor `headerSubtitle`); the fields and their admin inputs remain in the model, the store and `ProfileForm.vue`. The loop is fed by `loopLead` / `loopFacts` (`docs/admin-boucle.md`). To decide: remove the two inputs or connect them.
- `pages/about.vue`'s tagline uses `label` instead — `job1`/`job2` turned out to be full marketing sentences rather than short titles, so joining them there read as garbled text; `summary` + `about` render in a "Mon histoire" section on that page.
- `headerSubtitle` is not displayed anywhere at the moment (it was briefly slated for `pages/about.vue`, then dropped as redundant with `label`). The field and its admin input are kept in case it's wanted again later.

### Admin → home loop

The home loop (`assets/loop/loop.js`) is driven by `/admin` content through `GET /api/loop-content` (profile lead/facts/CV/contact/booking link, projects, AI tools, carnet). Hardcoded texts are the fallback (empty field or API failure = unchanged). New fields: `Profile.bookingUrl/loopLead/loopFacts`, `Project.order`. Escape every admin string with `esc()` before `innerHTML`. Details: `docs/admin-boucle.md`.

### Départ cairn
The stages map starts with the Départ stage (`STOPS[0]`, id `depart`), engraved and carded like the others from its stage record (no fiche link). The first 18 units of the trace are forced onto the needle axis `hd` (blended back to the real track by 50 units, `START_STRAIGHT` / `START_BLEND`). It is **not under the needle**: `placeBlocks` shifts it (`depOff`) 17 units left of the trace on wide screens, 20 units behind the needle on narrow ones (`cam.aspect < .9`), so only the needle tip marks the trace start. At t = 0 its stone faces the trace extended backwards, and the ball/bead sit just *after* it (`rig`: `aw===0` → +11 units). During the dive the needle points north and the trace start sits under its **pivot** (base of the north triangle), so the needle covers the start of the trace: the dial centre maps to `C0 = P[0] − hd × PIV` (`PIV = RFIN × NEEDLE_PIV / DIAL_R`), used by `topoInfo` and the top-view camera; `rig` also nudges the top-view camera each frame so `P[0]` lands exactly under the measured pivot (`NDL.piv`). On the map there is **no ball**: only the needle's **north triangle** (variable still named `ball`), at the start only — it fades out as soon as the trace advances (`NEEDLE_OUT`), then the glow runs from the start to the reached point (18 px wide). Cable and glow are never drawn under the needle (`uH0`..`uH1` discarded in `FAT_F`, plus the start cap), so nothing pokes out of the triangle. The overlay is weighted by the watch needle's fade (`NDL.w`). The last stop's cairn is shifted aside too (`depOff`). Exact overlay during the dive via `NDL` (watch needle tip/pivot on screen, unprojected onto the trace plane while `t < 0.006`). Details: `docs/admin-boucle.md`.

### Rain on the last cairn (map → puddle)
After the final cairn (« Étape à écrire ensemble »), it rains on the cairn before the puddle scene: `rainR = clamp((p − .478)/.062)` passed as `PARC.update(..., rain)`. Drops are an `InstancedMesh`; each drop raycasts its impact point at spawn (stele and rocks, else the ground) and leaves a splash ring there. The stone gets wet (darker, rougher → shinier) and dries when scrolling back. Camera: zoom in on the stele, then zoom out high above it while the puddle fades in (map fade .525–.555, puddle .53–.56; `WK_V[2]` = .555 so it plays in the slow part of the scroll). No drops or zoom under `prefers-reduced-motion`. Details: `docs/admin-boucle.md`.

### Stages map: engraved stele + stop panel
The 3D stele (`paintBlock`, canvas 768×576 drawn in 512×384 units) engraves the stage, place and year (`yearOf`), project name, km and D+ (`kmLine`), altitude (`altAt`) and techs. The stop panel `#stopCard` (« Option A », `fillCard`) is a dark glass panel in both themes (`--exp-*` roles, 420px max, 80vh max, scrolls), `<aside aria-label="Détails du projet …">`: year · category meta, `h2` serif title, summary, up to 3 key points, all techs as badges, « Voir le site ↗ » (first non-repo link) and « Code source ↗ » (GitHub/GitLab/Bitbucket link), a discreet « Fiche complète → » (main button when there is no public link). Text ≥ 7:1 (AAA). ✕ or Escape closes it for the current stop only (`cardShut`; capture-phase listener, never during the tour or with a dialog/menu open). What only the stele shows (stage, place, altitude, km, D+) is repeated for screen readers in `#scSr`. **Project previews** (`#scI`, `stageImgs` in `loop.js`): one image per linked project (3 max, 16:10, caption = short project title under it) **under the title and before the descriptive text** (order: meta, title, images, summary, key figure). Source order per project: screenshot from /admin (`image.light` / `image.dark` per theme, exposed by `/api/loop-content`) → screenshot from the `data/projects.ts` fallback → mood `cover` (admin, then fallback) → `data/stageImages.ts` (last-resort image per project slug for projects that are only in Mongo: StockPulse = capture of stockpulse-secours.fr, C+Paie = capture of cpluspaie.vercel.app, in `public/recentprojects/`; plus `Stage.images` (`{src,title}`, 3 max, edited in /admin › Étapes, default in `data/stages.ts`: the Départ shows UCPA Formation and Decathlon captures, chosen without recognisable faces — brands belong to their owners and only illustrate the career path; absent = defaults via `withStageDefaults`, `[]` = none), shown before the linked projects' images); `/projectsoon.png` is never shown. An image entered in /admin always wins over this fallback. No linked project or no image = no preview. Decorative (`alt=""`, the caption and the « Fiche … » links carry the text; caption ≥ 4.5:1 like `.gps`), `loading="lazy"`, a broken image removes itself, images of the next two stops are preloaded while the camera rests. Hidden under 620 px of height; on narrow screens a 64 px strip without captions. Details: `docs/admin-boucle.md`.

### Trail stages — single source (`utils/stages.ts`)
Everything visible on the cairn or in the card is stored in `Stage` and editable in /admin › Étapes (form sections « Sur le cairn » / « Dans la card », table `STAGE_DISPLAY_MAP`): `steleTitle` / `stelePeriod` (title and period engraved on the cairn; empty = the card's `title` / `period`), `km`, `gain`, `altitude` (null = computed), `steleTags` (bottom line, 4 max), `images`, `ctaLabel` (main link text). `docs/admin-boucle.md` (« Cairn, card et liste »).

The home trace no longer has one cairn per project: it follows **stages** edited in `/admin/stages` (Mongo `Stage`: `key`, `order`, `kind` depart/etape/bivouac/final, `period`, `title`, `place`, `summary`, `figure`, `figureLabel`, `projects` slugs; fallback `data/stages.ts`). `buildStageView` computes label (« Départ », « Étape 01 », « Bivouac », « Cairn final »), number, `t`, km / D+ (`TRAIL_TOTAL` 180 km / 10 200 m shared equally between depart, stages and final cairn; bivouac between its neighbours), key result (empty without a figure — never invent one) and links (only to existing projects; final → `/contact`). Same function for `/api/loop-content` (`stages`), the SSR list `#pList` (`renderStageList` in `utils/loopMarkup.ts`: real `<a href>`, shown in static view / reduced motion), `loop.js` (`loopStages(CMS)` → `PROJECTS`/`STOPS`), `/projects`, the fiche and the admin list. In `loop.js`: stop panel shows label · period, title, summary, figure and one link per fiche; `#plMore` is now an `<a>`; clicking the active stele follows the same link; bivouac = small marker (`SMALL_K` 0.62); each stage change is announced in `#live` (joined with the scene announcement on map entry, `sceneSay`); the needle triangle only exists at the start (fades out over `NEEDLE_OUT`) and the glow is drawn from the start to the reached point. The stage `summary` keeps its layout (blank line = paragraph, newline = `<br>`, text escaped) through `summaryHtml` in the card and the SSR list. `CV_FACTS` / `CMS_ALIAS` now only feed the workshop sheets. Header link « Projets » (`.top-link`) is the only header item visible before `html.loop-live`. `LoopHome.vue` `useFetch(..., { pick: ['hero','toolsHead','stages'] })` keeps the SSR payload small. Details: `docs/admin-boucle.md` (« Étapes de la trace »), `docs/architecture-site.md`.

### One scroll notch = one stage
On the stages map each wheel notch, trackpad swipe or finger swipe moves to the next/previous stop (`cinematicTo` ease-out, `STEP_MS` = 0.6 s; scene smoothing 20/s during the move, camera 9/s, stop panel after 0.12 s). The pure gate `utils/wheelStep.ts` (`wheelGate`, unit-tested) never lets one gesture move two projects: strict lock for `LOCK_MS` = 0.3 s after a step, then the inertia tail (close, shrinking events) stays absorbed — but a **new gesture is recognised at once** (pause > 280 ms, direction change, a delta that rises again, or a mouse notch ≥ 90 ms after the previous event) and interrupts the running transition. Before 2026-10-26 the whole 0.6 s transition plus every event < 280 ms apart was absorbed, so a notch every ~350 ms lost one in two and a 2nd trackpad swipe was swallowed by the 1st one's inertia (« il faut scroller plusieurs fois »). Native scroll resumes past both ends; a stop panel that overflows owns the wheel/touch while the cursor or finger is on it (`inScroller` in `loop.js`): it scrolls alone, and at its top/bottom nothing bubbles up to the trace (event swallowed, `overscroll-behavior: contain`) — move the cursor off the panel to change stop; keyboard, « Étapes » menu, tour, dialogs, static view untouched. The wheel listener is capture-phase and stops propagation so `stopCine` doesn't cancel its own transition. **Warm-up** (`warmAhead` in `PARC.update`): a cairn is only sent to the GPU (engraved-stone texture, rocks) and its shaders compiled on the first render where it is visible *and* in the camera frustum, which used to cost a frame hitch on arrival (« sensation de chargement »). While the camera rests on stop n, stops n+1 and n+2 (`WARM_AHEAD`) are drawn once each, one per frame, into a 1 px scissor that the normal render overwrites right after (visibility and `frustumCulled` restored). Details: `docs/admin-boucle.md`.

### Inscription des technos (cairn)
La ligne des technos reste une gravure fixe. Les effets lumineux essayés le 28/10 (guirlande, énergie, lave) ont été retirés ; leçons dans `docs/admin-boucle.md`.

### Persévérer : ondes d'eau et carte au focus
Les deux cercles au sol de la flaque invitent par deux ondes d'eau translucides (couleur eau, pas d'orange) sur un voile d'eau ; fixes sous `prefers-reduced-motion`, éteintes pendant une interaction, renforcées au survol / focus. Plus de consigne affichée (conservée en `sr-only`) ; au focus clavier ou au survol, la carte de la zone (`.pcard.lit`) apparaît à sa place comme libellé visible. Chaque carte porte un vrai bouton d'accès (`.route`, 44 px) et reste affichée tant que la zone ou la carte est survolée / a le focus (`Tab` depuis la zone atterrit sur le bouton). Détails : `docs/admin-boucle.md`.

### Cohérence étape ↔ projet
Carte des informations saisies à deux endroits (étape / projet) et règle proposée (le projet est la source, l'étape ne garde que le propre du parcours) : `docs/coherence-informations.md`. Propositions non appliquées.

### Calm trace
The GPS trace is smoothed twice: `smoothPath` (GPS noise) then `calmPath` (wide gaussian, `TRACE_SIGMA` = 15 points ≈ 1.5 km, x/z and y, ends pinned), so switchbacks don't show. The smoothed trace is rescaled to its original plan length, otherwise stops get closer and the map camera hits the previous cairn. Figures (altitude, D+) still use raw GPS altitudes. Details: `docs/admin-boucle.md`. The section title is a small top-left overline (`#s2 .head`), never over the 3D. Details: `docs/admin-boucle.md`.

### Watch strap (buckle and keepers)
In `buildStrapRing` the buckle and the two keepers are rounded, bevelled frames (`frame()`), sized from the strap stack at their position (`stackAt`) plus `RING_GAP` = 0.02 clearance, so they never clip the strap mesh. Buckle: brushed steel `steelBuckle` (metalness .8, roughness .3, env intensity .35); don't use `orPoli` there (its env reflections turn copper/cyan). Keepers: `keeperM`, same rubber colour as the strap, updated in `strapApply`. The buckle is assembled like a real tang buckle: the plain strap ends inside the hinge bar (`sA`, tube thicker than the strap); a rigid planar frame hangs from it to the end bar (`s1`); the holed strap goes under the end bar, crosses the frame plane at `sx` (bisection on `offB`), over the hinge, then lies on the plain strap through the keepers; the tongue goes through the hole placed exactly at `sx` and rests on the end bar. All on the ring's inner face (`D = -1`). Details: `docs/ascension-boucle.md`.

### Guided-tour button (light mode)
« Lancer la visite guidée » (`.cta`, `assets/loop/loop.source.css`) has no background or border in light mode: dark text `--fg` on one line, a dense `--brand-halo` text-shadow so it stays ≥ 4.5:1 over the dark rocks of the ground, focus ring `--focus`. Contrast was measured on the real background pixels, not on theoretical colours. Edit `loop.source.css`, then regenerate `loop.css` with `node scripts/scope-loop-css.cjs`.

### LatheGeometry orientation
A `LatheGeometry` profile must be listed so its faces point outwards (the watch bezel goes outer edge → top → inner edge); listed the other way, back-face culling made the bezel rim see-through at some angles. Details: `docs/ascension-boucle.md`.

### Intro transition (gate → 3D)
Opening the rope gate plays a WebGL shatter ("craquelure et chute"): `components/loop/IntroTransition.vue` + `utils/introShatter.ts` (Voronoi shards, all motion in the vertex shader from `uProgress`, GSAP `expo.inOut`) + `utils/introSnapshot.ts` (2D-canvas copy of `#gate`; SVG paint is inlined, defs must keep author attributes, referenced gradients/filters are copied in). Any failure or `prefers-reduced-motion` → `play()` returns `false` and the old CSS fade runs. GSAP lag smoothing is disabled during the transition so slow GPUs never drag it out. Details: `docs/intro-craquelure.md`.
