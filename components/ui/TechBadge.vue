<script setup lang="ts">
defineProps<{
  label: string;
  variant?: "default" | "featured";
}>();
</script>

<template>
  <span
    :class="[
      'inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-full border transition-colors',
      variant === 'featured'
        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/30'
        : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-accent)]/15',
    ]"
  >
    {{ label }}
  </span>
</template>
