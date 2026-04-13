<script setup lang="ts">
import { MapPin, Download, Mail } from "lucide-vue-next";
import resume from "~/data/resume.json";

useHead({ title: "Le Randonneur — À propos | Adrien Neyron" });

const hovered = ref(false);

const timeline = [
  {
    period: "2011 – 2021",
    title: "Éducateur sportif & Formateur",
    description: "10 ans dans les secteurs du sport, du tourisme et du social. Animation, enseignement, conception de parcours pédagogiques pour des publics variés.",
    icon: "🏃",
    color: "var(--color-secondary)",
  },
  {
    period: "2021 – 2023",
    title: "La transition numérique",
    description: "Reconversion vers le développement web. Formations intensives, premiers projets freelance, découverte de Vue.js et Nuxt. La pédagogie terrain devient pédagogie code.",
    icon: "💡",
    color: "var(--color-highlight)",
  },
  {
    period: "2023 – Aujourd'hui",
    title: "Développeur Full-Stack Sport & Outdoor",
    description: "Conception d'interfaces métier, de plateformes e-commerce et d'une plateforme LMS pour les acteurs du sport. Intégration d'outils IA. Profil hybride : développeur + formateur + passionné trail.",
    icon: "🚀",
    color: "var(--color-accent)",
  },
];

const values = [
  {
    icon: "⛰️",
    title: "L'Endurance",
    description: "La régularité avant les sprints. Des projets maintenus dans le temps, des codebase propres qui évoluent bien.",
  },
  {
    icon: "🎯",
    title: "La Précision",
    description: "Code propre, UX pensée, détails soignés. Parce que sur le trail comme en dev, les petits détails font la différence.",
  },
  {
    icon: "🗺️",
    title: "La Vision",
    description: "17 ans d'expérience terrain donnent une perspective business. Je construis des outils utiles, pas juste techniques.",
  },
];

const skills = {
  Frontend:  ["Vue.js", "Nuxt 3", "TypeScript", "Tailwind CSS", "Three.js", "TresJS", "GSAP"],
  Backend:   ["Node.js", "Express.js", "PostgreSQL", "MongoDB", "Mongoose", "REST API"],
  Outils:    ["Git", "Figma", "Make", "EmailJS", "Pinia", "Vite", "Stripe"],
  IA:        ["Claude / Anthropic", "GPT-4 / OpenAI", "Cursor", "Midjourney", "Perplexity"],
};
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-5xl mx-auto">

      <!-- Hero about -->
      <UiAnimatedSection>
        <div class="flex flex-col md:flex-row gap-10 items-center mb-16">
          <!-- Photo interactive -->
          <div
            class="relative w-56 h-56 shrink-0 cursor-pointer"
            @mouseenter="hovered = true"
            @mouseleave="hovered = false"
          >
            <NuxtImg
              src="/sculpture.png"
              alt="Silhouette"
              class="w-full h-full object-contain rounded-2xl border border-[var(--color-accent)]/20"
            />
            <Transition
              enter-active-class="transition-all duration-500 ease-in-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition-all duration-300 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div v-if="hovered" class="absolute inset-0">
                <NuxtImg
                  src="/profile.png"
                  alt="Adrien Neyron"
                  class="w-full h-full object-cover rounded-2xl border border-[var(--color-accent)]/30 shadow-lg"
                />
              </div>
            </Transition>
          </div>

          <!-- Identité -->
          <div>
            <span class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">Le Randonneur</span>
            <h1 class="text-3xl sm:text-5xl font-bold text-[var(--color-text)] mt-2 mb-3">
              Adrien Neyron
            </h1>
            <p class="text-[var(--color-accent)] font-medium mb-4">
              Développeur Web × Formateur × Passionné Trail
            </p>
            <div class="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-4">
              <MapPin :size="14" aria-hidden="true" />
              {{ resume.basics.location.city }}, {{ resume.basics.location.region }}
              <span class="w-px h-3 bg-[var(--color-muted)]/40 mx-1" />
              17 ans d'expérience
            </div>
            <p class="text-sm text-[var(--color-text)]/70 leading-relaxed max-w-lg">
              {{ resume.basics.description }}
            </p>
            <div class="flex gap-3 mt-6">
              <a
                href="/2025_CV_AdrienNEYRON.pdf"
                target="_blank"
                rel="noopener noreferrer"
                class="button-empty px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                <Download :size="14" aria-hidden="true" />
                CV
              </a>
              <NuxtLink
                to="/contact"
                class="button-accent px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                <Mail :size="14" aria-hidden="true" />
                Me contacter
              </NuxtLink>
            </div>
          </div>
        </div>
      </UiAnimatedSection>

      <!-- Timeline -->
      <UiAnimatedSection>
        <div class="mb-16">
          <h2 class="text-xl font-bold text-[var(--color-text)] mb-8">Le parcours</h2>
          <div class="relative">
            <!-- Ligne verticale -->
            <div class="absolute left-5 top-3 bottom-3 w-px bg-[var(--color-accent)]/20 hidden sm:block" aria-hidden="true" />

            <div class="flex flex-col gap-8">
              <div
                v-for="(step, i) in timeline"
                :key="i"
                class="flex gap-6 items-start"
              >
                <div
                  class="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 border-2"
                  :style="{ borderColor: step.color, background: 'var(--color-surface)' }"
                >
                  {{ step.icon }}
                </div>
                <div class="trail-card p-5 flex-1">
                  <p class="text-xs font-mono text-[var(--color-muted)] mb-1">{{ step.period }}</p>
                  <h3 class="font-semibold text-[var(--color-text)] mb-2">{{ step.title }}</h3>
                  <p class="text-sm text-[var(--color-text)]/70 leading-relaxed">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UiAnimatedSection>

      <!-- Valeurs -->
      <UiAnimatedSection>
        <div class="mb-16">
          <h2 class="text-xl font-bold text-[var(--color-text)] mb-6">Ce qui me différencie</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div
              v-for="value in values"
              :key="value.title"
              class="trail-card p-6 text-center"
            >
              <span class="text-4xl block mb-3">{{ value.icon }}</span>
              <h3 class="font-semibold text-[var(--color-text)] mb-2">{{ value.title }}</h3>
              <p class="text-xs text-[var(--color-text)]/60 leading-relaxed">{{ value.description }}</p>
            </div>
          </div>
        </div>
      </UiAnimatedSection>

      <!-- Compétences -->
      <UiAnimatedSection>
        <div>
          <h2 class="text-xl font-bold text-[var(--color-text)] mb-6">Stack & Compétences</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              v-for="(techs, category) in skills"
              :key="category"
              class="trail-card p-5"
            >
              <h3 class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest mb-3">{{ category }}</h3>
              <div class="flex flex-wrap gap-1.5">
                <UiTechBadge
                  v-for="tech in techs"
                  :key="tech"
                  :label="tech"
                />
              </div>
            </div>
          </div>
        </div>
      </UiAnimatedSection>

    </div>
  </div>
</template>
