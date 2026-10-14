<script setup lang="ts">
/**
 * Transition d'intro « craquelure et chute » (docs/intro-craquelure.md).
 *
 * `play(gate, { isReady, maxWait })` : capture l'écran d'intro, l'affiche à l'identique dans un canvas WebGL
 * transparent, attend que la scène en dessous soit prête (au plus `maxWait` ms), puis le fait craqueler et tomber
 * en éclats (timeline GSAP, easing power3.inOut) pour révéler la scène. Renvoie `false` SANS avoir touché au DOM
 * si la transition n'est pas possible (mouvement réduit, pas de WebGL, erreur) : l'appelant retombe alors sur
 * son fondu CSS. Tout est libéré à la fin (canvas retiré du DOM, contexte WebGL perdu, écouteurs retirés).
 *
 * Le DOM de l'intro reste la version accessible : le canvas est `aria-hidden`, sans interaction.
 */
import { nextTick, onBeforeUnmount, ref } from 'vue'

/** Durée de la transition, en secondes (réglage unique). */
const DURATION = 4.6
const active = ref(false)
const canvasEl = ref<HTMLCanvasElement | null>(null)

type Mods = { gsap: typeof import('gsap')['gsap']; shatter: typeof import('~/utils/introShatter'); snap: typeof import('~/utils/introSnapshot') }
let mods: Promise<Mods> | null = null
/** Charge GSAP et le moteur d'éclats à la demande (hors du chemin critique) ; appelable à l'avance pour les précharger. */
function prepare(): Promise<Mods> {
  return (mods ??= Promise.all([import('gsap'), import('~/utils/introShatter'), import('~/utils/introSnapshot')]).then(([g, shatter, snap]) => ({ gsap: g.gsap, shatter, snap })))
}

const isDarkMode = () => {
  const t = document.documentElement.dataset.theme
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
}

/** Lit un jeton de la charte (variable CSS) et le convertit en [r, g, b] 0 → 1, quel que soit son format (#hex, rgb(), color-mix…). */
function tokenRgb(name: string, fallback: [number, number, number]): [number, number, number] {
  const probe = document.createElement('canvas').getContext('2d')
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!probe || !raw) return fallback
  probe.fillStyle = '#000'
  probe.fillStyle = raw
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

let renderer: { dispose: () => void } | null = null
let timeline: { kill: () => void } | null = null
let onResize: (() => void) | null = null
let restoreLag: (() => void) | null = null
let stopHard: (() => void) | null = null

function cleanup() {
  timeline?.kill()
  timeline = null
  stopHard?.()
  stopHard = null
  restoreLag?.()
  restoreLag = null
  if (onResize) removeEventListener('resize', onResize)
  onResize = null
  renderer?.dispose()
  renderer = null
  active.value = false // v-if : le canvas quitte le DOM
}

async function play(gate: HTMLElement, opts: { isReady: () => boolean; maxWait: number }): Promise<boolean> {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    const { gsap, shatter, snap } = await prepare()
    const dpr = Math.min(devicePixelRatio || 1, 1.5)
    const image = await snap.snapshotGate(gate, dpr)

    active.value = true
    await nextTick()
    const canvas = canvasEl.value
    if (!canvas) throw new Error('canvas absent')
    canvas.width = image.width
    canvas.height = image.height
    const r = new shatter.ShatterRenderer(canvas, image, { mode: isDarkMode() ? 1 : 0, brand: tokenRgb('--brand', [0.15, 0.27, 0.36]), accent: tokenRgb('--acc', [0.89, 0.43, 0.23]) })
    renderer = r
    r.render(0)

    // L'image du canvas est identique au DOM : on masque le DOM (visuel ET lecteurs d'écran) sans à-coup.
    gate.style.visibility = 'hidden'
    gate.setAttribute('aria-hidden', 'true')

    // On attend que la scène soit prête derrière : la transition ne doit pas révéler un écran vide.
    const t0 = Date.now()
    while (!opts.isReady() && Date.now() - t0 < opts.maxWait) await new Promise((res) => setTimeout(res, 100))

    // L'accueil large place la montre à droite (texte à gauche) : la fissure part de la montre, pas du centre de l'écran.
    r.setEpicenter(document.documentElement.classList.contains('hero-split') ? (canvas.width / canvas.height) * 0.4 : 0, 0.06)
    const state = { p: 0 }
    // GSAP « lissage de lag » ralentit l'animation quand une image dure > 500 ms (GPU faible) : on veut au contraire
    // que la durée reste celle de l'horloge, quitte à sauter des images, pour ne jamais retenir le visiteur.
    gsap.ticker.lagSmoothing(0)
    restoreLag = () => gsap.ticker.lagSmoothing(500, 33)
    await new Promise<void>((resolve) => {
      const hardStop = setTimeout(resolve, DURATION * 1000 + 1500) // filet : fin garantie quoi qu'il arrive
      stopHard = () => clearTimeout(hardStop)
      timeline = gsap.timeline({ onComplete: resolve })
      // power3.inOut : démarrage lent (les fissures courent), accélération franche, retombée douce des éclats
      timeline.to(state, { p: 1, duration: DURATION, ease: 'power3.inOut', onUpdate: () => r.render(state.p) })
      // perte de contexte GPU en cours de route : on termine tout de suite, la scène est déjà là
      const watchdog = setInterval(() => { if (r.contextLost) { clearInterval(watchdog); resolve() } }, 200)
      timeline.eventCallback('onComplete', () => { clearInterval(watchdog); resolve() })
    })
    cleanup()
    return true
  } catch {
    cleanup()
    // Si l'échec survient après le masquage du DOM, on le rend pour que le fondu CSS de l'appelant ait quelque chose à fondre.
    gate.style.visibility = ''
    gate.removeAttribute('aria-hidden')
    return false
  }
}

onBeforeUnmount(cleanup)
defineExpose({ play, prepare })
</script>

<template>
  <Teleport v-if="active" to="body">
    <canvas ref="canvasEl" class="intro-shatter" aria-hidden="true" />
  </Teleport>
</template>

<style>
.intro-shatter {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 401; /* au-dessus de l'écran d'intro (#gate, 400) */
  pointer-events: none;
}
</style>
