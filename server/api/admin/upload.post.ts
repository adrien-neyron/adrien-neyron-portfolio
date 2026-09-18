import { requireAdminWrite } from "~/server/utils/requireAuth";
import { put } from "@vercel/blob";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);

  const config = useRuntimeConfig();
  const token  = config.blobReadWriteToken;

  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "BLOB_READ_WRITE_TOKEN manquant — crée un Blob store dans le dashboard Vercel (Storage) et ajoute la variable d'environnement.",
    });
  }

  const files = await readMultipartFormData(event);
  const file  = files?.find((f) => f.name === "file");

  if (!file || !file.filename) {
    throw createError({ statusCode: 400, statusMessage: "Aucun fichier reçu." });
  }

  // Préfixe pour éviter les collisions de noms, garde l'extension d'origine
  const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const pathname = `${Date.now()}-${safeName}`;

  const blob = await put(pathname, file.data, {
    access: "public",
    contentType: file.type,
    token,
  });

  return { url: blob.url };
});
