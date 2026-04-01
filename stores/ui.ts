import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", () => {
  const isPopupOpen  = ref(false);
  const hasTriggered = ref(false);

  function openPopup() {
    if (hasTriggered.value) return;
    isPopupOpen.value  = true;
    hasTriggered.value = true;
  }

  function closePopup() {
    isPopupOpen.value = false;
  }

  return { isPopupOpen, openPopup, closePopup };
});
