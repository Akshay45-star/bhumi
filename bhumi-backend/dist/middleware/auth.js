"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Fail fast at startup if JWT_SECRET is not set — never run with an empty secret
if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET environment variable is not set. Exiting.");
    process.exit(1);
}
// After the guard above, this is guaranteed to be a non-empty string
const SECRET = process.env.JWT_SECRET;
function signToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
    });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, SECRET);
}
// Express middleware
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorised" });
        return;
    }
    try {
        const payload = verifyToken(header.slice(7));
        req.userId = payload.userId;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token" });
    }
}
