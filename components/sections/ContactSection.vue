<script setup lang="ts">
import emailjs from "@emailjs/browser";
import Swal    from "sweetalert2";
import { Mail, MapPin, Send } from "lucide-vue-next";
import resume from "~/data/resume.json";

const greetings = "LET'S WORK TOGETHER!";
const formEl    = ref<HTMLFormElement | null>(null);

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
  } catch (err: any) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Something went wrong. Please try again later.",
    });
  }
}
</script>

<template>
  <section id="contact" class="min-h-screen flex items-center justify-center py-20">
    <div
      v-motion
      :initial="{ opacity: 0, y: 50 }"
      :visible="{ opacity: 1, y: 0, transition: { duration: 800 } }"
      class="w-[90%] max-w-6xl mx-auto flex flex-col md:flex-row items-stretch md:justify-between gap-12"
    >
      <!-- Colonne gauche -->
      <div
        v-motion
        :initial="{ opacity: 0, x: -60 }"
        :visible="{ opacity: 1, x: 0, transition: { duration: 800, delay: 200 } }"
        class="flex-1 flex flex-col justify-center gap-8 text-center md:text-left"
      >
        <div class="font-mono">
          <h2>
            <UiTextDecrypt
              :text="greetings"
              class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-accent"
            />
          </h2>
          <p class="mt-4 text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-sm">
            Un projet en tête ? Décrivez-le moi — je réponds sous 48h.
          </p>
        </div>

        <!-- Coordonnées -->
        <div class="flex flex-col gap-4">
          <a
            :href="`mailto:${resume.basics.email}`"
            class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent transition-colors group"
          >
            <span class="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
              <Mail :size="16" class="text-accent" />
            </span>
            {{ resume.basics.email }}
          </a>
          <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span class="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <MapPin :size="16" class="text-accent" />
            </span>
            {{ resume.basics.location.city }}, {{ resume.basics.location.region }}
          </div>
        </div>

        <!-- Disponibilité -->
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 justify-center md:justify-start">
          <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Disponible pour de nouveaux projets
        </div>
      </div>

      <!-- Colonne droite — formulaire -->
      <div
        v-motion
        :initial="{ opacity: 0, x: 60 }"
        :visible="{ opacity: 1, x: 0, transition: { duration: 800, delay: 300 } }"
        class="flex-1 w-full bg-white/70 dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-8"
      >
        <form ref="formEl" class="space-y-5" @submit="sendEmail">
          <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 500, delay: 400 } }"
          >
            <label for="name" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
              Votre nom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="John Doe"
              class="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6B2D] dark:focus:ring-[#EDDD53] transition"
            />
          </div>

          <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 500, delay: 500 } }"
          >
            <label for="email" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
              Votre email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@email.com"
              class="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6B2D] dark:focus:ring-[#EDDD53] transition"
            />
          </div>

          <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 500, delay: 600 } }"
          >
            <label for="message" class="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">
              Votre message
            </label>
            <textarea
              id="message"
              name="message"
              :rows="5"
              required
              placeholder="Décrivez votre projet..."
              class="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6B2D] dark:focus:ring-[#EDDD53] transition resize-none"
            />
          </div>

          <div
            v-motion
            :initial="{ opacity: 0, y: 20 }"
            :visible="{ opacity: 1, y: 0, transition: { duration: 500, delay: 700 } }"
          >
            <button
              type="submit"
              class="w-full py-3 px-6 flex items-center justify-center gap-2 button-accent text-white font-semibold rounded-lg shadow-md transition hover:opacity-90"
            >
              <Send :size="16" />
              Envoyer le message
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
