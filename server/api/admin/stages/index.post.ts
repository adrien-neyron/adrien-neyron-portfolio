import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import Stage                 from "~/server/models/stage";
import { normalizeStage }    from "~/utils/stages";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const { _id, ...fields } = normalizeStage(await readBody(event));   // champs connus seulement, textes rognés
  const doc = await Stage.create(fields);
  return { ...doc.toObject(), id: String(doc._id) };
});
