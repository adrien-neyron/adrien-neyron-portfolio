<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";

definePageMeta({ layout: "admin", middleware: "admin" });

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";
const route   = useRoute();
const router  = useRouter();
const id      = route.params.id as string;

const project = ref<Record<string, unknown> | null>(null);
const loading = ref(false);
const error   = ref("");

onMounted(async () => {
  try {
    const token = getToken();
    const rows = await $fetch<Record<string, unknown>[]>("/api/admin/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    project.value = rows.find((p) => p.id === id) ?? null;
    if (!project.value) error.value = "Projet introuvable.";
  } catch {
    error.value = "Impossible de charger le projet.";
  }
});

async function handleSubmit(payload: Record<string, unknown>) {
  loading.value = true;
  error.value   = "";
  try {
    const token = getToken();
    await $fetch(`/api/admin/projects/${id}`, {
      method:  "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body:    payload,
    });
    router.push("/admin");
  } catch {
    error.value = "Erreur lors de la mise à jour.";
    loading.value = false;
  }
}

const initial = computed(() => {
  if (!project.value) return undefined;
  return { ...project.value, technologies: (project.value.technologies as string[]) ?? [] };
});
</script>

<template>
  <div class="p-8 max-w-4xl">
    <div class="mb-8">
      <NuxtLink to="/admin" class="text-sm hover:underline" style="color: var(--color-muted);">← Retour</NuxtLink>
      <h1 class="text-2xl font-bold mt-2" style="font-family: var(--font-title);">Modifier le projet</h1>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div v-if="!project && !error" class="py-20 text-center" style="color: var(--color-muted);">Chargement…</div>

    <div v-else-if="project" class="p-6 rounded-xl border" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);">
      <AdminProjectForm :initial="initial" :loading="loading" @submit="handleSubmit" />
    </div>
  </div>
</template>
