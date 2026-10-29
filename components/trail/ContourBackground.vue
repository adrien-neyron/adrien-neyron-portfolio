<script setup lang="ts">
/**
 * Fond en courbes de niveau (SVG statique, décoratif).
 * Généré de façon déterministe à partir de `seed` : identique au rendu serveur
 * et client. Masqué aux technologies d'assistance.
 */
import { contourPaths, seededRandom } from "~/utils/trail";

const props = withDefaults(defineProps<{
  seed?: number;
  /** centre du relief, en % de la largeur / hauteur */
  cx?: number;
  cy?: number;
  levels?: number;
}>(), { seed: 7, cx: 75, cy: 45, levels: 16 });

const W = 1440;
const H = 640;

// Vraies courbes de niveau d'un champ d'altitude (deux sommets) : elles ne se croisent jamais.
const paths = computed(() => {
  const rnd = seededRandom(props.seed);
  const cx = (props.cx / 100) * W;
  const cy = (props.cy / 100) * H;
  const peaks = [
    { x: cx, y: cy, a: 1, sx: 300, sy: 190 },
    { x: cx - 330 + rnd() * 60, y: cy + 90 + rnd() * 60, a: 0.55, sx: 210, sy: 130 },
  ];
  const ds = contourPaths(W, H, peaks, props.levels, { wobble: [rnd() * 6, rnd() * 6] });
  return ds.map((d, i) => ({ d, major: i % 5 === 4 })).filter((p) => p.d);
});
</script>

<template>
  <svg
    class="contour-bg"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    focusable="false"
  >
    <path
      v-for="(p, i) in paths"
      :key="i"
      :d="p.d"
      :class="p.major ? 'major' : ''"
    />
  </svg>
</template>

<style scoped>
.contour-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* le texte reste lisible : les courbes s'effacent à gauche */
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 55%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 55%);
}
.contour-bg path {
  fill: none;
  stroke: var(--color-muted);
  stroke-width: 0.8;
  opacity: 0.35;
  vector-effect: non-scaling-stroke;
}
.contour-bg path.major {
  stroke-width: 1.3;
  opacity: 0.55;
}
@media (max-width: 768px) {
  .contour-bg { -webkit-mask-image: none; mask-image: none; opacity: 0.45; }
}
</style>
