<script setup lang="ts">
import { Mail, MapPin, Send, MessageCircle } from "lucide-vue-next";
import { useProfileStore } from "~/stores/profile";

usePageSeo({
  title: "Bivouac — Contact | Adrien Neyron",
  description: "Un projet front-end ou un audit d'accessibilité RGAA ? Décrivez votre besoin, réponse sous 48 h.",
});

const profileStore = useProfileStore();
profileStore.fetchProfile();

const formEl = ref<HTMLFormElement | null>(null);

const sending = ref(false);

// Retour d'envoi : un message persistant (pas de fenêtre qui se ferme seule, WCAG 2.2.1) et des erreurs rattachées à chaque champ
// (WCAG 3.3.1 / 3.3.3, RGAA 11.10). `status` est annoncé par les lecteurs d'écran (role="status" / "alert").
type Field = "name" | "email" | "message";
const errors = reactive<Record<Field, string>>({ name: "", email: "", message: "" });
const status = ref<{ kind: "success" | "error"; text: string } | null>(null);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f: FormData): Field | null {
  errors.name = String(f.get("name") ?? "").trim() ? "" : "Indiquez votre nom.";
  const email = String(f.get("email") ?? "").trim();
  errors.email = !email ? "Indiquez votre adresse e-mail." : EMAIL_RE.test(email) ? "" : "Cette adresse e-mail n'est pas valide (exemple : vous@email.com).";
  errors.message = String(f.get("message") ?? "").trim() ? "" : "Décrivez votre projet en quelques lignes.";
  return (["name", "email", "message"] as Field[]).find((k) => errors[k]) ?? null;
}

