"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const pool_1 = require("../db/pool");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// GET /letters
router.get("/", async (req, res) => {
    try {
        const userId = req.userId;
        const lettersList = await (0, pool_1.query)("SELECT * FROM legacy_letters WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
        res.json({ letters: lettersList });
    }
    catch (err) {
        console.error("[letters] GET /", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// POST /letters
router.post("/", async (req, res) => {
    const schema = zod_1.z.object({
        title: zod_1.z.string().min(1).max(300),
        content: zod_1.z.string().min(1).max(50000),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    try {
        const userId = req.userId;
        const { title, content } = result.data;
        const letter = await (0, pool_1.queryOne)(`INSERT INTO legacy_letters (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING *`, [userId, title, content]);
        res.status(201).json({ letter });
    }
    catch (err) {
        console.error("[letters] POST /", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// PATCH /letters/:id
router.patch("/:id", async (req, res) => {
    const schema = zod_1.z.object({
        title: zod_1.z.string().min(1).max(300).optional(),
        content: zod_1.z.string().min(1).max(50000).optional(),
    });
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
    }
    const updates = result.data;
    if (!Object.keys(updates).length) {
        res.status(400).json({ error: "No fields to update" });
        return;
    }
    try {
        const userId = req.userId;
        const setClauses = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(", ");
        const letter = await (0, pool_1.queryOne)(`UPDATE legacy_letters SET ${setClauses}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`, [req.params.id, userId, ...Object.values(updates)]);
        if (!letter) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json({ letter });
    }
    catch (err) {
        console.error("[letters] PATCH /:id", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// DELETE /letters/:id
router.delete("/:id", async (req, res) => {
    try {
        const userId = req.userId;
        await (0, pool_1.query)("DELETE FROM legacy_letters WHERE id = $1 AND user_id = $2", [req.params.id, userId]);
        res.json({ ok: true });
    }
    catch (err) {
        console.error("[letters] DELETE /:id", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
