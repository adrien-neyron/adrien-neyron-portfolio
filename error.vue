<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const is404 = computed(() => props.error?.statusCode === 404);
const title = computed(() => (is404.value ? "Sentier introuvable" : "Une erreur est survenue"));

useHead({ title: computed(() => `${title.value} | Adrien Neyron`) });

const goHome = () => clearError({ redirect: "/" });
</script>

<template>
  <NuxtLayout>
    <div class="min-h-[70vh] flex items-center px-6 sm:px-12 lg:px-20 py-20">
      <div class="max-w-2xl mx-auto w-full">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-[var(--color-accent)] mb-4">
          Erreur {{ error?.statusCode || 500 }}
        </p>
        <h1 class="text-4xl sm:text-5xl text-[var(--color-text)] mb-4">{{ title }}</h1>
        <p class="text-[var(--color-muted)] leading-relaxed mb-8">
          <template v-if="is404">
            La page demandée n'existe pas ou a changé d'adresse. Revenez au point de départ ou reprenez la trace par les projets.
          </template>
          <template v-else>
            Un problème technique s'est produit de notre côté. Réessayez dans quelques instants ou revenez à l'accueil.
          </template>
        </p>
        <div class="flex flex-wrap gap-3">
          <button type="button" class="button-accent px-5 py-3 rounded-xl text-sm font-semibold" @click="goHome">
            Retour à l'accueil
          </button>
          <NuxtLink to="/projects" class="button-empty px-5 py-3 rounded-xl text-sm font-semibold">
            Voir les projets
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
