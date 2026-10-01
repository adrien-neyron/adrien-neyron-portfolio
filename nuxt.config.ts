import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: "fr",
      },
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
        },
      ],
    },
  },

  modules: [
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    "@nuxt/image",
    "@tresjs/nuxt",
    "@vueuse/motion/nuxt",
  ],

  colorMode: {
    classSuffix: "",       // génère class="dark" — compatible Tailwind dark:
    preference: "system",  // suit le réglage clair/sombre de l'appareil tant que le visiteur n'a rien choisi
    fallback: "light",
    storageKey: "color-mode",
  },

  vite: {
    plugins: [tailwindcss()],
  },

  routeRules: {
    "/admin/**": { ssr: false },
    "/callback":  { ssr: false },
  },

  css: ["~/assets/css/main.css"],

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    mongodbUri:   process.env.MONGODB_URI    ?? "",
    postgresUrl:  process.env.POSTGRES_URL   ?? "",
    adminEmail:   process.env.ADMIN_EMAIL    ?? "adrien.neyron@gmail.com",
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN ?? "",
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    // Photos d'ambiance des projets : clé « Access Key » d'une app sur unsplash.com/oauth/applications
    // (serveur uniquement). Absente → pas de recherche auto, photos par défaut de data/projects.ts.
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY ?? "",
    public: {
      auth0Domain:   process.env.AUTH0_DOMAIN    ?? "",
      auth0ClientId: process.env.AUTH0_CLIENT_ID ?? "",
    },
  },
});
