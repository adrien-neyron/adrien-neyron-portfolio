export interface ProjectData {
  id: string;
  title: string;
  tagline: string;
  role: string;
  description: string;
  challenge: string;
  solution: string;
  result: string;
  technologies: string[];
  image: { light?: string; dark?: string };
  link?: string;
  code?: string;
  difficulty: "Débutant" | "Intermédiaire" | "Expert";
  duration: string;
  category: "E-commerce" | "Outil métier" | "LMS" | "IA";
}

export const projects: ProjectData[] = [
  {
    id: "runfit-advisor",
    title: "RunFit Advisor",
    tagline: "Conseiller de sentier — recommandation de chaussures par IA",
    role: "Développeur Full-Stack",
    description:
      "Application web de recommandation personnalisée de chaussures de running et trail. Un questionnaire morphologique et sportif intelligent oriente chaque coureur vers la paire idéale, avec des liens d'affiliation multi-réseaux intégrés.",
    challenge:
      "Les coureurs peinent à choisir une chaussure adaptée parmi des centaines de modèles. Les comparateurs existants manquent de personnalisation morphologique et ne tiennent pas compte des habitudes d'entraînement ni du type de terrain.",
    solution:
      "Développement d'un moteur de recommandation basé sur un profil complet (morphologie, niveau, terrain, distance). Synchronisation automatique des catalogues produits via feeds d'affiliation (Awin, CJ, Amazon). Interface filtrée par sport, marque, prix et disponibilité.",
    result:
      "Application déployée et opérationnelle. Catalogue synchronisé automatiquement via cron jobs. Liens affiliés actifs générant des revenus passifs dès la mise en ligne.",
    technologies: ["Nuxt 3", "Vue 3", "TypeScript", "PostgreSQL", "Prisma", "Tailwind CSS", "Nitro"],
    image: {
      light: "/recentprojects/runfit-hero.webp",
      dark: "/recentprojects/runfit-hero.webp",
    },
    link: "https://runfit-advisor.vercel.app/",
    difficulty: "Expert",
    duration: "2 mois",
    category: "IA",
  },
  {
    id: "boutique-trail-running",
    title: "Boutique Trail Running",
    tagline: "Sentier commercial — e-commerce sur mesure pour le running",
    role: "Développeur Full-Stack",
    description:
      "Plateforme e-commerce complète pour une boutique spécialisée trail running : catalogue, tunnel de conversion optimisé, paiement Stripe et espace client.",
    challenge:
      "La boutique utilisait une solution généraliste qui ne correspondait pas aux spécificités d'une boutique outdoor (guides de taille techniques, filtres par terrain, recommandations par niveau). Les taux de conversion étaient faibles et l'expérience mobile décevante.",
    solution:
      "Développement d'une plateforme Nuxt 3 avec un catalogue produit typé, des filtres avancés (terrain, distance, drop), une fiche produit immersive et un tunnel de paiement en 3 étapes via Stripe. Interface mobile-first avec transitions fluides.",
    result:
      "Réduction du temps de chargement de 60%. Augmentation du taux de conversion de 35% en 3 mois. 98% de score Lighthouse mobile.",
    technologies: ["Nuxt 3", "Vue.js", "TypeScript", "Stripe", "Node.js", "PostgreSQL", "Tailwind CSS"],
    image: { light: "/projectsoon.png", dark: "/projectsoon.png" },
    difficulty: "Expert",
    duration: "4 mois",
    category: "E-commerce",
  },
  {
    id: "interface-metier-sport",
    title: "Interface Métier Sport",
    tagline: "Col de gestion — dashboard pour club sportif",
    role: "Développeur Frontend & Intégrateur",
    description:
      "Dashboard interne permettant à une organisation sportive de gérer ses adhérents, plannings, événements et finances depuis une interface unifiée.",
    challenge:
      "L'équipe jonglait entre 4 outils différents (Excel, Google Sheets, une app de réservation et un CRM basique). La perte d'information et les doublons de saisie coûtaient plusieurs heures par semaine.",
    solution:
      "Conception d'une interface métier Vue.js avec des modules dédiés : gestion des membres (filtres, statuts, historique), calendrier des événements, tableau de bord financier avec visualisations Chart.js, et automatisation de relances email via Make.",
    result:
      "Gain de 8h/semaine sur les tâches administratives. Réduction des erreurs de saisie de 90%. ROI positif dès le 2e mois.",
    technologies: ["Vue.js", "TypeScript", "Pinia", "Chart.js", "Express.js", "MongoDB", "Make"],
    image: { light: "/projectsoon.png", dark: "/projectsoon.png" },
    difficulty: "Intermédiaire",
    duration: "3 mois",
    category: "Outil métier",
  },
  {
    id: "lms-sport-formation",
    title: "LMS Sport & Formation",
    tagline: "Sommet pédagogique — plateforme de cours en ligne",
    role: "Développeur Full-Stack & Concepteur pédagogique",
    description:
      "Plateforme LMS complète pour organiser et diffuser des formations dans le secteur sport et tourisme : modules vidéo, quiz, suivi de progression et certification.",
    challenge:
      "Les formateurs utilisaient des outils généralistes (Moodle, Google Classroom) peu adaptés aux formations terrain — pas de gestion de sorties, de suivi GPS ou de certification BPJEPS. L'expérience apprenante était décevante sur mobile.",
    solution:
      "Développement d'un LMS sur mesure Nuxt 3 avec : système de modules pédagogiques, lecture vidéo optimisée, quiz interactifs avec correction automatique, tableau de bord apprenant (progression, badges, certificats) et espace formateur pour créer et modifier les parcours.",
    result:
      "Taux de complétion des formations passé de 40% à 78%. Satisfaction apprenants 4.7/5. Réduction du temps de création de cours de 50% pour les formateurs.",
    technologies: ["Nuxt 3", "Vue.js", "TypeScript", "Pinia", "Node.js", "PostgreSQL", "EmailJS", "TresJS"],
    image: { light: "/projectsoon.png", dark: "/projectsoon.png" },
    difficulty: "Expert",
    duration: "5 mois",
    category: "LMS",
  },
];
