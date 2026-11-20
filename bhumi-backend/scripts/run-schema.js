#!/usr/bin/env node
/**
 * Runs schema.sql against DATABASE_URL.
 * Usage: DATABASE_URL=... node scripts/run-schema.js
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = fs.readFileSync(path.join(__dirname, "../src/db/schema.sql"), "utf8");

(async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("Connected. Running schema...");
    await client.query(sql);
    console.log("✅ Schema applied successfully.");
  } catch (err) {
    console.error("❌ Schema error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
