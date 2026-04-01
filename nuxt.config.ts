import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  app: {
    head: {
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
    preference: "light",
    fallback: "light",
    storageKey: "color-mode",
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ["~/assets/css/main.css"],

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    mongodbUri:   process.env.MONGODB_URI    ?? "",
    postgresUrl:  process.env.POSTGRES_URL   ?? "",
    public: {
      auth0Domain:      process.env.AUTH0_DOMAIN       ?? "",
      auth0ClientId:    process.env.AUTH0_CLIENT_ID    ?? "",
      auth0Audience:    process.env.AUTH0_AUDIENCE     ?? "",
      auth0RedirectUri: process.env.AUTH0_REDIRECT_URI ?? "http://localhost:3000/admin",
    },
  },
});
