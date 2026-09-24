<script setup lang="ts">
import { BookOpen, Filter, ChevronRight } from "lucide-vue-next";

useHead({ title: "Le Carnet — Trail, Dev & Coulisses | Adrien Neyron" });

const { categoryClass, categoryIcon } = useCarnetCategory();

const { data: articles, pending } = await useAsyncData("carnet-list", () =>
  queryCollection("carnet").order("date", "DESC").all()
);

const categories = ["Tous", "Trail", "Dev", "Coulisses"] as const;
type CarnetFilter = (typeof categories)[number];
const activeFilter = ref<CarnetFilter>("Tous");

const filtered = computed(() => {
  const list = articles.value ?? [];
  return activeFilter.value === "Tous"
    ? list
    : list.filter((a) => a.category === activeFilter.value);
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value)
  );
}
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <UiAnimatedSection>
        <div class="mb-12">
          <div class="flex items-center gap-2 mb-3">
            <BookOpen :size="16" class="text-[var(--color-accent)]" aria-hidden="true" />
            <span class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">Carnet de route</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-bold text-[var(--color-text)] mb-3">
            Le Carnet
          </h1>
          <p class="text-[var(--color-muted)] max-w-xl leading-relaxed text-sm sm:text-base">
            Sorties trail, coulisses techniques et notes de développement — le journal derrière les sentiers.
          </p>
        </div>
      </UiAnimatedSection>

      <!-- Filtres -->
      <UiAnimatedSection>
        <div class="flex items-center gap-2 mb-8 flex-wrap" role="group" aria-label="Filtrer le carnet">
          <Filter :size="14" class="text-[var(--color-muted)] shrink-0" aria-hidden="true" />
          <button
            v-for="cat in categories"
            :key="cat"
            :class="[
              'px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
              activeFilter === cat
                ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                : 'bg-transparent text-[var(--color-muted)] border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]',
            ]"
            @click="activeFilter = cat"
          >
            {{ cat }}
          </button>
        </div>
      </UiAnimatedSection>

      <!-- Loading -->
      <div v-if="pending" class="text-center py-20 text-[var(--color-muted)]">
        Chargement du carnet…
      </div>

      <!-- Grille d'articles -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <UiAnimatedSection
          v-for="article in filtered"
          :key="article.path"
        >
          <NuxtLink :to="article.path" class="block h-full">
            <article class="trail-card group flex flex-col overflow-hidden h-full">
              <div v-if="article.cover" class="relative w-full overflow-hidden bg-[var(--color-surface)]">
                <NuxtImg
                  :src="article.cover"
                  :alt="article.title"
                  width="800"
                  height="450"
                  class="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div class="p-5 flex flex-col gap-3 flex-1">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    :class="['inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full', categoryClass(article.category)]"
                  >
                    <component :is="categoryIcon(article.category)" :size="11" aria-hidden="true" />
                    {{ article.category }}
                  </span>
                  <time :datetime="article.date" class="text-[10px] text-[var(--color-muted)] font-mono">
                    {{ formatDate(article.date) }}
                  </time>
                </div>

                <h3 class="font-bold text-[var(--color-text)] text-base leading-snug">{{ article.title }}</h3>
                <p class="text-sm text-[var(--color-text)]/70 leading-relaxed line-clamp-3">{{ article.excerpt }}</p>

                <span class="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)] mt-auto pt-2 border-t border-[var(--color-accent)]/10 group/link">
                  Lire l'article
                  <ChevronRight :size="13" aria-hidden="true" class="group-hover/link:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </article>
          </NuxtLink>
        </UiAnimatedSection>
      </div>

      <!-- Empty state -->
      <div v-if="!pending && filtered.length === 0" class="text-center py-20 text-[var(--color-muted)]">
        <p class="text-4xl mb-4">📓</p>
        <p class="text-sm">Aucun article dans cette catégorie pour l'instant.</p>
      </div>
    </div>
  </div>
</template>
