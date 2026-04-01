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
  <!-- aria-label expose le texte réel ; les spans internes sont masqués des AT -->
  <div
    :class="['relative inline-block h-32 overflow-hidden', className]"
    :aria-label="text"
  >
    <span class="absolute left-0 top-0" aria-hidden="true">
      {{ prefersReduced ? text : result }}&nbsp;
    </span>
    <span class="invisible" aria-hidden="true">{{ text }}&nbsp;</span>
  </div>
</template>
