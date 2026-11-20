"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.queryOne = queryOne;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.DATABASE_URL) {
    console.error("FATAL: DATABASE_URL environment variable is not set. Exiting.");
    process.exit(1);
}
// Railway internal postgres (.railway.internal) uses no SSL.
// External/public URLs (rlwy.net, neon, supabase) need SSL.
const dbUrl = process.env.DATABASE_URL ?? "";
const needsSsl = !dbUrl.includes(".railway.internal") && !dbUrl.includes("localhost");
exports.pool = new pg_1.Pool({
    connectionString: dbUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
exports.pool.on("error", (err) => {
    console.error("Unexpected pg pool error", err);
});
async function query(text, params) {
    const client = await exports.pool.connect();
    try {
        const result = await client.query(text, params);
        return result.rows;
    }
    finally {
        client.release();
    }
}
async function queryOne(text, params) {
    const rows = await query(text, params);
    return rows[0] ?? null;
}
