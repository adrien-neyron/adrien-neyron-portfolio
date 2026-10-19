<script setup lang="ts">
/**
 * Fiche topo d'un sentier (projet) — refonte « L'ascension ».
 * Départ (description) → Passages délicats (challenge) → Itinéraire (solution)
 * → Arrivée (result + stats). Données : store projets (Mongo + repli statique).
 */
import { ExternalLink, Github } from "lucide-vue-next";
import { useProjectsStore, type Project } from "~/stores/projects";
import { useStagesStore } from "~/stores/stages";
import { defaultProfile, formatCoords, toParagraphs } from "~/utils/trail";
import { buildStageView, isListedProject, stageHeading, stageOfProject } from "~/utils/stages";

const route = useRoute();

const projectsStore = useProjectsStore();
const stagesStore = useStagesStore();
await Promise.all([projectsStore.fetchProjects(), stagesStore.fetchStages()]);

const slugOf = (p: Pick<Project, "slug" | "_id">) => p.slug || p._id;
const list = computed(() => projectsStore.projects);
const currentIndex = computed(() => list.value.findIndex((p) => slugOf(p) === route.params.id));
const project = computed(() => list.value[currentIndex.value]);

if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: "Sentier introuvable", fatal: true });
}

// Étape de la trace qui porte ce projet : même numéro, nom et résultat clé que l'accueil et /projects (utils/stages.ts)
const stage = computed(() =>
  stageOfProject(
    project.value && slugOf(project.value),
    buildStageView(stagesStore.stages, list.value.map((p) => ({ slug: slugOf(p), title: p.title })))
  )
);

// Voisins : parmi les fiches publiées sur /projects (une fiche non publiée garde tous les projets comme voisins)
const listedOnly = (p: Project) => isListedProject({ ...p, slug: slugOf(p) });
const navList = computed(() => (project.value && listedOnly(project.value) ? list.value.filter(listedOnly) : list.value));
const navIndex = computed(() => navList.value.findIndex((p) => slugOf(p) === route.params.id));
const prevProject = computed(() =>
  navList.value.length > 1 ? navList.value[(navIndex.value - 1 + navList.value.length) % navList.value.length] : undefined
);
const nextProject = computed(() =>
  navList.value.length > 1 ? navList.value[(navIndex.value + 1) % navList.value.length] : undefined
);

useHead({
  title: computed(() => `${project.value?.title ?? "Sentier"} — Sentiers | Adrien Neyron`),
  meta: [{ name: "description", content: computed(() => project.value?.tagline || project.value?.description || "") }],
});

const number = computed(() => String(currentIndex.value + 1).padStart(2, "0"));
const coords = computed(() => formatCoords(project.value?.coords));
const points = computed(() =>
  project.value?.profile?.length ? project.value.profile : defaultProfile(slugOf(project.value!))
);
const milestones = computed(() => project.value?.milestones ?? []);
const hasImage = computed(() => {
  const src = project.value?.image?.light;
  return !!src && !src.includes("projectsoon");
});

const facts = computed(() => {
  const p = project.value!;
  return [
    { k: "Rôle", v: p.role },
    { k: "Départ", v: p.startDate || p.duration },
    { k: "Catégorie", v: p.category },
    { k: "Statut", v: p.status },
    { k: "Stack", v: p.technologies.slice(0, 3).join(" · ") },
  ].filter((f) => f.v);
});

// Sommaire : seulement les sections réellement présentes sur la fiche
const sections = computed(() => [
  { id: "depart",     label: "Départ — le contexte", show: true },
  { id: "passages",   label: "Passages délicats",    show: !!project.value?.challenge },
  { id: "itineraire", label: "L'itinéraire choisi",  show: !!project.value?.solution },
  { id: "arrivee",    label: "Arrivée — résultats",  show: true },
].filter((s) => s.show));
</script>

