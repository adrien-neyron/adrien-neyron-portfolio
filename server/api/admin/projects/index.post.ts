import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }   from "~/server/lib/mongodb";
import Project         from "~/server/models/project";
import { coverSourceFromForm, findCoverFor, trackUnsplashDownload } from "~/server/utils/projectCover";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const body = await readBody(event);

  // Photo d'ambiance — priorité : admin > Unsplash (voir server/utils/projectCover.ts)
  const coverSource = coverSourceFromForm(body);
  if (coverSource === "unsplash" && body.coverUnsplashId) {
    await trackUnsplashDownload(body.coverUnsplashId);
  }

  const doc = await Project.create({
    slug:         body.slug,
    title:        body.title,
    tagline:      body.tagline,
    role:         body.role         ?? "",
    description:  body.description  ?? "",
    challenge:    body.challenge,
    solution:     body.solution,
    result:       body.result,
    technologies: body.technologies ?? [],
    image: {
      light: body.image_light,
      dark:  body.image_dark,
    },
    cover:          body.cover,
    coverCredit:    body.coverCredit,
    coverCreditUrl: body.coverCreditUrl,
    coverSource,
    coverUnsplashId: coverSource === "unsplash" ? body.coverUnsplashId : undefined,
    coverQuery:      body.coverQuery || undefined,
    link:       body.link       ?? null,
    code:       body.code       ?? null,
    difficulty: body.difficulty,
    duration:   body.duration,
    category:   body.category,
    status:     body.status,
    impact:     body.impact,
    // fiche topo (refonte « L'ascension »)
    place:      body.place,
    coords:     body.coords,
    startDate:  body.startDate,
    profile:    body.profile,
    milestones: body.milestones,
    stats:      body.stats,
  });

  // Pas de photo saisie : recherche Unsplash, résultat stocké en base.
  if (!doc.cover) {
    const found = await findCoverFor(doc.toObject(), { force: true });
    if (found) {
      doc.set(found);
      await doc.save();
    }
  }

  return { ...doc.toObject(), id: String(doc._id) };
});
