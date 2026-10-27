<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import {
  buildStageView, orderForPlacement, placementOf, placementOptions, stageKeyFromTitle, validateStage, PLACE_START,
  type Stage, type StageKind, type StageIssue, type StageField,
} from "~/utils/stages";

/**
 * Étape de la trace de l'accueil (voir utils/stages.ts). Un chiffre vide = l'étape s'affiche sans chiffre.
 * Le numéro d'une étape ne se saisit pas : il découle de son EMPLACEMENT sur la trace (liste « Après … »).
 * Erreurs : récapitulatif en haut (role="alert", liens vers les champs) + message sous chaque champ fautif.
 * Fiches liées : cases à cocher parmi les projets publics ; un slug inconnu (fiche pas encore créée) est gardé
 * dans « Autres slugs » et ne devient un lien qu'une fois le projet créé.
 */
const props = defineProps<{ initial?: Partial<Stage>; loading?: boolean; readonly?: boolean; serverIssues?: StageIssue[] }>();
const emit  = defineEmits<{ submit: [payload: Stage] }>();

const { list } = useAdminSession();
const isEdit = !!props.initial?.key;

const form = ref<Stage>({
  key: "", order: 0, kind: "etape", period: "", title: "", place: "", summary: "",
  figure: "", figureLabel: "", projects: [],
  ...props.initial,
});

const KINDS: { value: StageKind; label: string }[] = [
  { value: "depart",  label: "Départ (premier cairn de la trace)" },
  { value: "etape",   label: "Étape (numérotée selon son emplacement)" },
  { value: "bivouac", label: "Bivouac (petit marqueur, sans numéro)" },
  { value: "final",   label: "Cairn final (lien vers Contact)" },
];

// ── Autres étapes de la trace (pour l'emplacement, la clé unique et l'aperçu du numéro) ──────────
const allStages = ref<Stage[]>([]);
const stagesState = ref<"loading" | "ok" | "error">("loading");
const others = computed(() => allStages.value.filter((s) => s.key !== props.initial?.key));
const placement = ref("");
const fixedPlace = computed(() => form.value.kind === "depart" || form.value.kind === "final");
const options = computed(() => placementOptions(others.value));

// Création : la clé suit le type et le titre tant qu'on ne l'a pas modifiée à la main.
const keyTouched = ref(isEdit);
watch(() => [form.value.kind, form.value.title], () => {
  if (!keyTouched.value) form.value.key = form.value.title || form.value.kind !== "etape" ? stageKeyFromTitle(form.value.kind, form.value.title) : "";
});

// Numéro / km / D+ que l'étape aura à cet emplacement (même calcul que l'accueil).
const candidateOrder = computed(() => {
  if (isEdit && !fixedPlace.value && placement.value === placementOf(others.value, props.initial?.order ?? 0)) return props.initial?.order ?? 0;
  return orderForPlacement(others.value, form.value.kind, placement.value);
});
const preview = computed(() => {
  if (candidateOrder.value === null || !form.value.key) return null;
  const me = buildStageView([...others.value, { ...form.value, order: candidateOrder.value }]).find((v) => v.key === form.value.key);
  return me ?? null;
});

// ── Fiches liées ──────────────────────────────────────────────────────────────────────────────
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

onMounted(async () => {
  try {
    allStages.value = await list<Stage>("stages");
    stagesState.value = "ok";
    placement.value = isEdit ? placementOf(others.value, props.initial?.order ?? 0) : options.value[options.value.length - 1]?.value ?? "";
  } catch {
    stagesState.value = "error";
  }
});

// ── Erreurs ───────────────────────────────────────────────────────────────────────────────────
const issues = ref<StageIssue[]>([]);
const summary = ref<HTMLElement | null>(null);
watch(() => props.serverIssues, async (v) => {
  if (!v?.length) return;
  issues.value = v;
  await nextTick();
  summary.value?.focus();
});
const FIELD_ID: Record<StageField, string> = { kind: "sf-kind", title: "sf-title", key: "sf-key", placement: "sf-placement" };
const issueOf = (f: StageField) => issues.value.find((i) => i.field === f)?.message ?? "";
const describedBy = (f: StageField) => (issueOf(f) ? `sf-err-${f}` : undefined);

