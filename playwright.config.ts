import { defineConfig, devices } from '@playwright/test'

/**
 * Parcours navigateur sur le BUILD de production (`npm run build` puis `.output/server/index.mjs`), sans base de
 * données : MONGODB_URI / POSTGRES_URL volontairement vides, ce qui vérifie aussi que le site reste utilisable
 * quand la base est indisponible (replis statiques). Voir docs/tests.md.
 */
const PORT = Number(process.env.E2E_PORT || 3100)

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
    // CHROMIUM_PATH : utile dans un environnement où Chromium est déjà installé ailleurs (sinon : npx playwright install chromium)
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /smoke\.spec\.ts/ },
  ],
  webServer: {
    command: 'node .output/server/index.mjs',
    url: `http://127.0.0.1:${PORT}/favicon.ico`,
    // false : un ancien serveur resté actif (build/env périmés, vraie base) fausserait tout. Opt-in : E2E_REUSE_SERVER=1
    reuseExistingServer: !!process.env.E2E_REUSE_SERVER,
    stdout: 'ignore',
    stderr: process.env.E2E_SERVER_LOGS ? 'pipe' : 'ignore',
    timeout: 60_000,
    // runtimeConfig est figé au BUILD (valeurs du .env local) : seules les variables NUXT_* le surchargent à l'exécution.
    // Sans ça, les tests tapperaient la VRAIE base si le .env en contient une.
    env: { PORT: String(PORT), HOST: '127.0.0.1', MONGODB_URI: '', POSTGRES_URL: '', NUXT_MONGODB_URI: '', NUXT_POSTGRES_URL: '', NODE_ENV: 'production' },
  },
})
