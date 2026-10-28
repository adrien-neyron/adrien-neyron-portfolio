/**
 * Images de repli des aperçus du panneau d'étape de l'accueil (assets/loop/loop.js, `stageImgs`), par slug de projet.
 * Utilisées seulement quand le projet n'a ni capture ni photo d'ambiance (base /admin, puis data/projects.ts) : une image saisie
 * dans /admin passe toujours devant. Décoratives (alt vide) : le titre du projet est écrit sous l'image.
 */
export const stageImageFallback: Record<string, { src: string; credit: string }> = {
  // capture de la page d'accueil du site en ligne (26/10/2026)
  stockpulse: { src: '/recentprojects/stockpulse-cover.webp', credit: 'Capture de stockpulse-secours.fr' },
  // capture de la page d'accueil du site en ligne (27/10/2026)
  'Service-Gestion de paie': { src: '/recentprojects/cpluspaie-cover.webp', credit: 'Capture de cpluspaie.vercel.app' },
}
