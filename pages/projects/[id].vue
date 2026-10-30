<script setup lang="ts">
/**
 * Fiche topo d'un sentier (projet) — refonte « L'ascension ».
 * Départ (description) → Passages délicats (challenge) → Itinéraire (solution)
 * → Arrivée (result + stats). Données : store projets (Mongo + repli statique).
 * Mise en page du 30/10/2026 : en-tête en deux colonnes (texte + visuel en couleur), liens d'action dès le haut,
 * sentier vertical qui relie les étapes de la fiche, appel au contact en fin de page.
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

// Visuel d'en-tête : photo d'ambiance (en couleur), sinon la capture dans un cadre de navigateur
const heroKind = computed<"cover" | "shot" | "none">(() =>
  project.value?.cover ? "cover" : hasImage.value ? "shot" : "none"
);
const gpsText = computed(() => [project.value?.place, coords.value].filter(Boolean).join(" · "));

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
  { id: "depart",     label: "Départ — le contexte", title: "Le point de départ",         show: true },
  { id: "passages",   label: "Passages délicats",    title: "Les difficultés du terrain", show: !!project.value?.challenge },
  { id: "itineraire", label: "L'itinéraire choisi",  title: "Comment je suis passé",      show: !!project.value?.solution },
  { id: "arrivee",    label: "Arrivée — résultats",  title: "Ce qui a changé",            show: true },
].filter((s) => s.show));
</script>

<template>
  <div v-if="project">
    <!-- En-tête : texte à gauche, visuel à droite -->
    <header class="relative overflow-hidden">
      <TrailContourBackground :seed="11 + currentIndex" :cx="76" :cy="48" />
      <div class="relative max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 pt-10 sm:pt-14 pb-10 sm:pb-14">
        <nav aria-label="Fil d'Ariane" class="font-mono text-xs text-(--color-muted) mb-8">
          <ol class="flex flex-wrap gap-2">
            <li><NuxtLink to="/" class="hover:underline">Accueil</NuxtLink></li>
            <li aria-hidden="true">/</li>
            <li><NuxtLink to="/projects" class="hover:underline">Sentiers</NuxtLink></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{{ project.title }}</li>
          </ol>
        </nav>

        <div :class="['grid gap-10 items-center', heroKind !== 'none' ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14' : '']">
          <div>
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-(--color-accent) mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>{{ stage ? stage.label : `Sentier ${number}` }}<template v-if="project.place"> · {{ project.place }}</template></span>
              <span v-if="coords" class="text-(--color-muted) normal-case tracking-normal">— {{ coords }}</span>
            </p>

            <h1 class="text-4xl sm:text-5xl lg:text-6xl leading-[1.04] text-(--color-text)">
              {{ project.title }}
            </h1>
            <p v-if="project.tagline" class="mt-4 text-xl sm:text-2xl text-(--color-accent)" style="font-family: var(--font-title); font-style: italic;">
              {{ project.tagline }}
            </p>

            <!-- Sur la trace : l'étape et son résultat clé (mêmes données que l'accueil) -->
            <div v-if="stage" class="key-result mt-7">
              <p class="font-mono text-xs uppercase tracking-[0.12em] text-(--color-muted)">
                {{ stageHeading(stage) }}<template v-if="stage.period"> · {{ stage.period }}</template>
              </p>
              <p v-if="stage.keyResult" class="mt-1 text-2xl text-(--color-text)" style="font-family: var(--font-title);">
                {{ stage.keyResult }}
              </p>
            </div>

            <!-- Actions dès le haut de la fiche -->
            <div v-if="project.link || project.code" class="flex flex-wrap gap-3 mt-8">
              <a v-if="project.link" :href="project.link" target="_blank" rel="noopener noreferrer" class="button-accent px-6 py-3 min-h-11 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                <ExternalLink :size="16" aria-hidden="true" /> Voir le site <span class="sr-only">(nouvel onglet)</span>
              </a>
              <a v-if="project.code" :href="project.code" target="_blank" rel="noopener noreferrer" class="button-empty px-6 py-3 min-h-11 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                <Github :size="16" aria-hidden="true" /> Voir le code <span class="sr-only">(nouvel onglet)</span>
              </a>
            </div>
          </div>

          <!-- Visuel : photo d'ambiance en couleur (décorative, alt vide, RGAA 1.2), sinon la capture dans un cadre -->
          <figure v-if="heroKind !== 'none'" class="hero-visual">
            <div v-if="heroKind === 'cover'" class="visual-frame">
              <NuxtImg :src="project.cover!" alt="" width="1200" height="750" class="w-full h-full object-cover" />
              <span v-if="gpsText" class="gps-tag absolute bottom-3 left-3" aria-hidden="true">{{ gpsText }}</span>
            </div>
            <div v-else class="visual-frame browser">
              <div class="browser-bar" aria-hidden="true"><span /><span /><span /></div>
              <NuxtImg
                :src="project.image!.light!"
                :alt="`Capture d'écran : ${project.title}`"
                width="1200"
                height="750"
                class="w-full object-cover object-top"
              />
            </div>
            <figcaption v-if="heroKind === 'cover' && project.coverCredit" class="mt-2 font-mono text-[11px] text-(--color-muted)">
              Photo :
              <a v-if="project.coverCreditUrl" :href="project.coverCreditUrl" target="_blank" rel="noopener" class="underline underline-offset-2 hover:text-(--color-accent)">
                {{ project.coverCredit }}<span class="sr-only"> (nouvelle fenêtre)</span>
              </a>
              <template v-else>{{ project.coverCredit }}</template>
            </figcaption>
          </figure>
        </div>
      </div>
    </header>

    <!-- Fiche technique : une carte par information -->
    <div class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20">
      <dl class="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div v-for="f in facts" :key="f.k" class="fact">
          <dt class="font-mono text-[11px] uppercase tracking-[0.12em] text-(--color-muted)">{{ f.k }}</dt>
          <dd class="mt-1.5 text-sm font-medium text-(--color-text) leading-snug">{{ f.v }}</dd>
        </div>
      </dl>
    </div>

    <!-- Profil du sentier -->
    <figure class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 mt-10">
      <div class="profile-card">
        <TrailElevationProfile :points="points" :milestones="milestones" :height="150" />
      </div>
      <figcaption class="mt-3 font-mono text-xs text-(--color-muted)">
        Profil du sentier<template v-if="milestones.length"> :
          <span v-for="(m, i) in milestones" :key="m.label">{{ m.label }}<template v-if="m.detail"> ({{ m.detail }})</template>{{ i < milestones.length - 1 ? " → " : "." }}</span>
        </template>
      </figcaption>
    </figure>

    <!-- Topo-guide -->
    <div class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 py-14 grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
      <nav aria-label="Itinéraire de la fiche" class="lg:sticky lg:top-24 self-start">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-(--color-muted) mb-3">Itinéraire</p>
        <ol class="flex flex-wrap lg:flex-col gap-x-5 gap-y-3">
          <li v-for="(s, i) in sections" :key="s.id">
            <a :href="`#${s.id}`" class="toc-link"><span class="toc-n" aria-hidden="true">{{ i + 1 }}</span>{{ s.label }}</a>
          </li>
        </ol>
      </nav>

      <!-- Le sentier : une ligne verticale relie les étapes de la fiche -->
      <div class="trail">
        <section v-for="(s, i) in sections" :id="s.id" :key="s.id" class="chapter" :aria-labelledby="`h-${s.id}`">
          <span class="chapter-n" aria-hidden="true">{{ i + 1 }}</span>
          <p class="topo-eyebrow">{{ s.label }}</p>
          <h2 :id="`h-${s.id}`" class="topo-h2">{{ s.title }}</h2>

          <template v-if="s.id === 'depart'">
            <p v-for="(p, k) in toParagraphs(project.description)" :key="k" class="topo-p">{{ p }}</p>
            <!-- Capture d'écran : à cet endroit seulement si elle n'est pas déjà le visuel d'en-tête -->
            <figure v-if="hasImage && heroKind === 'cover'" class="visual-frame browser mt-2">
              <div class="browser-bar" aria-hidden="true"><span /><span /><span /></div>
              <NuxtImg :src="project.image!.light!" :alt="`Capture d'écran : ${project.title}`" width="1200" height="600" class="w-full" />
            </figure>
          </template>

          <template v-else-if="s.id === 'passages'">
            <p v-for="(p, k) in toParagraphs(project.challenge)" :key="k" class="topo-p">{{ p }}</p>
          </template>

          <template v-else-if="s.id === 'itineraire'">
            <p v-for="(p, k) in toParagraphs(project.solution)" :key="k" class="topo-p">{{ p }}</p>
          </template>

          <template v-else>
            <p v-for="(p, k) in toParagraphs(project.result)" :key="k" class="topo-p">{{ p }}</p>

            <ul v-if="project.stats?.length" class="grid gap-3 sm:grid-cols-3 mt-2">
              <li v-for="st in project.stats" :key="st.value + st.label" class="stat">
                <span class="block text-4xl leading-none text-(--color-accent)" style="font-family: var(--font-title);">{{ st.value }}</span>
                <span class="block mt-2 text-sm text-(--color-muted) leading-snug">{{ st.label }}</span>
              </li>
            </ul>

            <div class="mt-3">
              <p class="font-mono text-xs uppercase tracking-[0.12em] text-(--color-muted) mb-2">Stack</p>
              <ul class="flex flex-wrap gap-2" aria-label="Technologies">
                <li v-for="tech in project.technologies" :key="tech"><UiTechBadge :label="tech" variant="featured" /></li>
              </ul>
            </div>
          </template>
        </section>
      </div>
    </div>

    <!-- Fin de fiche : prolonger vers le contact -->
    <section class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 pb-14" aria-labelledby="h-fin">
      <div class="end-cta">
        <div>
          <h2 id="h-fin" class="text-2xl sm:text-3xl text-(--color-text)">Une étape à écrire ensemble&nbsp;?</h2>
          <p class="mt-2 text-(--color-muted) max-w-xl">Un projet similaire, un audit d'accessibilité, une mission Vue 3 : dites-moi où vous voulez aller.</p>
        </div>
        <NuxtLink to="/contact" class="button-accent px-6 py-3 min-h-11 rounded-full text-sm font-semibold inline-flex items-center gap-2 shrink-0">
          Me contacter <span aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Sentiers voisins -->
    <nav v-if="prevProject && nextProject" aria-label="Sentiers voisins" class="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 pb-16">
      <div class="grid sm:grid-cols-2 gap-3">
        <NuxtLink :to="`/projects/${slugOf(prevProject)}`" class="neighbour">
          <span class="neighbour-k">← Sentier précédent</span>
          <span class="neighbour-t">{{ prevProject.title }}</span>
        </NuxtLink>
        <NuxtLink :to="`/projects/${slugOf(nextProject)}`" class="neighbour sm:text-right">
          <span class="neighbour-k">Sentier suivant →</span>
          <span class="neighbour-t">{{ nextProject.title }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.key-result { border-left: 3px solid var(--color-accent); padding-left: 1rem; max-width: 34rem; }

/* visuel d'en-tête */
.hero-visual { margin: 0; }
.visual-frame {
  position: relative; overflow: hidden; border-radius: 1rem; aspect-ratio: 16 / 10;
  background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent);
  box-shadow: 0 18px 48px -18px color-mix(in srgb, var(--color-text) 35%, transparent);
}
.visual-frame.browser { aspect-ratio: auto; }
.browser-bar { display: flex; gap: 6px; padding: 10px 12px; background: var(--color-surface); border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent); }
.browser-bar span { width: 9px; height: 9px; border-radius: 50%; background: color-mix(in srgb, var(--color-muted) 55%, transparent); }
.hero-visual .browser img { max-height: 24rem; }

