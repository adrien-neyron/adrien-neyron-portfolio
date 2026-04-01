import { requireAuth } from "~/server/utils/requireAuth";
import { getPool }     from "~/server/lib/pgsql";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const body = await readBody(event);
  const pool = getPool();

  const { rows } = await pool.query(
    `INSERT INTO projects
       (slug, title, tagline, role, description, challenge, solution, result,
        technologies, image_light, image_dark, link, code, difficulty, duration, category)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      body.slug, body.title, body.tagline, body.role, body.description,
      body.challenge, body.solution, body.result,
      body.technologies, body.image_light, body.image_dark,
      body.link ?? null, body.code ?? null,
      body.difficulty, body.duration, body.category,
    ]
  );

  return rows[0];
});
