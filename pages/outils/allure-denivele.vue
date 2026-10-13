<script setup lang="ts">
import { Gauge, Info } from "lucide-vue-next";
import { TERRAINS, computePace, formatDuree, formatAllure, type Terrain } from "~/utils/allure";

useHead({
  title: "Calculateur d'allure trail D+ | Adrien Neyron",
  meta: [
    {
      name: "description",
      content:
        "Calculateur gratuit d'allure et de temps de course en trail running qui intègre le D+ et le D- réels du parcours — plus juste qu'un calculateur d'allure plate classique.",
    },
  ],
});

// ─── Entrées (stockées en texte brut pour rester robuste sur les états
// transitoires — champ vidé pendant la saisie, virgule décimale française,
// etc. — sans complexifier le typage avec v-model.number). ─────────────
const distanceRaw = ref("20");
const denivelePositifRaw = ref("800");
const deniveleNegatifRaw = ref(""); // optionnel — vide = suit le D+
const allureMinRaw = ref("6");
const allureSecRaw = ref("00");

const terrain = ref<Terrain>("modere");
const terrainOptions = TERRAINS;

// Logique de calcul pure : utils/allure.ts (testée dans tests/unit/allure.test.ts)
const calc = computed(() =>
  computePace({
    distanceRaw: distanceRaw.value,
    denivelePositifRaw: denivelePositifRaw.value,
    deniveleNegatifRaw: deniveleNegatifRaw.value,
    allureMinRaw: allureMinRaw.value,
    allureSecRaw: allureSecRaw.value,
    terrain: terrain.value,
  })
);
const denivelePositif = computed(() => calc.value.dPlus);
const tempsPlatMin = computed(() => calc.value.tempsPlatMin);
const tempsMonteeMin = computed(() => calc.value.tempsMonteeMin);
const tempsDescenteMin = computed(() => calc.value.tempsDescenteMin);
const tempsTotalMin = computed(() => calc.value.tempsTotalMin);
const allureEquivalenteMinParKm = computed(() => calc.value.allureEquivalenteMinParKm);
const tempsOptimisteMin = computed(() => calc.value.tempsOptimisteMin);
const tempsPessimisteMin = computed(() => calc.value.tempsPessimisteMin);
const resultatValide = computed(() => calc.value.valide);
</script>

