# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

-Le projet est un portfolio design qui présente mes appétences pour le développement, l'analyse et le code javascript avec une spécialisation en vue.js

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run generate   # Static site generation
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:
- `MONGODB_URI` — MongoDB connection string (stores projects, profile, AI tools)
- `POSTGRES_URL` — PostgreSQL connection string (stores visitor tracking)
- `AUTH0_DOMAIN` / `AUTH0_CLIENT_ID` — Auth0 SPA app, used to gate `/admin/**`
- `ADMIN_EMAIL` — the only email allowed to write via the admin API (`requireAdminWrite`)
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob store token, used by `/api/admin/upload` for image/CV uploads from the admin

## Architecture

This is a **Nuxt 3 portfolio** with a Nitro backend, redesigned around a "trail/outdoor" theme. Each route is its **own bespoke page** — `pages/index.vue`, `pages/about.vue`, `pages/contact.vue`, `pages/projects/*`, `pages/ai-tools.vue` — not a single-page scroll of stacked sections.

**`components/sections/*.vue` (HomeSection, AboutSection, ContactSection, ProjectsSection) and `components/AppHeader.vue` are dead code** — leftovers from an earlier single-page design, not imported by any page or layout. Don't build on them; extend the real pages instead. (Candidates for deletion, but left in place for now — ask before removing.)

### Frontend

- **Layout** (`layouts/default.vue`): 3D background, `NavigationTrailNav` (side nav), `AppFooter`, and a `ClientOnly` contact-access overlay. No header component — page titles/identity live inside each page.
- **Admin layout** (`layouts/admin.vue`): sidebar with Projets / Profil / Outils IA, used by every `/admin/**` page (`ssr: false` via `routeRules`).
- **UI components** (`components/ui/`): Reusable pieces — cards, modals, forms, animated wrappers.
- **Background** (`components/background/`): Three.js 3D scene, particle effects, and background music player.

### State Management (Pinia)

Stores in `stores/`, all following the same pattern — fetch the Mongo-backed API, fall back to a static default if it's empty/erroring (so the site still renders if Mongo is paused):
- `ui.ts` — Controls popup modal visibility
- `visitor.ts` — Fetches/increments visitor count via API
- `projects.ts` — Projects, falls back to `data/projects.ts`
- `profile.ts` — Singleton bio/contact/CV profile, falls back to `data/resume.json` + `staticProfileFallback` (used by `pages/index.vue` for the hero title/tagline, `pages/about.vue`, `pages/contact.vue`)
- `aiTools.ts` — AI tools list, falls back to `data/ai-tools.ts` (used by `pages/ai-tools.vue`)

### Composables

- `useTextDecrypt` — Letter-by-letter text reveal animation (respects `prefers-reduced-motion`)
- `usePopupSession` — One-time popup trigger using `sessionStorage`
- `useSectionTrigger` — IntersectionObserver wrapper for scroll-triggered callbacks

### Backend (Nitro / `server/`)

Two databases:
- **MongoDB** (via Mongoose, `server/lib/mongodb.ts`) — Projects (`server/models/project.ts`), Profile singleton (`server/models/profile.ts`), AI tools (`server/models/aiTool.ts`).
- **PostgreSQL** (via pg pool, `server/lib/pgsql.ts`) — Stores visitor count and visitor log.

Public API routes in `server/api/` (no auth): `GET /api/projects`, `GET /api/profile`, `GET /api/ai-tools`, `GET /api/visitors`, `POST /api/visitors`.

Admin API routes in `server/api/admin/` (all behind `requireAdminWrite` from `server/utils/requireAuth.ts` — verifies the Auth0 JWT and checks the email against `ADMIN_EMAIL`):
- Projects: `GET/POST /api/admin/projects`, `PUT/DELETE /api/admin/projects/[id]`, `POST /api/admin/seed` (imports the static list into Mongo, upsert-only-on-insert)
- Profile: `PUT /api/admin/profile` (upsert — first save creates the singleton doc)
- AI tools: `GET/POST /api/admin/ai-tools`, `PUT/DELETE /api/admin/ai-tools/[id]`, `POST /api/admin/ai-tools/seed`
- Uploads: `POST /api/admin/upload` — accepts `multipart/form-data` with a `file` field, pushes it to Vercel Blob, returns `{ url }`. Used by `components/admin/FileUpload.vue` for project images, the profile picture, and the CV PDF.

### Admin backoffice (`/admin/**`)

