<script setup lang="ts">
import { Map, Cpu, User, MessageCircle, Mountain, ArrowRight } from "lucide-vue-next";
import { projects } from "~/data/projects";

// Barre de progression au scroll
onMounted(() => {
  const updateProgress = () => {
    const bar    = document.getElementById("scroll-progress");
    const scroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (bar) bar.style.width = `${(scroll / height) * 100}%`;
  };
  window.addEventListener("scroll", updateProgress);
  onUnmounted(() => window.removeEventListener("scroll", updateProgress));
});

const trailRoutes = [
  {
    path: "/projects",
    label: "Les Sentiers",
    sublabel: "Projets réalisés",
    icon: Map,
    description: "E-commerce, interfaces métier et plateformes LMS pour l'écosystème sport.",
    difficulty: "3 projets",
    color: "var(--color-accent)",
  },
  {
    path: "/ai-tools",
    label: "Équipement IA",
    sublabel: "Outils intelligents",
    icon: Cpu,
    description: "Les outils IA que j'intègre pour automatiser et amplifier votre business.",
    difficulty: "6 outils",
    color: "var(--color-secondary)",
  },
  {
    path: "/about",
    label: "Le Randonneur",
    sublabel: "Mon parcours",
    icon: User,
    description: "17 ans dans le sport. Formateur, puis développeur. Un profil hybride unique.",
    difficulty: "1 histoire",
    color: "var(--color-highlight)",
  },
  {
    path: "/contact",
    label: "Bivouac",
    sublabel: "Discutons projet",
    icon: MessageCircle,
    description: "Vous avez un projet ? Posez vos sacs, parlons-en.",
    difficulty: "En ligne",
    color: "var(--color-muted)",
  },
];

const expertises = [
  {
    icon: "🛒",
    title: "E-commerce Sport",
    description: "Plateformes de vente optimisées pour les boutiques running, trail et outdoor. Tunnel de conversion, catalogue intelligent, paiement intégré.",
  },
  {
    icon: "📊",
    title: "Interfaces Métier",
    description: "Dashboards et outils internes sur mesure pour clubs sportifs, associations et organisations du secteur sport-tourisme.",
  },
  {
    icon: "🎓",
    title: "Plateformes LMS",
    description: "Solutions de formation en ligne pour formateurs BPJEPS, CQP et experts terrain. Modules vidéo, quiz, suivi de progression.",
  },
];
</script>