/* fiche technique */
.fact {
  padding: 0.9rem 1rem; border-radius: 0.9rem; background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-accent) 14%, transparent);
}

/* profil */
.profile-card {
  padding: 1.5rem 1.5rem 0.5rem; border-radius: 1rem; background: color-mix(in srgb, var(--color-surface) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-accent) 14%, transparent);
}

/* sommaire */
.toc-link { display: inline-flex; align-items: center; gap: 0.7rem; min-height: 2.25rem; font-size: 0.95rem; color: var(--color-text); text-decoration: none; }
.toc-link:hover { text-decoration: underline; text-underline-offset: 3px; }
.toc-n {
  display: inline-flex; align-items: center; justify-content: center; flex: none; width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid var(--color-accent); color: var(--color-accent); font-family: var(--font-mono); font-size: 0.7rem; font-weight: 600;
}

/* le sentier : ligne verticale pointillée + une balise numérotée par étape */
.trail { position: relative; display: flex; flex-direction: column; gap: 3rem; padding-left: 3rem; }
.trail::before {
  content: ""; position: absolute; left: 15px; top: 16px; bottom: 16px; width: 0;
  border-left: 2px dashed color-mix(in srgb, var(--color-accent) 45%, transparent);
}
.chapter { position: relative; display: flex; flex-direction: column; gap: 1rem; scroll-margin-top: 6rem; }
.chapter-n {
  position: absolute; left: -3rem; top: 0; width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-accent); color: var(--color-bg); font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700;
  box-shadow: 0 0 0 5px var(--color-bg);
}
.topo-eyebrow { margin: 0; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-muted); }
.topo-h2 { font-size: clamp(1.7rem, 3vw, 2.3rem); line-height: 1.1; color: var(--color-text); margin: 0; }
.topo-p { font-size: 1.05rem; line-height: 1.75; color: var(--color-text); max-width: 68ch; margin: 0; }

