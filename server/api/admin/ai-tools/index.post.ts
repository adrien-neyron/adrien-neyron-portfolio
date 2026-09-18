import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import AiTool                 from "~/server/models/aiTool";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const body = await readBody(event);
  const tool = await AiTool.create(body);
  return tool;
});
