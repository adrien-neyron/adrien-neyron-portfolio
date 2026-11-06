<script setup lang="ts">
/**
 * Accueil « L'ascension » : boucle de scroll infinie (montre GPS → instruments → carte des projets
 * → flaque → bivouac → retour). Portage du prototype HTML (voir docs/ascension-boucle.md).
 *
 * - Le balisage (loop.html) est rendu côté serveur : tout le texte est dans le HTML (SEO, lecteurs
 *   d'écran, sans JavaScript). Le premier écran (titre, accroche, montre en SVG) s'affiche sans JavaScript.
 * - La 3D et les interactions (three.js + loop.js, ~250 Ko compressés et plusieurs secondes de calcul sur un
 *   téléphone moyen) ne démarrent qu'à la première interaction : souris, toucher, défilement, molette ou clavier.
 *   Premier affichage léger et immédiat (Lighthouse mobile) ; la classe `html.loop-live` marque le démarrage.
 * - Les styles (loop.css) visent html et body : toutes leurs règles sont donc cantonnées derrière la
 *   classe `html.loop-on`, posée ici au rendu serveur puis retirée au démontage. Ils sont intégrés au HTML
 *   (balise <style>, retirée en quittant la page) pour ne pas bloquer le premier affichage.
 *   Si loop.css est modifié : relancer scripts/scope-loop-css.cjs (voir docs/ascension-boucle.md).
 * - Le contenu éditable (projets, carnet, profil, contact) vient de /api/loop-content (admin) et remplace
 *   les textes par défaut de loop.js ; voir docs/admin-boucle.md.
 * - Three.js r128 est importé sous l'alias `three-r128` (le reste du site garde sa version de three).
 */
import markup from '~/assets/loop/loop.html?raw'
import loopCss from '~/assets/loop/loop.css?inline'
import { applyLoopContent, type LoopContentTexts } from '~/utils/loopMarkup'

/**
 * Textes du premier écran saisis dans /admin (profil : surtitre, titre, sous-texte) et liste des étapes de la trace
 * (avec liens vers les fiches). Insérés dans le HTML rendu côté serveur : ni clignotement au chargement, ni attente
 * de la 3D, et lisibles sans JavaScript.
 * Champ vide, API en panne ou plus de 2 s : le texte de loop.html est conservé.
 */
const { data: loopContent } = await useFetch<LoopContentTexts>('/api/loop-content', {
  key: 'loop-hero',
  timeout: 2000,
  // seulement ce que le HTML serveur utilise : le reste (fiches, carnet…) n'alourdit pas la charge utile de la page
  pick: ['hero', 'toolsHead', 'stages', 'profile'],
  default: () => null,
})
const page = computed(() => applyLoopContent(markup, loopContent.value))

// URL publique : sert aux balises Open Graph et au lien canonique
const SITE_URL = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
const SITE_TITLE = 'Adrien Neyron — développeur front-end · Vue 3, TypeScript, accessibilité'

useHead({
  htmlAttrs: { class: 'loop-on' },
  title: SITE_TITLE,
  meta: [
    {
      name: 'description',
      content:
        "Portfolio d'Adrien Neyron, développeur front-end (Vue 3, TypeScript, accessibilité RGAA/WCAG) : 12 ans de formation et de management, puis 5 ans de code. Une expédition à parcourir : projets, outils, carnet, contact.",
    },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'fr_FR' },
    { property: 'og:site_name', content: 'Adrien Neyron' },
    { property: 'og:title', content: SITE_TITLE },
    { property: 'og:description', content: "12 ans de formation et de management, puis 5 ans de code. Une expédition à parcourir : projets, outils, carnet, contact." },
    { property: 'og:url', content: `${SITE_URL}/` },
    { property: 'og:image', content: `${SITE_URL}/profile.png` },
    { property: 'og:image:alt', content: 'Adrien Neyron, développeur front-end' },
    { name: 'twitter:card', content: 'summary' },
  ],
  // Thème posé avant le premier affichage (pas de clignotement avant l'hydratation)
  script: [{ key: 'loop-theme', innerHTML: "try{var cm=localStorage.getItem('color-mode');var th=cm==='dark'||cm==='light'?cm:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=th}catch(e){}" }],
  // Styles de la boucle intégrés au HTML (environ 12 Ko compressés) : pas de feuille de style à attendre avant l'affichage
  style: [{ key: 'loop-css', textContent: loopCss }],
  // Police des titres (Cormorant Garamond, servie par le site) : préchargée, c'est elle qui dessine le titre du premier écran
  link: [
    { rel: 'canonical', href: `${SITE_URL}/` },
    { rel: 'preload', href: '/loop/fonts/cormorant-garamond-latin-500-italic.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
  ],
})

