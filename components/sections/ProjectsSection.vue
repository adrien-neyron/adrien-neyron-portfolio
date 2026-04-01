<script setup lang="ts">
import { useProjectsStore } from "~/stores/projects";
import { useColorMode }     from "#imports";

const projectsStore = useProjectsStore();
const colorMode     = useColorMode();

onMounted(() => projectsStore.fetchProjects());

const projectsWithImage = computed(() =>
  projectsStore.projects.map((p) => ({
    ...p,
    imageUrl:
      colorMode.value === "dark"
        ? p.image?.dark  || "/projectsoon.png"
        : p.image?.light || "/projectsoon.png",
  }))
);
</script>

<template>
  <div class="flex flex-col gap-10">
    <!-- En-tête -->
    <div class="px-4 sm:px-6 lg:px-12 animate-fade-in">
      <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent">
        Projets sélectionnés
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Applications web &amp; mobile conçues sur mesure
      </p>
    </div>

    <!-- Squelette de chargement -->
    <div v-if="projectsStore.loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-6 lg:px-12">
      <div
        v-for="i in 3"
        :key="i"
        class="rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse h-72"
      />
    </div>

    <!-- Aucun projet -->
    <p v-else-if="!projectsStore.projects.length" class="px-6 text-gray-500 dark:text-gray-400">
      Aucun projet trouvé.
    </p>

    <!-- Grille -->
    <section v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <UiProjectCard
        v-for="project in projectsWithImage"
        :key="project._id"
        v-bind="project"
      />
    </section>
  </div>
</template>
