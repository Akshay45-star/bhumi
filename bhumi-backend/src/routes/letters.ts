import { Router, Request, Response } from "express";
import { z } from "zod";
import { query, queryOne } from "../db/pool";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

// GET /letters
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lettersList = await query(
      "SELECT * FROM legacy_letters WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json({ letters: lettersList });
  } catch (err) {
    console.error("[letters] GET /", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /letters
router.post("/", async (req: Request, res: Response) => {
  const schema = z.object({
    title:   z.string().min(1).max(300),
    content: z.string().min(1).max(50000),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }

  try {
    const userId = (req as any).userId;
    const { title, content } = result.data;

    const letter = await queryOne(
      `INSERT INTO legacy_letters (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, title, content]
    );
    res.status(201).json({ letter });
  } catch (err) {
    console.error("[letters] POST /", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /letters/:id
router.patch("/:id", async (req: Request, res: Response) => {
  const schema = z.object({
    title:   z.string().min(1).max(300).optional(),
    content: z.string().min(1).max(50000).optional(),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }

  const updates = result.data;
  if (!Object.keys(updates).length) { res.status(400).json({ error: "No fields to update" }); return; }

  try {
    const userId = (req as any).userId;
    const setClauses = Object.keys(updates).map((k, i) => `${k}=$${i + 3}`).join(", ");
    const letter = await queryOne(
      `UPDATE legacy_letters SET ${setClauses}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, userId, ...Object.values(updates)]
    );
    if (!letter) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ letter });
  } catch (err) {
    console.error("[letters] PATCH /:id", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /letters/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await query("DELETE FROM legacy_letters WHERE id = $1 AND user_id = $2", [req.params.id, userId]);
    res.json({ ok: true });
  } catch (err) {
    console.error("[letters] DELETE /:id", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
