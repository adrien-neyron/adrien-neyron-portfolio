import { dbConnect } from "~/server/lib/mongodb";
import AiTool from "~/server/models/aiTool";

export default defineEventHandler(async () => {
  await dbConnect();
  const tools = await AiTool.find().lean();
  return tools;
});
