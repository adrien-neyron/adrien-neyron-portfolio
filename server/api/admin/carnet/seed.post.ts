import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import CarnetArticle          from "~/server/models/carnetArticle";
import { carnetArticles as staticArticles } from "~/data/carnet";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const results = await Promise.all(
    staticArticles.map((a) =>
      CarnetArticle.findOneAndUpdate(
        { slug: a.slug },
        {
          $setOnInsert: {
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            category: a.category,
            date: a.date,
            cover: a.cover,
            content: a.content,
            data: a.data,
          },
        },
        { upsert: true, new: true }
      )
    )
  );

  return {
    seeded: results.length,
    slugs: results.map((r) => r?.slug),
  };
});
