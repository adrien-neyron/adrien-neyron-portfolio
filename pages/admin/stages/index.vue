<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Pencil, Trash2, PlusCircle, Download, Eye, GripVertical, ArrowUp, ArrowDown } from "lucide-vue-next";
import { buildStageView, isPinnedStage, moveWithinTrace, type Stage } from "~/utils/stages";
import { apiErrorMessage } from "~/utils/apiError";

definePageMeta({ layout: "admin", middleware: "admin" });

const { isAdmin, getToken, list } = useAdminSession();

type StageRow = Stage & { id: string };

const stages  = ref<StageRow[]>([]);
const loading = ref(true);
const error   = ref("");
const seeding = ref(false);

// même calcul que l'accueil et /projects : numéro, km, résultat clé
const view = computed(() => {
  const v = buildStageView(stages.value);
  return stages.value
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, v: v[i] }));
});

// ── Réorganiser la trace : glisser-déposer (souris) ou boutons Monter / Descendre (clavier, tactile) ──────────
const saving    = ref(false);
const moveError = ref("");
const live      = ref("");                       // annonce pour lecteur d'écran (aria-live)
const dragFrom  = ref<number | null>(null);
const dragOver  = ref<number | null>(null);
// bornes des déplacements : après le Départ, avant le Cairn final
const firstMovable = computed(() => (view.value[0]?.kind === "depart" ? 1 : 0));
const lastMovable  = computed(() => view.value.length - (view.value[view.value.length - 1]?.kind === "final" ? 2 : 1));
const canReorder = computed(() => isAdmin.value && stages.value.length > 1 && !saving.value);

async function applyOrder(next: StageRow[], movedId: string) {
  const before = stages.value;
  stages.value = next.map((s, i) => ({ ...s, order: i }));   // affichage immédiat, annulé si l'enregistrement échoue
  saving.value = true;
  moveError.value = "";
  try {
    await $fetch("/api/admin/stages/reorder", {
      method:  "PUT",
      headers: { Authorization: `Bearer ${getToken()}` },
      body:    { ids: stages.value.map((s) => s.id) },
    });
    const i = stages.value.findIndex((s) => s.id === movedId);
    const v = buildStageView(stages.value)[i];
    live.value = `« ${stages.value[i].title} » est en position ${i + 1} sur ${stages.value.length} : ${v.label}, kilomètre ${v.km}. Ordre enregistré.`;
  } catch (e) {
    stages.value = before;
    const r = apiErrorMessage(e, "enregistrer le nouvel ordre");
    moveError.value = `${r.message} L'ordre est revenu à l'état précédent.${r.issues.length ? " " + r.issues.map((x) => x.message).join(" ") : ""}`;
    live.value = moveError.value;
  } finally {
    saving.value = false;
  }
}

function moveTo(from: number, to: number) {
  if (!canReorder.value) return;
  const list = stages.value.slice().sort((a, b) => a.order - b.order);
  const next = moveWithinTrace(list, from, to);
  if (next === list) return;
  void applyOrder(next, list[from].id);
}
const onDragStart = (i: number, e: DragEvent) => {
  dragFrom.value = i;
  e.dataTransfer?.setData("text/plain", String(i));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
};
const onDragOver = (i: number, e: DragEvent) => {
  if (dragFrom.value === null) return;
  e.preventDefault();
  dragOver.value = i;
};
const onDrop = (i: number, e: DragEvent) => {
  e.preventDefault();
  const from = dragFrom.value;
  onDragEnd();
  if (from !== null) moveTo(from, i);
};
const onDragEnd = () => { dragFrom.value = null; dragOver.value = null; };

async function fetchStages() {
  loading.value = true;
  error.value   = "";
  try {
    stages.value = await list<StageRow>("stages");
  } catch (e: unknown) {
    const fe = e as { statusCode?: number; statusMessage?: string; message?: string };
    error.value = `Erreur ${fe.statusCode ?? "?"} — ${fe.statusMessage ?? fe.message ?? "inconnu"}`;
  } finally {
    loading.value = false;
  }
}

