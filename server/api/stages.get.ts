import { dbConnect } from "~/server/lib/mongodb";
import Stage from "~/server/models/stage";

/** Étapes de la trace, dans l'ordre (public, lecture seule). Vide : les pages utilisent data/stages.ts. */
export default defineEventHandler(async () => {
  await dbConnect();
  return Stage.find().sort({ order: 1 }).lean();
});
