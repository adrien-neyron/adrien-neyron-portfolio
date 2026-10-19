<script setup lang="ts">
import { ref } from "vue";
import type { Profile } from "~/stores/profile";

const props = defineProps<{ initial: Profile; loading?: boolean; readonly?: boolean }>();
const emit  = defineEmits<{ submit: [payload: Profile] }>();

const form = ref<Profile>({
  ...props.initial,
  location: { ...props.initial.location },
  profiles: [...props.initial.profiles],
  trailStats: (props.initial.trailStats ?? []).map((s) => ({ ...s })),
});

// Paragraphes "about" et liens sociaux édités comme du texte multi-lignes
const aboutInput = ref(form.value.about.join("\n\n"));

function addSocial() {
  form.value.profiles.push({ network: "", username: "", url: "", icon: "" });
}
function removeSocial(index: number) {
  form.value.profiles.splice(index, 1);
}

// Bandeau de chiffres de /projects : un chiffre sans valeur n'est pas enregistré (rien d'inventé à l'affichage)
function addStat() {
  form.value.trailStats = [...(form.value.trailStats ?? []), { value: "", label: "" }];
}
function removeStat(index: number) {
  form.value.trailStats?.splice(index, 1);
}

function onSubmit() {
  if (props.readonly) return;
  form.value.trailStats = (form.value.trailStats ?? [])
    .map((s) => ({ value: s.value.trim(), label: s.label.trim() }))
    .filter((s) => s.value);
  form.value.about = aboutInput.value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  emit("submit", { ...form.value });
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <!-- Lecture seule (visiteur) : fieldset désactivé = aucun champ ni bouton actionnable, valeurs lisibles -->
    <fieldset :disabled="readonly" class="admin-form-body space-y-6">

      <!-- Identité -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="admin-label">Nom *</label>
          <input v-model="form.name" required class="admin-input" />
        </div>
        <div>
          <label class="admin-label">Titre / label</label>
          <input v-model="form.label" class="admin-input" placeholder="Développeur Web Fullstack JS · Vue.js…" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="admin-label">Email *</label>
          <input v-model="form.email" type="email" required class="admin-input" />
        </div>
        <div>
          <label class="admin-label">Téléphone</label>
          <input v-model="form.phone" class="admin-input" />
        </div>
      </div>

      <!-- Accroche (Home) -->
      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="admin-label">Titre principal (accueil)</label>
          <input v-model="form.heroTitle" class="admin-input" placeholder="Développeur spécialisé sport & outdoor" />
        </div>
        <div>
          <label class="admin-label">Accroche principale (job1)</label>
          <input v-model="form.job1" class="admin-input" placeholder="Je livre des applications qui tiennent en production." />
        </div>
        <div>
          <label class="admin-label">Accroche secondaire (job2)</label>
          <textarea v-model="form.job2" rows="2" class="admin-input resize-none" />
        </div>
        <div>
          <label class="admin-label">Sous-titre du header</label>
          <input v-model="form.headerSubtitle" class="admin-input" placeholder="Fullstack JS · Vue.js / Node.js · AI & Automation" />
        </div>
        <div>
          <label class="admin-label">Description courte</label>
          <textarea v-model="form.description" rows="2" class="admin-input resize-none" />
        </div>
        <div>
          <label class="admin-label">Résumé (localisation / dispo)</label>
          <input v-model="form.summary" class="admin-input" placeholder="CDI & Freelance · Haute-Savoie · Lyon · Remote" />
        </div>
      </div>

      <!-- About -->
      <div>
        <label class="admin-label">Paragraphes "À propos" <span class="text-xs text-(--color-muted)">(un paragraphe par bloc, séparés par une ligne vide)</span></label>
        <textarea v-model="aboutInput" rows="8" class="admin-input resize-y" />
      </div>

      <!-- Images / CV -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="admin-label">Photo de profil</label>
          <AdminFileUpload v-model="form.pictureUrl" accept="image/*" label="Changer la photo" />
        </div>
        <div>
          <label class="admin-label">CV (PDF)</label>
          <AdminFileUpload v-model="form.cvUrl" accept="application/pdf" label="Changer le CV" />
        </div>
      </div>

      <!-- Accueil « L'ascension » : textes de la fiche Le Randonneur et du Bivouac -->
      <fieldset class="space-y-4 border-t pt-6" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
        <legend class="admin-label">Accueil « L'ascension » <span class="normal-case font-normal">(vide : le texte par défaut de l'accueil est conservé)</span></legend>
        <div>
          <label for="pr-loop-eyebrow" class="admin-label">Surtitre de l'accueil <span class="normal-case font-normal">— au-dessus du titre (ex. « Adrien Neyron »)</span></label>
          <input id="pr-loop-eyebrow" v-model="form.loopEyebrow" type="text" maxlength="80" class="admin-input" />
        </div>
        <div>
          <label for="pr-loop-title" class="admin-label">Titre de l'accueil <span class="normal-case font-normal">— repris sur l'écran de la corde</span></label>
          <input id="pr-loop-title" v-model="form.loopTitle" type="text" maxlength="120" class="admin-input" />
        </div>
        <div>
          <label for="pr-loop-lede" class="admin-label">Sous-texte de l'accueil</label>
          <textarea id="pr-loop-lede" v-model="form.loopLede" rows="3" maxlength="260" class="admin-input resize-none" />
        </div>
        <fieldset class="space-y-4 border border-[var(--line,#ccc)] rounded p-4">
          <legend class="admin-label px-1">Cadran de la montre</legend>
          <div>
            <label for="pr-dial-name" class="admin-label">Nom <span class="normal-case font-normal">— vide : « ADRIEN NEYRON »</span></label>
            <input id="pr-dial-name" v-model="form.loopDialName" type="text" maxlength="40" class="admin-input" />
          </div>
          <div>
            <label for="pr-dial-role" class="admin-label">Ligne de titre <span class="normal-case font-normal">— vide : « DÉVELOPPEUR × TRAILEUR × FORMATEUR »</span></label>
            <input id="pr-dial-role" v-model="form.loopDialRole" type="text" maxlength="60" class="admin-input" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="pr-dial-xpl" class="admin-label">Libellé d'expérience <span class="normal-case font-normal">— vide : « Expérience: »</span></label>
              <input id="pr-dial-xpl" v-model="form.loopDialXpLabel" type="text" maxlength="24" class="admin-input" />
            </div>
            <div>
              <label for="pr-dial-xpv" class="admin-label">Valeur <span class="normal-case font-normal">— vide : « Terrain 12 ans »</span></label>
              <input id="pr-dial-xpv" v-model="form.loopDialXpValue" type="text" maxlength="16" class="admin-input" />
            </div>
          </div>
        </fieldset>
        <fieldset class="space-y-4 border border-[var(--line,#ccc)] rounded p-4">
          <legend class="admin-label px-1">Étape « S'équiper »</legend>
          <div>
            <label for="pr-tools-eyebrow" class="admin-label">Surtitre <span class="normal-case font-normal">— vide : « S'équiper · Atelier »</span></label>
            <input id="pr-tools-eyebrow" v-model="form.loopToolsEyebrow" type="text" maxlength="60" class="admin-input" />
          </div>
          <div>
            <label for="pr-tools-title" class="admin-label">Titre</label>
            <input id="pr-tools-title" v-model="form.loopToolsTitle" type="text" maxlength="80" class="admin-input" />
          </div>
          <div>
            <label for="pr-tools-lede" class="admin-label">Paragraphe</label>
            <textarea id="pr-tools-lede" v-model="form.loopToolsLede" rows="4" maxlength="320" class="admin-input resize-none" />
          </div>
        </fieldset>
        <div>
          <label for="pr-loop-lead" class="admin-label">Accroche de la fiche « Le Randonneur »</label>
          <textarea id="pr-loop-lead" v-model="form.loopLead" rows="2" class="admin-input resize-none" />
        </div>
        <div>
          <label for="pr-loop-facts" class="admin-label">Ligne de faits (fiche « Le Randonneur »)</label>
          <textarea id="pr-loop-facts" v-model="form.loopFacts" rows="2" class="admin-input resize-none" />
        </div>
        <div>
          <label for="pr-booking" class="admin-label">Lien de prise de rendez-vous (Bivouac) <span class="normal-case font-normal">— le bouton n'apparaît que s'il est rempli</span></label>
          <input id="pr-booking" v-model="form.bookingUrl" type="url" class="admin-input" placeholder="https://cal.com/…" />
        </div>
      </fieldset>

      <!-- URL du site + mots-clés -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="admin-label">URL publique du site</label>
          <input v-model="form.url" class="admin-input" placeholder="https://adrien-neyron-portfolio.vercel.app/" />
        </div>
        <div>
          <label class="admin-label">Mots-clés SEO</label>
          <input v-model="form.keywords" class="admin-input" />
        </div>
      </div>

      <!-- Localisation -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="admin-label">Ville</label>
          <input v-model="form.location.city" class="admin-input" />
        </div>
        <div>
          <label class="admin-label">Région</label>
          <input v-model="form.location.region" class="admin-input" />
        </div>
        <div>
          <label class="admin-label">Code postal</label>
          <input v-model="form.location.postalCode" class="admin-input" />
        </div>
      </div>

      <!-- Bandeau de chiffres (/projects) -->
      <fieldset class="space-y-2 border-t pt-6" style="border-color: color-mix(in srgb, var(--color-accent) 15%, transparent);">
        <legend class="admin-label">Bandeau de chiffres <span class="normal-case font-normal">(sous le titre de /projects ; un chiffre vide n'est pas affiché)</span></legend>
        <div v-for="(stat, i) in form.trailStats" :key="i" class="grid grid-cols-1 md:grid-cols-[10rem_1fr_auto] gap-2 items-center">
          <label :for="`stat-value-${i}`" class="sr-only">Chiffre {{ i + 1 }}</label>
          <input :id="`stat-value-${i}`" v-model="stat.value" class="admin-input" placeholder="−50 %" />
          <label :for="`stat-label-${i}`" class="sr-only">Libellé du chiffre {{ i + 1 }}</label>
          <input :id="`stat-label-${i}`" v-model="stat.label" class="admin-input" placeholder="de temps de traitement" />
          <button type="button" class="admin-remove" :aria-label="`Retirer le chiffre ${i + 1}`" @click="removeStat(i)">✕</button>
        </div>
        <button type="button" class="admin-add" @click="addStat">+ Ajouter un chiffre</button>
      </fieldset>

      <!-- Réseaux sociaux -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="admin-label mb-0">Liens sociaux</label>
          <button type="button" class="text-xs font-medium" style="color: var(--color-accent);" @click="addSocial">+ Ajouter</button>
        </div>
        <div v-for="(social, i) in form.profiles" :key="i" class="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-2 mb-2 items-center">
          <input v-model="social.network" class="admin-input" placeholder="Réseau (LinkedIn…)" />
          <input v-model="social.username" class="admin-input" placeholder="Nom d'utilisateur" />
          <input v-model="social.url" class="admin-input" placeholder="https://…" />
          <button type="button" class="text-xs px-2 py-1" style="color: #e53e3e;" @click="removeSocial(i)">✕</button>
        </div>
      </div>

      <!-- Submit -->
      <div v-if="!readonly" class="flex justify-end pt-2">
        <button
          type="submit"
          :disabled="loading"
          class="px-6 py-2.5 rounded-lg bg-(--color-accent) text-white font-medium transition hover:opacity-90 disabled:opacity-50"
        >
          {{ loading ? "Enregistrement…" : "Enregistrer le profil" }}
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
.admin-add,
.admin-remove {
  min-height: 44px;
  min-width: 44px;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-accent);
}
</style>
