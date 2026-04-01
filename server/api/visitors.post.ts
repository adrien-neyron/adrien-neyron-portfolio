import { getPool } from "~/server/lib/pgsql";

export default defineEventHandler(async (event) => {
  const pool = getPool();
  const body = await readBody(event) as {
    intent?: string;
    domain?: string;
    email?: string;
  };

  // Incrémenter le compteur
  const result = await pool.query(
    "UPDATE visitor_count SET count = count + 1 WHERE id = 1 RETURNING count"
  );

  // Enregistrer le visiteur
  await pool.query(
    "INSERT INTO visitors (intent, domain, email) VALUES ($1, $2, $3)",
    [body.intent ?? null, body.domain ?? null, body.email ?? null]
  );

  return { count: result.rows[0]?.count ?? 0 };
});
