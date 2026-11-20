"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.get("/", async (req, res) => {
    const userId = req.userId;
    const assets = await (0, pool_1.query)("SELECT * FROM assets WHERE user_id=$1 ORDER BY created_at DESC", [userId]);
    const mapped = assets.filter((a) => a.link_status !== "not_added").length;
    const hasBeneficiary = assets.some((a) => a.beneficiary_name);
    const score = (mapped > 0 ? 25 : 0) + (hasBeneficiary ? 25 : 0);
    res.json({ assets, healthScore: Math.min(score, 100) });
});
router.post("/", async (req, res) => {
    const schema = zod_1.z.object({
        name: zod_1.z.string().min(1),
        type: zod_1.z.string(),
        valueCents: zod_1.z.number().int().optional(),
        institution: zod_1.z.string().optional(),
        accountNumber: zod_1.z.string().optional(),
        beneficiaryName: zod_1.z.string().optional(),
        linkStatus: zod_1.z.enum(["linked", "manual", "not_added"]).default("manual"),
        notes: zod_1.z.string().optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    const userId = req.userId;
    const { name, type, valueCents, institution, accountNumber, beneficiaryName, linkStatus, notes } = result.data;
    const asset = await (0, pool_1.queryOne)(`INSERT INTO assets (user_id,name,type,value_cents,institution,account_number,beneficiary_name,link_status,notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [userId, name, type, valueCents ?? null, institution ?? null, accountNumber ?? null, beneficiaryName ?? null, linkStatus, notes ?? null]);
    res.status(201).json({ asset });
});
router.patch("/:id", async (req, res) => {
    const userId = req.userId;
    // Strict allowlist — keys go directly into the SQL SET clause
    const allowed = ["name", "type", "value_cents", "institution", "beneficiary_name", "link_status", "notes"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) {
        res.status(400).json({ error: "No valid fields" });
        return;
    }
    // $1 = id, $2 = userId, $3..N = values — index offset is +3
    const keys = Object.keys(updates);
    const vals = Object.values(updates);
    const setClauses = keys.map((k, i) => `${k}=$${i + 3}`).join(", ");
    const asset = await (0, pool_1.queryOne)(`UPDATE assets SET ${setClauses}, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`, [req.params.id, userId, ...vals]);
    if (!asset) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json({ asset });
});
router.delete("/:id", async (req, res) => {
    const userId = req.userId;
    await (0, pool_1.query)("DELETE FROM assets WHERE id=$1 AND user_id=$2", [req.params.id, userId]);
    res.json({ ok: true });
});
exports.default = router;
