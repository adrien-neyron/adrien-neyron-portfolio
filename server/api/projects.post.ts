import { dbConnect } from "~/server/lib/mongodb";
import Project from "~/server/models/project";

export default defineEventHandler(async (event) => {
  await dbConnect();
  const body = await readBody(event);
  const project = await Project.create(body);
  return sendNoContent(event, 201) || project.toObject();
});
