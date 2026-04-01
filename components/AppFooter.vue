<template>
  <footer class="w-full border-t border-[var(--color-accent)]/10 mt-10 py-10 px-6 sm:px-12">
    <div class="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-sm">

      <!-- Identité -->
      <div class="text-center sm:text-left">
        <p class="font-semibold text-[var(--color-text)]">Adrien Neyron</p>
        <p class="text-xs text-[var(--color-muted)] mt-0.5">Camp de Base © 2025</p>
      </div>

      <!-- Liens rapides -->
      <nav aria-label="Navigation pied de page" class="flex flex-wrap justify-center gap-x-5 gap-y-1">
        <NuxtLink
          v-for="link in [
            { to: '/', label: 'Accueil' },
            { to: '/projects', label: 'Projets' },
            { to: '/ai-tools', label: 'IA' },
            { to: '/about', label: 'À propos' },
            { to: '/contact', label: 'Contact' },
          ]"
          :key="link.to"
          :to="link.to"
          class="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Stack -->
      <p class="text-xs text-[var(--color-muted)] text-center sm:text-right">
        Construit avec
        <span class="text-[#41B883] font-medium">Vue.js</span>,
        <span class="text-[#00C16A] font-medium">Nuxt</span>
        &amp;
        <span class="text-[var(--color-accent)] font-medium">Three.js</span>
      </p>
    </div>
  </footer>
</template>
