import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }   from "~/server/lib/mongodb";
import Project         from "~/server/models/project";
import { findCoverFor } from "~/server/utils/projectCover";

/**
 * Remplit en une fois les photos manquantes (à appeler depuis /admin, avec le
 * jeton admin). Les projets qui ont déjà une photo — admin ou Unsplash —
 * ne sont pas touchés.
 */
export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const missing = await Project.find({ $or: [{ cover: { $exists: false } }, { cover: "" }, { cover: null }] }).lean();
  const report: { slug: string; status: "added" | "not-found" }[] = [];

  // En série : le quota Unsplash (50 req/h en mode démo) ne supporte pas une rafale.
  for (const p of missing) {
    const found = await findCoverFor(p, { force: true });
    if (found) await Project.updateOne({ _id: p._id }, { $set: found });
    report.push({ slug: p.slug, status: found?.cover ? "added" : "not-found" });
  }

  return { checked: missing.length, report };
});
