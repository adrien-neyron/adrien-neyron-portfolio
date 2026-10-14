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
 * Textes du premier écran saisis dans /admin (profil : surtitre, titre, sous-texte). Insérés dans le HTML rendu
 * côté serveur : ni clignotement au chargement, ni attente de la 3D, et lisibles sans JavaScript.
 * Champ vide, API en panne ou plus de 2 s : le texte de loop.html est conservé.
 */
const { data: loopContent } = await useFetch<LoopContentTexts>('/api/loop-content', {
  key: 'loop-hero',
  timeout: 2000,
  default: () => null,
})
const page = computed(() => applyLoopContent(markup, loopContent.value))

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
  // Écran de la corde déjà vu dans cette session : masqué dès le premier affichage (pas de clignotement avant l'hydratation)
  script: [{ key: 'gate-seen', innerHTML: "try{var th=localStorage.getItem('asc-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=th}catch(e){}try{if(sessionStorage.getItem('cordee-gate-vu')==='1')document.documentElement.classList.add('gate-seen')}catch(e){}" }],
  // Styles de la boucle intégrés au HTML (environ 12 Ko compressés) : pas de feuille de style à attendre avant l'affichage
  style: [{ key: 'loop-css', textContent: loopCss }],
  // Police des titres (Cormorant Garamond, servie par le site) : préchargée, c'est elle qui dessine le titre du premier écran
  link: [
    { rel: 'preload', href: '/loop/fonts/cormorant-garamond-latin-500-italic.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
  ],
})

const intro = ref<{ play: (g: HTMLElement, o: { isReady: () => boolean; maxWait: number }) => Promise<boolean>; prepare: () => Promise<unknown> } | null>(null)
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
  void intro.value?.prepare().catch(() => {})   // GSAP et le moteur d'éclats, pour que la transition démarre sans attente
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

/** Démarre la boucle : la montre 3D remplace la boussole 2D et son chargement (altitude, calage du nord) se joue à l'écran. */
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

/** Tant que l'écran de la corde est ouvert, un geste ne fait que préparer les modules ; sinon il démarre la boucle. */
let gateOpen = false
function onWake() {
  WAKE.forEach((t) => removeEventListener(t, onWake))
  if (gateOpen) void prepare()
  else void start()
}

/**
 * Écran d'accueil « corde en C » (#gate, voir docs/ecran-accueil-corde.md) : affiché une fois par session,
 * avant la montre. Le bouton « Commencer l'ascension » ouvre l'écran (fondu CSS, ignoré si mouvement réduit),
 * puis révèle l'accueil. Pendant l'écran : le reste de la page est inerte (clavier, lecteurs d'écran) et le
 * défilement est bloqué. Sans JavaScript, l'écran est masqué par le <noscript> du balisage.
 */
