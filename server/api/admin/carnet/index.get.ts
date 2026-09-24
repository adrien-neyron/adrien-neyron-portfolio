import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import CarnetArticle          from "~/server/models/carnetArticle";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const articles = await CarnetArticle.find().sort({ date: -1 }).lean();
  return articles.map((a) => ({ ...a, id: String(a._id) }));
});
