<script setup lang="ts">
import { Cpu, ArrowRight } from "lucide-vue-next";
import { aiTools } from "~/data/ai-tools";
import type { AiTool } from "~/data/ai-tools";

useHead({ title: "Équipement IA | Adrien Neyron" });

type Category = "Tous" | AiTool["category"];
const categories: Category[] = ["Tous", "Productivité", "Création", "Analyse", "Automatisation"];
const activeFilter = ref<Category>("Tous");

const filtered = computed(() =>
  activeFilter.value === "Tous"
    ? aiTools
    : aiTools.filter((t) => t.category === activeFilter.value)
);
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-6xl mx-auto">

      <!-- Header -->
      <UiAnimatedSection>
        <div class="mb-12">
          <div class="flex items-center gap-2 mb-3">
            <Cpu :size="16" class="text-[var(--color-accent)]" aria-hidden="true" />
            <span class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">Intelligence artificielle</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-bold text-[var(--color-text)] mb-3">
            Équipement IA
          </h1>
          <p class="text-[var(--color-muted)] max-w-2xl leading-relaxed text-sm sm:text-base">
            Les outils d'intelligence artificielle que j'intègre dans mes projets et que je propose à mes clients
            pour <strong class="text-[var(--color-text)]">automatiser, accélérer et amplifier</strong> leur activité.
          </p>
        </div>
      </UiAnimatedSection>

      <!-- Intro value prop -->
      <UiAnimatedSection>
        <div class="trail-card p-6 mb-10 flex flex-col sm:flex-row gap-6 items-start">
          <span class="text-4xl shrink-0" aria-hidden="true">🗺️</span>
          <div>
            <h2 class="font-semibold text-[var(--color-text)] mb-2">Pourquoi intégrer l'IA dans votre business ?</h2>
            <p class="text-sm text-[var(--color-text)]/70 leading-relaxed">
              L'IA n'est pas une tendance — c'est un équipement. Comme un GPS sur le trail, elle ne remplace pas
              votre expertise, elle l'amplifie. Je sélectionne et intègre les outils les plus adaptés à votre
              contexte pour des gains de temps concrets et mesurables.
            </p>
          </div>
        </div>
      </UiAnimatedSection>

      <!-- Filtres -->
      <UiAnimatedSection>
        <div class="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filtrer par catégorie">
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

      <!-- Grille d'outils -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
        <UiAnimatedSection
          v-for="tool in filtered"
          :key="tool.id"
        >
          <UiAiToolCard :tool="tool" />
        </UiAnimatedSection>
      </div>

      <!-- CTA -->
      <UiAnimatedSection>
        <div class="trail-card p-8 text-center">
          <h2 class="text-xl font-bold text-[var(--color-text)] mb-3">
            Vous voulez intégrer l'IA dans votre business ?
          </h2>
          <p class="text-sm text-[var(--color-text)]/70 mb-6 max-w-md mx-auto">
            Audit, sélection d'outils, intégration sur mesure et formation de votre équipe.
            Discutons de ce qui a du sens pour votre contexte.
          </p>
          <NuxtLink
            to="/contact"
            class="button-accent px-8 py-3 rounded-2xl font-semibold text-sm inline-flex items-center gap-2 group"
          >
            Discutons de votre projet IA
            <ArrowRight :size="16" aria-hidden="true" class="group-hover:translate-x-0.5 transition-transform" />
          </NuxtLink>
        </div>
      </UiAnimatedSection>

    </div>
  </div>
</template>
