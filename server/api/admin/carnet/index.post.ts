import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import CarnetArticle          from "~/server/models/carnetArticle";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const body = await readBody(event);
  const article = await CarnetArticle.create(body);
  return article;
});
