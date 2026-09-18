<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { staticProfileFallback, type Profile } from "~/stores/profile";

definePageMeta({ layout: "admin", middleware: "admin" });

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";

const profile = ref<Profile | null>(null);
const loading = ref(false);
const saving  = ref(false);
const error   = ref("");
const saved   = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const result = await $fetch<Profile | null>("/api/profile");
    profile.value = result ? { ...staticProfileFallback, ...result } : staticProfileFallback;
  } catch {
    profile.value = staticProfileFallback;
  } finally {
    loading.value = false;
  }
});

async function handleSubmit(payload: Profile) {
  saving.value = true;
  error.value  = "";
  saved.value  = false;
  try {
    const token = getToken();
    await $fetch("/api/admin/profile", {
      method:  "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body:    payload,
    });
    saved.value = true;
  } catch {
    error.value = "Erreur lors de l'enregistrement du profil.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="p-8 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-2xl font-bold" style="font-family: var(--font-title);">Profil</h1>
      <p class="text-sm mt-0.5" style="color: var(--color-muted);">
        Bio, coordonnées, photo et CV affichés sur le site public.
      </p>
    </div>

    <div v-if="saved" class="mb-4 p-3 rounded-lg text-sm" style="background: color-mix(in srgb, #22c55e 12%, transparent); color: #16a34a;">
      Profil enregistré.
    </div>
    <div v-if="error" class="mb-4 p-3 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--color-muted);">Chargement…</div>

    <div v-else-if="profile" class="p-6 rounded-xl border" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);">
      <AdminProfileForm :initial="profile" :loading="saving" @submit="handleSubmit" />
    </div>
  </div>
</template>
