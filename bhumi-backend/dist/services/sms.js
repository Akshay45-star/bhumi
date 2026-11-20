"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = generateOTP;
exports.sendOTP = sendOTP;
exports.sendInviteSMS = sendInviteSMS;
exports.sendTrustedContactPing = sendTrustedContactPing;
exports.sendDeliverySMS = sendDeliverySMS;
const crypto_1 = require("crypto");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Generate a cryptographically secure 6-digit OTP
function generateOTP() {
    return (0, crypto_1.randomInt)(100000, 1000000).toString();
}
// Send OTP — uses Twilio if configured, otherwise logs to console (dev/staging)
async function sendOTP(phone, code) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
        // No Twilio credentials — log OTP so it can be used during testing
        console.log(`[OTP] Code for ${phone}: ${code}  (Twilio not configured — check Railway logs)`);
        return;
    }
    // Lazy-load Twilio only when credentials are available
    const twilio = await Promise.resolve().then(() => __importStar(require("twilio")));
    const client = twilio.default(sid, token);
    await client.messages.create({
        body: `Your Bhumi verification code is: ${code}. Valid for 10 minutes.`,
        from,
        to: phone,
    });
}
// Send invite SMS — no-op if Twilio not configured
async function sendInviteSMS(phone, creatorName, memberName, inviteUrl) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
        console.log(`[SMS] Invite for ${phone} — Twilio not configured`);
        return "no-sid";
    }
    const twilio = await Promise.resolve().then(() => __importStar(require("twilio")));
    const client = twilio.default(sid, token);
    const msg = await client.messages.create({
        body: `Hi ${memberName}, ${creatorName} has left you messages on Bhumi. Accept here: ${inviteUrl}`,
        from,
        to: phone,
    });
    return msg.sid;
}
// Trusted contact ping — no-op if Twilio not configured
async function sendTrustedContactPing(contactPhone, userName, confirmUrl) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
        console.log(`[SMS] Trusted contact ping for ${contactPhone} — Twilio not configured`);
        return "no-sid";
    }
    const twilio = await Promise.resolve().then(() => __importStar(require("twilio")));
    const client = twilio.default(sid, token);
    const msg = await client.messages.create({
        body: `Hi, this is Bhumi. ${userName} hasn't checked in. Please confirm: ${confirmUrl}`,
        from,
        to: contactPhone,
    });
    return msg.sid;
}
// Delivery SMS — no-op if Twilio not configured
async function sendDeliverySMS(recipientPhone, senderName, messageTitle, watchUrl) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) {
        console.log(`[SMS] Delivery SMS for ${recipientPhone} — Twilio not configured`);
        return "no-sid";
    }
    const twilio = await Promise.resolve().then(() => __importStar(require("twilio")));
    const client = twilio.default(sid, token);
    const msg = await client.messages.create({
        body: `${senderName} left you a message: "${messageTitle}". Watch: ${watchUrl}`,
        from,
        to: recipientPhone,
    });
    return msg.sid;
}
