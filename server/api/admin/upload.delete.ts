import { requireAdminWrite } from "~/server/utils/requireAuth";
import { del } from "@vercel/blob";
import { isBlobUrl } from "~/utils/blobTrash";

// Supprime d'anciennes images du Blob store (remplacées dans l'admin puis enregistrées). Jamais d'URL hors de notre store.
export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  const body = await readBody<{ urls?: unknown }>(event);
  const urls = (Array.isArray(body?.urls) ? body.urls : []).filter(isBlobUrl).slice(0, 10);
  if (!urls.length) return { deleted: 0 };
  try {
    await del(urls);
    return { deleted: urls.length };
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: err instanceof Error ? err.message : "Suppression impossible." });
  }
});
