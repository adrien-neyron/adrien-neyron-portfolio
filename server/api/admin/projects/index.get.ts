import { requireAuth } from "~/server/utils/requireAuth";
import { getPool }     from "~/server/lib/pgsql";

export default defineEventHandler(async (event) => {
  await requireAuth(event);

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM projects ORDER BY created_at DESC`
  );
  return rows;
});
