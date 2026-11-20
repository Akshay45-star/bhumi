#!/usr/bin/env node
/**
 * One-shot schema migration — runs inside Railway before API starts.
 * Splits schema.sql into individual statements to handle errors per-statement.
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = fs.readFileSync(path.join(__dirname, "src/db/schema.sql"), "utf8");

// Split on semicolons, filter empty lines
const statements = sql
  .split(";")
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

(async () => {
  const needsSsl = !url.includes(".railway.internal") && !url.includes("localhost");
  const client = new Client({
    connectionString: url,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
  });
  try {
    await client.connect();
    console.log("[migrate] Connected to database");
    let ok = 0, skip = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        ok++;
      } catch (err) {
        // IF NOT EXISTS means most errors are benign duplicate-object errors
        if (err.code === "42P07" || err.code === "42710" || err.message.includes("already exists")) {
          skip++;
        } else {
          console.warn("[migrate] warn:", err.message.slice(0, 120));
        }
      }
    }
    console.log(`[migrate] ✅ Done — ${ok} statements applied, ${skip} skipped (already exist)`);
  } catch (err) {
    console.error("[migrate] ❌ Connection failed:", err.message);
    // Don't exit 1 — let the server start anyway so we can debug via logs
  } finally {
    await client.end().catch(() => {});
  }
})();
