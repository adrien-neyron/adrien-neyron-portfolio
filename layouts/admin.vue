<script setup lang="ts">
import { useAuth0 } from "@auth0/auth0-vue";
import { LogOut, LayoutDashboard, PlusCircle, Home } from "lucide-vue-next";

const { logout } = useAuth0();

function handleLogout() {
  logout({ logoutParams: { returnTo: window.location.origin } });
}
</script>

<template>
  <div class="min-h-screen flex" style="background-color: var(--color-bg); color: var(--color-text);">

    <!-- Sidebar -->
    <aside class="w-56 shrink-0 border-r flex flex-col" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);">
      <div class="px-5 py-5 border-b" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
        <p class="font-bold text-sm" style="color: var(--color-text);">Admin</p>
        <p class="text-xs font-mono mt-0.5" style="color: var(--color-muted);">Adrien Neyron</p>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-1">
        <NuxtLink to="/admin" class="admin-nav-link" active-class="admin-nav-link--active">
          <LayoutDashboard :size="15" aria-hidden="true" />
          Projets
        </NuxtLink>
        <NuxtLink to="/admin/projects/new" class="admin-nav-link" active-class="admin-nav-link--active">
          <PlusCircle :size="15" aria-hidden="true" />
          Nouveau projet
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
</style>
