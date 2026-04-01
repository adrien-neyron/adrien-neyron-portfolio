<script setup lang="ts">
import { Mail, Linkedin, Github } from "lucide-vue-next";
import resume from "../../data/resume.json";

const open = ref(false);

const iconMap: Record<string, unknown> = {
  Email: Mail,
  LinkedIn: Linkedin,
  GitHub: Github,
};
</script>

<template>
  <div class="fixed top-[6em] right-[4em] sm:top-[3.5em] sm:right-[2.5em] flex flex-col items-end z-40">
    <!-- Toggle mobile -->
    <button
      aria-label="Afficher les contacts"
      :aria-expanded="open"
      class="w-10 h-10 rounded-full shadow-lg md:hidden flex items-center justify-center transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent bg-(--color-accent) text-white hover:opacity-90"
      @click="open = !open"
    >
      <span
        class="text-xl font-light transition-transform duration-300 inline-block"
        :class="open ? 'rotate-45' : ''"
        aria-hidden="true"
      >+</span>
    </button>

    <!-- Icônes sociales -->
    <div
      class="flex flex-col items-end space-y-4 mt-4 transition-all duration-300 md:opacity-100 md:pointer-events-auto"
      :class="open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
    >
      <a
        v-for="profile in resume.basics.profiles"
        :key="profile.network"
        :href="profile.url"
        target="_blank"
        rel="noopener noreferrer"
        :title="profile.network"
        class="text-2xl transition-colors flex items-center text-(--color-text) hover:text-(--color-accent)"
      >
        <component
          :is="iconMap[profile.network]"
          v-if="iconMap[profile.network]"
          :size="20"
          aria-hidden="true"
        />
      </a>
    </div>
  </div>
</template>
