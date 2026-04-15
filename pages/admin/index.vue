<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { Pencil, Trash2, PlusCircle, LogOut, Download } from "lucide-vue-next";

definePageMeta({ layout: "admin", middleware: "admin" });

const { idTokenClaims, user, logout } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";
const isAdmin = computed(() => user.value?.email === "adrien.neyron@gmail.com");

function handleLogout() {
  logout({ logoutParams: { returnTo: window.location.origin } });
}

const seeding = ref(false);
async function seedProjects() {
  if (!confirm("Importer les 4 projets statiques dans MongoDB ? Les projets existants (même slug) ne seront pas écrasés.")) return;
  seeding.value = true;
  try {
    const token = getToken();
    const result = await $fetch<{ seeded: number; slugs: string[] }>("/api/admin/seed", {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    alert(`${result.seeded} projet(s) importé(s) : ${result.slugs.join(", ")}`);
    await fetchProjects();
  } catch (e: unknown) {
    const fe = e as { statusCode?: number; statusMessage?: string; message?: string };
    alert(`Erreur ${fe.statusCode ?? "?"} — ${fe.statusMessage ?? fe.message ?? "inconnu"}`);
    console.error("[admin] seedProjects:", e);
  } finally {
    seeding.value = false;
  }
}

interface Project {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  difficulty: string;
  category: string;
  duration: string;
  created_at: string;
}

const projects = ref<Project[]>([]);
const loading  = ref(true);
const error    = ref("");

async function fetchProjects() {
  loading.value = true;
  error.value   = "";
  try {
    const token = getToken();
    if (!token) {
      error.value = "Token introuvable — reconnectez-vous.";
      loading.value = false;
      return;
    }
    projects.value = await $fetch<Project[]>("/api/admin/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e: unknown) {
    const fe = e as { statusCode?: number; statusMessage?: string; message?: string };
    error.value = `Erreur ${fe.statusCode ?? "?"} — ${fe.statusMessage ?? fe.message ?? "inconnu"}`;
    console.error("[admin] fetchProjects:", e);
  } finally {
    loading.value = false;
  }
}

async function deleteProject(id: string, title: string) {
  if (!confirm(`Supprimer "${title}" ?`)) return;
  const token = getToken();
  await $fetch(`/api/admin/projects/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  projects.value = projects.value.filter((p) => p.id !== id);
}

onMounted(fetchProjects);
</script>

<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold" style="font-family: var(--font-title);">Projets</h1>
        <p class="text-sm mt-0.5" style="color: var(--color-muted);">
          {{ projects.length }} projet{{ projects.length !== 1 ? 's' : '' }} en base
        </p>
      </div>
      <div class="flex items-center gap-3">
        <template v-if="isAdmin">
          <button
            :disabled="seeding"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
            style="border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent); color: var(--color-muted);"
            @click="seedProjects"
          >
            <Download :size="16" />
            {{ seeding ? "Import…" : "Importer les projets" }}
          </button>
          <NuxtLink
            to="/admin/projects/new"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition hover:opacity-90"
            style="background-color: var(--color-accent);"
          >
            <PlusCircle :size="16" />
            Nouveau projet
          </NuxtLink>
        </template>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
          style="border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent); color: var(--color-muted);"
          @click="handleLogout"
        >
          <LogOut :size="16" />
          Déconnexion
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-20" style="color: var(--color-muted);">Chargement…</div>

    <div v-else-if="error" class="p-4 rounded-lg text-sm" style="background: color-mix(in srgb, red 10%, transparent); color: red;">
      {{ error }}
    </div>

    <div v-else-if="projects.length === 0" class="text-center py-20" style="color: var(--color-muted);">
      Aucun projet.
      <NuxtLink to="/admin/projects/new" style="color: var(--color-accent);">Créer le premier →</NuxtLink>
    </div>

    <div v-else class="rounded-xl border overflow-hidden" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
      <table class="w-full text-sm">
        <thead>
          <tr style="background-color: var(--color-surface);">
            <th class="text-left px-4 py-3 font-semibold" style="color: var(--color-muted);">Titre</th>
            <th class="text-left px-4 py-3 font-semibold hidden md:table-cell" style="color: var(--color-muted);">Catégorie</th>
            <th class="text-left px-4 py-3 font-semibold hidden lg:table-cell" style="color: var(--color-muted);">Difficulté</th>
            <th class="text-left px-4 py-3 font-semibold hidden lg:table-cell" style="color: var(--color-muted);">Durée</th>
            <th v-if="isAdmin" class="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="project in projects"
            :key="project.id"
            class="border-t"
            style="border-color: color-mix(in srgb, var(--color-accent) 10%, transparent);"
          >
            <td class="px-4 py-3">
              <p class="font-medium">{{ project.title }}</p>
              <p class="text-xs font-mono mt-0.5" style="color: var(--color-muted);">{{ project.slug }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell" style="color: var(--color-muted);">{{ project.category }}</td>
            <td class="px-4 py-3 hidden lg:table-cell" style="color: var(--color-muted);">{{ project.difficulty }}</td>
            <td class="px-4 py-3 hidden lg:table-cell" style="color: var(--color-muted);">{{ project.duration }}</td>
            <td v-if="isAdmin" class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink
                  :to="`/admin/projects/${project.id}/edit`"
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
                  @click="deleteProject(project.id, project.title)"
                >
                  <Trash2 :size="15" />
                </button>
              </div>
            </td>
            <td v-else class="px-4 py-3" />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
