import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import AiTool                 from "~/server/models/aiTool";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const tools = await AiTool.find().sort({ created_at: -1 }).lean();
  return tools.map((t) => ({ ...t, id: String(t._id) }));
});
