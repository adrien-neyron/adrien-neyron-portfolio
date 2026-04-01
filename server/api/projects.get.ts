import { dbConnect } from "~/server/lib/mongodb";
import Project from "~/server/models/project";

export default defineEventHandler(async () => {
  await dbConnect();
  const projects = await Project.find().lean();
  return projects;
});
