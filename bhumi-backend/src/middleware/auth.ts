import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Fail fast at startup if JWT_SECRET is not set — never run with an empty secret
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set. Exiting.");
  process.exit(1);
}
// After the guard above, this is guaranteed to be a non-empty string
const SECRET = process.env.JWT_SECRET as string;

export function signToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  } as jwt.SignOptions);
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string };
}

// Express middleware
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorised" });
    return;
  }
  try {
    const payload = verifyToken(header.slice(7));
    (req as any).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
