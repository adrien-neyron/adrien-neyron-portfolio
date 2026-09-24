<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { Pencil, Trash2, PlusCircle, Download } from "lucide-vue-next";

definePageMeta({ layout: "admin", middleware: "admin" });

const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";
const { categoryClass } = useCarnetCategory();

interface CarnetRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
}

const articles = ref<CarnetRow[]>([]);
const loading  = ref(true);
const error    = ref("");
const seeding  = ref(false);

async function fetchArticles() {
  loading.value = true;
  error.value   = "";
  try {
    const token = getToken();
    articles.value = await $fetch<CarnetRow[]>("/api/admin/carnet", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e: unknown) {
    const fe = e as { statusCode?: number; statusMessage?: string; message?: string };
    error.value = `Erreur ${fe.statusCode ?? "?"} — ${fe.statusMessage ?? fe.message ?? "inconnu"}`;
  } finally {
    loading.value = false;
  }
}

async function seedArticles() {
  if (!confirm("Importer l'article de démo dans MongoDB ? Les articles existants (même slug) ne seront pas écrasés.")) return;
  seeding.value = true;
  try {
    const token = getToken();
    const result = await $fetch<{ seeded: number; slugs: string[] }>("/api/admin/carnet/seed", {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    alert(`${result.seeded} article(s) importé(s) : ${result.slugs.join(", ")}`);
    await fetchArticles();
  } catch (e: unknown) {
    const fe = e as { statusCode?: number; statusMessage?: string; message?: string };
    alert(`Erreur ${fe.statusCode ?? "?"} — ${fe.statusMessage ?? fe.message ?? "inconnu"}`);
  } finally {
    seeding.value = false;
  }
}

async function deleteArticle(id: string, title: string) {
  if (!confirm(`Supprimer "${title}" ?`)) return;
  const token = getToken();
  await $fetch(`/api/admin/carnet/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  articles.value = articles.value.filter((a) => a.id !== id);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

onMounted(fetchArticles);
</script>

<template>
  <div class="p-4 sm:p-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold" style="font-family: var(--font-title);">Le Carnet</h1>
        <p class="text-sm mt-0.5" style="color: var(--color-muted);">
          {{ articles.length }} article{{ articles.length !== 1 ? 's' : '' }} en base
        </p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          :disabled="seeding"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
          style="border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent); color: var(--color-muted);"
          @click="seedArticles"
        >
          <Download :size="16" />
          {{ seeding ? "Import…" : "Importer l'article de démo" }}
        </button>
        <NuxtLink
          to="/admin/carnet/new"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
          style="background-color: var(--color-accent);"
        >
          <PlusCircle :size="16" />
          Nouvel article
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--color-muted);">Chargement…</div>

    <div v-else-if="error" class="p-4 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div v-else-if="articles.length === 0" class="text-center py-20" style="color: var(--color-muted);">
      Aucun article.
      <NuxtLink to="/admin/carnet/new" style="color: var(--color-accent);">Créer le premier →</NuxtLink>
    </div>

    <div v-else>
      <!-- Mobile : cartes -->
      <ul class="space-y-3 md:hidden" role="list">
        <li
          v-for="article in articles"
          :key="article.id"
          class="rounded-xl border p-4"
          style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent); background-color: var(--color-surface);"
        >
          <p class="font-medium">{{ article.title }}</p>
          <p class="text-xs font-mono mt-0.5" style="color: var(--color-muted);">{{ article.slug }}</p>
          <div class="flex items-center gap-2 mt-2">
            <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', categoryClass(article.category)]">{{ article.category }}</span>
            <span class="text-xs" style="color: var(--color-muted);">{{ formatDate(article.date) }}</span>
          </div>

          <div class="flex items-center gap-2 mt-3">
            <NuxtLink
              :to="`/admin/carnet/${article.id}/edit`"
              class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition hover:opacity-80"
              style="border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent); color: var(--color-accent);"
            >
              <Pencil :size="15" aria-hidden="true" />
              Modifier
            </NuxtLink>
            <button
              class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition hover:opacity-80"
              style="border: 1px solid color-mix(in srgb, #e53e3e 30%, transparent); color: #e53e3e;"
              :aria-label="`Supprimer ${article.title}`"
              @click="deleteArticle(article.id, article.title)"
            >
              <Trash2 :size="15" aria-hidden="true" />
            </button>
          </div>
        </li>
      </ul>

      <!-- Desktop : tableau -->
      <div class="hidden md:block rounded-xl border overflow-x-auto" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
        <table class="w-full text-sm">
          <thead>
            <tr style="background-color: var(--color-surface);">
              <th class="text-left px-4 py-3 font-semibold" style="color: var(--color-muted);">Titre</th>
              <th class="text-left px-4 py-3 font-semibold" style="color: var(--color-muted);">Catégorie</th>
              <th class="text-left px-4 py-3 font-semibold hidden lg:table-cell" style="color: var(--color-muted);">Date</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="article in articles"
              :key="article.id"
              class="border-t"
              style="border-color: color-mix(in srgb, var(--color-accent) 10%, transparent);"
            >
              <td class="px-4 py-3">
                <p class="font-medium">{{ article.title }}</p>
                <p class="text-xs font-mono mt-0.5" style="color: var(--color-muted);">{{ article.slug }}</p>
              </td>
              <td class="px-4 py-3">
                <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', categoryClass(article.category)]">{{ article.category }}</span>
              </td>
              <td class="px-4 py-3 hidden lg:table-cell" style="color: var(--color-muted);">{{ formatDate(article.date) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink
                    :to="`/admin/carnet/${article.id}/edit`"
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
                    @click="deleteArticle(article.id, article.title)"
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
  </div>
</template>
