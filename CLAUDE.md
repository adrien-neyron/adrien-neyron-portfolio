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
- `profile.ts` — Singleton bio/contact/CV profile, falls back to `data/resume.json` + `staticProfileFallback` (used by `pages/about.vue`, `pages/contact.vue`)
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
- Accent color: `#FF6B2D` (light) / `#57C785` (dark) — via `--color-accent`
- Highlight color: `#f6c453` (light) / `#61DAFB` (dark) — via `--color-highlight`
- Dark mode uses `dark:` prefix (Tailwind), stored in `color-mode` localStorage key via `@nuxtjs/color-mode`

### Static Data (fallbacks only — not the source of truth once Mongo has data)

- `data/resume.json` — original profile/contact seed data, superseded by the `Profile` collection
- `data/ai-tools.ts` — original AI tools seed data, superseded by the `AiTool` collection
- `data/projects.ts` — original projects seed data, superseded by the `Project` collection
- `data/tooltip.json` — tooltip content, still static (not managed from the admin)

### Key Nuxt Modules

`@pinia/nuxt`, `@nuxtjs/color-mode`, `@nuxt/image`, `@tresjs/nuxt` (Three.js), `@vueuse/motion/nuxt`

### Accessibility

Components follow WCAG AA patterns: semantic HTML, `aria-label`/`aria-hidden` on animated text, `:focus-visible` styles, and `prefers-reduced-motion` support throughout.

### Known gaps (not fixed as part of the backoffice work)

- `npm run lint` fails — no `eslint.config.js` in the repo (ESLint v9 expects flat config).
- `pages/index.vue` imports `data/projects.ts` directly instead of going through `stores/projects.ts`, so the homepage's "Projets récents" section doesn't reflect Mongo edits until redeployed.

`job1` / `job2` / `summary` / `headerSubtitle` / `about` on the `Profile` model are now displayed on `pages/about.vue`: `job1`/`job2` feed the hero tagline (`× `-joined, with a static fallback), `headerSubtitle` is a small kicker under it, and `summary` + `about` render in a new "Mon histoire" section.