.stat {
  padding: 1.1rem 1.25rem; border-radius: 0.9rem; background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-accent) 14%, transparent);
  border-left: 3px solid var(--color-accent);
}

/* fin de fiche */
.end-cta {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.5rem;
  padding: 1.75rem 2rem; border-radius: 1.25rem; background: var(--color-surface);
  border: 1px solid color-mix(in srgb, var(--color-accent) 22%, transparent);
}

/* voisins */
.neighbour {
  display: flex; flex-direction: column; gap: 0.35rem; text-decoration: none; padding: 1.25rem 1.5rem; border-radius: 1rem;
  border: 1px solid color-mix(in srgb, var(--color-accent) 18%, transparent); transition: border-color 0.2s, background-color 0.2s;
}
.neighbour:hover { border-color: var(--color-accent); background: color-mix(in srgb, var(--color-surface) 70%, transparent); }
.neighbour-k { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-muted); }
.neighbour-t { font-family: var(--font-title); font-size: clamp(1.25rem, 2.4vw, 1.8rem); line-height: 1.15; color: var(--color-text); }
.neighbour:hover .neighbour-t { color: var(--color-accent); }

@media (max-width: 640px) {
  .trail { padding-left: 2.4rem; }
  .chapter-n { left: -2.4rem; width: 28px; height: 28px; font-size: 0.75rem; }
  .trail::before { left: 13px; }
}
</style>
