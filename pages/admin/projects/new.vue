<script setup lang="ts">
import { ref } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";

definePageMeta({ layout: "admin", middleware: "admin" });

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";
const router  = useRouter();
const loading = ref(false);
const error   = ref("");

async function handleSubmit(payload: Record<string, unknown>) {
  loading.value = true;
  error.value   = "";
  try {
    const token = getToken();
    await $fetch("/api/admin/projects", {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    payload,
    });
    router.push("/admin");
  } catch {
    error.value = "Erreur lors de la création du projet.";
    loading.value = false;
  }
}
</script>

<template>
  <div class="p-8 max-w-4xl">
    <div class="mb-8">
      <NuxtLink to="/admin" class="text-sm hover:underline" style="color: var(--color-muted);">← Retour</NuxtLink>
      <h1 class="text-2xl font-bold mt-2" style="font-family: var(--font-title);">Nouveau projet</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div class="p-6 rounded-xl border" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);">
      <AdminProjectForm :loading="loading" @submit="handleSubmit" />
    </div>
  </div>
</template>
