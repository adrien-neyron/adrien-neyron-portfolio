/**
 * Images remplacées depuis l'admin : l'ancien fichier (Vercel Blob) est supprimé une fois le formulaire ENREGISTRÉ
 * (pas avant : si on quitte sans enregistrer, la base pointe encore vers l'ancienne image).
 * Seules les URLs de notre Blob store sont supprimables ; les images du dépôt (/recentprojects/…) ou d'ailleurs ne sont jamais touchées.
 */
export const isBlobUrl = (url: unknown): url is string => {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
};

/** URLs en attente qui peuvent partir : Blob uniquement, et pas celles encore présentes dans ce qui vient d'être enregistré. */
export function urlsToDelete(pending: Iterable<string>, savedPayload: unknown): string[] {
  const saved = JSON.stringify(savedPayload ?? "");
  return [...new Set(pending)].filter((u) => isBlobUrl(u) && !saved.includes(u));
}
