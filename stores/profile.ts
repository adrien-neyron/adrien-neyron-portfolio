import { defineStore } from "pinia";
import resume from "~/data/resume.json";

export interface ProfileLocation {
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  region?: string;
}

export interface ProfileSocial {
  network: string;
  username: string;
  url: string;
  icon?: string;
}

export interface Profile {
  name: string;
  label: string;
  email: string;
  phone?: string;
  heroTitle?: string;
  job1?: string;
  job2?: string;
  description?: string;
  summary?: string;
  headerSubtitle?: string;
  about: string[];
  pictureUrl?: string;
  cvUrl?: string;
  url?: string;
  keywords?: string;
  location: ProfileLocation;
  profiles: ProfileSocial[];
}

// Valeurs par défaut : resume.json (déjà en place) + les textes qui étaient
// codés en dur dans AboutSection.vue / AppHeader.vue avant ce chantier.
// Servent à la fois de fallback public (si Mongo est vide/en pause) et de
// pré-remplissage du formulaire admin au tout premier enregistrement.
export const staticProfileFallback: Profile = {
  name: resume.basics.name,
  label: resume.basics.label,
  email: resume.basics.email,
  phone: resume.basics.phone,
  heroTitle: "Développeur spécialisé sport & outdoor",
  job1: resume.basics.job1,
  job2: resume.basics.job2,
  description: resume.basics.description,
  summary: resume.basics.summary,
  headerSubtitle: "Fullstack JS · Vue.js / Node.js · AI & Automation",
  about: [
    "Je suis Adrien Neyron, développeur fullstack créatif spécialisé en JavaScript, avec des frameworks comme Vue, Nuxt, React et Node.js. Je code principalement en TypeScript. Ma passion pour le code me pousse à créer des solutions innovantes qui résolvent de vrais problèmes.",
    "Avec un solide bagage en gestion et un sens aigu de la résolution de problèmes, j'apporte une perspective unique à chaque projet. Je combine un code propre avec une réflexion UX/UI pour créer des applications à la fois fonctionnelles et agréables à utiliser.",
    "Tailwind CSS et Bootstrap sont mes outils de prédilection pour des interfaces responsives. J'explore aussi Three.js, @vueuse/motion et TresJS pour donner vie à mes créations.",
    "Passionné par l'apprentissage et l'innovation, j'aime relever des défis et transformer des idées en expériences numériques fluides et interactives.",
  ],
  pictureUrl: "/profile.png",
  cvUrl: "/2025_CV_AdrienNEYRON.pdf",
  url: resume.basics.url,
  keywords: resume.basics.keywords,
  location: resume.basics.location,
  profiles: resume.basics.profiles,
};

export const useProfileStore = defineStore("profile", () => {
  const profile = ref<Profile>(staticProfileFallback);
  const loading = ref(false);
  const error   = ref<string | null>(null);
  const loaded  = ref(false);

  // `force` permet de recharger même si déjà chargé une fois dans la session —
  // nécessaire après un enregistrement admin, sinon les pages publiques
  // gardent en mémoire (store Pinia partagé sur toute la SPA) le profil
  // chargé avant la modification tant qu'aucun rechargement complet de page
  // n'a lieu (la navigation client-side ne recrée pas le store).
  async function fetchProfile(force = false) {
    if (loaded.value && !force) return;
    loading.value = true;
    error.value   = null;
    try {
      const result = await $fetch<Profile | null>("/api/profile");
      profile.value = result ? { ...staticProfileFallback, ...result } : staticProfileFallback;
    } catch {
      profile.value = staticProfileFallback;
      error.value = "Impossible de charger le profil.";
    } finally {
      loading.value = false;
      loaded.value  = true;
    }
  }

  return { profile, loading, error, fetchProfile };
});
