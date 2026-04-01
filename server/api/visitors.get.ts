import { getPool } from "~/server/lib/pgsql";

export default defineEventHandler(async () => {
  const pool = getPool();
  const result = await pool.query(
    "SELECT count FROM visitor_count WHERE id = 1"
  );
  return { count: result.rows[0]?.count ?? 0 };
});
