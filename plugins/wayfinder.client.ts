import { initWayfinder } from '~/utils/wayfinder'

/** WAYFINDER (viseur + trace de navigation clavier) sur tout le site, accueil compris. Voir docs/wayfinder.md. */
export default defineNuxtPlugin(() => {
  initWayfinder()
})
