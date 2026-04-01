import { requireAuth } from "~/server/utils/requireAuth";
import { getPool }     from "~/server/lib/pgsql";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const id   = getRouterParam(event, "id");
  const body = await readBody(event);
  const pool = getPool();

  const { rows } = await pool.query(
    `UPDATE projects SET
       slug=$1, title=$2, tagline=$3, role=$4, description=$5,
       challenge=$6, solution=$7, result=$8, technologies=$9,
       image_light=$10, image_dark=$11, link=$12, code=$13,
       difficulty=$14, duration=$15, category=$16, updated_at=NOW()
     WHERE id=$17
     RETURNING *`,
    [
      body.slug, body.title, body.tagline, body.role, body.description,
      body.challenge, body.solution, body.result,
      body.technologies, body.image_light, body.image_dark,
      body.link ?? null, body.code ?? null,
      body.difficulty, body.duration, body.category,
      id,
    ]
  );

  if (!rows[0]) throw createError({ statusCode: 404, statusMessage: "Project not found" });
  return rows[0];
});
