import { requireAdminWrite } from "~/server/utils/requireAuth";
import { dbConnect }   from "~/server/lib/mongodb";
import Project         from "~/server/models/project";
import { coverSourceFromForm, findCoverFor, trackUnsplashDownload } from "~/server/utils/projectCover";

export default defineEventHandler(async (event) => {
  await requireAdminWrite(event);
  await dbConnect();

  const id   = getRouterParam(event, "id");
  const body = await readBody(event);

  // Photo d'ambiance : une photo tapée/uploadée dans /admin devient prioritaire
  // ("admin") ; une photo choisie parmi les suggestions reste "unsplash".
  const coverSource = coverSourceFromForm(body);
  const previous = await Project.findById(id, { coverUnsplashId: 1 }).lean();
  if (coverSource === "unsplash" && body.coverUnsplashId && body.coverUnsplashId !== previous?.coverUnsplashId) {
    await trackUnsplashDownload(body.coverUnsplashId);
  }

  let doc = await Project.findByIdAndUpdate(
    id,
    {
      $set: {
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
        coverSource:     coverSource ?? null,
        coverUnsplashId: coverSource === "unsplash" ? body.coverUnsplashId ?? null : null,
        coverQuery:      body.coverQuery || null,
        link:       body.link       ?? null,
        code:       body.code       ?? null,
        difficulty: body.difficulty,
        duration:   body.duration,
        category:   body.category,
        status:     body.status,
        impact:     body.impact,
    // fiche topo (refonte « L'ascension »)
    type:       body.type === "mission" || body.type === "perso" ? body.type : null,
    order:      Number.isFinite(body.order) ? body.order : undefined,
    place:      body.place,
    coords:     body.coords,
    startDate:  body.startDate,
    profile:    body.profile,
    milestones: body.milestones,
    stats:      body.stats,
      },
    },
    { new: true }
  ).lean();

  if (!doc) throw createError({ statusCode: 404, statusMessage: "Project not found" });

  // Pas de photo : on en cherche une sur Unsplash et on la stocke (sans bloquer
  // l'enregistrement si Unsplash ne répond pas).
  if (!doc.cover) {
    const found = await findCoverFor(doc, { force: true });
    if (found) {
      doc = (await Project.findByIdAndUpdate(id, { $set: found }, { new: true }).lean()) ?? doc;
    }
  }

  return { ...doc, id: String(doc._id) };
});
