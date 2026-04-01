<script setup lang="ts">
defineProps<{
  variant?: "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  as?: "button" | "a";
  href?: string;
  type?: "button" | "submit";
}>();
</script>

<template>
  <component
    :is="as === 'a' ? 'a' : 'button'"
    :href="href"
    :type="as !== 'a' ? (type ?? 'button') : undefined"
    :class="[
      'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      // sizes
      size === 'sm' ? 'px-4 py-2 text-xs' : size === 'lg' ? 'px-8 py-4 text-base' : 'px-6 py-3 text-sm',
      // variants
      variant === 'outline' ? 'button-empty'
      : variant === 'ghost' ? 'bg-transparent text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10'
      : 'button-accent shadow-md',
    ]"
  >
    <slot />
  </component>
</template>
