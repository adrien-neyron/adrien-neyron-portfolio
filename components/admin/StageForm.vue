<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import {
  buildStageView, orderForPlacement, placementOf, placementOptions, stageKeyFromTitle, validateStage, validateStageDisplay,
  withStageDefaults, STAGE_DISPLAY_MAP, PLACE_START,
  type Stage, type StageKind, type StageIssue, type StageField, type StageImage,
} from "~/utils/stages";
import { stages as staticStages } from "~/data/stages";

/**
 * Étape de la trace de l'accueil (voir utils/stages.ts). Un chiffre vide = l'étape s'affiche sans chiffre.
 * Le formulaire est découpé selon l'endroit où le visiteur voit l'information : « Cairn et card » (texte commun),
 * « Sur le cairn » (stèle gravée dans la 3D) et « Dans la card » (panneau d'étape). Tout ce qui s'affiche est
 * saisi ici (stocké en base) ou calculé d'après l'emplacement : voir la table d'aide (STAGE_DISPLAY_MAP).
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
  figure: "", figureLabel: "", projects: [], ctaLabel: "", steleTitle: "", stelePeriod: "",
  ...props.initial,
});

// Champs d'affichage saisis en texte (vide = calcul automatique) ; images : une ligne par aperçu, 3 au plus.
const kmIn   = ref(props.initial?.km != null ? String(props.initial.km) : "");
const gainIn = ref(props.initial?.gain != null ? String(props.initial.gain) : "");
const altIn  = ref(props.initial?.altitude != null ? String(props.initial.altitude) : "");
const tagsIn = ref((props.initial?.steleTags ?? []).join(", "));
// étape de la base sans images : le site montre celles par défaut, le formulaire aussi (elles sont enregistrées à la sauvegarde)
const imgs = ref<StageImage[]>(
  (withStageDefaults({ key: props.initial?.key, images: props.initial?.images }, staticStages).images ?? []).map((i) => ({ ...i })),
);
const addImage = () => { if (imgs.value.length < 3) imgs.value.push({ src: "", title: "" }); };
const { queue: queueTrash } = useBlobTrash();
const removeImage = (i: number) => { queueTrash(imgs.value[i]?.src); imgs.value.splice(i, 1); };   // le fichier part du stockage à l'enregistrement

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
// `preview` : valeurs calculées (sans les km / D+ saisis) ; `shown` : ce que le visiteur verra, avec les valeurs saisies
const previewOf = (extra: Partial<Stage>) => {
  if (candidateOrder.value === null || !form.value.key) return null;
  const me = buildStageView([...others.value, { ...form.value, order: candidateOrder.value, ...extra }], projects.value).find((v) => v.key === form.value.key);
  return me ?? null;
};
const preview = computed(() => previewOf({ km: null, gain: null, altitude: null, steleTags: [], ctaLabel: "" }));
const shown = computed(() =>
  previewOf({
    km: kmIn.value.trim() === "" ? null : Number(kmIn.value), gain: gainIn.value.trim() === "" ? null : Number(gainIn.value),
    altitude: altIn.value.trim() === "" ? null : Number(altIn.value),
    steleTags: tagsIn.value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 4),
    projects: [...checked.value, ...othersInput.value.split(",").map((x) => x.trim()).filter(Boolean)], ctaLabel: form.value.ctaLabel,
  }),
);

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
const FIELD_ID: Record<StageField, string> = {
  kind: "sf-kind", title: "sf-title", key: "sf-key", placement: "sf-placement",
  km: "sf-km", gain: "sf-gain", altitude: "sf-alt", steleTags: "sf-tags", images: "sf-images", ctaLabel: "sf-cta",
};
const issueOf = (f: StageField) => issues.value.find((i) => i.field === f)?.message ?? "";
const describedBy = (f: StageField) => (issueOf(f) ? `sf-err-${f}` : undefined);

async function onSubmit() {
  if (props.readonly) return;
  const tags = tagsIn.value.split(",").map((t) => t.trim()).filter(Boolean);
  const found = [
    ...validateStage(form.value, others.value, fixedPlace.value ? "ok" : placement.value),
    ...validateStageDisplay({ km: kmIn.value, gain: gainIn.value, altitude: altIn.value, steleTags: tags, images: imgs.value }),
  ];
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
  emit("submit", {
    ...form.value,
    order: candidateOrder.value,
    projects: [...new Set([...checked.value, ...extra])],
    km: kmIn.value.trim() === "" ? null : Number(kmIn.value),
    gain: gainIn.value.trim() === "" ? null : Number(gainIn.value),
    altitude: altIn.value.trim() === "" ? null : Number(altIn.value),
    steleTags: tags,
    images: imgs.value.filter((i) => i.src.trim()),   // enregistré même vide : « aucune image » est un choix, distinct de « jamais saisi »
  });
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <!-- Lecture seule (visiteur) : fieldset désactivé = aucun champ ni bouton actionnable, valeurs lisibles -->
    <fieldset :disabled="readonly" class="admin-form-body space-y-8">

      <!-- Récapitulatif des erreurs : annoncé, focalisé, un lien par champ à corriger -->
      <div v-if="issues.length" ref="summary" role="alert" tabindex="-1" class="sf-summary">
        <p class="font-semibold">{{ issues.length > 1 ? `${issues.length} points à corriger avant d'enregistrer :` : "1 point à corriger avant d'enregistrer :" }}</p>
        <ul>
          <li v-for="i in issues" :key="i.field + i.message"><a :href="`#${FIELD_ID[i.field]}`">{{ i.message }}</a></li>
        </ul>
      </div>

      <!-- Où s'affiche chaque information -->
      <details class="sf-map">
        <summary>Où s'affiche chaque information ?</summary>
        <p class="sf-help">
          Le <strong>cairn</strong> est la stèle gravée dans la 3D (décorative). La <strong>card</strong> est le panneau d'étape qui apparaît à côté.
          La <strong>liste</strong> est la version HTML de l'accueil (sans 3D, en mouvement réduit) et ce que lisent les lecteurs d'écran.
        </p>
        <div class="sf-map-scroll">
          <table>
            <caption class="sr-only">Information, champ stocké en base, et endroits où elle s'affiche</caption>
            <thead><tr><th scope="col">Information</th><th scope="col">Champ en base</th><th scope="col">Cairn</th><th scope="col">Card</th><th scope="col">Liste</th><th scope="col">Précision</th></tr></thead>
            <tbody>
              <tr v-for="r in STAGE_DISPLAY_MAP" :key="r.info">
                <th scope="row">{{ r.info }}</th>
                <td><code>{{ r.field }}</code></td>
                <td>{{ r.cairn ? "Oui" : "Non" }}</td>
                <td>{{ r.card ? "Oui" : "Non" }}</td>
                <td>{{ r.liste ? "Oui" : "Non" }}</td>
                <td>{{ r.note || "" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <!-- 1. Emplacement et identité -->
      <fieldset class="sf-group">
        <legend>1 · Emplacement sur la trace</legend>
        <p class="sf-help">Le numéro (Étape 01, 02…), le kilomètre et le dénivelé découlent de l'emplacement.</p>
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
        <div class="max-w-sm">
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
      </fieldset>

      <!-- 2. Texte commun -->
      <fieldset class="sf-group">
        <legend>2 · Titre et période : cairn et card</legend>
        <p class="sf-help">Le titre et la période de la card sont ceux du panneau (et de la liste). Le cairn peut graver un titre plus court et une autre période : laisse ses champs vides pour reprendre ceux de la card.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="sf-title" class="admin-label">Titre de la card * <span class="sf-tag">Card</span></label>
            <input id="sf-title" v-model="form.title" required aria-required="true" class="admin-input" placeholder="DGFiP, mission via BeTeam" :aria-invalid="!!issueOf('title')" :aria-describedby="describedBy('title')" />
            <p v-if="issueOf('title')" id="sf-err-title" class="sf-err">{{ issueOf("title") }}</p>
          </div>
          <div>
            <label for="sf-period" class="admin-label">Période de la card <span class="sf-tag">Card</span></label>
            <input id="sf-period" v-model="form.period" class="admin-input" placeholder="Déc. 2023 – Oct. 2025" />
          </div>
        </div>
      </fieldset>

      <!-- 3. Sur le cairn -->
      <fieldset class="sf-group">
        <legend>3 · Sur le cairn <span class="sf-tag">stèle gravée</span></legend>
        <p class="sf-help">Gravés dans la pierre : le libellé (calculé), le lieu et la période, le titre, kilomètre et dénivelé, altitude, puis une ligne du bas. Laisse un champ numérique vide pour garder le calcul automatique.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="sf-stele-title" class="admin-label">Titre du cairn <span class="sf-tag">Cairn</span></label>
            <input id="sf-stele-title" v-model="form.steleTitle" class="admin-input" :placeholder="form.title ? `vide : ${form.title}` : 'vide : titre de la card'" aria-describedby="sf-stele-title-help" />
            <p id="sf-stele-title-help" class="mt-1 text-xs text-(--color-muted)">Gravé en grand : un nom court tient mieux qu'une phrase.</p>
          </div>
          <div>
            <label for="sf-stele-period" class="admin-label">Période du cairn <span class="sf-tag">Cairn</span></label>
            <input id="sf-stele-period" v-model="form.stelePeriod" class="admin-input" :placeholder="form.period ? `vide : ${form.period}` : 'vide : période de la card'" />
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-1">
            <label for="sf-place" class="admin-label">Lieu <span class="sf-tag">Cairn</span></label>
            <input id="sf-place" v-model="form.place" class="admin-input" placeholder="Paris" />
          </div>
          <div>
            <label for="sf-km" class="admin-label">Kilomètre <span class="sf-tag">Cairn</span></label>
            <input id="sf-km" v-model="kmIn" inputmode="decimal" class="admin-input" :placeholder="preview ? `auto : ${preview.km}` : 'auto'" :aria-invalid="!!issueOf('km')" :aria-describedby="describedBy('km')" />
            <p v-if="issueOf('km')" id="sf-err-km" class="sf-err">{{ issueOf("km") }}</p>
          </div>
          <div>
            <label for="sf-gain" class="admin-label">D+ (m) <span class="sf-tag">Cairn</span></label>
            <input id="sf-gain" v-model="gainIn" inputmode="decimal" class="admin-input" :placeholder="preview ? `auto : ${preview.gain}` : 'auto'" :aria-invalid="!!issueOf('gain')" :aria-describedby="describedBy('gain')" />
            <p v-if="issueOf('gain')" id="sf-err-gain" class="sf-err">{{ issueOf("gain") }}</p>
          </div>
          <div>
            <label for="sf-alt" class="admin-label">Altitude (m) <span class="sf-tag">Cairn</span></label>
            <input id="sf-alt" v-model="altIn" inputmode="decimal" class="admin-input" placeholder="auto : relevée sur le tracé" :aria-invalid="!!issueOf('altitude')" :aria-describedby="describedBy('altitude')" />
            <p v-if="issueOf('altitude')" id="sf-err-alt" class="sf-err">{{ issueOf("altitude") }}</p>
          </div>
        </div>
        <div>
          <label for="sf-tags" class="admin-label">Ligne du bas <span class="sf-tag">Cairn</span> <span class="normal-case font-normal">(4 éléments au plus, séparés par des virgules)</span></label>
          <input id="sf-tags" v-model="tagsIn" class="admin-input" placeholder="Vue 3, TypeScript, Accessibilité" aria-describedby="sf-tags-help" :aria-invalid="!!issueOf('steleTags')" />
          <p id="sf-tags-help" class="mt-1 text-xs text-(--color-muted)">Vide : le chiffre clé s'il existe, sinon les noms des fiches liées. Une ligne trop longue perd son dernier élément à la gravure.</p>
          <p v-if="issueOf('steleTags')" id="sf-err-steleTags" class="sf-err">{{ issueOf("steleTags") }}</p>
        </div>
        <!-- Aperçu du texte gravé -->
        <div v-if="shown" class="sf-preview" role="group" aria-label="Aperçu du texte gravé sur le cairn">
          <p class="sf-preview-t">Aperçu du texte gravé</p>
          <p class="sf-eng sf-mono">{{ shown.label }}</p>
          <p v-if="shown.place || shown.stelePeriod" class="sf-eng sf-mono">{{ [shown.place, shown.stelePeriod].filter(Boolean).join(" · ") }}</p>
          <p class="sf-eng sf-big">{{ shown.steleTitle }}</p>
          <p class="sf-eng sf-mono">Km {{ shown.km }} · D+ {{ shown.gain }} m</p>
          <p class="sf-eng sf-mono">Altitude {{ shown.altitude ?? "(relevée sur le tracé)" }}{{ shown.altitude != null ? " m" : "" }}</p>
          <p v-if="shown.steleTags.length" class="sf-eng sf-mono">{{ shown.steleTags.slice(0, 4).join(" · ") }}</p>
        </div>
      </fieldset>

      <!-- 4. Dans la card -->
      <fieldset class="sf-group">
        <legend>4 · Dans la card <span class="sf-tag">panneau d'étape</span></legend>
        <p class="sf-help">Affichés dans le panneau à côté du cairn : libellé · période, titre, résumé, chiffre clé, aperçus d'image, puis les liens. Le lieu, l'altitude et le kilomètre y sont lus aux lecteurs d'écran.</p>

        <div>
          <label for="sf-summary" class="admin-label">Résumé <span class="sf-tag">Card + liste</span> <span class="normal-case font-normal">(retour à la ligne et ligne vide conservés)</span></label>
          <textarea id="sf-summary" v-model="form.summary" rows="4" class="admin-input resize-y" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-4">
          <div>
            <label for="sf-figure" class="admin-label">Chiffre <span class="sf-tag">Card</span></label>
            <input id="sf-figure" v-model="form.figure" class="admin-input" placeholder="−50 %" aria-describedby="sf-figure-help" />
          </div>
          <div>
            <label for="sf-figure-label" class="admin-label">Libellé du chiffre <span class="sf-tag">Card</span></label>
            <input id="sf-figure-label" v-model="form.figureLabel" class="admin-input" placeholder="de temps de traitement" />
          </div>
          <p id="sf-figure-help" class="md:col-span-2 text-xs text-(--color-muted)">Vide : l'étape s'affiche sans chiffre (aucune valeur n'est inventée).</p>
        </div>

        <fieldset id="sf-images" class="space-y-3" tabindex="-1">
          <legend class="admin-label">Images d'aperçu <span class="sf-tag">Card</span> <span class="normal-case font-normal">(3 au plus, décoratives)</span></legend>
          <p class="sf-help">Elles passent avant celles des projets liés. Le titre est écrit sous l'image. Aucune image : l'aperçu n'apparaît pas.</p>
          <div v-for="(im, i) in imgs" :key="i" class="sf-img-row">
            <div class="flex-1 min-w-0 space-y-2">
              <label :for="`sf-img-src-${i}`" class="admin-label">Image {{ i + 1 }}</label>
              <input :id="`sf-img-src-${i}`" v-model="im.src" class="admin-input font-mono text-sm" placeholder="/recentprojects/mon-image.webp ou https://…" />
              <AdminFileUpload v-model="im.src" accept="image/*" label="Envoyer une image" />
              <label :for="`sf-img-title-${i}`" class="admin-label">Titre sous l'image</label>
              <input :id="`sf-img-title-${i}`" v-model="im.title" class="admin-input" placeholder="UCPA Formation" />
            </div>
            <div v-if="im.src" class="sf-thumb" aria-hidden="true"><img :src="im.src" alt="" loading="lazy" /></div>
            <button type="button" class="sf-btn" :aria-label="`Supprimer l'image ${i + 1}`" @click="removeImage(i)">Supprimer</button>
          </div>
          <button v-if="imgs.length < 3" type="button" class="sf-btn" @click="addImage">Ajouter une image</button>
          <p v-if="issueOf('images')" id="sf-err-images" class="sf-err">{{ issueOf("images") }}</p>
        </fieldset>

        <fieldset class="space-y-2">
          <legend class="admin-label">Fiches liées <span class="sf-tag">Card + liste</span></legend>
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

        <div class="max-w-md">
          <label for="sf-cta" class="admin-label">Texte du lien principal <span class="sf-tag">Card + liste</span></label>
          <input id="sf-cta" v-model="form.ctaLabel" class="admin-input" placeholder="Fiche DGFiP" aria-describedby="sf-cta-help" />
          <p id="sf-cta-help" class="mt-1 text-xs text-(--color-muted)">Vide : « Fiche &lt;projet&gt; » (premier projet lié), ou « Écrire la suite ensemble » au cairn final.</p>
        </div>

        <!-- Aperçu de la card -->
        <div v-if="shown" class="sf-preview" role="group" aria-label="Aperçu du texte de la card">
          <p class="sf-preview-t">Aperçu du texte de la card</p>
          <p class="sf-mono">{{ [shown.label, form.period].filter(Boolean).join(" · ") }}</p>
          <p class="sf-big">{{ shown.title }}</p>
          <p v-if="form.summary" class="sf-sum">{{ form.summary }}</p>
          <p v-if="shown.keyResult"><strong>{{ shown.keyResult }}</strong></p>
          <div v-if="imgs.filter((i) => i.src).length" class="sf-prev-imgs" role="group" aria-label="Aperçus d'image de la card">
            <figure v-for="(im, i) in imgs.filter((x) => x.src)" :key="im.src + i" class="sf-prev-fig">
              <img :src="im.src" alt="" loading="lazy" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'" />
              <figcaption>{{ im.title || "sans titre" }}</figcaption>
            </figure>
          </div>
          <p v-else class="sf-mono">Aucune image d'étape : la card n'affiche que celles des projets liés, s'il y en a.</p>
          <p v-if="shown.cta" class="sf-mono">Lien : {{ shown.cta }} →</p>
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
.sf-group { border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent); border-radius: 0.75rem; padding: 1rem 1rem 1.25rem; display: grid; gap: 1rem; }
.sf-group > legend { padding: 0 0.5rem; font-weight: 700; font-size: 0.95rem; color: var(--color-text); }
.sf-help { font-size: 0.8125rem; color: var(--color-muted); }
.sf-tag { display: inline-block; margin-left: 0.25rem; padding: 0 0.4rem; border: 1px solid var(--color-muted); border-radius: 0.25rem; font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em; text-transform: none; color: var(--color-muted); }
.sf-map { border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent); border-radius: 0.75rem; padding: 0.75rem 1rem; }
.sf-map > summary { cursor: pointer; font-weight: 600; min-height: 44px; display: flex; align-items: center; }
.sf-map > summary:focus-visible { outline: 3px solid var(--color-accent); outline-offset: 2px; }
.sf-map-scroll { overflow-x: auto; margin-top: 0.5rem; }
.sf-map table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
.sf-map th, .sf-map td { text-align: left; padding: 0.375rem 0.5rem; border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent); vertical-align: top; }
.sf-map thead th { color: var(--color-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }
.sf-preview { border: 1px dashed var(--color-muted); border-radius: 0.5rem; padding: 0.75rem 1rem; display: grid; gap: 0.25rem; font-size: 0.875rem; color: var(--color-text); }
.sf-preview-t { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-muted); }
.sf-eng { text-align: center; }
.sf-mono { font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.8125rem; }
.sf-big { font-family: var(--font-title); font-size: 1.25rem; }
.sf-img-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-start; padding: 0.75rem; border: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent); border-radius: 0.5rem; }
.sf-thumb { width: 7rem; flex: none; border-radius: 0.375rem; overflow: hidden; border: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent); }
.sf-thumb img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
.sf-btn { min-height: 44px; padding: 0 1rem; border-radius: 0.5rem; border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent); color: var(--color-accent); background: transparent; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
.sf-btn:hover { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
.sf-btn:focus-visible { outline: 3px solid var(--color-accent); outline-offset: 2px; }
.sf-prev-imgs { display: grid; grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr)); gap: 0.5rem; }
.sf-prev-fig { margin: 0; }
.sf-prev-fig img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 0.375rem; border: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent); }
.sf-prev-fig figcaption { margin-top: 0.25rem; font-size: 0.75rem; color: var(--color-muted); }
.sf-sum { white-space: pre-line; }
</style>
