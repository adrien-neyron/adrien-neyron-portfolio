<script setup lang="ts">
definePageMeta({ ssr: false });

import { useAuth0 } from "@auth0/auth0-vue";

const { handleRedirectCallback } = useAuth0();
const router = useRouter();

onMounted(async () => {
  try {
    const { appState } = await handleRedirectCallback();
    router.replace(appState?.target ?? "/admin");
  } catch {
    router.replace("/");
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
    <p class="text-sm text-[var(--color-muted)]">Connexion en cours…</p>
  </div>
</template>
