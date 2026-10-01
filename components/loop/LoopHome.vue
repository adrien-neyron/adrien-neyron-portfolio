<script setup lang="ts">
/**
 * Accueil « L'ascension » : boucle de scroll infinie (montre GPS → instruments → carte des projets
 * → flaque → bivouac → retour). Portage du prototype HTML (voir docs/ascension-boucle.md).
 *
 * - Le balisage (loop.html) est rendu côté serveur : tout le texte est dans le HTML (SEO, lecteurs
 *   d'écran, sans JavaScript). La 3D et les interactions démarrent au montage, côté client seulement.
 * - Les styles (loop.css) visent html et body : toutes leurs règles sont donc cantonnées derrière la
 *   classe `html.loop-on`, posée ici au rendu serveur puis retirée au démontage. Ils restent chargés
 *   après la navigation (33 Ko) mais ne s'appliquent plus à aucune autre page.
 *   Si loop.css est modifié : relancer scripts/scope-loop-css.cjs (voir docs/ascension-boucle.md).
 * - Three.js r128 est importé sous l'alias `three-r128` (le reste du site garde sa version de three).
 */
import markup from '~/assets/loop/loop.html?raw'
import loopCss from '~/assets/loop/loop.css?url'

useHead({
  htmlAttrs: { class: 'loop-on' },
  title: 'Adri — développeur front-end · Vue 3, TypeScript, accessibilité',
  meta: [
    {
      name: 'description',
      content:
        "Portfolio d'Adri, développeur front-end (Vue 3, TypeScript, accessibilité RGAA/WCAG) : 17 ans de sport avant le code. Une expédition à parcourir : projets, outils, carnet, contact.",
    },
  ],
  link: [
    { rel: 'stylesheet', href: loopCss },
    // Polices : DM Serif Display, Inter et JetBrains Mono sont déjà chargées par nuxt.config.ts ;
    // la boucle y ajoute seulement l'italique de DM Serif Display (titres et mots en filigrane).
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@1&display=swap' },
  ],
})

let loop: { destroy: () => void } | null = null

onMounted(async () => {
  document.documentElement.classList.add('loop-on')
  const [THREE, { initLoop }] = await Promise.all([
    import('three-r128'),
    import('~/assets/loop/loop.js'),
  ])
  loop = initLoop(THREE)
})

onBeforeUnmount(() => {
  loop?.destroy()
  loop = null
  document.documentElement.classList.remove('loop-on')
})
</script>

<template>
  <!-- Contenu statique : Vue ne le met pas à jour, le script de la boucle le pilote -->
  <div v-html="markup" />
</template>
