/**
 * Observe une section DOM via IntersectionObserver.
 * Déclenche onTrigger quand la section est visible à threshold%.
 * Équivalent du hook React useSectionTrigger.
 */
export function useSectionTrigger(
  sectionId: string,
  onTrigger: () => void,
  threshold = 0.3
) {
  onMounted(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onTrigger();
            observer.disconnect();
          }
        });
      },
      { threshold }
    );

    observer.observe(section);

    onUnmounted(() => observer.disconnect());
  });
}
