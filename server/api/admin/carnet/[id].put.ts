import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import CarnetArticle          from "~/server/models/carnetArticle";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const id   = getRouterParam(event, "id");
  const body = await readBody(event);

  const updated = await CarnetArticle.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!updated) throw createError({ statusCode: 404, statusMessage: "Article introuvable" });

  return updated;
});
