<script setup lang="ts">
import emailjs from "@emailjs/browser";
import Swal    from "sweetalert2";
import { Mail, MapPin, Send, MessageCircle } from "lucide-vue-next";
import resume from "~/data/resume.json";

useHead({ title: "Bivouac — Contact | Adrien Neyron" });

const formEl = ref<HTMLFormElement | null>(null);

async function sendEmail(e: Event) {
  e.preventDefault();
  if (!formEl.value) return;

  try {
    await emailjs.sendForm(
      "service_dl9djrv",
      "template_aybi97f",
      formEl.value,
      "MD6rY0SPz1H_153O_"
    );
    Swal.fire({
      position: "center",
      icon: "success",
      title: "Message envoyé 🚀",
      showConfirmButton: false,
      timer: 1500,
    });
    formEl.value.reset();
  } catch (err: unknown) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Une erreur est survenue. Réessayez dans quelques instants.",
    });
  }
}
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-5xl mx-auto">

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
                :href="`mailto:${resume.basics.email}`"
                class="flex items-center gap-3 text-sm text-[var(--color-text)]/70 hover:text-[var(--color-accent)] transition-colors group"
              >
                <span class="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-accent)]/15 flex items-center justify-center group-hover:border-[var(--color-accent)]/40 transition-colors">
                  <Mail :size="15" class="text-[var(--color-accent)]" aria-hidden="true" />
                </span>
                {{ resume.basics.email }}
              </a>
              <div class="flex items-center gap-3 text-sm text-[var(--color-text)]/60">
                <span class="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-accent)]/15 flex items-center justify-center">
                  <MapPin :size="15" class="text-[var(--color-accent)]" aria-hidden="true" />
                </span>
                {{ resume.basics.location.city }}, {{ resume.basics.location.region }}
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
                v-for="profile in resume.basics.profiles"
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
            <form ref="formEl" class="space-y-5" @submit="sendEmail">
              <div>
                <label for="name" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                  Votre nom
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm"
                />
              </div>

              <div>
                <label for="email" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                  Votre email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="vous@email.com"
                  class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm"
                />
              </div>

              <div>
                <label for="message" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                  Votre message
                </label>
                <textarea
                  id="message"
                  name="message"
                  :rows="5"
                  required
                  placeholder="Décrivez votre projet, votre contexte, vos objectifs..."
                  class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition resize-none text-sm"
                />
              </div>

              <button
                type="submit"
                class="w-full py-3 px-6 button-accent rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <Send :size="15" aria-hidden="true" />
                Envoyer le message
              </button>
            </form>
          </div>
        </UiAnimatedSection>

      </div>
    </div>
  </div>
</template>
