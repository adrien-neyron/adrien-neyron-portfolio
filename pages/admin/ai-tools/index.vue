<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { Pencil, Trash2, PlusCircle, Download } from "lucide-vue-next";

definePageMeta({ layout: "admin", middleware: "admin" });

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";

interface AiToolRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  provider: string;
}

const tools   = ref<AiToolRow[]>([]);
const loading = ref(true);
const error   = ref("");
const seeding = ref(false);

async function fetchTools() {
  loading.value = true;
  error.value   = "";
  try {
    const token = getToken();
    tools.value = await $fetch<AiToolRow[]>("/api/admin/ai-tools", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e: unknown) {
    const fe = e as { statusCode?: number; statusMessage?: string; message?: string };
    error.value = `Erreur ${fe.statusCode ?? "?"} — ${fe.statusMessage ?? fe.message ?? "inconnu"}`;
  } finally {
    loading.value = false;
  }
}

async function seedAiTools() {
  if (!confirm("Importer les 6 outils IA statiques dans MongoDB ? Les outils existants (même slug) ne seront pas écrasés.")) return;
  seeding.value = true;
  try {
    const token = getToken();
    const result = await $fetch<{ seeded: number; slugs: string[] }>("/api/admin/ai-tools/seed", {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    alert(`${result.seeded} outil(s) importé(s) : ${result.slugs.join(", ")}`);
    await fetchTools();
  } catch (e: unknown) {
    const fe = e as { statusCode?: number; statusMessage?: string; message?: string };
    alert(`Erreur ${fe.statusCode ?? "?"} — ${fe.statusMessage ?? fe.message ?? "inconnu"}`);
  } finally {
    seeding.value = false;
  }
}

async function deleteTool(id: string, name: string) {
  if (!confirm(`Supprimer "${name}" ?`)) return;
  const token = getToken();
  await $fetch(`/api/admin/ai-tools/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  tools.value = tools.value.filter((t) => t.id !== id);
}

onMounted(fetchTools);
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold" style="font-family: var(--font-title);">Outils IA</h1>
        <p class="text-sm mt-0.5" style="color: var(--color-muted);">
          {{ tools.length }} outil{{ tools.length !== 1 ? 's' : '' }} en base
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          :disabled="seeding"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
          style="border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent); color: var(--color-muted);"
          @click="seedAiTools"
        >
          <Download :size="16" />
          {{ seeding ? "Import…" : "Importer les outils IA" }}
        </button>
        <NuxtLink
          to="/admin/ai-tools/new"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
          style="background-color: var(--color-accent);"
        >
          <PlusCircle :size="16" />
          Nouvel outil
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--color-muted);">Chargement…</div>

    <div v-else-if="error" class="p-4 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div v-else-if="tools.length === 0" class="text-center py-20" style="color: var(--color-muted);">
      Aucun outil.
      <NuxtLink to="/admin/ai-tools/new" style="color: var(--color-accent);">Créer le premier →</NuxtLink>
    </div>

    <div v-else class="rounded-xl border overflow-hidden" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
      <table class="w-full text-sm">
        <thead>
          <tr style="background-color: var(--color-surface);">
            <th class="text-left px-4 py-3 font-semibold" style="color: var(--color-muted);">Nom</th>
            <th class="text-left px-4 py-3 font-semibold hidden md:table-cell" style="color: var(--color-muted);">Fournisseur</th>
            <th class="text-left px-4 py-3 font-semibold hidden lg:table-cell" style="color: var(--color-muted);">Catégorie</th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="tool in tools"
            :key="tool.id"
            class="border-t"
            style="border-color: color-mix(in srgb, var(--color-accent) 10%, transparent);"
          >
            <td class="px-4 py-3">
              <p class="font-medium">{{ tool.name }}</p>
              <p class="text-xs font-mono mt-0.5" style="color: var(--color-muted);">{{ tool.slug }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell" style="color: var(--color-muted);">{{ tool.provider }}</td>
            <td class="px-4 py-3 hidden lg:table-cell" style="color: var(--color-muted);">{{ tool.category }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink
                  :to="`/admin/ai-tools/${tool.id}/edit`"
                  class="p-1.5 rounded-lg transition hover:opacity-80"
                  style="color: var(--color-accent);"
                  title="Modifier"
                >
                  <Pencil :size="15" />
                </NuxtLink>
                <button
                  class="p-1.5 rounded-lg transition hover:opacity-80"
                  style="color: #e53e3e;"
                  title="Supprimer"
                  @click="deleteTool(tool.id, tool.name)"
                >
                  <Trash2 :size="15" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
