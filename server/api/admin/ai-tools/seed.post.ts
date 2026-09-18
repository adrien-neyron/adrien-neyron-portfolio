import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import AiTool                 from "~/server/models/aiTool";
import { aiTools as staticAiTools } from "~/data/ai-tools";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const results = await Promise.all(
    staticAiTools.map((t) =>
      AiTool.findOneAndUpdate(
        { slug: t.id },
        {
          $setOnInsert: {
            slug: t.id,
            name: t.name,
            provider: t.provider,
            category: t.category,
            tagline: t.tagline,
            description: t.description,
            useCases: t.useCases,
            businessValue: t.businessValue,
            icon: t.icon,
            link: t.link,
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
