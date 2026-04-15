import { requireAuth } from "~/server/utils/requireAuth";
import { dbConnect }   from "~/server/lib/mongodb";
import Project         from "~/server/models/project";

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  await dbConnect();

  const body = await readBody(event);

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
    link:       body.link       ?? null,
    code:       body.code       ?? null,
    difficulty: body.difficulty,
    duration:   body.duration,
    category:   body.category,
    status:     body.status,
    impact:     body.impact,
  });

  return { ...doc.toObject(), id: String(doc._id) };
});
