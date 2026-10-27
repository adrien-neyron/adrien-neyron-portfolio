import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }         from "~/server/lib/mongodb";
import Stage                 from "~/server/models/stage";
import { normalizeStage, validateStage } from "~/utils/stages";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const { _id, ...fields } = normalizeStage(await readBody(event));   // champs connus seulement, textes rognés

  // Mêmes contrôles que le formulaire (clé unique, un seul Départ / cairn final…), avec un message qui dit quoi corriger.
  const others = await Stage.find().lean<{ key: string; order: number; kind: "depart" | "etape" | "bivouac" | "final"; title: string; period: string }[]>();
  const errors = validateStage(fields, others, "ok").filter((i) => i.field !== "placement");
  if (errors.length) throw createError({ statusCode: 422, statusMessage: "Étape invalide", data: { errors } });

  try {
    const doc = await Stage.create(fields);
    return { ...doc.toObject(), id: String(doc._id) };
  } catch (e) {
    if ((e as { code?: number }).code === 11000) throw createError({ statusCode: 409, statusMessage: `la clé « ${fields.key} » est déjà utilisée` });
    throw e;
  }
});
