<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
</script>

<template>
  <div
    v-motion
    :initial="prefersReduced ? {} : { opacity: 0, y: 60, filter: 'blur(8px)' }"
    :visible="prefersReduced ? {} : { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1000, ease: 'easeOut' } }"
  >
    <slot />
  </div>
</template>
