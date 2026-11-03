import { toValue, type MaybeRefOrGetter } from "vue";

interface PageSeoOptions {
  /** Titre complet de l'onglet, ex. « Les Sentiers — Projets | Adrien Neyron ». */
  title: MaybeRefOrGetter<string>;
  description?: MaybeRefOrGetter<string | undefined>;
  /** Image de partage : URL absolue ou chemin du site. Absente → portrait par défaut. */
  image?: MaybeRefOrGetter<string | undefined>;
  imageAlt?: MaybeRefOrGetter<string | undefined>;
  type?: "website" | "article";
}

const DEFAULT_IMAGE = "/profile.png";
const DEFAULT_DESCRIPTION =
  "Portfolio d'Adrien Neyron, développeur front-end Vue 3 / TypeScript, spécialisé accessibilité RGAA et WCAG.";

/**
 * Balises de partage d'une page : titre, description, canonical, Open Graph et Twitter.
 * L'URL du site vient de `runtimeConfig.public.siteUrl` (variable SITE_URL) : une seule valeur à changer
 * au passage au domaine propre. L'accueil (components/loop/LoopHome.vue) pose les siennes.
 */
export function usePageSeo(opts: PageSeoOptions) {
  const siteUrl = String(useRuntimeConfig().public.siteUrl || "").replace(/\/$/, "");
  const route = useRoute();

  const absolute = (u?: string) => {
    if (!u) return `${siteUrl}${DEFAULT_IMAGE}`;
    return /^https?:\/\//i.test(u) ? u : `${siteUrl}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  const title = computed(() => toValue(opts.title));
  const description = computed(() => (toValue(opts.description) || "").trim() || DEFAULT_DESCRIPTION);
  const hasImage = computed(() => Boolean(toValue(opts.image)));
  const image = computed(() => absolute(toValue(opts.image)));

  useHead({ link: [{ rel: "canonical", href: computed(() => `${siteUrl}${route.path}`) }] });

  useSeoMeta({
    title,
    description,
    ogType: opts.type ?? "website",
    ogLocale: "fr_FR",
    ogSiteName: "Adrien Neyron",
    ogTitle: title,
    ogDescription: description,
    ogUrl: computed(() => `${siteUrl}${route.path}`),
    ogImage: image,
    ogImageAlt: computed(() => toValue(opts.imageAlt) || (hasImage.value ? title.value : "Adrien Neyron, développeur front-end")),
    twitterCard: computed(() => (hasImage.value ? "summary_large_image" : "summary")),
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  });
}
