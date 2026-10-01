import { requireAdminWrite } from "~/server/utils/requireAuth";
import { buildCoverQuery, isUnsplashConfigured, searchUnsplash, type CoverSubject } from "~/server/utils/projectCover";

/**
 * Suggestions de photos d'ambiance pour le formulaire projet (/admin).
 * Body : les champs du formulaire (titre, description, catégorie…) + `coverQuery`
 * optionnel (mots-clés saisis) + `exclude` (ids déjà proposés, pour « Autres photos »).
 * Réponse : { query, candidates[] } — rien n'est enregistré ici : la photo choisie
 * part avec le formulaire, et le suivi Unsplash est fait à l'enregistrement.
 */
export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);

  if (!isUnsplashConfigured()) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "UNSPLASH_ACCESS_KEY manquante — crée une application sur unsplash.com/oauth/applications, puis ajoute sa clé « Access Key » dans les variables d'environnement Vercel (et dans ton .env en local).",
    });
  }

  const body = await readBody<CoverSubject & { exclude?: string[] }>(event);
  const query = await buildCoverQuery(body);

  try {
    const candidates = await searchUnsplash(query, { perPage: 6, exclude: body.exclude });
    return { query, candidates };
  } catch {
    throw createError({ statusCode: 502, statusMessage: "Unsplash ne répond pas — réessaie dans un moment (quota : 50 recherches par heure)." });
  }
});
