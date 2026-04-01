<script setup lang="ts">
import { useAuth0 } from "@auth0/auth0-vue";
import { Lock } from "lucide-vue-next";

const { isAuthenticated, loginWithRedirect } = useAuth0();
</script>

<template>
  <NuxtLink
    v-if="isAuthenticated"
    to="/admin"
    class="p-1.5 rounded-lg transition-colors hover:bg-(--color-accent)/10"
    :style="{ color: 'var(--color-accent)' }"
    title="Espace administrateur"
    aria-label="Espace administrateur"
  >
    <Lock :size="16" aria-hidden="true" />
  </NuxtLink>
  <button
    v-else
    class="p-1.5 rounded-lg transition-colors hover:bg-(--color-accent)/10 text-(--color-muted) hover:text-(--color-accent)"
    title="Connexion administrateur"
    aria-label="Connexion administrateur"
    @click="loginWithRedirect({ appState: { target: '/admin' } })"
  >
    <Lock :size="16" aria-hidden="true" />
  </button>
</template>