async function seedStages() {
  if (!confirm("Importer les étapes par défaut dans MongoDB ? Les étapes existantes (même clé) ne seront pas écrasées.")) return;
  seeding.value = true;
  try {
    const result = await $fetch<{ seeded: number; keys: string[] }>("/api/admin/stages/seed", {
      method:  "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    alert(`${result.seeded} étape(s) importée(s) : ${result.keys.join(", ")}`);
    await fetchStages();
  } catch (e: unknown) {
    const fe = e as { statusCode?: number; statusMessage?: string; message?: string };
    alert(`Erreur ${fe.statusCode ?? "?"} — ${fe.statusMessage ?? fe.message ?? "inconnu"}`);
  } finally {
    seeding.value = false;
  }
}

async function deleteStage(id: string, title: string) {
  if (!confirm(`Supprimer l'étape "${title}" ?`)) return;
  await $fetch(`/api/admin/stages/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  stages.value = stages.value.filter((s) => s.id !== id);
}

onMounted(fetchStages);
</script>

<template>
  <div class="p-4 sm:p-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold" style="font-family: var(--font-title);">Étapes de la trace</h1>
        <p class="text-sm mt-0.5" style="color: var(--color-muted);">
          {{ stages.length }} étape{{ stages.length !== 1 ? "s" : "" }} en base · accueil, /projects et fiches lisent ces données
        </p>
      </div>
      <div v-if="isAdmin" class="flex items-center gap-2 flex-wrap">
        <button
          :disabled="seeding"
          class="flex items-center gap-2 px-4 min-h-11 rounded-lg text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
          style="border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent); color: var(--color-muted);"
          @click="seedStages"
        >
          <Download :size="16" aria-hidden="true" />
          {{ seeding ? "Import…" : "Importer les étapes par défaut" }}
        </button>
        <NuxtLink
          to="/admin/stages/new"
          class="flex items-center gap-2 px-4 min-h-11 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
          style="background-color: var(--color-accent);"
        >
          <PlusCircle :size="16" aria-hidden="true" />
          Nouvelle étape
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--color-muted);">Chargement…</div>

    <div v-else-if="error" role="alert" class="p-4 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div v-else-if="stages.length === 0" class="text-center py-20" style="color: var(--color-muted);">
      Aucune étape en base : l'accueil affiche les étapes par défaut (data/stages.ts).
    </div>

    <template v-else>
      <p v-if="isAdmin && stages.length > 1" class="text-sm mb-3" style="color: var(--color-muted);">
        Glisse une étape par sa poignée, ou utilise les flèches « Monter » / « Descendre ». Le numéro suit la position ; le Départ reste en premier et le Cairn final en dernier. L'accueil se met à jour en une minute environ.
      </p>
      <p
        v-if="moveError" role="alert" class="mb-3 p-3 rounded-lg text-sm font-medium"
        style="border: 2px solid var(--color-accent); background: color-mix(in srgb, var(--color-accent) 8%, var(--color-surface)); color: var(--color-text);"
      >{{ moveError }}</p>
      <p class="sr-only" aria-live="polite" role="status">{{ live }}</p>
    <ol class="space-y-3" aria-label="Étapes, dans l'ordre de la trace" :aria-busy="saving">
      <li
        v-for="(row, idx) in view"
        :key="row.id"
        class="stage-row rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        :class="{ 'is-dragging': dragFrom === idx, 'is-drop': dragOver === idx && dragFrom !== null && dragFrom !== idx, 'is-before': dragOver === idx && dragFrom !== null && dragFrom > idx }"
        style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);"
        :draggable="canReorder && !isPinnedStage(row)"
        @dragstart="onDragStart(idx, $event)"
        @dragover="onDragOver(idx, $event)"
        @drop="onDrop(idx, $event)"
        @dragend="onDragEnd"
      >
        <div v-if="isAdmin" class="flex sm:flex-col items-center gap-1 shrink-0">
          <template v-if="!isPinnedStage(row)">
            <span class="stage-grip" aria-hidden="true" title="Glisser pour déplacer"><GripVertical :size="18" /></span>
            <button
              type="button" class="stage-move" :disabled="!canReorder || idx <= firstMovable"
              :aria-label="`Monter « ${row.title} » d'une place`" @click="moveTo(idx, idx - 1)"
            ><ArrowUp :size="16" aria-hidden="true" /></button>
            <button
              type="button" class="stage-move" :disabled="!canReorder || idx >= lastMovable"
              :aria-label="`Descendre « ${row.title} » d'une place`" @click="moveTo(idx, idx + 1)"
            ><ArrowDown :size="16" aria-hidden="true" /></button>
          </template>
          <span v-else class="text-xs font-mono text-(--color-muted)">{{ row.kind === "depart" ? "Fixe : premier" : "Fixe : dernier" }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-mono" style="color: var(--color-muted);">{{ row.v.label }} · km {{ row.v.km }}<template v-if="row.period"> · {{ row.period }}</template></p>
          <p class="font-medium">{{ row.title }}</p>
          <p v-if="row.v.keyResult" class="text-sm">{{ row.v.keyResult }}</p>
          <p v-else class="text-sm" style="color: var(--color-muted);">Sans chiffre</p>
          <p v-if="row.projects?.length" class="text-xs font-mono mt-1" style="color: var(--color-muted);">Fiches : {{ row.projects.join(", ") }}</p>
        </div>
        <div v-if="isAdmin" class="flex items-center gap-2">
          <NuxtLink
            :to="`/admin/stages/${row.id}/edit`"
            class="flex items-center justify-center gap-2 px-3 min-h-11 rounded-lg text-sm font-medium transition hover:opacity-80"
            style="border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent); color: var(--color-accent);"
          >
            <Pencil :size="15" aria-hidden="true" />
            Modifier<span class="sr-only"> {{ row.title }}</span>
          </NuxtLink>
          <button
            class="flex items-center justify-center min-h-11 min-w-11 rounded-lg transition hover:opacity-80"
            style="border: 1px solid color-mix(in srgb, #e53e3e 30%, transparent); color: #e53e3e;"
            :aria-label="`Supprimer ${row.title}`"
            @click="deleteStage(row.id, row.title)"
          >
            <Trash2 :size="15" aria-hidden="true" />
          </button>
        </div>
        <NuxtLink
          v-else
          :to="`/admin/stages/${row.id}/edit`"
          class="flex items-center justify-center gap-2 px-3 min-h-11 rounded-lg text-sm font-medium transition hover:opacity-80"
          style="border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent); color: var(--color-accent);"
        >
          <Eye :size="15" aria-hidden="true" />
          Consulter<span class="sr-only"> {{ row.title }}</span>
        </NuxtLink>
      </li>
    </ol>
    </template>
  </div>
</template>

<style scoped>
.stage-grip { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 28px; color: var(--color-muted); cursor: grab; }
.stage-move {
  display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; border-radius: 0.5rem;
  border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent); color: var(--color-accent); background: transparent; cursor: pointer;
}
.stage-move:hover:not(:disabled) { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
.stage-move:focus-visible { outline: 3px solid var(--color-accent); outline-offset: 2px; }
.stage-move:disabled { opacity: 0.4; cursor: not-allowed; }
.stage-row.is-dragging { opacity: 0.5; }
/* Repère de dépose : trait épais (pas la couleur seule) au-dessus ou au-dessous de la ligne visée */
.stage-row.is-drop { box-shadow: 0 4px 0 0 var(--color-accent); }
.stage-row.is-drop.is-before { box-shadow: 0 -4px 0 0 var(--color-accent); }
@media (prefers-reduced-motion: no-preference) { .stage-row { transition: box-shadow 0.15s, opacity 0.15s; } }
</style>
