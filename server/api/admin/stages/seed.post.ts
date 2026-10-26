import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import Stage                 from "~/server/models/stage";
import { stages as staticStages } from "~/data/stages";

/** Importe les étapes par défaut (data/stages.ts) : insertion seulement, une étape déjà en base (même clé) n'est pas touchée. */
export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const results = await Promise.all(
    staticStages.map((s) =>
      Stage.findOneAndUpdate({ key: s.key }, { $setOnInsert: s }, { upsert: true, new: true })
    )
  );

  return { seeded: results.length, keys: results.map((r) => r?.key) };
});
