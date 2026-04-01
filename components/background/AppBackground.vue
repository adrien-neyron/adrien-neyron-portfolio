<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isDark = ref(false);

onMounted(() => {
  isDark.value = document.documentElement.classList.contains("dark");
  const obs = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains("dark");
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  onUnmounted(() => obs.disconnect());
});
</script>

<template>
  <div aria-hidden="true">

    <!-- ① Gradient mesh vivant — 3 blobs colorés animés ───── -->
    <div class="blob blob-a" :class="{ dark: isDark }" />
    <div class="blob blob-b" :class="{ dark: isDark }" />
    <div class="blob blob-c" :class="{ dark: isDark }" />

    <!-- ② Canvas Three.js ──────────────────────────────────── -->
    <ClientOnly>
      <BackgroundThreeScene :is-dark="isDark" />
    </ClientOnly>

  </div>
</template>

<style scoped>
/* ─── Gradient blobs ─────────────────────────────────────── */
/* Chaque blob est un cercle flou qui dérive lentement.         */
/* GPU-only : transform uniquement.                             */

.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(90px);
  z-index: 1;
  pointer-events: none;
  will-change: transform;
}

/* Blob A — orange brûlé, haut-droite → bas-centre */
.blob-a {
  width: 65vw;
  height: 65vw;
  top: -20vw;
  right: -15vw;
  background: radial-gradient(circle,
    rgba(196, 98, 45, 0.30) 0%,
    transparent 70%
  );
  animation: blobA 22s ease-in-out infinite;
}
.blob-a.dark {
  background: radial-gradient(circle,
    rgba(224, 120, 64, 0.22) 0%,
    transparent 70%
  );
}

/* Blob B — vert sauge, bas-gauche → haut-centre */
.blob-b {
  width: 55vw;
  height: 55vw;
  bottom: -15vw;
  left: -10vw;
  background: radial-gradient(circle,
    rgba(92, 122, 90, 0.28) 0%,
    transparent 70%
  );
  animation: blobB 30s ease-in-out infinite;
}
.blob-b.dark {
  background: radial-gradient(circle,
    rgba(122, 173, 120, 0.20) 0%,
    transparent 70%
  );
}

/* Blob C — ambre doré, centre → légère pulsation */
.blob-c {
  width: 45vw;
  height: 45vw;
  top: 25vh;
  left: 28vw;
  background: radial-gradient(circle,
    rgba(232, 168, 56, 0.18) 0%,
    transparent 70%
  );
  animation: blobC 38s ease-in-out infinite;
}
.blob-c.dark {
  background: radial-gradient(circle,
    rgba(240, 192, 80, 0.13) 0%,
    transparent 70%
  );
}

/* ─── Mouvements des blobs ─────────────────────────────────── */
@keyframes blobA {
  0%,  100% { transform: translate(0,    0)    scale(1);    }
  30%        { transform: translate(-8vw, 6vh)  scale(1.12); }
  65%        { transform: translate(5vw, -4vh)  scale(0.92); }
}
@keyframes blobB {
  0%,  100% { transform: translate(0,   0)    scale(1);    }
  40%        { transform: translate(9vw, -7vh) scale(1.15); }
  72%        { transform: translate(-4vw, 5vh) scale(0.88); }
}
@keyframes blobC {
  0%,  100% { transform: translate(0,     0)    scale(1);    }
  50%        { transform: translate(-10vw, 7vh)  scale(1.20); }
}

/* ─── Reduced motion ──────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .blob { animation: none; }
}
</style>
