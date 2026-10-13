import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: {
        lang: "fr",
      },
      // Polices servies par le site (sous-ensemble latin) : voir les @font-face en tête de assets/css/main.css.
      // Inter (pages du site) et JetBrains Mono (accueil : tout le texte d'interface) sont préchargées : texte du premier affichage.
      link: [
        { rel: "preload", href: "/fonts/inter-latin-variable.woff2", as: "font", type: "font/woff2", crossorigin: "" },
        { rel: "preload", href: "/fonts/jetbrains-mono-latin-variable.woff2", as: "font", type: "font/woff2", crossorigin: "" },
      ],
    },
  },

  modules: [
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    "@nuxt/image",
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

  // main.css (Tailwind + jetons du site) est importé par layouts/default.vue, layouts/admin.vue et
  // pages/admin/login.vue : l'accueil (layout « loop ») ne l'embarque pas dans son premier affichage.
  css: ["~/assets/css/fonts.css"],

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
