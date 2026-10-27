import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import Stage                 from "~/server/models/stage";
import { stages as staticStages } from "~/data/stages";

/** Importe les étapes par défaut (data/stages.ts) : insertion seulement, une étape déjà en base (même clé) n'est pas modifiée, sauf les images d'aperçu jamais saisies. */
export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const results = await Promise.all(
    staticStages.map((s) =>
      Stage.findOneAndUpdate({ key: s.key }, { $setOnInsert: s }, { upsert: true, new: true })
    )
  );

  // champs d'affichage ajoutés après coup : une étape déjà en base qui ne les a jamais eus reçoit ceux par défaut (jamais d'écrasement)
  await Promise.all(
    staticStages.filter((s) => s.images?.length).map((s) => Stage.updateOne({ key: s.key, images: { $exists: false } }, { $set: { images: s.images } })),
  );

  return { seeded: results.length, keys: results.map((r) => r?.key) };
});
