<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Stage, StageKind } from "~/utils/stages";

/**
 * Étape de la trace de l'accueil (voir utils/stages.ts). Un chiffre vide = l'étape s'affiche sans chiffre.
 * Fiches liées : cases à cocher parmi les projets publics ; un slug inconnu (fiche pas encore créée) est gardé
 * dans « Autres slugs » et ne devient un lien qu'une fois le projet créé.
 */
const props = defineProps<{ initial?: Partial<Stage>; loading?: boolean; readonly?: boolean }>();
const emit  = defineEmits<{ submit: [payload: Stage] }>();

const form = ref<Stage>({
  key: "", order: 0, kind: "etape", period: "", title: "", place: "", summary: "",
  figure: "", figureLabel: "", projects: [],
  ...props.initial,
});

const KINDS: { value: StageKind; label: string }[] = [
  { value: "depart",  label: "Départ" },
  { value: "etape",   label: "Étape (numérotée)" },
  { value: "bivouac", label: "Bivouac (petit marqueur, sans numéro)" },
  { value: "final",   label: "Cairn final (lien vers Contact)" },
];

const projects = ref<{ slug: string; title: string }[]>([]);
const loaded = ref(false);
const checked = ref<string[]>([]);
const othersInput = ref("");

// Les slugs liés connus sont cochés ; les autres (fiche pas encore créée) passent dans « Autres slugs » pour ne pas être perdus.
function splitLinked(rows: { slug: string }[]) {
  const known = new Set(rows.map((p) => p.slug));
  const linked = form.value.projects ?? [];
  checked.value = linked.filter((s) => known.has(s));
  othersInput.value = linked.filter((s) => !known.has(s)).join(", ");
}

onMounted(async () => {
  try {
    const rows = await $fetch<{ slug?: string; title?: string }[]>("/api/projects");
    projects.value = rows.filter((p) => p.slug).map((p) => ({ slug: p.slug!, title: p.title || p.slug! }));
  } catch {
    projects.value = [];
  }
  splitLinked(projects.value);
  loaded.value = true;
});

function onSubmit() {
  if (props.readonly) return;
  const others = othersInput.value.split(",").map((s) => s.trim()).filter(Boolean);
  emit("submit", { ...form.value, projects: [...new Set([...checked.value, ...others])] });
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <!-- Lecture seule (visiteur) : fieldset désactivé = aucun champ ni bouton actionnable, valeurs lisibles -->
    <fieldset :disabled="readonly" class="admin-form-body space-y-6">

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="sf-kind" class="admin-label">Type *</label>
          <select id="sf-kind" v-model="form.kind" required class="admin-input">
            <option v-for="k in KINDS" :key="k.value" :value="k.value">{{ k.label }}</option>
          </select>
        </div>
        <div>
          <label for="sf-order" class="admin-label">Rang sur la trace *</label>
          <input id="sf-order" v-model.number="form.order" type="number" min="0" step="1" required class="admin-input" />
        </div>
        <div>
          <label for="sf-key" class="admin-label">Clé *</label>
          <input id="sf-key" v-model="form.key" required class="admin-input font-mono text-sm" placeholder="etape-02" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2">
          <label for="sf-title" class="admin-label">Titre *</label>
          <input id="sf-title" v-model="form.title" required class="admin-input" placeholder="DGFiP, mission via BeTeam" />
        </div>
        <div>
          <label for="sf-place" class="admin-label">Lieu</label>
          <input id="sf-place" v-model="form.place" class="admin-input" placeholder="Paris" />
        </div>
      </div>

      <div>
        <label for="sf-period" class="admin-label">Période</label>
        <input id="sf-period" v-model="form.period" class="admin-input" placeholder="Déc. 2023 – Oct. 2025" />
      </div>

      <div>
        <label for="sf-summary" class="admin-label">Résumé <span class="normal-case font-normal">(une phrase)</span></label>
        <textarea id="sf-summary" v-model="form.summary" rows="2" class="admin-input resize-none" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-4">
        <div>
          <label for="sf-figure" class="admin-label">Chiffre</label>
          <input id="sf-figure" v-model="form.figure" class="admin-input" placeholder="−50 %" aria-describedby="sf-figure-help" />
        </div>
        <div>
          <label for="sf-figure-label" class="admin-label">Libellé du chiffre</label>
          <input id="sf-figure-label" v-model="form.figureLabel" class="admin-input" placeholder="de temps de traitement" />
        </div>
        <p id="sf-figure-help" class="md:col-span-2 text-xs text-(--color-muted)">Vide : l'étape s'affiche sans chiffre (aucune valeur n'est inventée).</p>
      </div>

      <fieldset class="space-y-2">
        <legend class="admin-label">Fiches liées</legend>
        <p v-if="!loaded" class="text-sm text-(--color-muted)">Chargement des projets…</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <label v-for="p in projects" :key="p.slug" class="admin-check">
            <input v-model="checked" type="checkbox" :value="p.slug" />
            <span>{{ p.title }} <span class="font-mono text-xs text-(--color-muted)">{{ p.slug }}</span></span>
          </label>
        </div>
        <div>
          <label for="sf-others" class="admin-label">Autres slugs <span class="normal-case font-normal">(fiches pas encore créées, séparés par des virgules)</span></label>
          <input id="sf-others" v-model="othersInput" class="admin-input font-mono text-sm" placeholder="hellostay" />
        </div>
      </fieldset>

      <div v-if="!readonly" class="flex justify-end pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2.5 min-h-11 rounded-lg bg-(--color-accent) text-white font-medium transition hover:opacity-90 disabled:opacity-50"
        >
          {{ loading ? "Enregistrement…" : "Enregistrer l'étape" }}
        </button>
      </div>
    </fieldset>
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
.admin-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  font-size: 0.875rem;
  cursor: pointer;
}
.admin-check input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--color-accent);
}
</style>