// Envoi par POST /api/contact (même route que le formulaire du Bivouac)
async function sendEmail(e: Event) {
  e.preventDefault();
  if (!formEl.value || sending.value) return;
  status.value = null;
  const f = new FormData(formEl.value);
  const firstInvalid = validate(f);
  if (firstInvalid) {
    status.value = { kind: "error", text: "Le message n'est pas parti : corrigez les champs signalés." };
    await nextTick();
    (formEl.value.elements.namedItem(firstInvalid) as HTMLElement | null)?.focus();
    return;
  }
  sending.value = true;
  try {
    await $fetch("/api/contact", {
      method: "POST",
      body: { nom: f.get("name"), email: f.get("email"), message: f.get("message"), site: f.get("site") },
    });
    status.value = { kind: "success", text: "Message envoyé. Je vous réponds sous 48 h." };
    formEl.value.reset();
  } catch (err: unknown) {
    const msg = (err as { statusMessage?: string; data?: { statusMessage?: string } })?.data?.statusMessage
      || (err as { statusMessage?: string })?.statusMessage
      || "Une erreur est survenue.";
    status.value = { kind: "error", text: `Message non envoyé. ${msg} Vous pouvez aussi écrire à ${profileStore.profile.email}.` };
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-5xl mx-auto">
      <TrailBackToScene scene="bivouac" />

      <!-- Header -->
      <UiAnimatedSection>
        <div class="mb-12">
          <div class="flex items-center gap-2 mb-3">
            <MessageCircle :size="16" class="text-[var(--color-accent)]" aria-hidden="true" />
            <span class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">Bivouac</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-bold text-[var(--color-text)] mb-3">
            Posez vos sacs
          </h1>
          <p class="text-[var(--color-muted)] max-w-xl leading-relaxed text-sm sm:text-base">
            Vous avez un projet ? Une idée ? Une question ? Décrivez-moi votre besoin —
            je réponds sous 48h.
          </p>
        </div>
      </UiAnimatedSection>

      <div class="flex flex-col md:flex-row gap-10 items-start">

        <!-- Colonne gauche — infos -->
        <UiAnimatedSection>
          <div class="flex flex-col gap-7 md:w-72 shrink-0">

            <!-- Contact -->
            <div class="flex flex-col gap-4">
              <a
                :href="`mailto:${profileStore.profile.email}`"
                class="flex items-center gap-3 text-sm text-[var(--color-text)]/70 hover:text-[var(--color-accent)] transition-colors group"
              >
                <span class="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-accent)]/15 flex items-center justify-center group-hover:border-[var(--color-accent)]/40 transition-colors">
                  <Mail :size="15" class="text-[var(--color-accent)]" aria-hidden="true" />
                </span>
                {{ profileStore.profile.email }}
              </a>
              <div class="flex items-center gap-3 text-sm text-[var(--color-text)]/60">
                <span class="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-accent)]/15 flex items-center justify-center">
                  <MapPin :size="15" class="text-[var(--color-accent)]" aria-hidden="true" />
                </span>
                {{ profileStore.profile.location.city }}, {{ profileStore.profile.location.region }}
              </div>
            </div>

            <!-- Disponibilité -->
            <div class="trail-card p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="inline-block w-2 h-2 rounded-full bg-green-500 trail-pulse" aria-hidden="true" />
                <span class="text-xs font-semibold text-[var(--color-text)]">Disponible</span>
              </div>
              <p class="text-xs text-[var(--color-muted)] leading-relaxed">
                Ouvert aux projets freelance, missions et collaborations dans le secteur sport et outdoor.
              </p>
            </div>

            <!-- Réseaux -->
            <div class="flex flex-col gap-2">
              <p class="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest mb-1">Réseaux</p>
              <a
                v-for="profile in profileStore.profile.profiles"
                :key="profile.network"
                :href="profile.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-[var(--color-text)]/60 hover:text-[var(--color-accent)] transition-colors"
              >
                {{ profile.network }}
              </a>
            </div>
          </div>
        </UiAnimatedSection>

        <!-- Formulaire -->
        <UiAnimatedSection class="flex-1 w-full">
          <div class="trail-card p-7 bg-white/50 dark:bg-white/3">
            <form ref="formEl" class="space-y-5" novalidate @submit="sendEmail">
              <!-- champ piège anti-robots : invisible, hors tabulation -->
              <div style="position:absolute;left:-9999px" aria-hidden="true">
                <input name="site" type="text" tabindex="-1" autocomplete="off" />
              </div>
              <div>
                <label for="name" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                  Votre nom <span aria-hidden="true">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autocomplete="name"
                  :aria-invalid="errors.name ? 'true' : undefined"
                  :aria-describedby="errors.name ? 'name-error' : undefined"
                  placeholder="Jean Dupont"
                  class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm"
                />
                <p v-if="errors.name" id="name-error" class="mt-1.5 text-xs font-medium text-red-700 dark:text-red-300">{{ errors.name }}</p>
              </div>

              <div>
                <label for="email" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                  Votre email <span aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autocomplete="email"
                  :aria-invalid="errors.email ? 'true' : undefined"
                  :aria-describedby="errors.email ? 'email-error' : undefined"
                  placeholder="vous@email.com"
                  class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm"
                />
                <p v-if="errors.email" id="email-error" class="mt-1.5 text-xs font-medium text-red-700 dark:text-red-300">{{ errors.email }}</p>
              </div>

              <div>
                <label for="message" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                  Votre message <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  :rows="5"
                  required
                  :aria-invalid="errors.message ? 'true' : undefined"
                  :aria-describedby="errors.message ? 'message-error' : undefined"
                  placeholder="Décrivez votre projet, votre contexte, vos objectifs..."
                  class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition resize-none text-sm"
                />
                <p v-if="errors.message" id="message-error" class="mt-1.5 text-xs font-medium text-red-700 dark:text-red-300">{{ errors.message }}</p>
              </div>

              <p class="text-xs text-[var(--color-muted)]">Les champs marqués d'un astérisque (*) sont obligatoires.</p>

              <!-- Retour d'envoi : les deux régions existent en permanence (une région ajoutée en même temps que son texte
                   n'est pas toujours annoncée) ; le message reste affiché jusqu'au prochain envoi -->
              <div class="min-h-6">
                <div role="status" class="text-sm font-medium text-[var(--color-secondary)]">{{ status?.kind === "success" ? status.text : "" }}</div>
                <div role="alert" class="text-sm font-medium text-red-700 dark:text-red-300">{{ status?.kind === "error" ? status.text : "" }}</div>
              </div>

              <button
                type="submit"
                :disabled="sending"
                class="w-full py-3 px-6 button-accent rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <Send :size="15" aria-hidden="true" />
                {{ sending ? "Envoi en cours…" : "Envoyer le message" }}
              </button>
            </form>
          </div>
        </UiAnimatedSection>

      </div>
    </div>
  </div>
</template>
