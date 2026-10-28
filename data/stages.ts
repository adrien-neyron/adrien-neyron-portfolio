import type { Stage } from "~/utils/stages";

/**
 * Étapes de la trace (repli et import initial de /admin/stages) — dates et chiffres donnés par Adri (octobre 2026).
 * Remplacées par la collection `Stage` dès qu'elle contient des données. Un chiffre vide n'est jamais affiché.
 */
export const stages: Stage[] = [
  {
    key: "depart", order: 0, kind: "depart",
    period: "Sept. 2010 – Oct. 2021", title: "UCPA / Decathlon", place: "",
    summary: "Formateur BPJEPS, management d'équipes jusqu'à 25 personnes.",
    figure: "500+", figureLabel: "personnes formées", projects: [],
    // captures de pages publiques (27/10/2026), choisies sans visage reconnaissable ; les marques appartiennent à leurs propriétaires
    images: [
      { src: "/recentprojects/ucpa-cover.webp", title: "UCPA Formation" },
      { src: "/recentprojects/decathlon-cover.webp", title: "Decathlon" },
    ],
  },
  {
    key: "etape-01", order: 1, kind: "etape",
    period: "Oct. 2021 – Déc. 2023", title: "Développeur web freelance", place: "Haute-Savoie",
    summary: "Applications sur mesure pour des PME locales.",
    figure: "3", figureLabel: "missions pour des PME locales",
    projects: ["stockpulse", "Service-Gestion de paie", "hellostay"],
  },
  {
    key: "etape-02", order: 2, kind: "etape",
    period: "Déc. 2023 – Oct. 2025", title: "DGFiP, mission via BeTeam", place: "Paris",
    summary: "Refonte de l'outil de configuration des projets entrants.",
    figure: "−50 %", figureLabel: "de temps de traitement", projects: ["dgfip-outil-metier"],
  },
  {
    key: "bivouac", order: 3, kind: "bivouac",
    period: "Oct. 2025 – Mai 2026", title: "Projets personnels", place: "",
    summary: "Deux applications conçues et mises en ligne entre deux missions.",
    figure: "", figureLabel: "", projects: ["runfit-advisor", "coachflow"],
  },
  {
    key: "etape-03", order: 4, kind: "etape",
    period: "Mai – Oct. 2026", title: "Mission Tyredating / YepGarage", place: "Lyon",
    summary: "Accessibilité RGAA / WCAG d'une plateforme de sites pour garagistes.",
    figure: "30 → 52 %", figureLabel: "de conformité RGAA · 100+ sites corrigés",
    projects: ["click2sellsite-accessibilite"],
  },
  {
    key: "final", order: 5, kind: "final",
    period: "", title: "Étape à écrire ensemble", place: "",
    summary: "La suite du parcours reste à écrire : une mission, un projet, une cordée.",
    figure: "", figureLabel: "", projects: [],
  },
];
