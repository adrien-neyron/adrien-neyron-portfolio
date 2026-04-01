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
- `MONGODB_URI` — MongoDB connection string (stores projects)
- `POSTGRES_URL` — PostgreSQL connection string (stores visitor tracking)

## Architecture

This is a **Nuxt 3 single-page portfolio** with a Nitro backend. The app renders a single route (`/pages/index.vue`) composed of stacked sections (Home, Projects, About, Contact).

### Frontend

- **Layout** (`layouts/default.vue`): Wraps all pages with the 3D background, fixed header, sidebar nav, and contact overlay.
- **Sections** (`components/sections/`): Each section of the portfolio (Home, Projects, About, Contact) is its own component.
- **UI components** (`components/ui/`): Reusable pieces — cards, modals, forms, animated wrappers.
- **Background** (`components/background/`): Three.js 3D scene, particle effects, and background music player.

### State Management (Pinia)

Three stores in `stores/`:
- `ui.ts` — Controls popup modal visibility
- `visitor.ts` — Fetches/increments visitor count via API
- `projects.ts` — Lazy-loads and caches projects from `/api/projects`

### Composables

- `useTextDecrypt` — Letter-by-letter text reveal animation (respects `prefers-reduced-motion`)
- `usePopupSession` — One-time popup trigger using `sessionStorage`
- `useSectionTrigger` — IntersectionObserver wrapper for scroll-triggered callbacks

### Backend (Nitro / `server/`)

Dual-database setup:
- **MongoDB** (via Mongoose, `server/lib/mongodb.ts`) — Stores projects. Schema in `server/models/project.ts`.
- **PostgreSQL** (via pg pool, `server/lib/pgsql.ts`) — Stores visitor count and visitor log.

API routes in `server/api/`:
- `GET /api/projects` — Fetch all projects
- `POST /api/projects` — Create a project
- `GET /api/visitors` — Get visitor count
- `POST /api/visitors` — Increment count + log visitor

### Styling

- **Tailwind CSS 4** with custom design tokens in `assets/css/main.css`
- Accent color: `#FF6B2D` (light) / `#57C785` (dark) — via `--color-accent`
- Highlight color: `#f6c453` (light) / `#61DAFB` (dark) — via `--color-highlight`
- Dark mode uses `dark:` prefix (Tailwind), stored in `color-mode` localStorage key via `@nuxtjs/color-mode`

### Static Data

- `data/resume.json` — Profile, contact info, job descriptions
- `data/tooltip.json` — Tooltip content for UI sections

### Key Nuxt Modules

`@pinia/nuxt`, `@nuxtjs/color-mode`, `@nuxt/image`, `@tresjs/nuxt` (Three.js), `@vueuse/motion/nuxt`

### Accessibility

Components follow WCAG AA patterns: semantic HTML, `aria-label`/`aria-hidden` on animated text, `:focus-visible` styles, and `prefers-reduced-motion` support throughout.
