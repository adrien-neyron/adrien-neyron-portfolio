<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useAuth0 } from "@auth0/auth0-vue";
import { projectType } from "~/utils/stages";

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
  // photo d'ambiance « grain skate » (cartes + en-tête de fiche)
  cover: string;
  coverCredit: string;
  coverCreditUrl: string;
  // origine de la photo : "admin" (tapée/uploadée, prioritaire) ou "unsplash"
  // (trouvée automatiquement ou choisie parmi les suggestions) — voir server/utils/projectCover.ts
  coverSource?: "admin" | "unsplash";
  coverUnsplashId?: string;
  coverQuery?: string;
  link: string;
  code: string;
  difficulty: "Apprentissage" | "Side Project" | "Professionnel";
  duration: string;
  category: string;
  type?: "mission" | "perso" | "";   // filtre de /projects (vide : repli par slug, voir utils/stages.ts)
  // fiche topo (refonte « L'ascension »)
  order?: number;
  place?: string;
  coords?: { lat?: number; lon?: number };
  startDate?: string;
  profile?: number[];
  milestones?: { label: string; detail?: string }[];
  stats?: { value: string; label: string }[];
}

// Le projet renvoyé par l'API porte `image: { light, dark }` : on l'aplatit
// vers `image_light` / `image_dark` attendus par le formulaire.
type InitialProject = Partial<ProjectPayload> & { image?: { light?: string; dark?: string } };

const props = defineProps<{ initial?: InitialProject; loading?: boolean; readonly?: boolean }>();
const emit  = defineEmits<{ submit: [payload: ProjectPayload] }>();

// Un projet enregistré avant le renommage de septembre 2026 peut encore
// porter une ancienne valeur ("Débutant"/"Intermédiaire"/"Expert") : on la
// convertit vers son équivalent actuel dès le chargement du formulaire, à
// la fois pour que le <select> ci-dessous l'affiche correctement (ses
// <option> ne listent plus que les 3 nouvelles valeurs) et pour que le
// prochain enregistrement migre naturellement le champ, sans script de
// migration séparé — voir composables/useDifficultyBadge.ts.
const { difficultyLabel } = useDifficultyBadge();

const form = ref<ProjectPayload>({
  slug: "", title: "", tagline: "", role: "",
  description: "", challenge: "", solution: "", result: "",
  technologies: [],
  cover: "", coverCredit: "", coverCreditUrl: "",
  coverQuery: "",
  link: "", code: "",
  difficulty: "Side Project", duration: "", category: "",
  ...props.initial,
  // type : valeur en base, sinon le repli par slug (celui qu'applique /projects) pour que le formulaire montre la réalité
  type: (props.initial ? projectType({ slug: props.initial.slug, type: props.initial.type || undefined }) : null) ?? "",
  image_light: props.initial?.image_light ?? props.initial?.image?.light ?? "",
  image_dark:  props.initial?.image_dark  ?? props.initial?.image?.dark  ?? "",
  ...(props.initial?.difficulty
    ? { difficulty: difficultyLabel(props.initial.difficulty) as ProjectPayload["difficulty"] }
    : {}),
});

// Technologies en tant que string CSV dans l'input
const techInput = ref((props.initial?.technologies ?? []).join(", "));

// ── Fiche topo : champs saisis en texte simple, convertis à l'envoi ──
const latInput     = ref(props.initial?.coords?.lat?.toString() ?? "");
const lonInput     = ref(props.initial?.coords?.lon?.toString() ?? "");
const profileInput = ref((props.initial?.profile ?? []).join(", "));
// une étape par ligne : « Libellé — détail »
const milestonesInput = ref(
  (props.initial?.milestones ?? []).map((m) => (m.detail ? `${m.label} — ${m.detail}` : m.label)).join("\n")
);
// un chiffre clé par ligne : « valeur | libellé »
const statsInput = ref(
  (props.initial?.stats ?? []).map((s) => `${s.value} | ${s.label}`).join("\n")
);

const toNumber = (v: string) => {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};
const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);

// ── Photo d'ambiance : priorité admin > Unsplash ──────────────
const { idTokenClaims } = useAuth0();
const getToken = () => (idTokenClaims.value as { __raw?: string })?.__raw ?? "";

