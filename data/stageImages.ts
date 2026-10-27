/**
 * Images de repli des aperçus du panneau d'étape de l'accueil (assets/loop/loop.js, `stageImgs`), par slug de projet (et, plus bas, par clé d'étape).
 * Utilisées seulement quand le projet n'a ni capture ni photo d'ambiance (base /admin, puis data/projects.ts) : une image saisie
 * dans /admin passe toujours devant. Décoratives (alt vide) : le titre du projet est écrit sous l'image.
 */
export const stageImageFallback: Record<string, { src: string; credit: string }> = {
  // capture de la page d'accueil du site en ligne (26/10/2026)
  stockpulse: { src: '/recentprojects/stockpulse-cover.webp', credit: 'Capture de stockpulse-secours.fr' },
  // capture de la page d'accueil du site en ligne (27/10/2026)
  'Service-Gestion de paie': { src: '/recentprojects/cpluspaie-cover.webp', credit: 'Capture de cpluspaie.vercel.app' },
}

/**
 * Images d'une étape elle-même, par clé d'étape (`Stage.key`) : pour les étapes sans fiche projet (le Départ : UCPA / Decathlon).
 * Elles passent après celles des projets liés, dans la limite de 3 aperçus. Captures de pages publiques (27/10/2026), choisies sans
 * visage reconnaissable ; les marques appartiennent à leurs propriétaires et ne servent qu'à illustrer le parcours.
 */
export const stageImageByStage: Record<string, { src: string; title: string; credit: string }[]> = {
  depart: [
    { src: '/recentprojects/ucpa-cover.webp', title: 'UCPA Formation', credit: 'Capture de ucpa.com/formations' },
    { src: '/recentprojects/decathlon-cover.webp', title: 'Decathlon', credit: 'Capture de decathlon.fr (magasin de Villebon-sur-Yvette)' },
  ],
}
