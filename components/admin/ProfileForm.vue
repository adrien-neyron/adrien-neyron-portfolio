<script setup lang="ts">
import { ref } from "vue";
import type { Profile } from "~/stores/profile";

const props = defineProps<{ initial: Profile; loading?: boolean }>();
const emit  = defineEmits<{ submit: [payload: Profile] }>();

const form = ref<Profile>({ ...props.initial, location: { ...props.initial.location }, profiles: [...props.initial.profiles] });

// Paragraphes "about" et liens sociaux édités comme du texte multi-lignes
const aboutInput = ref(form.value.about.join("\n\n"));

function addSocial() {
  form.value.profiles.push({ network: "", username: "", url: "", icon: "" });
}
function removeSocial(index: number) {
  form.value.profiles.splice(index, 1);
}

function onSubmit() {
  form.value.about = aboutInput.value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  emit("submit", { ...form.value });
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">

    <!-- Identité -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Nom *</label>
        <input v-model="form.name" required class="admin-input" />
      </div>
      <div>
        <label class="admin-label">Titre / label</label>
        <input v-model="form.label" class="admin-input" placeholder="Développeur Web Fullstack JS · Vue.js…" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Email *</label>
        <input v-model="form.email" type="email" required class="admin-input" />
      </div>
      <div>
        <label class="admin-label">Téléphone</label>
        <input v-model="form.phone" class="admin-input" />
      </div>
    </div>

    <!-- Accroche (Home) -->
    <div class="grid grid-cols-1 gap-4">
      <div>
        <label class="admin-label">Titre principal (accueil)</label>
        <input v-model="form.heroTitle" class="admin-input" placeholder="Développeur spécialisé sport & outdoor" />
      </div>
      <div>
        <label class="admin-label">Accroche principale (job1)</label>
        <input v-model="form.job1" class="admin-input" placeholder="Je livre des applications qui tiennent en production." />
      </div>
      <div>
        <label class="admin-label">Accroche secondaire (job2)</label>
        <textarea v-model="form.job2" rows="2" class="admin-input resize-none" />
      </div>
      <div>
        <label class="admin-label">Sous-titre du header</label>
        <input v-model="form.headerSubtitle" class="admin-input" placeholder="Fullstack JS · Vue.js / Node.js · AI & Automation" />
      </div>
      <div>
        <label class="admin-label">Description courte</label>
        <textarea v-model="form.description" rows="2" class="admin-input resize-none" />
      </div>
      <div>
        <label class="admin-label">Résumé (localisation / dispo)</label>
        <input v-model="form.summary" class="admin-input" placeholder="CDI & Freelance · Haute-Savoie · Lyon · Remote" />
      </div>
    </div>

    <!-- About -->
    <div>
      <label class="admin-label">Paragraphes "À propos" <span class="text-xs text-(--color-muted)">(un paragraphe par bloc, séparés par une ligne vide)</span></label>
      <textarea v-model="aboutInput" rows="8" class="admin-input resize-y" />
    </div>

    <!-- Images / CV -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Photo de profil</label>
        <AdminFileUpload v-model="form.pictureUrl" accept="image/*" label="Changer la photo" />
      </div>
      <div>
        <label class="admin-label">CV (PDF)</label>
        <AdminFileUpload v-model="form.cvUrl" accept="application/pdf" label="Changer le CV" />
      </div>
    </div>

    <!-- URL du site + mots-clés -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">URL publique du site</label>
        <input v-model="form.url" class="admin-input" placeholder="https://adrien-neyron-portfolio.vercel.app/" />
      </div>
      <div>
        <label class="admin-label">Mots-clés SEO</label>
        <input v-model="form.keywords" class="admin-input" />
      </div>
    </div>

    <!-- Localisation -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label class="admin-label">Ville</label>
        <input v-model="form.location.city" class="admin-input" />
      </div>
      <div>
        <label class="admin-label">Région</label>
        <input v-model="form.location.region" class="admin-input" />
      </div>
      <div>
        <label class="admin-label">Code postal</label>
        <input v-model="form.location.postalCode" class="admin-input" />
      </div>
    </div>

    <!-- Réseaux sociaux -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="admin-label mb-0">Liens sociaux</label>
        <button type="button" class="text-xs font-medium" style="color: var(--color-accent);" @click="addSocial">+ Ajouter</button>
      </div>
      <div v-for="(social, i) in form.profiles" :key="i" class="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-2 mb-2 items-center">
        <input v-model="social.network" class="admin-input" placeholder="Réseau (LinkedIn…)" />
        <input v-model="social.username" class="admin-input" placeholder="Nom d'utilisateur" />
        <input v-model="social.url" class="admin-input" placeholder="https://…" />
        <button type="button" class="text-xs px-2 py-1" style="color: #e53e3e;" @click="removeSocial(i)">✕</button>
      </div>
    </div>

    <!-- Submit -->
    <div class="flex justify-end pt-2">
      <button
        type="submit"
        :disabled="loading"
        class="px-6 py-2.5 rounded-lg bg-(--color-accent) text-white font-medium transition hover:opacity-90 disabled:opacity-50"
      >
        {{ loading ? "Enregistrement…" : "Enregistrer le profil" }}
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
