<script setup lang="ts">
import { ArrowLeft, Mountain, HeartPulse, Gauge } from "lucide-vue-next";
import { marked } from "marked";
import { useCarnetStore } from "~/stores/carnet";

const route = useRoute();
const { categoryClass, categoryIcon } = useCarnetCategory();

const store = useCarnetStore();
onMounted(() => store.fetchArticles());

const article = computed(() =>
  store.articles.find((a) => a.slug === route.params.slug)
);

const notFound = computed(() => !store.loading && store.articles.length > 0 && !article.value);

useHead({
  title: computed(() => `${article.value?.title ?? "Article"} | Le Carnet — Adrien Neyron`),
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value)
  );
}

const dataStats = computed(() => {
  const data = article.value?.data;
  if (!data) return [];
  return [
    data.elevation ? { icon: Mountain, label: "D+", value: data.elevation } : null,
    data.heartRate ? { icon: HeartPulse, label: "FC moy.", value: data.heartRate } : null,
    data.pace ? { icon: Gauge, label: "Allure", value: data.pace } : null,
  ].filter((s): s is { icon: typeof Mountain; label: string; value: string } => s !== null);
});

// Contenu rédigé exclusivement depuis le backoffice (admin authentifié via
// Auth0, cf. CLAUDE.md) — pas d'entrée utilisateur public ici, d'où le
// rendu HTML direct du Markdown sans étape de sanitisation supplémentaire.
const renderedContent = computed(() => {
  if (!article.value?.content) return "";
  return marked.parse(article.value.content, { async: false }) as string;
});
</script>

<template>
  <div v-if="article" class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-3xl mx-auto">

      <!-- Retour -->
      <UiAnimatedSection>
        <NuxtLink
          to="/carnet"
          class="inline-flex items-center gap-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors mb-8 group"
        >
          <ArrowLeft :size="14" aria-hidden="true" class="group-hover:-translate-x-0.5 transition-transform" />
          Retour au carnet
        </NuxtLink>
      </UiAnimatedSection>

      <!-- En-tête article -->
      <UiAnimatedSection>
        <div class="mb-8">
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <span
              :class="['inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full', categoryClass(article.category)]"
            >
              <component :is="categoryIcon(article.category)" :size="12" aria-hidden="true" />
              {{ article.category }}
            </span>
            <time :datetime="article.date" class="text-xs text-[var(--color-muted)] font-mono">
              {{ formatDate(article.date) }}
            </time>
          </div>

          <h1 class="text-3xl sm:text-5xl font-bold text-[var(--color-text)] mb-3">
            {{ article.title }}
          </h1>
          <p class="text-[var(--color-accent)] text-sm italic">{{ article.excerpt }}</p>
        </div>
      </UiAnimatedSection>

      <!-- Image bannière -->
      <UiAnimatedSection v-if="article.cover">
        <div class="rounded-2xl overflow-hidden mb-10 border border-[var(--color-accent)]/15">
          <NuxtImg
            :src="article.cover"
            :alt="article.title"
            width="1200"
            height="600"
            class="w-full h-56 sm:h-80 object-cover"
          />
        </div>
      </UiAnimatedSection>

      <!-- Bloc données (optionnel — sorties trail) -->
      <UiAnimatedSection v-if="dataStats.length">
        <div class="grid gap-4 mb-10" :style="`grid-template-columns: repeat(${dataStats.length}, minmax(0, 1fr));`">
          <div v-for="stat in dataStats" :key="stat.label" class="trail-card p-4 flex flex-col items-center text-center gap-1.5">
            <component :is="stat.icon" :size="18" class="text-[var(--color-accent)]" aria-hidden="true" />
            <p class="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest">{{ stat.label }}</p>
            <p class="text-lg font-bold text-[var(--color-text)]">{{ stat.value }}</p>
          </div>
        </div>
      </UiAnimatedSection>

      <!-- Contenu -->
      <UiAnimatedSection>
        <div class="carnet-prose" v-html="renderedContent" />
      </UiAnimatedSection>

    </div>
  </div>

  <div v-else-if="notFound" class="min-h-screen py-20 px-6 sm:px-12 lg:px-20 text-center">
    <p class="text-[var(--color-muted)]">Article introuvable.</p>
    <NuxtLink to="/carnet" style="color: var(--color-accent);">Retour au carnet →</NuxtLink>
  </div>

  <div v-else class="min-h-screen py-20 px-6 sm:px-12 lg:px-20 text-center text-[var(--color-muted)]">
    Chargement…
  </div>
</template>

<style scoped>
/* Typographie de l'article — alignée sur les tokens du design system
   (assets/css/main.css) plutôt que sur un plugin Tailwind Typography. */
.carnet-prose :deep(h2) {
  font-family: var(--font-title);
  font-size: 1.5rem;
  color: var(--color-text);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}
.carnet-prose :deep(h3) {
  font-family: var(--font-title);
  font-size: 1.2rem;
  color: var(--color-text);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
.carnet-prose :deep(p) {
  font-size: 0.95rem;
  line-height: 1.75;
  color: color-mix(in srgb, var(--color-text) 85%, transparent);
  margin-bottom: 1.25rem;
}
.carnet-prose :deep(ul),
.carnet-prose :deep(ol) {
  margin: 0 0 1.25rem 1.25rem;
  color: color-mix(in srgb, var(--color-text) 85%, transparent);
  font-size: 0.95rem;
  line-height: 1.75;
}
.carnet-prose :deep(ul) { list-style: disc; }
.carnet-prose :deep(ol) { list-style: decimal; }
.carnet-prose :deep(li) { margin-bottom: 0.4rem; }
.carnet-prose :deep(a) {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.carnet-prose :deep(blockquote) {
  border-left: 3px solid var(--color-accent);
  padding-left: 1rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--color-muted);
}
.carnet-prose :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.85em;
  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  padding: 0.15em 0.4em;
  border-radius: 0.3em;
}
.carnet-prose :deep(pre) {
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
  border-radius: 0.75rem;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1.5rem;
}
.carnet-prose :deep(pre code) {
  background: none;
  padding: 0;
}
.carnet-prose :deep(img) {
  border-radius: 1rem;
  margin: 1.5rem 0;
}
</style>
