/**
 * Effet de déchiffrement lettre par lettre.
 * Équivalent de use-dencrypt-effect (React).
 */
const CHARS = "-./*!?#%&@$€()[]{}<>~0123456789abcdefghijklmnopqrstuvwxyz";

export function useTextDecrypt() {
  const result = ref("");
  let timer: ReturnType<typeof setInterval> | null = null;

  function decrypt(target: string) {
    if (timer) clearInterval(timer);

    let iteration = 0;
    const maxIterations = target.length * 3;

    timer = setInterval(() => {
      result.value = target
        .split("")
        .map((char, index) => {
          if (index < Math.floor(iteration / 3)) return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      iteration++;
      if (iteration > maxIterations) {
        result.value = target;
        clearInterval(timer!);
        timer = null;
      }
    }, 50);
  }

  onUnmounted(() => { if (timer) clearInterval(timer); });

  return { result, decrypt };
}