<template>
  <!-- Hero -->
  <section
    aria-label="Camp de base — présentation"
    class="min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20"
  >
    <div
      v-motion
      :initial="{ opacity: 0, y: 40 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 700 } }"
      class="max-w-4xl"
    >
      <!-- Label -->
      <div class="flex items-center gap-2 mb-6">
        <Mountain :size="16" class="text-[var(--color-accent)]" aria-hidden="true" />
        <span class="text-xs font-mono font-semibold text-[var(--color-accent)] uppercase tracking-widest">
          Camp de Base
        </span>
        <span class="w-8 h-px bg-[var(--color-accent)]" />
      </div>

      <!-- H1 -->
      <h1 class="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight text-[var(--color-text)] mb-4">
        <UiTextDecrypt text="Développeur" class="block" />
        <span class="text-[var(--color-accent)]">spécialisé sport</span>
        <span class="block text-[var(--color-text)]">& outdoor</span>
      </h1>

      <!-- Sous-titre -->
      <p class="mt-4 text-base sm:text-lg text-[var(--color-text)]/70 max-w-2xl leading-relaxed">
        Je conçois des plateformes e-commerce, des interfaces métier et des outils pédagogiques
        pour les <strong class="text-[var(--color-text)]">organisations sportives</strong>.
        Ancien éducateur sportif, maintenant développeur web.
      </p>

      <!-- Disponibilité -->
      <div class="flex items-center gap-2 mt-5 text-sm text-[var(--color-muted)]">
        <span class="inline-block w-2 h-2 rounded-full bg-green-500 trail-pulse" aria-hidden="true" />
        Disponible pour de nouveaux projets
      </div>

      <!-- CTAs -->
      <div class="flex flex-wrap gap-4 mt-8">
        <NuxtLink
          to="/projects"
          class="button-accent px-7 py-3 rounded-2xl font-semibold text-sm flex items-center gap-2 shadow-md group"
        >
          Voir les projets
          <ArrowRight :size="16" aria-hidden="true" class="group-hover:translate-x-1 transition-transform" />
        </NuxtLink>
        <NuxtLink
          to="/contact"
          class="button-empty px-7 py-3 rounded-2xl font-semibold text-sm"
        >
          Me contacter
        </NuxtLink>
      </div>

      <!-- Tech badges -->
      <div class="flex flex-wrap gap-2 mt-8">
        <UiTechBadge
          v-for="tech in ['Vue 3', 'Nuxt', 'TypeScript', 'Node.js', 'PostgreSQL', 'IA']"
          :key="tech"
          :label="tech"
        />
      </div>
    </div>
  </section>

  <!-- Expertises -->
  <section
    aria-label="Expertises"
    class="py-20 px-6 sm:px-12 lg:px-20"
  >
    <UiAnimatedSection>
      <div class="max-w-6xl mx-auto">
        <div class="mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">Mes expertises</h2>
          <p class="mt-2 text-[var(--color-muted)] text-sm">Ce que je construis pour les acteurs du sport</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="exp in expertises"
            :key="exp.title"
            class="trail-card p-6 flex flex-col gap-3"
          >
            <span class="text-3xl" aria-hidden="true">{{ exp.icon }}</span>
            <h3 class="font-semibold text-[var(--color-text)]">{{ exp.title }}</h3>
            <p class="text-sm text-[var(--color-text)]/70 leading-relaxed">{{ exp.description }}</p>
          </div>
        </div>
      </div>
    </UiAnimatedSection>
  </section>

  <!-- Carte des sentiers -->
  <section
    aria-label="Carte des sentiers — navigation"
    class="py-20 px-6 sm:px-12 lg:px-20"
  >
    <UiAnimatedSection>
      <div class="max-w-6xl mx-auto">
        <div class="mb-10">
          <span class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">Carte du terrain</span>
          <h2 class="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mt-1">Explorez les sentiers</h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink
            v-for="trail in trailRoutes"
            :key="trail.path"
            :to="trail.path"
            class="trail-card p-5 flex flex-col gap-3 group cursor-pointer"
          >
            <div class="flex items-center justify-between">
              <component
                :is="trail.icon"
                :size="20"
                :style="{ color: trail.color }"
                aria-hidden="true"
              />
              <span class="text-[10px] font-mono text-[var(--color-muted)]">{{ trail.difficulty }}</span>
            </div>
            <div>
              <p class="font-semibold text-sm text-[var(--color-text)]">{{ trail.label }}</p>
              <p class="text-xs text-[var(--color-muted)]">{{ trail.sublabel }}</p>
            </div>
            <p class="text-xs text-[var(--color-text)]/60 leading-relaxed line-clamp-2">
              {{ trail.description }}
            </p>
            <ArrowRight
              :size="14"
              class="text-[var(--color-accent)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
              aria-hidden="true"
            />
          </NuxtLink>
        </div>
      </div>
    </UiAnimatedSection>
  </section>

  <!-- Projets récents -->
  <section
    aria-label="Projets récents"
    class="py-20 px-6 sm:px-12 lg:px-20"
  >
    <UiAnimatedSection>
      <div class="max-w-6xl mx-auto">
        <div class="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">Étapes du trail</span>
            <h2 class="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mt-1">Projets réalisés</h2>
          </div>
          <NuxtLink
            to="/projects"
            class="button-empty px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 group"
          >
            Tous les projets
            <ArrowRight :size="14" aria-hidden="true" class="group-hover:translate-x-0.5 transition-transform" />
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UiProjectCard
            v-for="project in projects"
            :key="project.id"
            :title="project.title"
            :role="project.role"
            :description="project.description"
            :technologies="project.technologies"
            :image-url="project.image.light"
            :slug="project.id"
            :difficulty="project.difficulty"
            :duration="project.duration"
            :tagline="project.tagline"
          />
        </div>
      </div>
    </UiAnimatedSection>
  </section>

  <!-- CTA final -->
  <section
    aria-label="Appel à l'action"
    class="py-20 px-6 sm:px-12 lg:px-20"
  >
    <UiAnimatedSection>
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="text-2xl sm:text-3xl font-bold text-[var(--color-text)] mb-4">
          Un projet en tête ?
        </h2>
        <p class="text-[var(--color-text)]/70 text-sm leading-relaxed mb-8">
          Que ce soit une boutique en ligne, un outil de gestion ou une plateforme de formation,
          je construis des solutions sur mesure pour le secteur sport et outdoor.
        </p>
        <NuxtLink
          to="/contact"
          class="button-accent px-8 py-4 rounded-2xl font-semibold text-base inline-flex items-center gap-2 group"
        >
          Parlons de votre projet
          <ArrowRight :size="18" aria-hidden="true" class="group-hover:translate-x-1 transition-transform" />
        </NuxtLink>
      </div>
    </UiAnimatedSection>
  </section>
</template>
