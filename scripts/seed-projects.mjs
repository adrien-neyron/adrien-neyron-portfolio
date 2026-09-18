/**
 * Seed MongoDB avec les projets statiques du portfolio.
 * Usage : node --env-file=.env scripts/seed-projects.mjs
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌  MONGODB_URI manquant dans .env");
  process.exit(1);
}

const ProjectSchema = new mongoose.Schema(
  {
    slug:         { type: String, required: true, unique: true },
    title:        { type: String, required: true },
    tagline:      String,
    role:         { type: String, default: "" },
    description:  { type: String, default: "" },
    challenge:    String,
    solution:     String,
    result:       String,
    technologies: { type: [String], default: [] },
    image:        { light: String, dark: String },
    link:         String,
    code:         String,
    difficulty:   String,
    duration:     String,
    category:     String,
    status:       String,
    impact:       String,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Project =
  mongoose.models.Project || mongoose.model("Project", ProjectSchema);

const projects = [
  {
    slug: "click2sellsite-accessibilite",
    title: "Click2SellSite — Sprint Accessibilité",
    tagline: "Remédiation RGAA/WCAG 2.1 AA à grande échelle sur un SaaS Vue 3 multi-marques",
    role: "Développeur Front-End (mission ESN — Amiltone)",
    description:
      "Sprint d'accessibilité mené sur Click2SellSite (YepGarage), plateforme SaaS Vue 3 qui permet à des garages du monde entier de créer leur site de vente et d'installation de pneus. Remédiation RGAA/WCAG 2.1 AA sur des dizaines de composants existants : navigation clavier, accordéons, onglets, carrousel, formulaires multi-étapes, localisateur de garages, modales et annonceur ARIA global.",
    challenge:
      "Rendre conforme RGAA/WCAG 2.1 AA une plateforme SaaS déjà en production, construite sur des dizaines de composants Vue 3 existants (carrousel Hooper, modales, tabs, formulaires) non pensés pour l'accessibilité — sans casser le design ni les fonctionnalités en place, sur un périmètre multi-langues (7 langues).",
    solution:
      "Audit puis remédiation composant par composant : refonte de la navigation clavier (pattern ARIA tablist, roving tabindex), résolution des conflits de cache v-show sur les accordéons, remplacement des <a>/<div> cliquables par des <button> sémantiques, attribut inert sur les panneaux latéraux, création d'un annonceur ARIA live global en singleton (useA11yAnnouncer), correction d'un bug de rôles ARIA implicites HTML5 sur les balises <section>/<header>/<footer>, centralisation de la logique de labels dans a11y.util.ts. Mise en place d'un garde-fou CI : eslint-plugin-vuejs-accessibility + hook Husky pre-commit, suites de tests Vitest dédiées (.a11y.spec.ts), et validation manuelle au lecteur d'écran Orca sous Linux avec cross-check Chrome/Firefox.",
    result:
      "Remédiation livrée sur la navbar, les accordéons, les onglets, les modales, le breadcrumb, le carrousel, le localisateur de garages et les formulaires. Gate CI automatisé pour prévenir les régressions d'accessibilité, traductions a11y déployées sur 7 langues, et documentation des conventions pour l'équipe.",
    technologies: ["Vue 3", "TypeScript", "RGAA / WCAG 2.1 AA", "Vitest", "ESLint (vuejs-accessibility)", "Husky", "Hooper", "i18n"],
    image: { light: "/projectsoon.png", dark: "/projectsoon.png" },
    difficulty: "Expert",
    duration: "Depuis mai 2026 (en cours)",
    category: "E-commerce",
    status: "Case study pro",
    impact: "RGAA/WCAG 2.1 AA · gate CI a11y · tests Orca · 7 langues",
  },
  {
    slug: "coachflow",
    title: "CoachFlow",
    tagline: "Plateforme LMS gamifiée · 6 phases · 82 leçons · certification",
    role: "Développeur Full-Stack",
    description:
      "Plateforme de formation en ligne complète pour coachs sportifs. Parcours structuré en 6 phases et 82 leçons, système de gamification (XP, niveaux, badges, streak), dashboard apprenant, communauté, certification LinkedIn-ready et panel d'administration. Stack React 18 + Supabase déployée sur Vercel.",
    challenge:
      "Concevoir une expérience d'apprentissage engageante qui transforme un coach débutant en professionnel certifié, tout en maintenant la motivation sur un parcours de 14 semaines.",
    solution:
      "Architecture LMS complète avec React 18 + TypeScript + Vite. Backend Supabase (auth + BDD). Gamification progressive : XP, 5 niveaux, badges, défis hebdomadaires, classement. Leçons multi-formats (vidéo, PDF, quiz, projets réels). Certification partageable sur LinkedIn. Panel admin pour la gestion du contenu.",
    result:
      "Plateforme déployée et fonctionnelle. Parcours complet de 82 leçons sur 14 semaines. Système de gamification opérationnel. Interface admin pour la gestion des présentations.",
    technologies: ["React 18", "TypeScript", "Vite", "Supabase", "shadcn/ui", "Framer Motion", "React Query", "Tailwind CSS"],
    image: { light: "/recentprojects/coachflow-hero.png", dark: "/recentprojects/coachflow-hero.png" },
    link: "https://with-coachflow.vercel.app/",
    code: "https://github.com/adrien-neyron/CoachFlow",
    difficulty: "Expert",
    duration: "3 semaines",
    category: "LMS",
    status: "En production",
    impact: "82 leçons · gamification complète · certification LinkedIn",
  },
  {
    slug: "runfit-advisor",
    title: "RunFit Advisor",
    tagline: "Recommandation de chaussures running par algo de scoring",
    role: "Développeur Full-Stack",
    description:
      "Application web de recommandation personnalisée de chaussures de running et trail. Questionnaire morphologique et sportif, algo de scoring, interface swipe, authentification, liens d'affiliation multi-réseaux — déployée et en production.",
    challenge:
      "Les coureurs peinent à choisir une chaussure adaptée parmi des centaines de modèles. Les comparateurs existants manquent de personnalisation morphologique.",
    solution:
      "Moteur de recommandation basé sur profil complet (morphologie, niveau, terrain, distance). Auth Supabase. Interface swipe pour affiner les préférences. Synchronisation automatique du catalogue via cron jobs. Liens affiliés Awin, CJ, Amazon.",
    result: "Application déployée et opérationnelle. Catalogue synchronisé automatiquement. Liens affiliés actifs.",
    technologies: ["Nuxt 3", "Vue 3", "TypeScript", "Supabase", "PostgreSQL", "Prisma", "Tailwind CSS", "Nitro"],
    image: { light: "/recentprojects/runfit-hero.webp", dark: "/recentprojects/runfit-hero.webp" },
    link: "https://runfit-advisor.vercel.app/",
    difficulty: "Expert",
    duration: "2 mois",
    category: "IA",
    status: "En production",
    impact: "En production — algo de scoring + auth + affiliation",
  },
  {
    slug: "job-search-automator",
    title: "Job Search Automator",
    tagline: "Pipeline d'automatisation de recherche d'emploi avec IA",
    role: "Développeur & Architecte automation",
    description:
      "Pipeline complet de recherche d'emploi automatisée : scraping Playwright des offres, enrichissement Claude API (scoring, extraction de critères), génération de lettres de motivation personnalisées, dashboard React pour review humaine, synchronisation Airtable.",
    challenge:
      "La recherche d'emploi manuelle est chronophage : veille quotidienne, tri des offres, rédaction de candidatures adaptées. Automatiser sans perdre la pertinence ni le contrôle humain.",
    solution:
      "Architecture Make.com pour l'orchestration du pipeline. Playwright pour le scraping des plateformes d'offres. Claude API pour le scoring de pertinence et la génération de lettres contextualisées. Dashboard React avec validation human-in-the-loop avant envoi. Airtable comme base de données de suivi.",
    result:
      "Pipeline opérationnel. Réduction du temps de candidature de 80%. Human-in-the-loop préserve la qualité des candidatures.",
    technologies: ["Make.com", "Claude API", "Playwright", "React", "Airtable", "Node.js", "TypeScript"],
    image: { light: "/projectsoon.png", dark: "/projectsoon.png" },
    difficulty: "Expert",
    duration: "3 semaines",
    category: "Automatisation",
    status: "En cours",
    impact: "-80% temps de candidature · human-in-the-loop",
  },
  {
    slug: "dgfip-outil-metier",
    title: "Outil Métier DGFiP",
    tagline: "Interface SI Vue.js 3 · -50% temps de traitement",
    role: "Développeur Full-Stack (mission de 2 ans)",
    description:
      "Application métier interne déployée à la Direction Générale des Finances Publiques. Interface Vue.js 3 avec backend FastAPI, CI/CD GitLab, intégrée dans le SI existant. Résultat : -50% sur le temps de traitement des processus ciblés.",
    challenge:
      "Des agents traitaient manuellement des processus répétitifs et chronophages de configurations techniques avec des outils vieillissants afin d'intégrer de nouveaux projets. L'enjeu : moderniser sans déstabiliser le SI en place, sur un périmètre réglementé.",
    solution:
      "Développement d'une interface Vue.js 3 avec Vuex, connectée à l'API REST Gitlab ainsi qu'à une API créée avec FastAPI Python. Pipeline CI/CD GitLab pour les déploiements. Tests unitaires et d'intégration. Conception UX centrée sur les cas d'usage agents.",
    result:
      "Réduction de 50% du temps de traitement sur les processus ciblés. Application en production depuis 2 ans.",
    technologies: ["Vue.js 3", "TypeScript", "Vuex", "FastAPI", "Python", "GitLab CI/CD", "PostgreSQL"],
    image: { light: "/recentprojects/dgfip-hero.png", dark: "/recentprojects/dgfip-hero.png" },
    difficulty: "Expert",
    duration: "2 ans",
    category: "SI",
    status: "Case study pro",
    impact: "-50% temps de traitement · SI public · 2 ans en prod",
  },
];

await mongoose.connect(uri);
console.log("✅  Connecté à MongoDB");

let inserted = 0;
let skipped  = 0;

for (const p of projects) {
  const exists = await Project.findOne({ slug: p.slug });
  if (exists) {
    console.log(`⏭️   Ignoré (déjà présent) : ${p.slug}`);
    skipped++;
  } else {
    await Project.create(p);
    console.log(`➕  Inséré : ${p.slug}`);
    inserted++;
  }
}

console.log(`\n✅  Terminé — ${inserted} inséré(s), ${skipped} ignoré(s)`);
await mongoose.disconnect();
