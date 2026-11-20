#!/usr/bin/env node
const { Client } = require("pg");
const fs = require("fs");

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) { console.error("Usage: node run-schema-full.js <DATABASE_URL>"); process.exit(1); }

const sql = fs.readFileSync(__dirname + "/src/db/schema.sql", "utf8");
const needsSsl = !url.includes(".railway.internal") && !url.includes("localhost");

(async () => {
  const client = new Client({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : false });
  await client.connect();
  console.log("Connected.");
  try {
    await client.query(sql);
    console.log("✅ Schema applied.");
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
