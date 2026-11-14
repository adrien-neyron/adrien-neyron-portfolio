/**
 * Textes par défaut de l'accueil modifiables dans /admin › Profil, copie de ceux de assets/loop/loop.html.
 * Le formulaire les affiche quand le champ est vide : on modifie le texte en ligne au lieu de partir d'une case vide.
 * tests/unit/loopTexts.test.ts échoue si les deux divergent.
 */
export const LOOP_TEXT_DEFAULTS = {
  loopEyebrow: "Adrien Neyron · Développeur front-end Vue 3 · Accessibilité RGAA",
  loopTitle: "Trouver le cap. Concevoir le chemin.",
  loopLede: "Je conçois des expériences numériques où design, ingénierie et accessibilité avancent dans la même direction.",
  loopToolsEyebrow: "S'équiper · Outils développés",
  loopToolsTitle: "Des outils construits pour le terrain",
  loopToolsLede: "Architecte de données et de l'interface, je donne vie à des applications web Vue et TypeScript accessibles, propulsées par des classes Java robustes et administrables en temps réel.",
};