<template>
  <div class="min-h-screen py-20 px-6 sm:px-12 lg:px-20">
    <div class="max-w-4xl mx-auto">

      <!-- Header -->
      <UiAnimatedSection>
        <div class="mb-10">
          <div class="flex items-center gap-2 mb-3">
            <Gauge :size="16" class="text-[var(--color-accent)]" aria-hidden="true" />
            <span class="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">Outils trail</span>
          </div>
          <h1 class="text-3xl sm:text-5xl font-bold text-[var(--color-text)] mb-3">
            Calculateur d'allure trail
          </h1>
          <p class="text-[var(--color-muted)] max-w-2xl leading-relaxed text-sm sm:text-base">
            Estime ton temps de course en tenant compte du <strong class="text-[var(--color-text)]">D+ et D- réels</strong>
            du parcours — pas juste une allure plate multipliée par la distance.
          </p>
        </div>
      </UiAnimatedSection>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        <!-- Formulaire -->
        <UiAnimatedSection>
          <form class="trail-card p-6 sm:p-7 flex flex-col gap-5" @submit.prevent>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="distance" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                  Distance (km)
                </label>
                <input
                  id="distance"
                  v-model="distanceRaw"
                  type="number"
                  min="0"
                  step="0.1"
                  inputmode="decimal"
                  class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm"
                />
              </div>
              <div>
                <label for="dplus" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                  D+ (m)
                </label>
                <input
                  id="dplus"
                  v-model="denivelePositifRaw"
                  type="number"
                  min="0"
                  step="10"
                  inputmode="numeric"
                  class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm"
                />
              </div>
            </div>

            <div>
              <label for="dmoins" class="flex items-center justify-between text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                <span>D- (m)</span>
                <span class="text-[10px] font-normal text-[var(--color-muted)]">optionnel — sinon = D+</span>
              </label>
              <input
                id="dmoins"
                v-model="deniveleNegatifRaw"
                type="number"
                min="0"
                step="10"
                inputmode="numeric"
                :placeholder="`${denivelePositif} (par défaut)`"
                class="w-full px-4 py-3 bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-muted)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm"
              />
            </div>

            <div>
              <span id="allure-label" class="block text-xs font-medium mb-1.5 text-[var(--color-text)]/80">
                Allure de référence sur plat
              </span>
              <div class="flex items-center gap-2" role="group" aria-labelledby="allure-label">
                <label for="allureMin" class="sr-only">Minutes par km</label>
                <input
                  id="allureMin"
                  v-model="allureMinRaw"
                  type="number"
                  min="0"
                  max="30"
                  inputmode="numeric"
                  class="w-16 px-3 py-3 bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm text-center"
                />
                <span class="text-[var(--color-muted)] font-mono text-sm shrink-0">min</span>
                <label for="allureSec" class="sr-only">Secondes par km</label>
                <input
                  id="allureSec"
                  v-model="allureSecRaw"
                  type="number"
                  min="0"
                  max="59"
                  inputmode="numeric"
                  class="w-16 px-3 py-3 bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl border border-[var(--color-accent)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 transition text-sm text-center"
                />
                <span class="text-[var(--color-muted)] font-mono text-sm shrink-0">sec / km</span>
              </div>
            </div>

            <div>
              <span id="terrain-label" class="block text-xs font-medium mb-2 text-[var(--color-text)]/80">
                Technicité du terrain
              </span>
              <div class="flex flex-wrap gap-2" role="group" aria-labelledby="terrain-label">
                <button
                  v-for="opt in terrainOptions"
                  :key="opt.value"
                  type="button"
                  :aria-pressed="terrain === opt.value"
                  :class="[
                    'px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                    terrain === opt.value
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-transparent text-[var(--color-muted)] border-[var(--color-accent)]/20 hover:border-[var(--color-accent)]/50 hover:text-[var(--color-accent)]',
                  ]"
                  @click="terrain = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </form>
        </UiAnimatedSection>

        <!-- Résultat -->
        <UiAnimatedSection>
          <div
            class="trail-card p-6 sm:p-7 flex flex-col gap-6 lg:sticky lg:top-24"
            role="status"
            aria-live="polite"
          >
            <div v-if="!resultatValide" class="text-sm text-[var(--color-muted)] text-center py-10">
              Renseigne une distance et une allure pour voir l'estimation.
            </div>

            <template v-else>
              <div class="text-center">
                <p class="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest mb-2">
                  Temps estimé
                </p>
                <p
                  class="text-4xl sm:text-5xl font-bold text-[var(--color-accent)]"
                  style="font-family: var(--font-title);"
                >
                  {{ formatDuree(tempsTotalMin) }}
                </p>
                <p class="text-xs text-[var(--color-muted)] mt-2">
                  entre {{ formatDuree(tempsOptimisteMin) }} et {{ formatDuree(tempsPessimisteMin) }} (±10 %)
                </p>
              </div>

              <div class="flex flex-col gap-3 pt-4 border-t border-[var(--color-accent)]/10">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--color-muted)]">Allure moyenne équivalente</span>
                  <span class="font-semibold text-[var(--color-text)] font-mono">{{ formatAllure(allureEquivalenteMinParKm) }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--color-muted)]">Temps sur le plat</span>
                  <span class="font-mono text-[var(--color-text)]/70">{{ formatDuree(tempsPlatMin) }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--color-muted)]">Ajouté en montée</span>
                  <span class="font-mono text-[var(--color-text)]/70">+{{ formatDuree(tempsMonteeMin) }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-[var(--color-muted)]">Ajouté en descente</span>
                  <span class="font-mono text-[var(--color-text)]/70">+{{ formatDuree(tempsDescenteMin) }}</span>
                </div>
              </div>

              <p class="flex items-start gap-2 text-xs text-[var(--color-muted)] leading-relaxed pt-4 border-t border-[var(--color-accent)]/10">
                <Info :size="13" class="shrink-0 mt-0.5" aria-hidden="true" />
                Méthode : allure sur plat + un temps additionnel par mètre de D+ et de D- (règle de Naismith adaptée à
                la course à pied), modulé par la technicité du terrain — une estimation, pas une science exacte.
              </p>
            </template>
          </div>
        </UiAnimatedSection>

      </div>
    </div>
  </div>
</template>
