import { Router, Request, Response } from "express";
import { z } from "zod";
import { query, queryOne } from "../db/pool";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const assets = await query("SELECT * FROM assets WHERE user_id=$1 ORDER BY created_at DESC", [userId]);
  const mapped        = assets.filter((a: any) => a.link_status !== "not_added").length;
  const hasBeneficiary = assets.some((a: any) => a.beneficiary_name);
  const score = (mapped > 0 ? 25 : 0) + (hasBeneficiary ? 25 : 0);
  res.json({ assets, healthScore: Math.min(score, 100) });
});

router.post("/", async (req: Request, res: Response) => {
  const schema = z.object({
    name:            z.string().min(1),
    type:            z.string(),
    valueCents:      z.number().int().optional(),
    institution:     z.string().optional(),
    accountNumber:   z.string().optional(),
    beneficiaryName: z.string().optional(),
    linkStatus:      z.enum(["linked","manual","not_added"]).default("manual"),
    notes:           z.string().optional(),
  });
  const result = schema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: result.error.flatten() }); return; }
  const userId = (req as any).userId;
  const { name, type, valueCents, institution, accountNumber, beneficiaryName, linkStatus, notes } = result.data;
  const asset = await queryOne(
    `INSERT INTO assets (user_id,name,type,value_cents,institution,account_number,beneficiary_name,link_status,notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [userId, name, type, valueCents ?? null, institution ?? null, accountNumber ?? null, beneficiaryName ?? null, linkStatus, notes ?? null]
  );
  res.status(201).json({ asset });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const userId  = (req as any).userId;
  // Strict allowlist — keys go directly into the SQL SET clause
  const allowed = ["name","type","value_cents","institution","beneficiary_name","link_status","notes"];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  if (!Object.keys(updates).length) { res.status(400).json({ error: "No valid fields" }); return; }
  // $1 = id, $2 = userId, $3..N = values — index offset is +3
  const keys   = Object.keys(updates);
  const vals   = Object.values(updates);
  const setClauses = keys.map((k, i) => `${k}=$${i + 3}`).join(", ");
  const asset = await queryOne(
    `UPDATE assets SET ${setClauses}, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [req.params.id, userId, ...vals]
  );
  if (!asset) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ asset });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  await query("DELETE FROM assets WHERE id=$1 AND user_id=$2", [req.params.id, userId]);
  res.json({ ok: true });
});

export default router;
