import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const root = (p: string) => fileURLToPath(new URL(p, import.meta.url))

/**
 * Tests unitaires et d'intégration légère (sans navigateur ni base de données) : fonctions pures,
 * composables, stores, gestionnaires d'API Nitro (modèles Mongo simulés), contrats du balisage de l'accueil.
 * Les parcours réels (pages, accessibilité, admin) sont dans tests/e2e (Playwright).
 */
export default defineConfig({
  esbuild: { tsconfigRaw: '{}' }, // le tsconfig du projet étend .nuxt/ (absent avant « nuxt prepare ») : inutile pour les tests
  resolve: { alias: { '~': root('.'), '@': root('.') } },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/unit/setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      include: ['utils/**', 'composables/**', 'stores/**', 'server/**', 'data/**'],
      exclude: ['**/*.d.ts', 'server/api/admin/seed.post.ts', 'server/api/admin/*/seed.post.ts', 'server/lib/**'],
      // plancher actuel (mesuré : ~54 % lignes, 60 % fonctions, 79 % branches) : à relever au fil des tests, jamais à baisser
      thresholds: { lines: 50, functions: 55, branches: 70, statements: 50 },
    },
  },
})
