<script setup lang="ts">
const emit = defineEmits<{ close: [] }>();
const prefersReduced = ref(false);
const closeBtn = ref<HTMLButtonElement | null>(null);

onMounted(() => {
  prefersReduced.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  closeBtn.value?.focus();
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") emit("close");
  };
  document.addEventListener("keydown", handleKey);
  onUnmounted(() => document.removeEventListener("keydown", handleKey));
});
</script>

<template>
  <Teleport to="body">
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Formulaire de visite"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="emit('close')"
    >
      <div
        v-motion
        :initial="prefersReduced ? {} : { opacity: 0, y: 80, filter: 'blur(12px)' }"
        :enter="prefersReduced ? {} : { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 800 } }"
        class="relative w-[90%] md:w-[60%] bg-white font-sans rounded-2xl shadow-xl p-10"
      >
        <button
          ref="closeBtn"
          aria-label="Fermer la fenêtre"
          class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:text-black hover:bg-gray-100 transition"
          @click="emit('close')"
        >
          ✕
        </button>

        <slot />
      </div>
    </div>
  </Teleport>
</template>
