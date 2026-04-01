<script setup lang="ts">
import type { AiTool } from "~/data/ai-tools";

defineProps<{ tool: AiTool }>();

const categoryColor: Record<string, string> = {
  Productivité:    "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]",
  Création:        "bg-[var(--color-highlight)]/20 text-[var(--color-highlight)]",
  Analyse:         "bg-[var(--color-accent)]/20 text-[var(--color-accent)]",
  Automatisation:  "bg-[var(--color-muted)]/20 text-[var(--color-muted)]",
};
</script>

<template>
  <article
    :aria-label="tool.name"
    class="trail-card p-6 flex flex-col gap-4 h-full"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="text-3xl" aria-hidden="true">{{ tool.icon }}</span>
        <div>
          <h3 class="font-semibold text-[var(--color-text)] leading-tight">{{ tool.name }}</h3>
          <p class="text-xs text-[var(--color-muted)]">{{ tool.provider }}</p>
        </div>
      </div>
      <span
        :class="['text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0', categoryColor[tool.category] ?? '']"
      >
        {{ tool.category }}
      </span>
    </div>

    <!-- Tagline -->
    <p class="text-sm font-medium text-[var(--color-accent)] italic leading-snug">
      {{ tool.tagline }}
    </p>

    <!-- Use cases -->
    <ul class="flex flex-col gap-1.5 flex-1">
      <li
        v-for="useCase in tool.useCases"
        :key="useCase"
        class="flex items-start gap-2 text-xs text-[var(--color-text)]/70"
      >
        <span class="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
        {{ useCase }}
      </li>
    </ul>

    <!-- Business value -->
    <div class="border-t border-[var(--color-accent)]/15 pt-3">
      <p class="text-xs font-semibold text-[var(--color-secondary)]">
        💡 {{ tool.businessValue }}
      </p>
    </div>
  </article>
</template>
