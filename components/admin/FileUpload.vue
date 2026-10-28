<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { Upload, Loader2 } from "lucide-vue-next";
import { useBlobTrash } from "~/composables/useBlobTrash";
import { convertToWebp, isConvertible, formatKo } from "~/utils/imageWebp";

const props = defineProps<{
  modelValue?: string;
  accept?: string;
  label?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";

const { queue } = useBlobTrash();
const uploading = ref(false);
const previewFailed = ref(false);
const error      = ref("");
const status     = ref("");
watch(() => props.modelValue, () => { previewFailed.value = false; });
const inputEl    = ref<HTMLInputElement | null>(null);

async function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;
  error.value = "";
  status.value = "";

  try {
    // Images : converties en WebP (≤ 1600 px) avant l'envoi ; PDF, SVG et GIF partent tels quels.
    let toSend = file;
    if (isConvertible(file.type)) {
      try { toSend = await convertToWebp(file); } catch { toSend = file; }
    }
    const formData = new FormData();
    formData.append("file", toSend);

    const token = getToken();
    const result = await $fetch<{ url: string }>("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    // L'image remplacée sera supprimée du stockage à l'enregistrement du formulaire (composables/useBlobTrash.ts).
    if (props.modelValue && props.modelValue !== result.url) queue(props.modelValue);
    previewFailed.value = false;
    emit("update:modelValue", result.url);
    status.value = (toSend === file
      ? `Fichier envoyé (${formatKo(file.size)}).`
      : `Image envoyée en WebP : ${formatKo(file.size)} → ${formatKo(toSend.size)}.`)
      + (props.modelValue ? " L'ancienne image sera supprimée à l'enregistrement." : "");
  } catch (err: unknown) {
    const fe = err as { statusMessage?: string; message?: string };
    error.value = fe.statusMessage ?? fe.message ?? "Échec de l'envoi.";
  } finally {
    uploading.value = false;
    if (inputEl.value) inputEl.value.value = "";
  }
}
</script>

<template>
  <div class="flex items-start gap-3">
    <div v-if="modelValue" class="w-20 h-20 rounded-lg overflow-hidden shrink-0 border" style="border-color: color-mix(in srgb, var(--color-accent) 25%, transparent);">
      <img
        v-if="(!accept || accept.startsWith('image')) && !previewFailed"
        :src="modelValue"
        alt=""
        class="w-full h-full object-cover"
        @error="previewFailed = true"
      >
      <div v-else class="w-full h-full flex items-center justify-center text-xs" style="color: var(--color-muted);">
        {{ previewFailed ? "Aperçu indisponible" : "Fichier" }}
      </div>
    </div>

    <div class="flex-1">
      <label class="inline-flex items-center gap-2 px-3 py-2 min-h-11 rounded-lg text-xs focus-within:outline-2 focus-within:outline-offset-2 font-medium cursor-pointer transition hover:opacity-80" style="border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent); color: var(--color-muted);">
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
      <p v-if="error" role="alert" class="text-xs mt-1 font-semibold" style="color: var(--color-accent);">{{ error }}</p>
      <p role="status" class="text-xs mt-1" style="color: var(--color-muted);">{{ status }}</p>
    </div>
  </div>
</template>
