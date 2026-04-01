import { requireAuth } from "~/server/utils/requireAuth";
import { getPool }     from "~/server/lib/pgsql";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const id   = getRouterParam(event, "id");
  const pool = getPool();

  const { rowCount } = await pool.query(
    `DELETE FROM projects WHERE id=$1`, [id]
  );

  if (!rowCount) throw createError({ statusCode: 404, statusMessage: "Project not found" });

  return sendNoContent(event, 204);
});
