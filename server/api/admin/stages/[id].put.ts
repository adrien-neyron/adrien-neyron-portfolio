import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import Stage                 from "~/server/models/stage";
import { normalizeStage }    from "~/utils/stages";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const id = getRouterParam(event, "id");
  const { _id, ...fields } = normalizeStage(await readBody(event));
  const updated = await Stage.findByIdAndUpdate(id, { $set: fields }, { new: true, runValidators: true }).lean<{ _id: unknown }>();
  if (!updated) throw createError({ statusCode: 404, statusMessage: "Étape introuvable" });

  return { ...updated, id: String(updated._id) };
});
