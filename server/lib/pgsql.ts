import pg from "pg";

const { Pool } = pg;

let pool: InstanceType<typeof Pool> | null = null;

export function getPool(): InstanceType<typeof Pool> {
  if (pool) return pool;

  const config = useRuntimeConfig();

  // Retire sslmode de l'URL pour éviter le warning pg-connection-string,
  // et passe ssl explicitement via les options du Pool.
  const url = new URL(config.postgresUrl);
  url.searchParams.delete("sslmode");

  pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
  });
  return pool;
}
