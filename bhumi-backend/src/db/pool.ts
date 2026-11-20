import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL environment variable is not set. Exiting.");
  process.exit(1);
}

// Railway internal postgres (.railway.internal) uses no SSL.
// External/public URLs (rlwy.net, neon, supabase) need SSL.
const dbUrl = process.env.DATABASE_URL ?? "";
const needsSsl = !dbUrl.includes(".railway.internal") && !dbUrl.includes("localhost");

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected pg pool error", err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