let loop: { destroy: () => void } | null = null
let gone = false
const WAKE = ['pointermove', 'pointerdown', 'touchstart', 'wheel', 'scroll', 'keydown'] as const

/** Contenu éditable de l'accueil (server/api/loop-content.get.ts) : jamais bloquant, {} si l'API échoue ou tarde (3 s). */
async function loadContent(): Promise<Record<string, unknown>> {
  try {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), 3000)
    const res = await fetch('/api/loop-content', { signal: ctl.signal, headers: { accept: 'application/json' } })
    clearTimeout(timer)
    return res.ok ? await res.json() : {}
  } catch {
    return {}
  }
}

/** Téléchargement et évaluation des modules (three.js, loop.js, chargeur 3D) et du contenu admin : sans rien démarrer. */
let prepared: Promise<[typeof import('three-r128'), typeof import('~/assets/loop/loop.js'), typeof import('~/assets/loop/GLTFLoader.r128.js'), Record<string, unknown>]> | null = null
function prepare() {
  return (prepared ??= Promise.all([
    import('three-r128'),
    import('~/assets/loop/loop.js'),
    // chargeur du modèle 3D de la chaussure (public/models/trail-shoe.glb)
    import('~/assets/loop/GLTFLoader.r128.js'),
    // contenu saisi dans l'admin (projets, carnet, profil, contact) ; en cas d'échec, la boucle garde ses textes par défaut
    loadContent(),
  ]))
}

/**
 * Appareil ou connexion qui ne supporteront pas l'intro 3D : économiseur de données, 2G / « slow-2g », ou 2 Go de
 * mémoire ou moins. La boucle démarre alors directement en vue statique (toutes les scènes, sans animation), sans
 * attendre la 3D ; le visiteur peut la réactiver dans les réglages. API absente (Safari, Firefox) : on ne présume rien.
 */
function isLiteDevice(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number }
  return !!nav.connection?.saveData || /^(slow-)?2g$/.test(nav.connection?.effectiveType ?? '') || (nav.deviceMemory !== undefined && nav.deviceMemory <= 2)
}

/** Démarre la boucle : la montre 3D remplace la boussole 2D et son aiguille se cale sur le nord. */
let started = false
async function start() {
  if (started) return
  started = true
  WAKE.forEach((t) => removeEventListener(t, onWake))
  const [THREE, { initLoop }, { GLTFLoader }, content] = await prepare()
  if (gone) return   // page quittée pendant le téléchargement
  document.documentElement.classList.add('loop-live')
  loop = initLoop(THREE, { GLTFLoader, content, lite: isLiteDevice() })
}

function onWake() {
  WAKE.forEach((t) => removeEventListener(t, onWake))
  void start()
}

onMounted(() => {
  document.documentElement.classList.add('loop-on')
  const woke = !!(window as { __loopWake?: number }).__loopWake   // geste avant le montage, noté par server/plugins/home-low-priority-js.ts
  // La boucle démarre d'elle-même peu après l'affichage, sans attendre de geste
  if (woke) return void start()
  WAKE.forEach((t) => addEventListener(t, onWake, { once: true, passive: true }))
  setTimeout(() => void start(), 1200)
})

// Jour / Nuit partagé avec les pages : un choix fait dans la boucle met à jour @nuxtjs/color-mode (même clé de stockage)
const colorMode = useColorMode()
const onTheme = (e: Event) => { const t = (e as CustomEvent<string>).detail; if (t === 'dark' || t === 'light') colorMode.preference = t }
onMounted(() => addEventListener('cordee-theme', onTheme))

onBeforeUnmount(() => {
  removeEventListener('cordee-theme', onTheme)
  gone = true
  WAKE.forEach((t) => removeEventListener(t, onWake))
  loop?.destroy()
  loop = null
  document.documentElement.classList.remove('loop-on', 'loop-live')
})
</script>

<template>
  <!-- Contenu statique : Vue ne le met pas à jour, le script de la boucle le pilote -->
  <div v-html="page" />
</template>
