import { requireAdminWrite } from "~/server/utils/requireAuth";
import { put, BlobStoreNotFoundError } from "@vercel/blob";

// Depuis @vercel/blob v2, un projet déployé sur Vercel s'authentifie par
// défaut via OIDC (variables BLOB_STORE_ID + VERCEL_OIDC_TOKEN, injectées
// automatiquement quand un Blob store est connecté au projet) — plus besoin
// de générer ni de configurer un BLOB_READ_WRITE_TOKEN à la main. Le SDK lit
// ces variables tout seul, donc `put()` n'a plus besoin qu'on lui passe un
// `token` explicite ici. BLOB_READ_WRITE_TOKEN reste supporté par le SDK en
// repli automatique (utile en local/CI via `vercel env pull`), mais n'est
// plus la méthode par défaut.
export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);

  const files = await readMultipartFormData(event);
  const file  = files?.find((f) => f.name === "file");

  if (!file || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: "Aucun fichier reçu." });
  }

  // Préfixe pour éviter les collisions de noms, garde l'extension d'origine
  const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const pathname = `${Date.now()}-${safeName}`;

  try {
    const blob = await put(pathname, file.data, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url };
  } catch (err) {
    if (err instanceof BlobStoreNotFoundError) {
      throw createError({
        statusCode: 500,
        statusMessage:
          "Aucun Blob store connecté à ce projet — crée-en un depuis le dashboard Vercel (Storage, au niveau de l'équipe) puis connecte-le à ce projet (onglet Projects du store).",
      });
    }
    const message = err instanceof Error ? err.message : "Échec de l'upload.";
    throw createError({ statusCode: 500, statusMessage: message });
  }
});
