<script setup lang="ts">
import { ref, watch } from "vue";

interface ProjectPayload {
  slug: string;
  title: string;
  tagline: string;
  role: string;
  description: string;
  challenge: string;
  solution: string;
  result: string;
  technologies: string[];
  image_light: string;
  image_dark: string;
  link: string;
  code: string;
  difficulty: "Débutant" | "Intermédiaire" | "Expert";
  duration: string;
  category: string;
}

const props = defineProps<{ initial?: Partial<ProjectPayload>; loading?: boolean }>();
const emit  = defineEmits<{ submit: [payload: ProjectPayload] }>();

const form = ref<ProjectPayload>({
  slug: "", title: "", tagline: "", role: "",
  description: "", challenge: "", solution: "", result: "",
  technologies: [], image_light: "", image_dark: "",
  link: "", code: "",
  difficulty: "Intermédiaire", duration: "", category: "",
  ...props.initial,
});

// Technologies en tant que string CSV dans l'input
const techInput = ref((props.initial?.technologies ?? []).join(", "));

// Auto-génère le slug depuis le titre
watch(() => form.value.title, (val) => {
  if (!props.initial?.slug) {
    form.value.slug = val
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});

function onSubmit() {
  form.value.technologies = techInput.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  emit("submit", { ...form.value });
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">

    <!-- Titre + Slug -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Titre *</label>
        <input v-model="form.title" required class="admin-input" placeholder="Boutique Trail Running" />
      </div>
      <div>
        <label class="admin-label">Slug *</label>
        <input v-model="form.slug" required class="admin-input font-mono text-sm" placeholder="boutique-trail-running" />
      </div>
    </div>

    <!-- Tagline + Rôle -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Tagline</label>
        <input v-model="form.tagline" class="admin-input" placeholder="Sentier commercial — e-commerce…" />
      </div>
      <div>
        <label class="admin-label">Rôle</label>
        <input v-model="form.role" class="admin-input" placeholder="Développeur Full-Stack" />
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="admin-label">Description</label>
      <textarea v-model="form.description" rows="3" class="admin-input resize-none" />
    </div>

    <!-- Défi + Solution -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Défi</label>
        <textarea v-model="form.challenge" rows="4" class="admin-input resize-none" />
      </div>
      <div>
        <label class="admin-label">Solution</label>
        <textarea v-model="form.solution" rows="4" class="admin-input resize-none" />
      </div>
    </div>

    <!-- Résultat -->
    <div>
      <label class="admin-label">Résultat</label>
      <textarea v-model="form.result" rows="2" class="admin-input resize-none" />
    </div>

    <!-- Technologies -->
    <div>
      <label class="admin-label">Technologies <span class="text-xs text-(--color-muted)">(séparées par des virgules)</span></label>
      <input v-model="techInput" class="admin-input" placeholder="Nuxt 3, TypeScript, PostgreSQL…" />
    </div>

    <!-- Images -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Image mode clair (URL)</label>
        <input v-model="form.image_light" class="admin-input" placeholder="/recentprojects/mon-projet-light.png" />
      </div>
      <div>
        <label class="admin-label">Image mode sombre (URL)</label>
        <input v-model="form.image_dark" class="admin-input" placeholder="/recentprojects/mon-projet-dark.png" />
      </div>
    </div>

    <!-- Liens -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Lien démo (optionnel)</label>
        <input v-model="form.link" type="url" class="admin-input" placeholder="https://…" />
      </div>
      <div>
        <label class="admin-label">Lien code source (optionnel)</label>
        <input v-model="form.code" type="url" class="admin-input" placeholder="https://github.com/…" />
      </div>
    </div>

    <!-- Difficulté / Durée / Catégorie -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="admin-label">Difficulté *</label>
        <select v-model="form.difficulty" required class="admin-input">
          <option>Débutant</option>
          <option>Intermédiaire</option>
          <option>Expert</option>
        </select>
      </div>
      <div>
        <label class="admin-label">Durée *</label>
        <input v-model="form.duration" required class="admin-input" placeholder="3 mois" />
      </div>
      <div>
        <label class="admin-label">Catégorie *</label>
        <select v-model="form.category" required class="admin-input">
          <option>E-commerce</option>
          <option>Outil métier</option>
          <option>LMS</option>
          <option>IA</option>
          <option>Autre</option>
        </select>
      </div>
    </div>

    <!-- Submit -->
    <div class="flex justify-end pt-2">
      <button
        type="submit"
        :disabled="loading"
        class="px-6 py-2.5 rounded-lg bg-(--color-accent) text-white font-medium transition hover:opacity-90 disabled:opacity-50"
      >
        {{ loading ? "Enregistrement…" : "Enregistrer le projet" }}
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
