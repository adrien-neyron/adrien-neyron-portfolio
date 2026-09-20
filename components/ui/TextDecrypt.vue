<script setup lang="ts">
const props = defineProps<{ text: string; className?: string }>();

const { result, decrypt } = useTextDecrypt();
const prefersReduced = ref(false);

onMounted(() => {
  prefersReduced.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced.value) decrypt(props.text);
  else result.value = props.text;
});

watch(() => props.text, (val) => {
  if (!prefersReduced.value) decrypt(val);
  else result.value = val;
});
</script>

<template>
  <!-- Un <div> n'a pas de rôle ARIA implicite : aria-label y est donc interdit
       (WCAG 4.1.2 / RGAA 7.1.1). Le texte réel est exposé via un span sr-only
       (lu par les lecteurs d'écran) ; les spans visuels (animation + span de
       réservation d'espace) sont masqués des technologies d'assistance. -->
  <div :class="['relative inline-block h-32 overflow-hidden', className]">
    <span class="absolute left-0 top-0" aria-hidden="true">
      {{ prefersReduced ? text : result }}&nbsp;
    </span>
    <span class="invisible" aria-hidden="true">{{ text }}&nbsp;</span>
    <span class="sr-only">{{ text }}</span>
  </div>
</template>