interface UnsplashCandidate {
  id: string; url: string; thumb: string; alt: string;
  credit: string; creditUrl: string;
}
const suggestions   = ref<UnsplashCandidate[]>([]);
const seenIds       = ref<string[]>([]);
const searching     = ref(false);
const searchError   = ref("");
const searchStatus  = ref(""); // annoncé aux lecteurs d'écran (aria-live)

const coverOrigin = computed(() => {
  if (!form.value.cover) return "Aucune photo : une photo Unsplash sera cherchée à l'enregistrement.";
  return form.value.coverSource === "unsplash"
    ? "Photo Unsplash stockée en base — remplacée si tu mets ta propre photo."
    : "Ta photo (backoffice) — prioritaire, jamais remplacée automatiquement.";
});

// Toute photo tapée ou uploadée à la main devient la photo « admin », prioritaire.
function onManualCover(url: string) {
  form.value.cover = url;
  form.value.coverSource = url ? "admin" : undefined;
  form.value.coverUnsplashId = undefined;
}

async function searchCovers(more = false) {
  searching.value = true;
  searchError.value = "";
  searchStatus.value = "Recherche en cours…";
  if (!more) seenIds.value = [];
  try {
    const res = await $fetch<{ query: string; candidates: UnsplashCandidate[] }>(
      "/api/admin/projects/cover-suggestions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: {
          title: form.value.title, tagline: form.value.tagline,
          description: form.value.description, category: form.value.category,
          coverQuery: form.value.coverQuery, exclude: seenIds.value,
        },
      },
    );
    form.value.coverQuery = res.query;
    suggestions.value = res.candidates;
    seenIds.value.push(...res.candidates.map((c) => c.id));
    searchStatus.value = res.candidates.length
      ? `${res.candidates.length} photos trouvées pour « ${res.query} ».`
      : `Aucune photo pour « ${res.query} » : essaie d'autres mots-clés.`;
  } catch (err: unknown) {
    const fe = err as { statusMessage?: string; message?: string };
    searchError.value = fe.statusMessage ?? fe.message ?? "Recherche impossible.";
    searchStatus.value = "";
  } finally {
    searching.value = false;
  }
}

function pickSuggestion(c: UnsplashCandidate) {
  form.value.cover = c.url;
  form.value.coverCredit = c.credit;
  form.value.coverCreditUrl = c.creditUrl;
  form.value.coverSource = "unsplash";
  form.value.coverUnsplashId = c.id;
}

