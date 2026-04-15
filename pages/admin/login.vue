<script setup lang="ts">
import { useAuth0 } from "@auth0/auth0-vue";
import { Lock } from "lucide-vue-next";

definePageMeta({ layout: false });

const { loginWithRedirect, isAuthenticated } = useAuth0();

onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo("/admin");
  }
});

function login() {
  loginWithRedirect({ appState: { target: "/admin" } });
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center"
    style="background-color: var(--color-bg);"
  >
    <div
      class="flex flex-col items-center gap-6 p-10 rounded-2xl border"
      style="
        background-color: var(--color-surface);
        border-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
      "
    >
      <div
        class="h-14 w-14 rounded-xl flex items-center justify-center"
        style="background-color: color-mix(in srgb, var(--color-accent) 12%, transparent);"
      >
        <Lock :size="24" style="color: var(--color-accent);" />
      </div>

      <div class="text-center">
        <h1 class="font-bold text-lg" style="color: var(--color-text);">Espace Admin</h1>
        <p class="text-sm mt-1" style="color: var(--color-muted);">Connexion requise pour accéder au tableau de bord.</p>
      </div>

      <button
        class="w-full px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition hover:opacity-90"
        style="background-color: var(--color-accent);"
        @click="login"
      >
        Se connecter avec Auth0
      </button>

      <NuxtLink
        to="/"
        class="text-xs transition"
        style="color: var(--color-muted);"
      >
        ← Retour au portfolio
      </NuxtLink>
    </div>
  </div>
</template>
