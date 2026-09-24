export interface CarnetArticleData {
  slug: string;
  title: string;
  excerpt: string;
  category: "Trail" | "Dev" | "Coulisses";
  date: string;
  cover?: string;
  content: string;
  data?: {
    elevation?: string;
    heartRate?: string;
    pace?: string;
  };
}

export const carnetArticles: CarnetArticleData[] = [
  {
    slug: "du-mont-blanc-au-terminal",
    title: "Du Mont Blanc au terminal : ce que le trail m'apprend sur le code",
    excerpt:
      "Endurance, gestion de l'effort, lecture du terrain — les parallèles entre l'ultra-trail et le développement logiciel ne manquent pas.",
    category: "Trail",
    date: "2026-09-24",
    data: { elevation: "+2400m", heartRate: "152 bpm", pace: "6'20/km" },
    content: `## Une préparation qui ressemble à un sprint de dev

Chaque sortie longue commence par un plan — distance, dénivelé, allure cible — un peu comme un sprint commence par un découpage de tâches. Et comme en dev, le plan tient rarement tel quel : un passage technique plus long que prévu, une météo qui change, et il faut réévaluer en continu sans perdre l'objectif de vue.

## Gérer l'effort plutôt que le subir

Sur un ultra, partir trop vite se paie cash dans la deuxième moitié de course. C'est exactement le même réflexe qu'il faut avoir sur un projet : livrer vite au détriment de la base (tests, accessibilité, dette technique) se paie cash quelques sprints plus tard.

Quelques principes qui se transposent directement :

- **Allure régulière** → itérations régulières plutôt que des à-coups suivis de burnout.
- **Ravitaillement anticipé** → refactoring anticipé, avant que le code ne devienne un mur.
- **Lecture du terrain** → lecture du besoin utilisateur avant de foncer dans l'implémentation.

## Le sommet n'est jamais la fin

Sur les crêtes, la vue au sommet ne dure jamais longtemps — il faut redescendre, souvent le passage le plus exigeant techniquement. En dev, la mise en prod n'est pas non plus la ligne d'arrivée : c'est là que commence le vrai travail de suivi, d'accessibilité vérifiée en conditions réelles, et de maintenance.`,
  },
];
