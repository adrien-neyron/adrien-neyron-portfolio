<script setup lang="ts">
const greetings = "HELLO. I'M ADRIEN, WELCOME THERE!";
const aboutMeParagraphs = [
  "I'm Adrien Neyron, a creative fullstack developer specializing in Javascript with frameworks like Vue, Nuxt, React, and Node.js. I usually code in Typescript. My passion for coding drives me to create innovative solutions that solve problems.",
  "With a strong background in business and a knack for problem-solving, I bring a unique perspective to every project. I blend clean code with thoughtful UX/UI design to craft applications that are both functional and visually engaging.",
  "Tailwind CSS and Bootstrap are my go-to for creating responsive interfaces. I also explore Three.js, @vueuse/motion, and TresJS to bring my designs to life.",
  "Passionate about learning and innovation, I thrive on challenges and love transforming ideas into smooth, interactive digital experiences.",
];

const hovered       = ref(false);
const reducedMotion = ref(false);

onMounted(() => {
  reducedMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
});
</script>

<template>
  <section id="about" class="min-h-screen flex items-center justify-center py-20">
    <div
      v-motion
      :initial="{ opacity: 0, y: 50 }"
      :visible="{ opacity: 1, y: 0, transition: { duration: 800 } }"
      class="w-[90%] max-w-5xl mx-auto bg-white/70 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 rounded-3xl shadow-xl flex flex-col md:flex-row items-center overflow-hidden"
    >
      <!-- Image interactive -->
      <div
        v-motion
        :initial="{ opacity: 0, x: -60 }"
        :visible="{ opacity: 1, x: 0, transition: { duration: 800, delay: 200 } }"
        class="relative w-72 h-72 md:w-96 md:h-96 m-6 cursor-pointer flex items-center justify-center"
        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
      >
        <!-- Sculpture -->
        <div class="absolute inset-0 flex items-center justify-center">
          <h2 class="absolute text-xl md:text-2xl font-bold text-gray-600 dark:text-gray-300/80 tracking-wider select-none pointer-events-none">
            <span class="text-accent text-8xl">?</span>
          </h2>
          <NuxtImg
            src="/sculpture.png"
            alt="Sculpture"
            class="w-full h-full object-contain rounded-xl shadow-lg border border-white/30"
          />
        </div>

        <!-- Profil au hover -->
        <Transition
          enter-active-class="transition-all duration-500 ease-in-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-105"
          leave-active-class="transition-all duration-500 ease-in-out"
          leave-from-class="opacity-100 scale-105"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="hovered" class="absolute inset-0">
            <NuxtImg
              src="/profile.png"
              alt="Photo de profil d'Adrien"
              class="w-full h-full object-cover rounded-xl shadow-xl border border-white/40"
            />
          </div>
        </Transition>
      </div>

      <!-- Texte -->
      <div
        v-motion
        :initial="{ opacity: 0, x: 60 }"
        :visible="{ opacity: 1, x: 0, transition: { duration: 800, delay: 300 } }"
        class="flex-1 flex flex-col text-center md:text-left px-6 py-12 md:py-16 space-y-6"
      >
        <h2 class="text-2xl md:text-3xl font-semibold text-accent font-mono">
          <UiTextDecrypt :text="greetings" />
        </h2>

        <div class="space-y-4 text-gray-800 dark:text-gray-200 text-sm md:text-base">
          <p
            v-for="(paragraph, index) in aboutMeParagraphs"
            :key="index"
            class="leading-relaxed"
          >
            <span
              v-for="(word, i) in paragraph.split(' ')"
              :key="i"
              :class="['inline-block cursor-default px-0.5', !reducedMotion && 'transition-transform duration-150 hover:scale-110 hover:text-[#f6c453]']"
            >
              {{ word }}&nbsp;
            </span>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
