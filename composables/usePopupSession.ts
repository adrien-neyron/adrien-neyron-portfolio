/**
 * Retourne true si le popup doit s'ouvrir (une seule fois par session).
 * Équivalent du hook React usePopupSession.
 */
export function usePopupSession(): Ref<boolean> {
  const shouldOpen = ref(false);

  onMounted(() => {
    const key = "popupShown";
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "true");
      shouldOpen.value = true;
    }
  });

  return shouldOpen;
}
