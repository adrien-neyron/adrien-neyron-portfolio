<script setup lang="ts">
// Accueil : la boucle « L'ascension » (voir docs/ascension-boucle.md).
// L'ancien accueil /camp-de-base redirige ici (301, nuxt.config.ts).
definePageMeta({ layout: 'loop' })

// Données structurées (JSON-LD) : identité professionnelle lisible par les moteurs de recherche.
// Uniquement des informations déjà publiques sur le site ; l'URL vient de SITE_URL (docs/seo.md).
const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
useHead({
  script: [
    {
      type: 'application/ld+json',
      key: 'jsonld-home',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${siteUrl}/#site`,
            url: siteUrl,
            name: 'Adrien Neyron',
            inLanguage: 'fr-FR',
            publisher: { '@id': `${siteUrl}/#person` },
          },
          {
            '@type': 'Person',
            '@id': `${siteUrl}/#person`,
            name: 'Adrien Neyron',
            url: siteUrl,
            image: `${siteUrl}/profile.png`,
            jobTitle: 'Développeur front-end',
            description: 'Développeur front-end Vue 3 / TypeScript, spécialisé en accessibilité RGAA et WCAG.',
            knowsAbout: ['Vue.js', 'Nuxt', 'TypeScript', 'Accessibilité numérique', 'RGAA', 'WCAG'],
            address: { '@type': 'PostalAddress', addressLocality: 'Araches-la-Frasse', addressRegion: 'Haute-Savoie', addressCountry: 'FR' },
            sameAs: ['https://github.com/adrien-neyron', 'https://www.linkedin.com/in/adrienneyron/'],
          },
        ],
      }),
    },
  ],
})
</script>

<template>
  <LoopHome />
</template>
