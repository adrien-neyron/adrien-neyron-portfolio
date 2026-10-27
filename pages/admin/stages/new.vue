<script setup lang="ts">
import type { Stage, StageIssue } from "~/utils/stages";
import { apiErrorMessage } from "~/utils/apiError";
import { ref } from "vue";

definePageMeta({ layout: "admin", middleware: "admin" });

const { getToken } = useAdminSession();
const router  = useRouter();
const loading = ref(false);
const error   = ref("");
const issues  = ref<StageIssue[]>([]);

async function handleSubmit(payload: Stage) {
  loading.value = true;
  error.value   = "";
  issues.value  = [];
  try {
    await $fetch("/api/admin/stages", {
      method:  "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body:    payload,
    });
    router.push("/admin/stages");
  } catch (e) {
    const r = apiErrorMessage(e, "créer l'étape");
    error.value   = r.message;
    issues.value  = r.issues;
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

    <div
      v-if="error" :role="issues.length ? undefined : 'alert'" class="mb-4 p-3 rounded-lg text-sm font-medium"
      style="border: 2px solid var(--color-accent); background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)); color: var(--color-text);"
    >
      {{ error }}
    </div>

    <div class="p-4 sm:p-6 rounded-xl border" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);">
      <AdminStageForm :loading="loading" :server-issues="issues" @submit="handleSubmit" />
    </div>
  </div>
</template>
