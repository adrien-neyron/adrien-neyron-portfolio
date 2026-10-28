import { urlsToDelete } from "~/utils/blobTrash";

/** File d'attente des images remplacées (voir utils/blobTrash.ts). Vidée à chaque changement de page : rien ne part sans enregistrement. */
export function useBlobTrash() {
  const pending = useState<string[]>("blob-trash", () => []);

  const queue = (url?: string) => { if (url && !pending.value.includes(url)) pending.value.push(url); };
  const clear = () => { pending.value = []; };

  /** À appeler après l'enregistrement réussi : supprime les anciennes images qui ne sont plus utilisées. Ne bloque jamais la sauvegarde. */
  async function commit(savedPayload: unknown, token: string) {
    const urls = urlsToDelete(pending.value, savedPayload);
    clear();
    if (!urls.length) return;
    try {
      await $fetch("/api/admin/upload", { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, body: { urls } });
    } catch { /* un fichier orphelin n'empêche pas l'enregistrement */ }
  }

  return { queue, clear, commit };
}
