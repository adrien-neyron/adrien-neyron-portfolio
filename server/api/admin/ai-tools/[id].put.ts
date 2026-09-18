import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import AiTool                 from "~/server/models/aiTool";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const id   = getRouterParam(event, "id");
  const body = await readBody(event);

  const updated = await AiTool.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!updated) throw createError({ statusCode: 404, statusMessage: "Outil introuvable" });

  return updated;
});
