<script setup lang="ts">
import { ref } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { Upload, Loader2 } from "lucide-vue-next";

const props = defineProps<{
  modelValue?: string;
  accept?: string;
  label?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";

const uploading = ref(false);
const error      = ref("");
const inputEl    = ref<HTMLInputElement | null>(null);

async function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;
  error.value = "";

  try {
    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    const result = await $fetch<{ url: string }>("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    emit("update:modelValue", result.url);
  } catch (err: unknown) {
    const fe = err as { statusMessage?: string; message?: string };
    error.value = fe.statusMessage ?? fe.message ?? "Échec de l'upload.";
  } finally {
    uploading.value = false;
    if (inputEl.value) inputEl.value.value = "";
  }
}
</script>

<template>
  <div class="flex items-start gap-3">
    <div v-if="modelValue" class="w-16 h-16 rounded-lg overflow-hidden shrink-0 border" style="border-color: color-mix(in srgb, var(--color-accent) 25%, transparent);">
      <img
        v-if="!accept || accept.startsWith('image')"
        :src="modelValue"
        alt=""
        class="w-full h-full object-cover"
      >
      <div v-else class="w-full h-full flex items-center justify-center text-xs" style="color: var(--color-muted);">
        Fichier
      </div>
    </div>

    <div class="flex-1">
      <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition hover:opacity-80" style="border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent); color: var(--color-muted);">
        <Loader2 v-if="uploading" :size="14" class="animate-spin" />
        <Upload v-else :size="14" />
        {{ uploading ? "Envoi…" : (label ?? "Choisir un fichier") }}
        <input
          ref="inputEl"
          type="file"
          :accept="accept ?? 'image/*'"
          class="hidden"
          :disabled="uploading"
          @change="onFileChange"
        >
      </label>
      <p v-if="error" class="text-xs mt-1" style="color: #e53e3e;">{{ error }}</p>
    </div>
  </div>
</template>
