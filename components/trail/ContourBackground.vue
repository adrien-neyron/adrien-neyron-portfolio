<script setup lang="ts">
/**
 * Fond en courbes de niveau (SVG statique, décoratif).
 * Généré de façon déterministe à partir de `seed` : identique au rendu serveur
 * et client. Masqué aux technologies d'assistance.
 */
import { seededRandom } from "~/utils/trail";

const props = withDefaults(defineProps<{
  seed?: number;
  /** centre du relief, en % de la largeur / hauteur */
  cx?: number;
  cy?: number;
  levels?: number;
}>(), { seed: 7, cx: 75, cy: 45, levels: 16 });

const W = 1440;
const H = 640;

const paths = computed(() => {
  const rnd = seededRandom(props.seed);
  const ph = [rnd(), rnd(), rnd()].map((v) => v * Math.PI * 2);
  const cx = (props.cx / 100) * W;
  const cy = (props.cy / 100) * H;
  const out: { d: string; major: boolean }[] = [];
  for (let k = 0; k < props.levels; k++) {
    const r0 = 18 + k * 30;
    let d = "";
    for (let i = 0; i <= 140; i++) {
      const th = (i / 140) * Math.PI * 2;
      const n = 0.16 * Math.sin(2 * th + ph[0] + k * 0.08)
              + 0.09 * Math.sin(3 * th + ph[1] - k * 0.05)
              + 0.05 * Math.sin(5 * th + ph[2] + k * 0.1);
      const r = r0 * (1 + n * (0.6 + k * 0.04));
      d += `${i ? "L" : "M"}${(cx + Math.cos(th) * r * 1.4).toFixed(1)} ${(cy + Math.sin(th) * r * 0.95).toFixed(1)}`;
    }
    out.push({ d: `${d}Z`, major: k % 5 === 4 });
  }
  return out;
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
