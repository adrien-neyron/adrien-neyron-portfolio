<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { LogOut, LayoutDashboard, PlusCircle, Home, UserCircle, Cpu, NotebookPen, Menu, X } from "lucide-vue-next";

const { logout } = useAuth0();
const route     = useRoute();
const menuOpen  = ref(false);

function handleLogout() {
  logout({ logoutParams: { returnTo: window.location.origin } });
}

// Referme le menu mobile à chaque navigation — même pattern que
// components/navigation/TrailNav.vue (menu hamburger du site public).
watch(() => route.path, () => { menuOpen.value = false; });
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row" style="position: relative; z-index: 1; background-color: var(--color-bg); color: var(--color-text);">

    <!-- Barre mobile : titre + bouton menu (le sidebar reste toujours visible en desktop) -->
    <div
      class="md:hidden flex items-center justify-between px-4 py-3 border-b"
      style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);"
    >
      <div>
        <p class="font-bold text-sm" style="color: var(--color-text);">Admin</p>
        <p class="text-xs font-mono mt-0.5" style="color: var(--color-muted);">Adrien Neyron</p>
      </div>
      <button
        class="admin-menu-toggle p-2 rounded-lg transition-colors"
        :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
        aria-controls="admin-sidebar-nav"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="20" aria-hidden="true" />
        <Menu v-else :size="20" aria-hidden="true" />
      </button>
    </div>

    <!-- Sidebar -->
    <aside
      id="admin-sidebar-nav"
      :class="[
        'w-full md:w-56 md:shrink-0 border-b md:border-b-0 md:border-r flex-col',
        menuOpen ? 'flex' : 'hidden md:flex',
      ]"
      style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);"
    >
      <div class="hidden md:block px-5 py-5 border-b" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
        <p class="font-bold text-sm" style="color: var(--color-text);">Admin</p>
        <p class="text-xs font-mono mt-0.5" style="color: var(--color-muted);">Adrien Neyron</p>
      </div>

      <nav aria-label="Navigation admin" class="flex-1 px-3 py-4 space-y-1">
        <NuxtLink to="/admin" class="admin-nav-link" active-class="admin-nav-link--active">
          <LayoutDashboard :size="15" aria-hidden="true" />
          Projets
        </NuxtLink>
        <NuxtLink to="/admin/projects/new" class="admin-nav-link" active-class="admin-nav-link--active">
          <PlusCircle :size="15" aria-hidden="true" />
          Nouveau projet
        </NuxtLink>
        <NuxtLink to="/admin/carnet" class="admin-nav-link" active-class="admin-nav-link--active">
          <NotebookPen :size="15" aria-hidden="true" />
          Carnet
        </NuxtLink>
        <NuxtLink to="/admin/profile" class="admin-nav-link" active-class="admin-nav-link--active">
          <UserCircle :size="15" aria-hidden="true" />
          Profil
        </NuxtLink>
        <NuxtLink to="/admin/ai-tools" class="admin-nav-link" active-class="admin-nav-link--active">
          <Cpu :size="15" aria-hidden="true" />
          Outils IA
        </NuxtLink>
      </nav>

      <div class="px-3 py-4 space-y-1 border-t" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
        <NuxtLink to="/" class="admin-nav-link">
          <Home :size="15" aria-hidden="true" />
          Voir le site
        </NuxtLink>
        <button class="admin-nav-link w-full text-left" @click="handleLogout">
          <LogOut :size="15" aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </aside>

    <!-- Contenu -->
    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.admin-nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text);
  transition: background 0.15s, color 0.15s;
}
.admin-nav-link:hover,
.admin-nav-link--active {
  background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
  color: var(--color-accent);
}

.admin-menu-toggle:hover {
  background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
}
</style>
