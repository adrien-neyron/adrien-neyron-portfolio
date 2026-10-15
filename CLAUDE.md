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
- **Admin layout** (`layouts/admin.vue`): sidebar with Projets / Carnet / Profil / Outils IA, used by every `/admin/**` page (`ssr: false` via `routeRules`).
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

### Composables

- `useTextDecrypt` — Letter-by-letter text reveal animation (respects `prefers-reduced-motion`)

### Backend (Nitro / `server/`)

Two databases:
- **MongoDB** (via Mongoose, `server/lib/mongodb.ts`) — Projects (`server/models/project.ts`), Profile singleton (`server/models/profile.ts`), AI tools (`server/models/aiTool.ts`), Carnet articles (`server/models/carnetArticle.ts`).
- **PostgreSQL** (via pg pool, `server/lib/pgsql.ts`) — Stores visitor count and visitor log.

Public API routes in `server/api/` (no auth): `GET /api/projects`, `GET /api/profile`, `GET /api/ai-tools`, `GET /api/carnet`, `GET /api/visitors`, `POST /api/visitors`, `GET /api/auth/role` (`{ role: "admin" | "lecteur" }` from the optional Bearer token, via `isAdminRequest` — never throws, UI hint only).

Admin API routes in `server/api/admin/` (all behind `requireAdminWrite` from `server/utils/requireAuth.ts` — verifies the Auth0 JWT and checks the email against `ADMIN_EMAIL`):
- Projects: `GET/POST /api/admin/projects`, `PUT/DELETE /api/admin/projects/[id]`, `POST /api/admin/seed` (imports the static list into Mongo, upsert-only-on-insert)
- Profile: `PUT /api/admin/profile` (upsert — first save creates the singleton doc)
- AI tools: `GET/POST /api/admin/ai-tools`, `PUT/DELETE /api/admin/ai-tools/[id]`, `POST /api/admin/ai-tools/seed`
- Carnet: `GET/POST /api/admin/carnet`, `PUT/DELETE /api/admin/carnet/[id]`, `POST /api/admin/carnet/seed`, `POST /api/admin/carnet/generate` (Gemini API — see below)
- Uploads: `POST /api/admin/upload` — accepts `multipart/form-data` with a `file` field, pushes it to Vercel Blob, returns `{ url }`. Used by `components/admin/FileUpload.vue` for project images, the profile picture, the CV PDF, and Carnet cover photos.

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
- Every page sets a page-specific `<title>` via `useHead({ title: ... })` (see the top of each `pages/*.vue`); the homepage's is `"Camp de Base — Accueil | Adrien Neyron"`.
- `UiTextDecrypt` (`components/ui/TextDecrypt.vue`) never puts `aria-label` on its wrapping `<div>` — a `<div>` has no implicit ARIA role, so `aria-label` on it is invalid per WCAG 4.1.2 / RGAA 7.1.1 (axe-core: `aria-prohibited-attr`). The real text is exposed to assistive tech via a `.sr-only` span instead; the animated span and the space-reservation span are both `aria-hidden="true"`.
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
- **Sentiers pages**: `/projects` loads projects server-side (`await store.fetchProjects()`), builds filters from the categories actually present, filter buttons use `aria-pressed`, result count in `aria-live`, and renders the original `UiProjectCard` cards (3-column grid, as before the redesign). `/projects/[id]` is the topo fiche: breadcrumb, « Sentier NN · place — coords », fiche technique `<dl>`, profile figure, sticky « Itinéraire » TOC (only sections present), sections Départ (`description`) / Passages délicats (`challenge`) / Itinéraire (`solution`) / Arrivée (`result` + `stats` + stack + links), previous/next neighbours. Texts are split into paragraphs on blank lines (`toParagraphs`).
- **Trail shoe on the home loop (`assets/loop/loop.js`, `SHOE`)**: a real 3D model `public/models/trail-shoe.glb` (generated for free with Microsoft TRELLIS from a photo of Adri's own shoe, then `npx @gltf-transform/cli optimize … --compress false --simplify-ratio 0.5 --texture-compress false`) replaces the procedural shoe (`buildShoe`) as soon as it loads; missing/broken file → procedural shoe stays. `fitModel` auto-orients any GLB (yaw = narrowest width, toe = lower end → +x, then sole plane levelled from down-facing normals, scaled to `SHOE_GLB.len`); overrides in `SHOE_GLB` (`toe`, `right`). The left foot is the right one mirrored. `GLTFLoader` is vendored as `assets/loop/GLTFLoader.r128.js` because the package's copy imports `'three'` (the site's 0.178) instead of `three-r128`. Don't quantize/Draco/meshopt-compress the GLB: r128 + `fitModel` read raw attributes. Only free tools/assets.
- **Navigation** (`TrailNav.vue`): metaphor + explicit label always visible (« Sentiers · Projets »), `aria-current` (`page` / `true` for a parent section); desktop nav from `xl`, burger below.

### Known gaps (not fixed as part of the backoffice work)

- `npm run lint` fails — no `eslint.config.js` in the repo (ESLint v9 expects flat config).
- ~~`pages/projects/[id].vue` read `data/projects.ts` directly~~ — fixed on `feat/ascension`: it now goes through `stores/projects.ts` (slug or `_id`), and `challenge` / `solution` / `result` were added to the store type and fallback.

`job1` / `job2` / `summary` / `about` / `heroTitle` on the `Profile` model are now displayed live:
- `heroTitle` and `job1`/`job2` feed the homepage hero (`pages/index.vue`): `heroTitle` is split into a `UiTextDecrypt`-animated first word plus an accent-colored remainder (so the H1 stays readable whatever length is typed in the admin), and `job1`/`job2` render as the subtitle lines underneath it.
- `pages/about.vue`'s tagline uses `label` instead — `job1`/`job2` turned out to be full marketing sentences rather than short titles, so joining them there read as garbled text; `summary` + `about` render in a "Mon histoire" section on that page.
- `headerSubtitle` is not displayed anywhere at the moment (it was briefly slated for `pages/about.vue`, then dropped as redundant with `label`). The field and its admin input are kept in case it's wanted again later.

### Admin → home loop

The home loop (`assets/loop/loop.js`) is driven by `/admin` content through `GET /api/loop-content` (profile lead/facts/CV/contact/booking link, projects, AI tools, carnet). Hardcoded texts are the fallback (empty field or API failure = unchanged). New fields: `Profile.bookingUrl/loopLead/loopFacts`, `Project.order`. Escape every admin string with `esc()` before `innerHTML`. Details: `docs/admin-boucle.md`.

### Départ cairn (stage 00)
The stages map starts with a cairn too: `buildBlocks` gives `STOPS[0]` (no project) a pseudo-project `{id:'depart', stage:'Étape 00', place:'Grandes Platières', when:'2009–2021', …}` so it is engraved like the others; it has no fiche but does get the glass stop card (`fillCard` without `PROJECT_INFO`, « Fiche complète » hidden). The first 18 units of the trace are forced onto the needle axis `hd` (blended back to the real track by 50 units, `START_STRAIGHT` / `START_BLEND`). It is **not under the needle**: `placeBlocks` shifts it (`depOff`) 17 units left of the trace on wide screens, 20 units behind the needle on narrow ones (`cam.aspect < .9`), so only the needle tip marks the trace start. At t = 0 its stone faces the trace extended backwards, and the ball/bead sit just *after* it (`rig`: `aw===0` → +11 units). During the dive the needle points north and the trace start sits under its **pivot** (base of the north triangle), so the needle covers the start of the trace: the dial centre maps to `C0 = P[0] − hd × PIV` (`PIV = RFIN × NEEDLE_PIV / DIAL_R`), used by `topoInfo` and the top-view camera; `rig` also nudges the top-view camera each frame so `P[0]` lands exactly under the measured pivot (`NDL.piv`). On the map there is **no ball**: only the needle's **north triangle** (variable still named `ball`), base and tip both on the trace (chord between two curve points), never before the start, tip reaching the very end at the last stop; the cable glow stops at the triangle base (`uT` = base) and is 18 px wide. Cable and glow are never drawn under the needle (`uH0`..`uH1` discarded in `FAT_F`, plus the start cap), so nothing pokes out of the triangle. The overlay is weighted by the watch needle's fade (`NDL.w`). The last stop's cairn is shifted aside too (`depOff`). Exact overlay during the dive via `NDL` (watch needle tip/pivot on screen, unprojected onto the trace plane while `t < 0.006`). Details: `docs/admin-boucle.md`.

### Stages map: single source of text
On the stages map the 3D stele (`paintBlock`) engraves **only the project name**; stage, place, summary, stats and techs live in the glass stop card `#stopCard` (`fillCard`, summary condensed by `brief()`, techs on one line). The section title is a small top-left overline (`#s2 .head`), never over the 3D. Don't engrave text back on the stone. Details: `docs/admin-boucle.md`.

### Watch strap (buckle and keepers)
In `buildStrapRing` the buckle and the two keepers are rounded, bevelled frames (`frame()`), sized from the strap stack at their position (`stackAt`) plus `RING_GAP` = 0.02 clearance, so they never clip the strap mesh. Buckle: brushed steel `steelBuckle` (metalness .8, roughness .3, env intensity .35); don't use `orPoli` there (its env reflections turn copper/cyan). Keepers: `keeperM`, same rubber colour as the strap, updated in `strapApply`. The buckle is assembled like a real tang buckle: the plain strap ends inside the hinge bar (`sA`, tube thicker than the strap); a rigid planar frame hangs from it to the end bar (`s1`); the holed strap goes under the end bar, crosses the frame plane at `sx` (bisection on `offB`), over the hinge, then lies on the plain strap through the keepers; the tongue goes through the hole placed exactly at `sx` and rests on the end bar. All on the ring's inner face (`D = -1`). Details: `docs/ascension-boucle.md`.

### Intro transition (gate → 3D)
Opening the rope gate plays a WebGL shatter ("craquelure et chute"): `components/loop/IntroTransition.vue` + `utils/introShatter.ts` (Voronoi shards, all motion in the vertex shader from `uProgress`, GSAP `expo.inOut`) + `utils/introSnapshot.ts` (2D-canvas copy of `#gate`; SVG paint is inlined, defs must keep author attributes, referenced gradients/filters are copied in). Any failure or `prefers-reduced-motion` → `play()` returns `false` and the old CSS fade runs. GSAP lag smoothing is disabled during the transition so slow GPUs never drag it out. Details: `docs/intro-craquelure.md`.
