<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";

definePageMeta({ layout: "admin", middleware: "admin" });

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";
const route   = useRoute();
const router  = useRouter();
const id      = route.params.id as string;

const article = ref<Record<string, unknown> | null>(null);
const loading = ref(false);
const error   = ref("");

onMounted(async () => {
  try {
    const token = getToken();
    const rows = await $fetch<Record<string, unknown>[]>("/api/admin/carnet", {
      headers: { Authorization: `Bearer ${token}` },
    });
    article.value = rows.find((a) => a.id === id) ?? null;
    if (!article.value) error.value = "Article introuvable.";
  } catch {
    error.value = "Impossible de charger l'article.";
  }
});

async function handleSubmit(payload: Record<string, unknown>) {
  loading.value = true;
  error.value   = "";
  try {
    const token = getToken();
    await $fetch(`/api/admin/carnet/${id}`, {
      method:  "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body:    payload,
    });
    router.push("/admin/carnet");
  } catch {
    error.value = "Erreur lors de la mise à jour.";
    loading.value = false;
  }
}
</script>

<template>
  <div class="p-4 sm:p-8 max-w-4xl">
    <div class="mb-8">
      <NuxtLink to="/admin/carnet" class="text-sm hover:underline" style="color: var(--color-muted);">← Retour</NuxtLink>
      <h1 class="text-2xl font-bold mt-2" style="font-family: var(--font-title);">Modifier l'article</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div v-if="!article && !error" class="py-20 text-center" style="color: var(--color-muted);">Chargement…</div>

    <div v-else-if="article" class="p-4 sm:p-6 rounded-xl border" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);">
      <AdminCarnetForm :initial="article" :loading="loading" @submit="handleSubmit" />
    </div>
  </div>
</template>
