import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }   from "~/server/lib/mongodb";
import Project         from "~/server/models/project";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const id  = getRouterParam(event, "id");
  const doc = await Project.findByIdAndDelete(id);

  if (!doc) throw createError({ statusCode: 404, statusMessage: "Project not found" });

  return sendNoContent(event, 204);
});
