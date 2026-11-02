import type { Milestone, ProjectStat } from "~/utils/trail";

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
  cover?: string;         // photo d'ambiance (cartes + en-tête de fiche)
  coverCredit?: string;
  coverCreditUrl?: string;
  link?: string;
  code?: string;
  difficulty: "Apprentissage" | "Side Project" | "Professionnel";
  duration: string;
  category: "Mobile" | "E-commerce" | "Outil métier" | "LMS" | "IA" | "Automatisation" | "SI";
  status: "En production" | "En cours" | "Case study pro";
  impact?: string;
  // fiche topo (refonte « L'ascension ») — optionnels
  place?: string;
  coords?: { lat: number; lon: number };
  startDate?: string;
  profile?: number[];
  milestones?: Milestone[];
  stats?: ProjectStat[];
}

export const projects: ProjectData[] = [
  {
    id: "click2sellsite-accessibilite",
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
    // Illustration : Euromaster.ro (site Click2SellSite) + score Lighthouse accessibilité 100
    cover: "/recentprojects/tyredating-cover.webp",
    coverCredit: "Capture d'Euromaster.ro (Click2SellSite)",
    coverCreditUrl: "https://www.euromaster.ro/",
    image: {
      light: "/projectsoon.png",
      dark: "/projectsoon.png",
    },
    difficulty: "Professionnel",
    duration: "Depuis mai 2026 (en cours)",
    category: "E-commerce",
    status: "Case study pro",
    impact: "RGAA/WCAG 2.1 AA · gate CI a11y · tests Orca · 7 langues",
    place: "Lyon",
    coords: { lat: 45.764, lon: 4.836 },
    startDate: "Mai 2026",
    profile: [18, 22, 30, 28, 42, 55, 50, 68, 76, 72, 84, 80, 88],
    milestones: [
      { label: "Départ", detail: "Base Vue 3 fraîchement migrée" },
      { label: "Audit", detail: "Composant par composant" },
      { label: "Remédiation", detail: "Clavier, ARIA, sémantique" },
      { label: "Garde-fous", detail: "Lint a11y, tests, Orca" },
    ],
    stats: [
      { value: "7", label: "langues pour les libellés d'accessibilité" },
      { value: "1", label: "annonceur ARIA global, en singleton" },
      { value: "CI", label: "lint accessibilité bloquant à chaque commit (Husky)" },
    ],
  },
  {
    id: "coachflow",
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
    // Illustration : accueil SportFlow dans une fenêtre sur fond topo
    cover: "/recentprojects/coachflow-cover.webp",
    coverCredit: "Visuel d'accueil de SportFlow",
    coverCreditUrl: "https://with-coachflow.vercel.app",
    image: {
      light: "/recentprojects/coachflow-hero.png",
      dark: "/recentprojects/coachflow-hero.png",
    },
    link: "https://with-coachflow.vercel.app/",
    code: "https://github.com/adrien-neyron/CoachFlow",
    difficulty: "Professionnel",
    duration: "3 semaines",
    category: "LMS",
    status: "En production",
    impact: "82 leçons · gamification complète · certification LinkedIn",
  },
  {
    id: "runfit-advisor",
    title: "RunFit Advisor",
    tagline: "Recommandation de chaussures running par algo de scoring",
    role: "Développeur Full-Stack",
    description:
      "Application web de recommandation personnalisée de chaussures de running et trail. Questionnaire morphologique et sportif, algo de scoring, interface swipe, authentification, liens d'affiliation multi-réseaux — déployée et en production.",
    challenge:
      "Les coureurs peinent à choisir une chaussure adaptée parmi des centaines de modèles. Les comparateurs existants manquent de personnalisation morphologique.",
    solution:
      "Moteur de recommandation basé sur profil complet (morphologie, niveau, terrain, distance). Auth Supabase. Interface swipe pour affiner les préférences. Synchronisation automatique du catalogue via cron jobs. Liens affiliés Awin, CJ, Amazon.",
    result:
      "Application déployée et opérationnelle. Catalogue synchronisé automatiquement. Liens affiliés actifs.",
    technologies: ["Nuxt 3", "Vue 3", "TypeScript", "Supabase", "PostgreSQL", "Prisma", "Tailwind CSS", "Nitro"],
    // Illustration : accueil RunMatch dans une fenêtre sur fond topo
    cover: "/recentprojects/runfit-cover.webp",
    coverCredit: "Visuel d'accueil de RunMatch",
    coverCreditUrl: "https://runfit-advisor.vercel.app",
    image: {
      light: "/recentprojects/runfit-hero.webp",
      dark: "/recentprojects/runfit-hero.webp",
    },
    link: "https://runfit-advisor.vercel.app/",
    difficulty: "Professionnel",
    duration: "2 mois",
    category: "IA",
    status: "En production",
    impact: "En production — algo de scoring + auth + affiliation",
  },
  {
    id: "job-search-automator",
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
    cover: "https://images.unsplash.com/photo-1595327656903-2f54e37ce09b?w=1600&q=80&auto=format&fit=crop",
    coverCredit: "I'M ZION / Unsplash",
    coverCreditUrl: "https://unsplash.com/photos/rVcxGBT80j8",
    image: { light: "/projectsoon.png", dark: "/projectsoon.png" },
    difficulty: "Professionnel",
    duration: "3 semaines",
    category: "Automatisation",
    status: "En cours",
    impact: "-80% temps de candidature · human-in-the-loop",
  },
  {
    id: "dgfip-outil-metier",
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
    cover: "https://images.unsplash.com/photo-1680992044138-ce4864c2b962?w=1600&q=80&auto=format&fit=crop",
    coverCredit: "Tyler / Unsplash",
    coverCreditUrl: "https://unsplash.com/photos/vSprjjDbu60",
    image: { light: "/recentprojects/dgfip-hero.png", dark: "/recentprojects/dgfip-hero.png" },
    difficulty: "Professionnel",
    duration: "2 ans",
    category: "SI",
    status: "Case study pro",
    impact: "-50% temps de traitement · SI public · 2 ans en prod",
    place: "Paris",
    coords: { lat: 48.857, lon: 2.352 },
    milestones: [
      { label: "Départ", detail: "Processus manuels" },
      { label: "Conception", detail: "UX centrée agents" },
      { label: "Livraison", detail: "CI/CD GitLab" },
      { label: "Arrivée", detail: "−50 % de temps" },
    ],
    stats: [
      { value: "−50 %", label: "de temps de traitement sur les processus ciblés" },
      { value: "2 ans", label: "en production dans le SI de la DGFiP" },
    ],
  },
  {
    id: "dressmeup",
    title: "DressMeUp",
    tagline: "Application mobile pour composer ses tenues · Expo SDK 57 · version web en ligne",
    role: "Développeur Full-Stack",
    description:
      "Application de garde-robe numérique : on photographie ses vêtements, on les classe (type, couleur, marque, saison, événement) puis on compose et enregistre des tenues, avec des favoris. Front React Native (Expo) disponible dans Expo Go et en version web, API Express et base MongoDB Atlas, images hébergées sur Cloudinary.",
    challenge:
      "Rendre une application mobile utilisable par n'importe qui sans installation : migration vers Expo SDK 57 (Expo Go ne prend en charge que la dernière version), adaptation de l'interface à react-native-web, et ouverture de la base de données au déploiement serverless.",
    solution:
      "Mise à niveau d'Expo SDK 54 vers 57 (React Native 0.86, React 19) et remplacement d'expo-router, devenu incompatible avec react-navigation. Export web statique déployé sur Vercel, avec un cadre mobile de 430 px de large qui garde la mise en page de l'application sur ordinateur. API Express déployée comme fonction Vercel, connectée à MongoDB Atlas. Déploiement continu : chaque push sur GitHub redéploie le front.",
    result:
      "L'application est accessible en ligne depuis un navigateur, sans installation, et sur téléphone via Expo Go. Front et API sont déployés séparément sur Vercel.",
    technologies: ["React Native", "Expo SDK 57", "Node.js", "Express", "MongoDB Atlas", "Mongoose", "Cloudinary", "Vercel"],
    image: { light: "/projectsoon.png", dark: "/projectsoon.png" },
    link: "https://dressmeup-frontend.vercel.app",
    code: "https://github.com/adrien-neyron/dressMeUp-frontend",
    difficulty: "Side Project",
    duration: "Projet de 2023, remis en ligne en octobre 2026",
    category: "Mobile",
    status: "En production",
    impact: "App mobile + web · Expo SDK 57 · API Express · déploiement continu",
    startDate: "2023",
  },
];
