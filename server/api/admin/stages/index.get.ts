import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import Stage                 from "~/server/models/stage";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const stages = await Stage.find().sort({ order: 1 }).lean();
  return stages.map((s) => ({ ...s, id: String(s._id) }));
});
