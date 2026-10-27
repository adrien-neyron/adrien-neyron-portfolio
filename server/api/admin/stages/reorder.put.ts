import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import Stage                 from "~/server/models/stage";
import { traceOrderError }   from "~/utils/stages";

/**
 * Enregistre l'ordre de la trace : `{ ids: [...] }` = TOUTES les étapes, dans le nouvel ordre. Les rangs deviennent 0, 1, 2…
 * Refusé (409) si la liste ne correspond plus à la base (étape ajoutée ou supprimée entre-temps) : on recharge au lieu d'écraser.
 */
export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const body = await readBody<{ ids?: unknown }>(event);
  const ids = Array.isArray(body?.ids) ? body.ids.map((v) => String(v)) : [];
  if (!ids.length || new Set(ids).size !== ids.length) {
    throw createError({ statusCode: 422, statusMessage: "Liste d'étapes invalide", data: { errors: [] } });
  }

  const docs = await Stage.find().lean<{ _id: unknown; kind: string; title: string }[]>();
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  if (byId.size !== ids.length || ids.some((id) => !byId.has(id))) {
    throw createError({ statusCode: 409, statusMessage: "la liste des étapes a changé entre-temps ; recharge la page" });
  }
  const problem = traceOrderError(ids.map((id) => byId.get(id)!));
  if (problem) throw createError({ statusCode: 422, statusMessage: "Ordre invalide", data: { errors: [{ field: "placement", message: problem }] } });

  await Stage.bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: i } } } })));
  return { ok: true, count: ids.length };
});
