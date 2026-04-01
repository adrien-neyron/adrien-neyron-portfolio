<script setup lang="ts">
const emit = defineEmits<{ finish: [] }>();

const step = ref(1);
const formData = reactive({ intent: "", domain: "", email: "" });

const intents = [
  { label: "Voir mes projets", value: "projects" },
  { label: "Me contacter",    value: "contact"  },
  { label: "Par curiosité",   value: "curiosity" },
];

const domains = [
  { label: "Tech / Web",      value: "tech"     },
  { label: "Sport / Coaching",value: "sports"   },
  { label: "Entreprise",      value: "business" },
  { label: "Autre",           value: "other"    },
];

async function submit() {
  await $fetch("/api/visitors", {
    method: "POST",
    body: { ...formData },
  });
  emit("finish");
}
</script>

<template>
  <div class="space-y-6">
    <!-- Étape 1 -->
    <div v-if="step === 1" class="space-y-4">
      <h2 class="text-2xl font-bold">Pourquoi visitez-vous mon portfolio ?</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="item in intents"
          :key="item.value"
          :class="[
            'p-4 rounded-xl border-2 font-semibold text-center transition',
            formData.intent === item.value
              ? 'bg-accent text-white border-accent'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
          ]"
          @click="formData.intent = item.value"
        >
          {{ item.label }}
        </button>
      </div>
      <button
        class="px-6 py-3 bg-accent text-white rounded-xl mt-4 disabled:opacity-40"
        :disabled="!formData.intent"
        @click="step++"
      >
        Suivant
      </button>
    </div>

    <!-- Étape 2 -->
    <div v-else-if="step === 2" class="space-y-4">
      <h2 class="text-2xl font-bold">Votre domaine ?</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          v-for="item in domains"
          :key="item.value"
          :class="[
            'p-4 rounded-xl border-2 font-semibold text-center transition',
            formData.domain === item.value
              ? 'bg-accent text-white border-accent'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700'
          ]"
          @click="formData.domain = item.value"
        >
          {{ item.label }}
        </button>
      </div>
      <button
        class="px-6 py-3 bg-accent text-white rounded-xl mt-4 disabled:opacity-40"
        :disabled="!formData.domain"
        @click="step++"
      >
        Suivant
      </button>
    </div>

    <!-- Étape 3 -->
    <div v-else class="space-y-4">
      <h2 class="text-2xl font-bold">Recevoir mes projets par email ?</h2>
      <input
        v-model="formData.email"
        type="email"
        placeholder="Votre email (facultatif)"
        class="border p-3 rounded-xl w-full"
      />
      <button class="px-6 py-3 bg-accent text-white rounded-xl mt-4" @click="submit">
        Terminer
      </button>
    </div>
  </div>
</template>