Auth0-gated (`middleware/admin.ts` + `layouts/admin.vue`). Each managed entity follows the same pattern: Mongoose model → public `GET` → admin CRUD → Pinia store with fallback → admin list/form page(s) → `components/admin/*Form.vue`. When adding a new manageable entity, copy the Projects implementation (`server/models/project.ts`, `server/api/admin/projects/*`, `stores/projects.ts`, `pages/admin/projects/*`, `components/admin/ProjectForm.vue`) rather than inventing a new pattern.

### Styling

- **Tailwind CSS 4** with custom design tokens in `assets/css/main.css`
- Accent color: `#A84E20` (light) / `#E07840` (dark) — via `--color-accent`
- Highlight color: `#E8A838` (light) / `#F0C050` (dark) — via `--color-highlight` (decorative use only — not contrast-checked for text, see the comment in `main.css`)
- `--color-vue` / `--color-nuxt` — tech-stack badge colors used in `components/AppFooter.vue`, darkened in light mode (`#065F46` / `#166534`) to clear 4.5:1 contrast against `--color-bg`; full brand brightness (`#41B883` / `#00C16A`) in dark mode, where contrast against the dark background is already sufficient. Never hardcode the raw Vue/Nuxt brand hexes directly in a template — go through these tokens so contrast stays correct in both modes.
- Dark mode uses `dark:` prefix (Tailwind), stored in `color-mode` localStorage key via `@nuxtjs/color-mode`

### Static Data (fallbacks only — not the source of truth once Mongo has data)

- `data/resume.json` — original profile/contact seed data, superseded by the `Profile` collection
- `data/ai-tools.ts` — original AI tools seed data, superseded by the `AiTool` collection
- `data/projects.ts` — original projects seed data, superseded by the `Project` collection
- `data/tooltip.json` — tooltip content, still static (not managed from the admin)

### Key Nuxt Modules

`@pinia/nuxt`, `@nuxtjs/color-mode`, `@nuxt/image`, `@tresjs/nuxt` (Three.js), `@vueuse/motion/nuxt`

### Accessibility

Components follow WCAG AA / RGAA patterns: semantic HTML, `:focus-visible` styles, and `prefers-reduced-motion` support throughout.

- `<html lang="fr">` is set via `app.head.htmlAttrs` in `nuxt.config.ts`.
- Every page sets a page-specific `<title>` via `useHead({ title: ... })` (see the top of each `pages/*.vue`); the homepage's is `"Camp de Base — Accueil | Adrien Neyron"`.
- `UiTextDecrypt` (`components/ui/TextDecrypt.vue`) never puts `aria-label` on its wrapping `<div>` — a `<div>` has no implicit ARIA role, so `aria-label` on it is invalid per WCAG 4.1.2 / RGAA 7.1.1 (axe-core: `aria-prohibited-attr`). The real text is exposed to assistive tech via a `.sr-only` span instead; the animated span and the space-reservation span are both `aria-hidden="true"`.
- Footer tech badges go through the `--color-vue` / `--color-nuxt` tokens (see Styling above) so their contrast passes WCAG AA / RGAA 3.2 in both color modes instead of using the raw brand hexes directly (those fail ~2:1 against the light background).
- Audited with Lighthouse (2026-09); fixed as a result: `aria-prohibited-attr` (TextDecrypt), `color-contrast` (footer badges), `document-title` (homepage was missing one), `html-has-lang`.

### Known gaps (not fixed as part of the backoffice work)

- `npm run lint` fails — no `eslint.config.js` in the repo (ESLint v9 expects flat config).
- `pages/index.vue` imports `data/projects.ts` directly instead of going through `stores/projects.ts`, so the homepage's "Projets récents" section doesn't reflect Mongo edits until redeployed.

`job1` / `job2` / `summary` / `about` / `heroTitle` on the `Profile` model are now displayed live:
- `heroTitle` and `job1`/`job2` feed the homepage hero (`pages/index.vue`): `heroTitle` is split into a `UiTextDecrypt`-animated first word plus an accent-colored remainder (so the H1 stays readable whatever length is typed in the admin), and `job1`/`job2` render as the subtitle lines underneath it.
- `pages/about.vue`'s tagline uses `label` instead — `job1`/`job2` turned out to be full marketing sentences rather than short titles, so joining them there read as garbled text; `summary` + `about` render in a "Mon histoire" section on that page.
- `headerSubtitle` is not displayed anywhere at the moment (it was briefly slated for `pages/about.vue`, then dropped as redundant with `label`). The field and its admin input are kept in case it's wanted again later.
