<script setup lang="ts">
import { ref, watch } from "vue";

interface AiToolPayload {
  slug: string;
  name: string;
  provider: string;
  category: "Productivité" | "Création" | "Analyse" | "Automatisation";
  tagline: string;
  description: string;
  useCases: string[];
  businessValue: string;
  icon: string;
  link: string;
}

const props = defineProps<{ initial?: Partial<AiToolPayload>; loading?: boolean }>();
const emit  = defineEmits<{ submit: [payload: AiToolPayload] }>();

const form = ref<AiToolPayload>({
  slug: "", name: "", provider: "", category: "Productivité",
  tagline: "", description: "", useCases: [], businessValue: "",
  icon: "🤖", link: "",
  ...props.initial,
});

const useCasesInput = ref((props.initial?.useCases ?? []).join("\n"));

// Auto-génère le slug depuis le nom
watch(() => form.value.name, (val) => {
  if (!props.initial?.slug) {
    form.value.slug = val
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});

function onSubmit() {
  form.value.useCases = useCasesInput.value
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
  emit("submit", { ...form.value });
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Nom *</label>
        <input v-model="form.name" required class="admin-input" placeholder="Claude" />
      </div>
      <div>
        <label class="admin-label">Slug *</label>
        <input v-model="form.slug" required class="admin-input font-mono text-sm" placeholder="claude-anthropic" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="admin-label">Fournisseur</label>
        <input v-model="form.provider" class="admin-input" placeholder="Anthropic" />
      </div>
      <div>
        <label class="admin-label">Catégorie *</label>
        <select v-model="form.category" required class="admin-input">
          <option>Productivité</option>
          <option>Création</option>
          <option>Analyse</option>
          <option>Automatisation</option>
        </select>
      </div>
      <div>
        <label class="admin-label">Icône (emoji)</label>
        <input v-model="form.icon" class="admin-input" placeholder="🤖" />
      </div>
    </div>

    <div>
      <label class="admin-label">Tagline</label>
      <input v-model="form.tagline" class="admin-input" placeholder="L'assistant IA pour rédiger, analyser…" />
    </div>

    <div>
      <label class="admin-label">Description</label>
      <textarea v-model="form.description" rows="3" class="admin-input resize-none" />
    </div>

    <div>
      <label class="admin-label">Cas d'usage <span class="text-xs text-(--color-muted)">(un par ligne)</span></label>
      <textarea v-model="useCasesInput" rows="4" class="admin-input resize-none" />
    </div>

    <div>
      <label class="admin-label">Valeur business</label>
      <textarea v-model="form.businessValue" rows="2" class="admin-input resize-none" />
    </div>

    <div>
      <label class="admin-label">Lien (optionnel)</label>
      <input v-model="form.link" type="url" class="admin-input" placeholder="https://…" />
    </div>

    <div class="flex justify-end pt-2">
      <button
        type="submit"
        :disabled="loading"
        class="px-6 py-2.5 rounded-lg bg-(--color-accent) text-white font-medium transition hover:opacity-90 disabled:opacity-50"
      >
        {{ loading ? "Enregistrement…" : "Enregistrer l'outil" }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.admin-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-muted);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.admin-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
  background: color-mix(in srgb, var(--color-surface) 60%, transparent);
  color: var(--color-text);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}
.admin-input:focus {
  border-color: var(--color-accent);
}
</style>
