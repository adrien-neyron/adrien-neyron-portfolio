import { requireAuth } from "~/server/utils/requireAuth";
import { dbConnect }   from "~/server/lib/mongodb";
import Project         from "~/server/models/project";

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  await dbConnect();

  const docs = await Project.find().sort({ created_at: -1 }).lean();

  return docs.map((p) => ({
    ...p,
    id: String(p._id),
  }));
});
