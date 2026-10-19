<script setup lang="ts">
import type { Stage } from "~/utils/stages";
import { ref, onMounted } from "vue";

definePageMeta({ layout: "admin", middleware: "admin" });

const { isAdmin, getToken, list } = useAdminSession();
const route   = useRoute();
const router  = useRouter();
const id      = route.params.id as string;

const stage   = ref<Record<string, unknown> | null>(null);
const loading = ref(false);
const error   = ref("");

onMounted(async () => {
  try {
    const rows = await list<Record<string, unknown>>("stages");
    stage.value = rows.find((s) => s.id === id) ?? null;
    if (!stage.value) error.value = "Étape introuvable.";
  } catch {
    error.value = "Impossible de charger l'étape.";
  }
});

async function handleSubmit(payload: Stage) {
  loading.value = true;
  error.value   = "";
  try {
    await $fetch(`/api/admin/stages/${id}`, {
      method:  "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body:    payload,
    });
    router.push("/admin/stages");
  } catch {
    error.value = "Erreur lors de la mise à jour.";
    loading.value = false;
  }
}
</script>

<template>
  <div class="p-4 sm:p-8 max-w-4xl">
    <div class="mb-8">
      <NuxtLink to="/admin/stages" class="text-sm hover:underline" style="color: var(--color-muted);">← Retour</NuxtLink>
      <h1 class="text-2xl font-bold mt-2" style="font-family: var(--font-title);">{{ isAdmin ? "Modifier" : "Consulter" }} l'étape</h1>
    </div>

    <div v-if="error" role="alert" class="mb-4 p-3 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div v-if="!stage && !error" class="py-20 text-center" style="color: var(--color-muted);">Chargement…</div>

    <div v-else-if="stage" class="p-4 sm:p-6 rounded-xl border" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);">
      <AdminStageForm :initial="stage" :loading="loading" :readonly="!isAdmin" @submit="handleSubmit" />
    </div>
  </div>
</template>
