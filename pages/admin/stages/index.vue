<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Pencil, Trash2, PlusCircle, Download, Eye } from "lucide-vue-next";
import { buildStageView, type Stage } from "~/utils/stages";

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

    <ol v-else class="space-y-3" aria-label="Étapes, dans l'ordre de la trace">
      <li
        v-for="row in view"
        :key="row.id"
        class="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);"
      >
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
  </div>
</template>