const GATE_KEY = 'cordee-gate-vu'
function setupGate(): boolean {
  const gate = document.getElementById('gate')
  if (!gate) return false
  const root = document.documentElement
  const others = Array.from(gate.parentElement?.children ?? []).filter((el) => el !== gate) as HTMLElement[]
  const seen = () => { try { return sessionStorage.getItem(GATE_KEY) === '1' } catch { return false } }
  const close = () => {
    gate.hidden = true
    root.classList.remove('gate-on', 'gate-waiting')
    others.forEach((el) => el.removeAttribute('inert'))
    try { sessionStorage.setItem(GATE_KEY, '1') } catch { /* stockage indisponible : l'écran reviendra au prochain chargement */ }
    document.getElementById('main')?.focus({ preventScroll: true })
  }
  // déjà vu : classe aussi posée ici (retour sur l'accueil sans rechargement), elle autorise l'aiguille du préchargement
  if (seen()) { gate.hidden = true; root.classList.add('gate-seen'); return false }
  root.classList.add('gate-on')
  others.forEach((el) => el.setAttribute('inert', ''))
  const skipBtn = document.getElementById('gateSkip') as HTMLButtonElement | null
  skipBtn?.focus({ preventScroll: true })
  // Ouverture : au clic (accélérateur) ou toute seule (voir plus bas). `maxWait` = délai maximal avant de refermer l'écran
  // si la montre 3D n'est pas prête une fois le nœud défait.
  let opening = false
  const untie = async (maxWait = 4000) => {
    if (opening) return
    opening = true
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const live = document.getElementById('live')
    if (live) live.textContent = "L'ascension commence."
    gateOpen = false
    // La boucle démarre tout de suite : sous l'écran, la montre 3D se met en place et son chargement (altitude, calage du nord) se joue à l'écran.
    void start()
    // 1) Transition en éclats (IntroTransition.vue) : l'écran se fissure et tombe quand la montre est prête (maxWait au plus).
    //    `false` = impossible (mouvement réduit, pas de WebGL, erreur) et le DOM n'a pas été touché : on retombe sur le fondu.
    const shattered = await intro.value?.play(gate, { isReady: () => root.classList.contains('loop-live'), maxWait }).catch(() => false)
    if (shattered) return close()
    // 2) Repli : la corde se dénoue (CSS), puis fondu, quand la montre 3D est en place (maxWait au plus).
    if (!reduce) gate.classList.add('gate-untie')
    const t0 = Date.now()
    let leaving = false
    const poll = () => {
      const ready = root.classList.contains('loop-live')
      const animDone = reduce || Date.now() - t0 > 1100
      if (animDone && !ready) root.classList.add('gate-waiting')   // montre pas encore prête : logo et aiguille qui tournent
      if (((ready && animDone) || Date.now() - t0 > maxWait) && !leaving) {
        leaving = true
        if (reduce) return close()
        gate.classList.add('gate-out')
        return void setTimeout(close, 700)
      }
      if (!leaving) setTimeout(poll, 100)
    }
    poll()
  }
  // Plus de bouton central : un clic n'importe où sur l'écran (sauf « Passer l'intro ») ouvre tout de suite.
  gate.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('#gateSkip')) untie() })
  // « Passer l'intro » : on ferme l'écran tout de suite, sans attendre la 3D, et on passe en vue statique (mémorisée)
  document.getElementById('gateSkip')?.addEventListener('click', () => {
    if (opening) return
    opening = true
    try { localStorage.setItem('asc-static', '1') } catch { /* stockage indisponible : la vue statique s'applique pour cette visite seulement */ }
    const live = document.getElementById('live')
    if (live) live.textContent = 'Intro passée : le contenu est affiché directement.'
    gateOpen = false
    void start()
    close()
  })
  // Ouverture automatique : aucun clic n'est exigé. La 3D se charge dès 1,5 s ; l'écran s'ouvre seul dès qu'elle est
  // prête (logo visible au moins 1,8 s), au plus tard 4,5 s après l'affichage, quelle que soit la connexion.
  const tShown = Date.now()
  let loading = false
  const auto = () => {
    if (opening) return
    const elapsed = Date.now() - tShown
    if (!loading && elapsed > 1500) { loading = true; gateOpen = false; void start() }
    if ((root.classList.contains('loop-live') && elapsed > 1800) || elapsed > 4500) return untie(1500)
    setTimeout(auto, 150)
  }
  setTimeout(auto, 150)
  return true
}

onMounted(() => {
  document.documentElement.classList.add('loop-on')
  gateOpen = setupGate()
  const woke = !!(window as { __loopWake?: number }).__loopWake   // geste avant le montage, noté par server/plugins/home-low-priority-js.ts
  if (gateOpen) {
    // Écran de la corde : modules préchargés dès le premier affichage terminé, pour que la montre apparaisse sans attente au clic
    setTimeout(() => void prepare(), woke ? 0 : 1500)
    WAKE.forEach((t) => addEventListener(t, onWake, { once: true, passive: true }))
    return
  }
  // Pas d'écran de la corde (déjà vu) : la boucle démarre d'elle-même peu après l'affichage, sans attendre de geste
  if (woke) return void start()
  WAKE.forEach((t) => addEventListener(t, onWake, { once: true, passive: true }))
  setTimeout(() => void start(), 1200)
})

onBeforeUnmount(() => {
  gone = true
  WAKE.forEach((t) => removeEventListener(t, onWake))
  loop?.destroy()
  loop = null
  document.documentElement.classList.remove('loop-on', 'loop-live', 'gate-on', 'gate-seen', 'gate-waiting')
})
</script>

<template>
  <!-- Contenu statique : Vue ne le met pas à jour, le script de la boucle le pilote -->
  <div v-html="page" />
  <!-- Transition d'ouverture en éclats (canvas WebGL téléporté dans <body>, absent du DOM hors transition) -->
  <LoopIntroTransition ref="intro" />
</template>
