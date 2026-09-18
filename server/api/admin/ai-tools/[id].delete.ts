import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import AiTool                 from "~/server/models/aiTool";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const id = getRouterParam(event, "id");
  await AiTool.findByIdAndDelete(id);

  return { deleted: true };
});
