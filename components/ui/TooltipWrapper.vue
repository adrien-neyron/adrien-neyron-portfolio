<script setup lang="ts">
defineProps<{ text: string }>();

const visible = ref(false);
</script>

<template>
  <div
    class="relative inline-block"
    @mouseenter="visible = true"
    @mouseleave="visible = false"
    @focusin="visible = true"
    @focusout="visible = false"
  >
    <slot />

    <Transition name="tooltip">
      <div
        v-if="visible && text"
        role="tooltip"
        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 rounded-lg bg-gray-900 text-white px-3 py-2 text-sm shadow-lg max-w-xs whitespace-normal text-center pointer-events-none"
      >
        {{ text }}
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tooltip-enter-active, .tooltip-leave-active { transition: opacity 0.15s, transform 0.15s; }
.tooltip-enter-from, .tooltip-leave-to { opacity: 0; transform: translateX(-50%) translateY(4px); }
.tooltip-enter-to { transform: translateX(-50%) translateY(0); }
</style>
