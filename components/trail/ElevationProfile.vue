<script setup lang="ts">
/**
 * Profil d'altitude (comme sur un dossard de course).
 * - `points` : altitudes relatives de 0 (bas) à 100 (haut), dans l'ordre du parcours
 * - `milestones` : étapes réparties régulièrement sur le profil (optionnel)
 * Le dessin est décoratif (aria-hidden) : le parent fournit l'équivalent texte
 * (figcaption ou liste des étapes), conformément au RGAA 1.2 / 1.3.
 */
import type { Milestone } from "~/utils/trail";

const props = withDefaults(defineProps<{
  points: number[];
  milestones?: Milestone[];
  /** hauteur du tracé en px */
  height?: number;
  compact?: boolean;
}>(), { milestones: () => [], height: 200, compact: false });

const VB_W = 1000;
const pad = computed(() => (props.compact ? 6 : 14));

const coords = computed(() => {
  const pts = props.points.length > 1 ? props.points : [20, 80];
  const n = pts.length;
  return pts.map((v, i) => {
    const x = (i / (n - 1)) * VB_W;
    const clamped = Math.max(0, Math.min(100, v));
    const y = pad.value + (1 - clamped / 100) * (props.height - pad.value * 2);
    return [x, y] as const;
  });
});

const linePath = computed(() =>
  coords.value.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
);
const areaPath = computed(() => `${linePath.value} L ${VB_W} ${props.height} L 0 ${props.height} Z`);

const markers = computed(() => {
  const m = props.milestones.length;
  if (!m) return [];
  const n = coords.value.length;
  return props.milestones.map((ms, i) => {
    const idx = m === 1 ? 0 : Math.round((i * (n - 1)) / (m - 1));
    const [x, y] = coords.value[idx];
    return {
      ...ms,
      leftPct: (x / VB_W) * 100,
      top: y,
      stem: props.height - y,
      align: i === 0 ? "start" : i === m - 1 ? "end" : "center",
    };
  });
});
</script>

<template>
  <div class="profile" :class="{ compact }" :style="{ height: `${height + (compact ? 0 : 56)}px` }">
    <svg
      :viewBox="`0 0 ${VB_W} ${height}`"
      preserveAspectRatio="none"
      :style="{ height: `${height}px` }"
      aria-hidden="true"
      focusable="false"
    >
      <line v-for="g in 3" :key="g" class="grid" x1="0" :x2="VB_W" :y1="(height * g) / 4" :y2="(height * g) / 4" />
      <path class="area" :d="areaPath" />
      <path class="line" :d="linePath" />
    </svg>
    <div
      v-for="(m, i) in markers"
      :key="i"
      class="marker"
      :class="`align-${m.align}`"
      :style="{ left: `${m.leftPct}%`, top: `${m.top}px` }"
      aria-hidden="true"
    >
      <span v-if="!compact" class="stem" :style="{ height: `${m.stem}px` }" />
      <span class="dot" />
      <span class="label" :style="{ top: `${compact ? 14 : m.stem + 10}px` }">
        <span class="label-title">{{ m.label }}</span>
        <span v-if="m.detail" class="label-detail">{{ m.detail }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.profile { position: relative; width: 100%; }
svg { display: block; width: 100%; overflow: visible; }
.grid { stroke: color-mix(in srgb, var(--color-muted) 35%, transparent); stroke-dasharray: 2 6; vector-effect: non-scaling-stroke; }
.area { fill: var(--color-accent); opacity: 0.1; }
.line { fill: none; stroke: var(--color-accent); stroke-width: 2.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.compact .line { stroke-width: 2; }

.marker { position: absolute; width: 0; height: 0; }
.dot {
  position: absolute; left: -7px; top: -7px; width: 14px; height: 14px; border-radius: 50%;
  background: var(--color-bg); border: 3px solid var(--color-accent);
}
/* étiquettes rangées sous le tracé, reliées au point par un fil : elles ne chevauchent jamais la courbe */
.stem { position: absolute; left: -0.5px; top: 7px; width: 0; border-left: 1px dashed color-mix(in srgb, var(--color-accent) 55%, transparent); }
.label {
  position: absolute; display: flex; flex-direction: column; gap: 2px;
  white-space: nowrap; font-size: 13px; line-height: 1.3;
}
.label-title {
  font-family: var(--font-mono); font-size: 11px; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-accent);
}
.label-detail { color: var(--color-text); }
.align-start .label { left: -7px; }
.align-center .label { left: 0; transform: translateX(-50%); text-align: center; }
.align-end .label { right: -7px; text-align: right; }
/* petits écrans : les étiquettes se chevaucheraient ; la liste textuelle
   des étapes fournie par le parent prend le relais */
@media (max-width: 640px) {
  .label { display: none; }
}
</style>
