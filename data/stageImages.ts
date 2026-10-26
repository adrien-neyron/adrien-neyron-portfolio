/**
 * Images de repli des aperçus du panneau d'étape de l'accueil (assets/loop/loop.js, `stageImgs`), par slug de projet.
 * Utilisées seulement quand le projet n'a ni capture ni photo d'ambiance (base /admin, puis data/projects.ts) : une image saisie
 * dans /admin passe toujours devant. Décoratives (alt vide) : le titre du projet est écrit sous l'image.
 */
export const stageImageFallback: Record<string, { src: string; credit: string }> = {
  // capture de la page d'accueil du site en ligne (26/10/2026)
  stockpulse: { src: '/recentprojects/stockpulse-cover.webp', credit: 'Capture de stockpulse-secours.fr' },
  // photo libre Unsplash (licence Unsplash, attribution non obligatoire), hotlinkée comme les photos d'ambiance : https://unsplash.com/photos/tLqtcDZltPs
  'Service-Gestion de paie': {
    src: 'https://images.unsplash.com/photo-1772588627373-729b0f47e5bb?auto=format&fit=crop&w=800&h=500&q=80',
    credit: 'Photo : Kelly Sikkema / Unsplash',
  },
}