<template>
  <div v-if="project">
    <!-- En-tête -->
    <header class="relative overflow-hidden">
      <TrailContourBackground :seed="11 + currentIndex" :cx="76" :cy="48" />
      <div class="relative max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 py-14 sm:py-20">
        <nav aria-label="Fil d'Ariane" class="font-mono text-xs text-(--color-muted) mb-6">
          <ol class="flex flex-wrap gap-2">
            <li><NuxtLink to="/" class="hover:underline">Camp de Base</NuxtLink></li>
            <li aria-hidden="true">/</li>
            <li><NuxtLink to="/projects" class="hover:underline">Sentiers</NuxtLink></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{{ project.title }}</li>
          </ol>
        </nav>

        <p class="font-mono text-xs uppercase tracking-[0.14em] text-(--color-accent) mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{{ stage ? stage.label : `Sentier ${number}` }}<template v-if="project.place"> · {{ project.place }}</template></span>
          <span v-if="coords" class="text-(--color-muted) normal-case tracking-normal">— {{ coords }}</span>
        </p>

        <h1 class="text-4xl sm:text-6xl leading-[1.02] text-(--color-text) max-w-3xl">
          {{ project.title }}
        </h1>
        <p v-if="project.tagline" class="mt-4 text-xl sm:text-2xl text-(--color-accent) max-w-3xl" style="font-family: var(--font-title); font-style: italic;">
          {{ project.tagline }}
        </p>
        <!-- Sur la trace : l'étape et son résultat clé (mêmes données que l'accueil) -->
        <p v-if="stage" class="mt-6 font-mono text-sm text-(--color-text) flex flex-wrap gap-x-3 gap-y-1">
          <span>{{ stageHeading(stage) }}<template v-if="stage.period"> · {{ stage.period }}</template></span>
          <strong v-if="stage.keyResult" class="font-semibold text-(--color-accent)">{{ stage.keyResult }}</strong>
        </p>
      </div>
    </header>

    <!-- Photo d'ambiance « grain skate » (décorative : alt vide, RGAA 1.2).
         Le lieu et les coordonnées sont déjà dans l'en-tête ; l'étiquette GPS
         sur la photo est donc masquée aux lecteurs d'écran. -->
    <figure v-if="project.cover" class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 mb-10">
      <div class="grain-photo rounded-xl h-56 sm:h-80 lg:h-[26rem]">
        <NuxtImg :src="project.cover" alt="" width="1600" height="700" class="w-full h-full object-cover" />
        <span v-if="project.place || coords" class="gps-tag absolute bottom-3 left-3" aria-hidden="true">
          {{ [project.place, coords].filter(Boolean).join(" · ") }}
        </span>
      </div>
      <figcaption v-if="project.coverCredit" class="mt-2 font-mono text-[11px] text-(--color-muted)">
        Photo :
        <a v-if="project.coverCreditUrl" :href="project.coverCreditUrl" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-(--color-accent)">
          {{ project.coverCredit }}<span class="sr-only"> (nouvelle fenêtre)</span>
        </a>
        <template v-else>{{ project.coverCredit }}</template>
      </figcaption>
    </figure>

    <!-- Fiche technique -->
    <dl class="border-y border-(--color-accent)/20 bg-(--color-surface)">
      <div class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 grid grid-cols-2 lg:grid-cols-5">
        <div
          v-for="(f, i) in facts"
          :key="f.k"
          :class="['py-4 pr-4', i > 0 ? 'lg:pl-5 lg:border-l lg:border-(--color-accent)/20' : '']"
        >
          <dt class="font-mono text-[11px] uppercase tracking-[0.12em] text-(--color-muted)">{{ f.k }}</dt>
          <dd class="mt-1 text-sm font-medium text-(--color-text)">{{ f.v }}</dd>
        </div>
      </div>
    </dl>

    <!-- Profil du sentier -->
    <figure class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 pt-12">
      <TrailElevationProfile :points="points" :milestones="milestones" :height="190" />
      <figcaption class="mt-3 font-mono text-xs text-(--color-muted)">
        Profil du sentier<template v-if="milestones.length"> :
          <span v-for="(m, i) in milestones" :key="m.label">{{ m.label }}<template v-if="m.detail"> ({{ m.detail }})</template>{{ i < milestones.length - 1 ? " → " : "." }}</span>
        </template>
      </figcaption>
    </figure>

    <!-- Topo-guide -->
    <div class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 py-14 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Itinéraire de la fiche" class="lg:sticky lg:top-24 self-start">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-(--color-muted) mb-3">Itinéraire</p>
        <ol class="flex flex-wrap lg:flex-col gap-3">
          <li v-for="s in sections" :key="s.id">
            <a :href="`#${s.id}`" class="toc-link">{{ s.label }}</a>
          </li>
        </ol>
      </nav>

      <div class="flex flex-col gap-14">
        <section id="depart" class="topo-section" aria-labelledby="h-depart">
          <p class="topo-eyebrow"><span class="blaze" aria-hidden="true" />Départ — le contexte</p>
          <h2 id="h-depart" class="topo-h2">Le point de départ</h2>
          <p v-for="(p, i) in toParagraphs(project.description)" :key="i" class="topo-p">{{ p }}</p>
          <!-- Capture d'écran : laissée nette (pas de grain) pour rester lisible -->
          <figure v-if="hasImage" class="relative mt-2 overflow-hidden rounded-xl border border-(--color-accent)/15">
            <NuxtImg
              :src="project.image!.light!"
              :alt="`Capture d'écran : ${project.title}`"
              width="1200"
              height="600"
              class="w-full"
            />
            <figcaption v-if="!project.cover && (project.place || coords)" class="gps-tag absolute bottom-3 left-3">
              {{ [project.place, coords].filter(Boolean).join(" · ") }}
            </figcaption>
          </figure>
        </section>

        <section v-if="project.challenge" id="passages" class="topo-section" aria-labelledby="h-passages">
          <p class="topo-eyebrow"><span class="blaze" aria-hidden="true" />Passages délicats</p>
          <h2 id="h-passages" class="topo-h2">Les difficultés du terrain</h2>
          <p v-for="(p, i) in toParagraphs(project.challenge)" :key="i" class="topo-p">{{ p }}</p>
        </section>

        <section v-if="project.solution" id="itineraire" class="topo-section" aria-labelledby="h-itineraire">
          <p class="topo-eyebrow"><span class="blaze" aria-hidden="true" />L'itinéraire choisi</p>
          <h2 id="h-itineraire" class="topo-h2">Comment je suis passé</h2>
          <p v-for="(p, i) in toParagraphs(project.solution)" :key="i" class="topo-p">{{ p }}</p>
        </section>

        <section id="arrivee" class="topo-section" aria-labelledby="h-arrivee">
          <p class="topo-eyebrow"><span class="blaze" aria-hidden="true" />Arrivée — résultats</p>
          <h2 id="h-arrivee" class="topo-h2">Ce qui a changé</h2>
          <p v-for="(p, i) in toParagraphs(project.result)" :key="i" class="topo-p">{{ p }}</p>

          <ul v-if="project.stats?.length" class="grid gap-4 sm:grid-cols-3 mt-2">
            <li v-for="s in project.stats" :key="s.value + s.label" class="rounded-lg bg-(--color-surface) p-5">
              <span class="block text-4xl leading-none text-(--color-accent)" style="font-family: var(--font-title);">{{ s.value }}</span>
              <span class="block mt-2 text-sm text-(--color-muted)">{{ s.label }}</span>
            </li>
          </ul>

          <ul class="flex flex-wrap gap-2 mt-2" aria-label="Technologies">
            <li v-for="tech in project.technologies" :key="tech"><UiTechBadge :label="tech" variant="featured" /></li>
          </ul>

          <div v-if="project.code || project.link" class="flex flex-wrap gap-3 mt-2">
            <a v-if="project.code" :href="project.code" target="_blank" rel="noopener noreferrer" class="button-empty px-5 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2">
              <Github :size="16" aria-hidden="true" /> Voir le code <span class="sr-only">(nouvel onglet)</span>
            </a>
            <a v-if="project.link" :href="project.link" target="_blank" rel="noopener noreferrer" class="button-accent px-5 py-3 rounded-full text-sm font-semibold inline-flex items-center gap-2">
              <ExternalLink :size="16" aria-hidden="true" /> Voir le site <span class="sr-only">(nouvel onglet)</span>
            </a>
          </div>
        </section>
      </div>
    </div>

    <!-- Sentiers voisins -->
    <nav v-if="prevProject && nextProject" aria-label="Sentiers voisins" class="border-t border-(--color-accent)/20">
      <div class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 grid grid-cols-2">
        <NuxtLink :to="`/projects/${slugOf(prevProject)}`" class="neighbour py-8 pr-4">
          <span class="neighbour-k">← Sentier précédent</span>
          <span class="neighbour-t">{{ prevProject.title }}</span>
        </NuxtLink>
        <NuxtLink :to="`/projects/${slugOf(nextProject)}`" class="neighbour py-8 pl-4 text-right border-l border-(--color-accent)/20">
          <span class="neighbour-k">Sentier suivant →</span>
          <span class="neighbour-t">{{ nextProject.title }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.toc-link {
  display: inline-flex; align-items: center; gap: 0.6rem;
  font-size: 0.95rem; color: var(--color-text); text-decoration: none;
}
.toc-link::before {
  content: ""; width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid var(--color-accent); flex: none;
}
.toc-link:hover { text-decoration: underline; text-underline-offset: 3px; }

.topo-section { display: flex; flex-direction: column; gap: 1.1rem; border-top: 1.5px solid var(--color-text); padding-top: 1.5rem; scroll-margin-top: 6rem; }
.topo-eyebrow {
  display: flex; align-items: center; gap: 0.8rem; margin: 0;
  font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-muted);
}
.topo-h2 { font-size: clamp(1.9rem, 3.4vw, 2.6rem); line-height: 1.08; color: var(--color-text); margin: 0; }
.topo-p { font-size: 1.05rem; line-height: 1.7; color: var(--color-text); max-width: 68ch; margin: 0; }

/* balise de sentier GR : blanc au-dessus du rouge */
.blaze { display: inline-flex; flex-direction: column; gap: 3px; }
.blaze::before, .blaze::after { content: ""; width: 30px; height: 7px; }
.blaze::before { background: #fff; outline: 1px solid color-mix(in srgb, var(--color-muted) 60%, transparent); outline-offset: -1px; }
.blaze::after { background: #C8352B; }

.neighbour { display: flex; flex-direction: column; gap: 0.35rem; text-decoration: none; }
.neighbour-k { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); }
.neighbour-t { font-family: var(--font-title); font-size: clamp(1.3rem, 2.6vw, 2rem); line-height: 1.15; color: var(--color-text); }
.neighbour:hover .neighbour-t { color: var(--color-accent); }
</style>
