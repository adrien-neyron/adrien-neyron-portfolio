<script setup lang="ts">
import { Sparkles } from "@tresjs/cientos";
import { useLoop } from "@tresjs/core";
import * as THREE from "three";

const props = defineProps<{
  color?: string;
  emissiveColor?: string;
  emissiveIntensity?: number;
  sphereOpacity?: number;
  sparkleColor?: string;
  sparkleSize?: number;
  isDark?: boolean;
}>();

// ─── Position responsive (frustum-based) ─────────────────
const FOV = 70;
const CAMERA_Z = 15;
const TARGET_X = 0.80;
const TARGET_Y = 0.08;

const position = ref<[number, number, number]>([10, 9, 0]);

function computePosition() {
  const h = 2 * Math.tan((FOV / 2) * (Math.PI / 180)) * CAMERA_Z;
  const w = h * (window.innerWidth / window.innerHeight);
  return [
    -w / 2 + TARGET_X * w,
    h / 2 - TARGET_Y * h,
    0,
  ] as [number, number, number];
}

onMounted(() => {
  position.value = computePosition();
  window.addEventListener("resize", () => {
    position.value = computePosition();
  });
});

// ─── Rotation souris ──────────────────────────────────────
const meshRef = ref<THREE.Mesh | null>(null);
const targetRot = { x: 0, y: 0 };
const currentRot = { x: 0, y: 0 };

onMounted(() => {
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    targetRot.x = y * 0.5;
    targetRot.y = x * 0.5;
  });
});

const { onBeforeRender } = useLoop();

onBeforeRender(() => {
  if (!meshRef.value) return;
  currentRot.x += (targetRot.x - currentRot.x) * 0.1;
  currentRot.y += (targetRot.y - currentRot.y) * 0.1;
  meshRef.value.rotation.x = currentRot.x;
  meshRef.value.rotation.y = currentRot.y;
  meshRef.value.rotation.z += 0.001;
});
</script>

<template>
  <TresMesh ref="meshRef" :position="position">
    <TresSphereGeometry :args="[1.4, 10, 128]" />
    <TresMeshStandardMaterial
      :color="color ?? '#2A7B9B'"
      :roughness="0.2"
      :emissive="emissiveColor ?? '#57C785'"
      :emissive-intensity="emissiveIntensity ?? 1"
      :metalness="0.1"
      :transparent="true"
      :opacity="sphereOpacity ?? 0.2"
      :depth-write="false"
    />
    <Sparkles
      :count="50"
      :scale="5"
      :size="sparkleSize ?? 0.2"
      :speed="1.5"
      :color="sparkleColor ?? '#EDDD53'"
    />
  </TresMesh>
</template>
