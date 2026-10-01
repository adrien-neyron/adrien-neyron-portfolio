import { dbConnect } from "~/server/lib/mongodb";
import Project from "~/server/models/project";
import { findCoverFor } from "~/server/utils/projectCover";

/**
 * Projets publics. Un projet sans photo d'ambiance en reçoit une ici, une seule
 * fois : elle est cherchée sur Unsplash puis STOCKÉE en base, les visites
 * suivantes la lisent directement. Une recherche ratée n'est pas relancée
 * avant 24 h (coverCheckedAt). Une photo mise dans /admin n'est jamais touchée.
 */
export default defineEventHandler(async () => {
  await dbConnect();
  const projects = await Project.find().lean();

  const missing = projects.filter((p) => !p.cover);
  if (missing.length) {
    await Promise.allSettled(
      missing.map(async (p) => {
        const found = await findCoverFor(p);
        if (!found) return;
        await Project.updateOne({ _id: p._id }, { $set: found });
        Object.assign(p, found);
      })
    );
  }

  return projects;
});
