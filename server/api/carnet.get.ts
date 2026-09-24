import { dbConnect } from "~/server/lib/mongodb";
import CarnetArticle from "~/server/models/carnetArticle";

export default defineEventHandler(async () => {
  await dbConnect();
  const articles = await CarnetArticle.find().sort({ date: -1 }).lean();
  return articles;
});