async function onSubmit() {
  if (props.readonly) return;
  const found = validateStage(form.value, others.value, fixedPlace.value ? "ok" : placement.value);
  if (stagesState.value === "error" && !fixedPlace.value) {
    found.push({ field: "placement", message: "La liste des étapes n'a pas pu être chargée, l'emplacement ne peut donc pas être choisi. Recharge la page puis réessaie." });
  }
  issues.value = found;
  if (found.length || candidateOrder.value === null) {
    await nextTick();
    summary.value?.focus();
    return;
  }
  const extra = othersInput.value.split(",").map((s) => s.trim()).filter(Boolean);
  emit("submit", { ...form.value, order: candidateOrder.value, projects: [...new Set([...checked.value, ...extra])] });
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <!-- Lecture seule (visiteur) : fieldset désactivé = aucun champ ni bouton actionnable, valeurs lisibles -->
    <fieldset :disabled="readonly" class="admin-form-body space-y-6">

      <!-- Récapitulatif des erreurs : annoncé, focalisé, un lien par champ à corriger -->
      <div v-if="issues.length" ref="summary" role="alert" tabindex="-1" class="sf-summary">
        <p class="font-semibold">{{ issues.length > 1 ? `${issues.length} points à corriger avant d'enregistrer :` : "1 point à corriger avant d'enregistrer :" }}</p>
        <ul>
          <li v-for="i in issues" :key="i.field + i.message"><a :href="`#${FIELD_ID[i.field]}`">{{ i.message }}</a></li>
        </ul>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="sf-kind" class="admin-label">Type *</label>
          <select id="sf-kind" v-model="form.kind" required aria-required="true" class="admin-input" :aria-invalid="!!issueOf('kind')" :aria-describedby="describedBy('kind')">
            <option v-for="k in KINDS" :key="k.value" :value="k.value">{{ k.label }}</option>
          </select>
          <p v-if="issueOf('kind')" id="sf-err-kind" class="sf-err">{{ issueOf("kind") }}</p>
        </div>
        <div>
          <label for="sf-placement" class="admin-label">Emplacement sur la trace *</label>
          <select
            id="sf-placement" v-model="placement" class="admin-input" aria-required="true"
            :disabled="fixedPlace || stagesState !== 'ok'" :aria-invalid="!!issueOf('placement')"
            :aria-describedby="['sf-place-help', describedBy('placement')].filter(Boolean).join(' ')"
          >
            <option v-if="fixedPlace" value="">{{ form.kind === "depart" ? "Toujours au début de la trace" : "Toujours à la fin de la trace" }}</option>
            <template v-else>
              <option value="" disabled>{{ stagesState === "loading" ? "Chargement des étapes…" : "Choisir l'emplacement" }}</option>
              <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
            </template>
          </select>
          <p id="sf-place-help" class="mt-1 text-xs text-(--color-muted)">
            <template v-if="stagesState === 'error'">Liste des étapes indisponible (base hors ligne ?).</template>
            <template v-else-if="preview">
              Cette étape sera : <strong>{{ preview.label }}</strong> · km {{ preview.km }} · D+ {{ preview.gain }} m.
              Les étapes suivantes sont renumérotées toutes seules.
            </template>
            <template v-else>Le numéro (Étape 01, 02…) se déduit de l'emplacement : il ne se saisit pas.</template>
          </p>
          <p v-if="issueOf('placement')" id="sf-err-placement" class="sf-err">{{ issueOf("placement") }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="md:col-span-2">
          <label for="sf-title" class="admin-label">Titre *</label>
          <input id="sf-title" v-model="form.title" required aria-required="true" class="admin-input" placeholder="DGFiP, mission via BeTeam" :aria-invalid="!!issueOf('title')" :aria-describedby="describedBy('title')" />
          <p v-if="issueOf('title')" id="sf-err-title" class="sf-err">{{ issueOf("title") }}</p>
        </div>
        <div>
          <label for="sf-place" class="admin-label">Lieu</label>
          <input id="sf-place" v-model="form.place" class="admin-input" placeholder="Paris" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="sf-period" class="admin-label">Période</label>
          <input id="sf-period" v-model="form.period" class="admin-input" placeholder="Déc. 2023 – Oct. 2025" />
        </div>
        <div>
          <label for="sf-key" class="admin-label">Clé (identifiant technique) *</label>
          <input
            id="sf-key" v-model="form.key" required aria-required="true" class="admin-input font-mono text-sm" placeholder="etape-dgfip"
            :aria-invalid="!!issueOf('key')" :aria-describedby="['sf-key-help', describedBy('key')].filter(Boolean).join(' ')"
            @input="keyTouched = true"
          />
          <p id="sf-key-help" class="mt-1 text-xs text-(--color-muted)">
            {{ isEdit ? "Changer la clé crée un nouvel identifiant : à éviter sur une étape existante." : "Proposée d'après le type et le titre ; unique, minuscules, chiffres et tirets." }}
          </p>
          <p v-if="issueOf('key')" id="sf-err-key" class="sf-err">{{ issueOf("key") }}</p>
        </div>
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
.sf-summary {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface));
  color: var(--color-text);
  font-size: 0.875rem;
}
.sf-summary ul { margin-top: 0.25rem; padding-left: 1.25rem; list-style: disc; }
.sf-summary a { color: var(--color-text); text-decoration: underline; }
.sf-summary:focus { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.sf-err { margin-top: 0.25rem; font-size: 0.8125rem; font-weight: 600; color: var(--color-accent); }
.admin-input[aria-invalid="true"] { border-color: var(--color-accent); border-width: 2px; }
</style>
