<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { Sparkles, Wand2, Loader2 } from "lucide-vue-next";

interface CarnetPayload {
  slug: string;
  title: string;
  excerpt: string;
  category: "Trail" | "Dev" | "Coulisses";
  date: string;
  cover: string;
  content: string;
  data: {
    elevation: string;
    heartRate: string;
    pace: string;
  };
}

const props = defineProps<{ initial?: Partial<CarnetPayload>; loading?: boolean }>();
const emit  = defineEmits<{ submit: [payload: CarnetPayload] }>();

const today = new Date().toISOString().slice(0, 10);

const form = ref<CarnetPayload>({
  slug: "", title: "", excerpt: "", category: "Dev", date: today, cover: "", content: "",
  data: { elevation: "", heartRate: "", pace: "" },
  ...props.initial,
  data: { elevation: "", heartRate: "", pace: "", ...props.initial?.data },
});

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";

// Auto-génère le slug depuis le titre, tant que l'admin ne l'a pas modifié
// à la main — même principe que AiToolForm.vue.
watch(() => form.value.title, (val) => {
  if (!props.initial?.slug) {
    form.value.slug = val
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
});

function onSubmit() {
  emit("submit", { ...form.value });
}

// ─── Assistance IA ──────────────────────────────────────────────────────
type AiMode = "draft" | "improve" | null;
const aiOpen        = ref<AiMode>(null);
const aiLoading      = ref(false);
const aiError        = ref("");
const draftTopic     = ref("");
const draftNotes     = ref("");
const improveInstruction = ref("");
const aiPreview = ref<{ title?: string; excerpt?: string; content: string } | null>(null);

function toggleAi(mode: Exclude<AiMode, null>) {
  aiOpen.value  = aiOpen.value === mode ? null : mode;
  aiError.value = "";
  aiPreview.value = null;
}

async function generateDraft() {
  if (!draftTopic.value.trim()) {
    aiError.value = "Indique un sujet pour générer un brouillon.";
    return;
  }
  aiLoading.value = true;
  aiError.value   = "";
  try {
    const token = getToken();
    const result = await $fetch<{ title: string; excerpt: string; content: string }>("/api/admin/carnet/generate", {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    { mode: "draft", topic: draftTopic.value, notes: draftNotes.value, category: form.value.category },
    });
    aiPreview.value = result;
  } catch (e: unknown) {
    const fe = e as { statusMessage?: string; message?: string };
    aiError.value = fe.statusMessage ?? fe.message ?? "Échec de la génération.";
  } finally {
    aiLoading.value = false;
  }
}

async function improveText() {
  if (!form.value.content.trim()) {
    aiError.value = "Écris (ou colle) d'abord un texte à améliorer.";
    return;
  }
  aiLoading.value = true;
  aiError.value   = "";
  try {
    const token = getToken();
    const result = await $fetch<{ content: string }>("/api/admin/carnet/generate", {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    { mode: "improve", existingContent: form.value.content, instruction: improveInstruction.value },
    });
    aiPreview.value = { content: result.content };
  } catch (e: unknown) {
    const fe = e as { statusMessage?: string; message?: string };
    aiError.value = fe.statusMessage ?? fe.message ?? "Échec de l'amélioration.";
  } finally {
    aiLoading.value = false;
  }
}

function applyAiPreview() {
  if (!aiPreview.value) return;
  if (aiPreview.value.title) form.value.title = aiPreview.value.title;
  if (aiPreview.value.excerpt) form.value.excerpt = aiPreview.value.excerpt;
  form.value.content = aiPreview.value.content;
  aiPreview.value = null;
  aiOpen.value = null;
}

function discardAiPreview() {
  aiPreview.value = null;
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Titre *</label>
        <input v-model="form.title" required class="admin-input" placeholder="Titre de l'article" />
      </div>
      <div>
        <label class="admin-label">Slug *</label>
        <input v-model="form.slug" required class="admin-input font-mono text-sm" placeholder="titre-de-larticle" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="admin-label">Catégorie *</label>
        <select v-model="form.category" required class="admin-input">
          <option value="Trail">Trail</option>
          <option value="Dev">Dev</option>
          <option value="Coulisses">Coulisses</option>
        </select>
      </div>
      <div>
        <label class="admin-label">Date *</label>
        <input v-model="form.date" type="date" required class="admin-input" />
      </div>
    </div>

    <div>
      <label class="admin-label">Accroche <span class="text-xs text-(--color-muted)">(une phrase, affichée sur la carte et l'article)</span></label>
      <textarea v-model="form.excerpt" rows="2" class="admin-input resize-none" />
    </div>

    <div>
      <label class="admin-label">Photo de couverture</label>
      <AdminFileUpload v-model="form.cover" accept="image/*" label="Uploader une image" />
    </div>

    <!-- Bloc données optionnel (sorties trail) -->
    <div>
      <label class="admin-label">Données de sortie <span class="text-xs text-(--color-muted)">(optionnel — laisser vide si non pertinent)</span></label>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input v-model="form.data.elevation" class="admin-input" placeholder="D+ (ex. +2400m)" />
        <input v-model="form.data.heartRate" class="admin-input" placeholder="FC moy. (ex. 152 bpm)" />
        <input v-model="form.data.pace" class="admin-input" placeholder="Allure (ex. 6'20/km)" />
      </div>
    </div>

    <!-- Contenu + assistance IA -->
    <div>
      <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
        <label class="admin-label mb-0">Contenu * <span class="text-xs text-(--color-muted)">(Markdown)</span></label>
        <div class="flex items-center gap-2">
          <button type="button" class="ai-button" @click="toggleAi('draft')">
            <Sparkles :size="13" aria-hidden="true" />
            Générer un brouillon
          </button>
          <button type="button" class="ai-button" @click="toggleAi('improve')">
            <Wand2 :size="13" aria-hidden="true" />
            Améliorer avec l'IA
          </button>
        </div>
      </div>

      <!-- Panneau "Générer un brouillon" -->
      <div v-if="aiOpen === 'draft'" class="ai-panel">
        <div>
          <label class="admin-label">Sujet *</label>
          <input v-model="draftTopic" class="admin-input" placeholder="Ex. La sortie du week-end au Mont Blanc" />
        </div>
        <div>
          <label class="admin-label">Notes / points à couvrir <span class="text-xs text-(--color-muted)">(optionnel)</span></label>
          <textarea v-model="draftNotes" rows="3" class="admin-input resize-none" placeholder="Quelques éléments à intégrer…" />
        </div>
        <button type="button" class="button-accent px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50" :disabled="aiLoading" @click="generateDraft">
          <Loader2 v-if="aiLoading" :size="14" class="animate-spin" aria-hidden="true" />
          <Sparkles v-else :size="14" aria-hidden="true" />
          {{ aiLoading ? "Génération…" : "Générer" }}
        </button>
      </div>

      <!-- Panneau "Améliorer" -->
      <div v-if="aiOpen === 'improve'" class="ai-panel">
        <div>
          <label class="admin-label">Consigne <span class="text-xs text-(--color-muted)">(optionnel — par défaut : style, clarté, grammaire)</span></label>
          <input v-model="improveInstruction" class="admin-input" placeholder="Ex. rends le ton plus direct, raccourcis le premier paragraphe…" />
        </div>
        <button type="button" class="button-accent px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50" :disabled="aiLoading" @click="improveText">
          <Loader2 v-if="aiLoading" :size="14" class="animate-spin" aria-hidden="true" />
          <Wand2 v-else :size="14" aria-hidden="true" />
          {{ aiLoading ? "Amélioration…" : "Améliorer" }}
        </button>
      </div>

      <p v-if="aiError" class="text-xs mt-2" style="color: #e53e3e;">{{ aiError }}</p>

      <!-- Prévisualisation du résultat IA -->
      <div v-if="aiPreview" class="trail-card p-4 mt-3 space-y-2">
        <p class="text-xs font-mono uppercase tracking-widest" style="color: var(--color-accent);">Proposition de l'IA</p>
        <p v-if="aiPreview.title" class="font-bold text-sm">{{ aiPreview.title }}</p>
        <p v-if="aiPreview.excerpt" class="text-xs italic" style="color: var(--color-muted);">{{ aiPreview.excerpt }}</p>
        <p class="text-xs whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto" style="color: var(--color-text);">{{ aiPreview.content }}</p>
        <div class="flex items-center gap-2 pt-1">
          <button type="button" class="button-accent px-3 py-1.5 rounded-lg text-xs font-medium" @click="applyAiPreview">Utiliser ce texte</button>
          <button type="button" class="button-empty px-3 py-1.5 rounded-lg text-xs font-medium" @click="discardAiPreview">Ignorer</button>
        </div>
      </div>

      <textarea v-model="form.content" rows="14" required class="admin-input resize-y font-mono text-xs mt-3" placeholder="## Un premier titre&#10;&#10;Le corps de l'article, en Markdown…" />
    </div>

    <!-- Submit -->
    <div class="flex justify-end pt-2">
      <button
        type="submit"
        :disabled="loading"
        class="px-6 py-2.5 rounded-lg bg-(--color-accent) text-white font-medium transition hover:opacity-90 disabled:opacity-50"
      >
        {{ loading ? "Enregistrement…" : "Enregistrer l'article" }}
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
.ai-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-accent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
  background: color-mix(in srgb, var(--color-accent) 6%, transparent);
  transition: background 0.15s;
}
.ai-button:hover {
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
}
.ai-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px dashed color-mix(in srgb, var(--color-accent) 30%, transparent);
  background: color-mix(in srgb, var(--color-accent) 4%, transparent);
  margin-bottom: 0.75rem;
}
</style>
