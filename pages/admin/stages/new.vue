<script setup lang="ts">
import type { Stage } from "~/utils/stages";
import { ref } from "vue";

definePageMeta({ layout: "admin", middleware: "admin" });

const { getToken } = useAdminSession();
const router  = useRouter();
const loading = ref(false);
const error   = ref("");

async function handleSubmit(payload: Stage) {
  loading.value = true;
  error.value   = "";
  try {
    await $fetch("/api/admin/stages", {
      method:  "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body:    payload,
    });
    router.push("/admin/stages");
  } catch {
    error.value = "Erreur lors de la création de l'étape (clé déjà utilisée ?).";
    loading.value = false;
  }
}
</script>

<template>
  <div class="p-4 sm:p-8 max-w-4xl">
    <div class="mb-8">
      <NuxtLink to="/admin/stages" class="text-sm hover:underline" style="color: var(--color-muted);">← Retour</NuxtLink>
      <h1 class="text-2xl font-bold mt-2" style="font-family: var(--font-title);">Nouvelle étape</h1>
    </div>

    <div v-if="error" role="alert" class="mb-4 p-3 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div class="p-4 sm:p-6 rounded-xl border" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);">
      <AdminStageForm :loading="loading" @submit="handleSubmit" />
    </div>
  </div>
</template>