function clearCover() {
  form.value.cover = "";
  form.value.coverCredit = "";
  form.value.coverCreditUrl = "";
  form.value.coverSource = undefined;
  form.value.coverUnsplashId = undefined;
}

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
  if (props.readonly) return;
  form.value.technologies = techInput.value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const lat = toNumber(latInput.value);
  const lon = toNumber(lonInput.value);
  form.value.coords = lat !== undefined && lon !== undefined ? { lat, lon } : undefined;
  form.value.profile = profileInput.value
    .split(/[,;\s]+/)
    .map((v) => toNumber(v))
    .filter((v): v is number => v !== undefined)
    .map((v) => Math.max(0, Math.min(100, v)));
  form.value.milestones = lines(milestonesInput.value).map((l) => {
    const [label, ...rest] = l.split(/\s+[—–-]\s+/);
    return rest.length ? { label: label.trim(), detail: rest.join(" — ").trim() } : { label: label.trim() };
  });
  form.value.stats = lines(statsInput.value)
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter(([value, label]) => value && label)
    .map(([value, label]) => ({ value, label }));
  emit("submit", { ...form.value });
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <!-- Lecture seule (visiteur) : fieldset désactivé = aucun champ ni bouton actionnable, valeurs lisibles -->
    <fieldset :disabled="readonly" class="admin-form-body space-y-6">

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
          <label class="admin-label">Image mode clair</label>
          <input v-model="form.image_light" class="admin-input mb-2" placeholder="/recentprojects/mon-projet-light.png" />
          <AdminFileUpload v-model="form.image_light" accept="image/*" label="Uploader une image" />
        </div>
        <div>
          <label class="admin-label">Image mode sombre</label>
          <input v-model="form.image_dark" class="admin-input mb-2" placeholder="/recentprojects/mon-projet-dark.png" />
          <AdminFileUpload v-model="form.image_dark" accept="image/*" label="Uploader une image" />
        </div>
      </div>

      <!-- Photo d'ambiance : affichée avec le traitement « grain skate »
           (N&B contrasté + grain 16 mm) sur les cartes et en tête de fiche.
           Priorité : ta photo (admin) > photo Unsplash stockée en base.
           Les captures ci-dessus restent nettes dans la section « Départ ». -->
      <fieldset class="flex flex-col gap-4 border border-(--color-muted)/30 rounded-lg p-4">
        <legend class="admin-label px-1">Photo d'ambiance (grain skate)</legend>

        <div class="flex flex-col md:flex-row gap-4 items-start">
          <!-- Aperçu avec le filtre du site (décoratif) -->
          <div class="grain-photo w-full md:w-72 aspect-video rounded-lg shrink-0">
            <img v-if="form.cover" :src="form.cover" alt="" class="w-full h-full object-cover" />
          </div>
          <div class="flex flex-col gap-2 min-w-0">
            <p id="pf-cover-origin" class="text-sm text-(--color-text)">
              <span
                class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mr-1 align-middle"
                :class="form.coverSource === 'unsplash' ? 'bg-(--color-muted)/15 text-(--color-text)' : 'bg-(--color-accent)/15 text-(--color-text)'"
              >{{ !form.cover ? "Vide" : form.coverSource === "unsplash" ? "Unsplash" : "Backoffice" }}</span>
              {{ coverOrigin }}
            </p>
            <p v-if="form.cover && form.coverCredit" class="text-xs text-(--color-muted)">
              Crédit : <a :href="form.coverCreditUrl" target="_blank" rel="noopener noreferrer" class="underline">{{ form.coverCredit }}<span class="sr-only"> (nouvel onglet)</span></a>
            </p>
            <button v-if="form.cover" type="button" class="self-start text-xs underline text-(--color-muted) hover:text-(--color-accent) min-h-11" @click="clearCover">
              Retirer la photo
            </button>
          </div>
        </div>

        <!-- 1. Ta photo : prioritaire -->
        <div>
          <label for="pf-cover" class="admin-label">Ta photo (URL ou upload) — prioritaire</label>
          <input
            id="pf-cover"
            :value="form.coverSource === 'unsplash' ? '' : form.cover"
            class="admin-input mb-2"
            placeholder="https://… ou upload ci-dessous"
            aria-describedby="pf-cover-origin"
            @change="onManualCover(($event.target as HTMLInputElement).value.trim())"
          />
          <AdminFileUpload
            :model-value="form.coverSource === 'unsplash' ? '' : form.cover"
            accept="image/*"
            label="Uploader une photo"
            @update:model-value="onManualCover"
          />
        </div>

        <!-- 2. Sinon : suggestions Unsplash -->
        <div class="flex flex-col gap-2">
          <label for="pf-cover-query" class="admin-label">Mots-clés Unsplash <span class="normal-case font-normal">(anglais de préférence — vide : déduits de la description)</span></label>
          <div class="flex gap-2">
            <input id="pf-cover-query" v-model="form.coverQuery" class="admin-input" placeholder="tire stack garage" />
            <button
              type="button"
              :disabled="searching"
              class="shrink-0 px-4 min-h-11 rounded-lg border border-(--color-accent) text-(--color-text) text-sm font-medium hover:bg-(--color-accent)/10 disabled:opacity-50"
              @click="searchCovers(false)"
            >
              {{ searching ? "Recherche…" : "Chercher" }}
            </button>
          </div>
          <p class="sr-only" aria-live="polite">{{ searchStatus }}</p>
          <p v-if="searchError" role="alert" class="text-xs text-red-700 dark:text-red-400">{{ searchError }}</p>

          <fieldset v-if="suggestions.length" class="mt-1">
            <legend class="text-xs text-(--color-muted) mb-2">Choisis une photo (aperçu avec le filtre du site)</legend>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label
                v-for="c in suggestions"
                :key="c.id"
                class="flex flex-col gap-1 cursor-pointer rounded-lg p-1 border-2 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-accent)"
                :class="form.coverUnsplashId === c.id ? 'border-(--color-accent)' : 'border-transparent'"
              >
                <input
                  type="radio"
                  name="pf-cover-pick"
                  class="sr-only"
                  :value="c.id"
                  :checked="form.coverUnsplashId === c.id"
                  @change="pickSuggestion(c)"
                />
                <span class="grain-photo block aspect-video rounded-md">
                  <img :src="c.thumb" alt="" class="w-full h-full object-cover" loading="lazy" />
                </span>
                <span class="text-xs text-(--color-text) truncate">{{ c.alt || "Photo sans description" }}</span>
                <span class="text-[11px] text-(--color-muted) truncate">{{ c.credit }}</span>
              </label>
            </div>
            <button type="button" :disabled="searching" class="mt-2 text-xs underline text-(--color-muted) hover:text-(--color-accent) min-h-11" @click="searchCovers(true)">
              Autres photos
            </button>
          </fieldset>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="pf-cover-credit" class="admin-label">Crédit photo</label>
            <input id="pf-cover-credit" v-model="form.coverCredit" class="admin-input" placeholder="Prénom Nom / Unsplash" />
          </div>
          <div>
            <label for="pf-cover-credit-url" class="admin-label">Lien du crédit</label>
            <input id="pf-cover-credit-url" v-model="form.coverCreditUrl" type="url" class="admin-input" placeholder="https://unsplash.com/photos/…" />
          </div>
        </div>
      </fieldset>

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

      <!-- Difficulté / Durée / Catégorie / Type -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="admin-label">Difficulté *</label>
          <select v-model="form.difficulty" required class="admin-input">
            <option>Apprentissage</option>
            <option>Side Project</option>
            <option>Professionnel</option>
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
            <option>Automatisation</option>
            <option>SI</option>
            <option>Autre</option>
          </select>
        </div>
        <div>
          <label for="pf-type" class="admin-label">Type <span class="normal-case font-normal">(filtre de /projects)</span></label>
          <select id="pf-type" v-model="form.type" class="admin-input">
            <option value="">Non classé (masqué de /projects)</option>
            <option value="mission">Mission</option>
            <option value="perso">Projet perso</option>
          </select>
        </div>
      </div>

      <!-- Fiche topo (refonte « L'ascension ») -->
      <fieldset class="space-y-4 border-t pt-6" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
        <legend class="admin-label">Fiche topo — carte et profil</legend>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label for="pf-place" class="admin-label">Lieu</label>
            <input id="pf-place" v-model="form.place" class="admin-input" placeholder="Lyon" />
          </div>
          <div>
            <label for="pf-lat" class="admin-label">Latitude</label>
            <input id="pf-lat" v-model="latInput" inputmode="decimal" class="admin-input font-mono" placeholder="45.764" />
          </div>
          <div>
            <label for="pf-lon" class="admin-label">Longitude</label>
            <input id="pf-lon" v-model="lonInput" inputmode="decimal" class="admin-input font-mono" placeholder="4.836" />
          </div>
          <div>
            <label for="pf-start" class="admin-label">Départ</label>
            <input id="pf-start" v-model="form.startDate" class="admin-input" placeholder="Mai 2026" />
          </div>
        </div>
        <div>
          <label for="pf-order" class="admin-label">Ordre des fiches de l'accueil <span class="normal-case font-normal">(0, 1, 2… ; la trace, elle, suit les Étapes)</span></label>
          <input id="pf-order" v-model.number="form.order" type="number" min="0" step="1" class="admin-input md:w-40" />
        </div>
        <div>
          <label for="pf-profile" class="admin-label">Profil d'altitude <span class="normal-case font-normal">(valeurs 0 à 100 séparées par des virgules — vide : profil généré)</span></label>
          <input id="pf-profile" v-model="profileInput" class="admin-input font-mono" placeholder="18, 25, 40, 38, 60, 72, 85" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="pf-milestones" class="admin-label">Étapes du profil <span class="normal-case font-normal">(une par ligne : « Libellé — détail »)</span></label>
            <textarea id="pf-milestones" v-model="milestonesInput" rows="4" class="admin-input resize-y font-mono" placeholder="Départ — Base Vue 3 migrée&#10;Sprint RGAA — Remédiation" />
          </div>
          <div>
            <label for="pf-stats" class="admin-label">Chiffres clés « Arrivée » <span class="normal-case font-normal">(une par ligne : « valeur | libellé »)</span></label>
            <textarea id="pf-stats" v-model="statsInput" rows="4" class="admin-input resize-y font-mono" placeholder="−50 % | de temps de traitement" />
          </div>
        </div>
      </fieldset>

      <!-- Submit -->
      <div v-if="!readonly" class="flex justify-end pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2.5 rounded-lg bg-(--color-accent) text-white font-medium transition hover:opacity-90 disabled:opacity-50"
        >
          {{ loading ? "Enregistrement…" : "Enregistrer le projet" }}
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
</style>
