export interface AiTool {
  id: string;
  name: string;
  provider: string;
  category: "Productivité" | "Création" | "Analyse" | "Automatisation";
  tagline: string;
  description: string;
  useCases: string[];
  businessValue: string;
  icon: string;
  link?: string;
}

export const aiTools: AiTool[] = [
  {
    id: "claude-anthropic",
    name: "Claude",
    provider: "Anthropic",
    category: "Productivité",
    tagline: "L'assistant IA pour rédiger, analyser et structurer",
    description:
      "Claude est utilisé pour la rédaction de contenu, l'analyse de documents et la structuration de spécifications fonctionnelles.",
    useCases: [
      "Rédaction de cahiers des charges et specs techniques",
      "Analyse et synthèse de documents volumineux",
      "Génération de contenu SEO pour sites e-commerce",
    ],
    businessValue: "Réduit de 70% le temps de production de contenu écrit.",
    icon: "🤖",
  },
  {
    id: "cursor-ai",
    name: "Cursor",
    provider: "Cursor AI",
    category: "Productivité",
    tagline: "L'IDE IA qui accélère le développement",
    description:
      "Cursor intègre Claude directement dans l'éditeur de code pour générer, corriger et expliquer du code en contexte.",
    useCases: [
      "Génération de composants Vue/Nuxt à partir de maquettes",
      "Refactoring et documentation automatique",
      "Debugging assisté avec explication des erreurs",
    ],
    businessValue: "Multiplie par 3 la vitesse de développement sur les tâches répétitives.",
    icon: "⚡",
  },
  {
    id: "make-automation",
    name: "Make",
    provider: "Make (ex-Integromat)",
    category: "Automatisation",
    tagline: "Automatiser les flux de travail sans code",
    description:
      "Make connecte vos applications et automatise les processus répétitifs : emails, notifications, synchronisation de données.",
    useCases: [
      "Automatisation des relances email clients",
      "Synchronisation CRM ↔ base de données interne",
      "Notifications automatiques sur événements clés",
    ],
    businessValue: "Économise en moyenne 10h/semaine sur les tâches manuelles répétitives.",
    icon: "⚙️",
    link: "https://www.make.com",
  },
  {
    id: "openai-gpt",
    name: "GPT-4",
    provider: "OpenAI",
    category: "Analyse",
    tagline: "Analyser, catégoriser et extraire des insights",
    description:
      "GPT-4 via API pour automatiser l'analyse de données clients, la catégorisation de feedbacks et la génération de rapports.",
    useCases: [
      "Analyse de sentiment sur feedbacks clients",
      "Catégorisation automatique de données",
      "Génération de rapports hebdomadaires automatisés",
    ],
    businessValue: "Transforme des données brutes en insights actionnables en quelques secondes.",
    icon: "🧠",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    provider: "Midjourney",
    category: "Création",
    tagline: "Générer des visuels immersifs pour vos projets",
    description:
      "Midjourney pour créer des visuels de qualité professionnelle : illustrations, mockups, concepts visuels pour les interfaces.",
    useCases: [
      "Création de visuels hero pour landing pages",
      "Génération de mockups pour présentations clients",
      "Illustrations thématiques sport/outdoor",
    ],
    businessValue: "Réduit les coûts d'illustration de 80% tout en produisant des visuels uniques.",
    icon: "🎨",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    provider: "Perplexity AI",
    category: "Analyse",
    tagline: "Recherche et veille technologique en temps réel",
    description:
      "Perplexity pour la veille sectorielle, la recherche de solutions techniques et l'analyse concurrentielle.",
    useCases: [
      "Veille technologique sur les frameworks web",
      "Analyse de la concurrence pour clients e-commerce",
      "Recherche de réglementations et normes sectorielles",
    ],
    businessValue: "Accélère la phase de recherche et de benchmark de 5x.",
    icon: "🔍",
  },
];
