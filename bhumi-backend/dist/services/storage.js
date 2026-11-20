"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadPresignedUrl = getUploadPresignedUrl;
exports.uploadBuffer = uploadBuffer;
exports.getPlaybackUrl = getPlaybackUrl;
exports.getSignedPlayUrl = getSignedPlayUrl;
exports.getPublicUrl = getPublicUrl;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Supports both Neon Object Storage (AWS_* vars) and legacy Cloudflare R2 (R2_* vars).
// Neon Object Storage is S3-compatible and preferred when AWS_ENDPOINT_URL_S3 is set.
function makeS3Client() {
    if (process.env.AWS_ENDPOINT_URL_S3) {
        // Neon Object Storage
        return new client_s3_1.S3Client({
            region: process.env.AWS_REGION ?? "us-east-2",
            endpoint: process.env.AWS_ENDPOINT_URL_S3,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
            forcePathStyle: true,
        });
    }
    // Legacy Cloudflare R2
    return new client_s3_1.S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
    });
}
const s3 = makeS3Client();
// Bucket: Neon uses branch-scoped bucket name via AWS_ENDPOINT_URL_S3; R2 uses R2_BUCKET_NAME.
const BUCKET = process.env.R2_BUCKET_NAME ?? "assets";
// Generate a presigned upload URL — mobile app uploads directly to storage
async function getUploadPresignedUrl(userId, type) {
    const key = `${type}s/${userId}/${(0, uuid_1.v4)()}.mp4`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: "video/mp4",
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 3600 });
    return { uploadUrl, key };
}
// Upload a raw buffer directly from server (used for server-side uploads)
async function uploadBuffer(key, buffer, contentType) {
    await s3.send(new client_s3_1.PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));
}
// Generate a signed playback URL (valid for 7 days)
async function getPlaybackUrl(key, expiresInSeconds = 604800) {
    const command = new client_s3_1.GetObjectCommand({ Bucket: BUCKET, Key: key });
    return (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: expiresInSeconds });
}
// Alias used by other routes (shorter expiry)
async function getSignedPlayUrl(key, expiresInSeconds = 3600) {
    return getPlaybackUrl(key, expiresInSeconds);
}
// Public URL (if bucket is public-readable)
function getPublicUrl(key) {
    if (process.env.AWS_ENDPOINT_URL_S3) {
        return `${process.env.AWS_ENDPOINT_URL_S3}/${BUCKET}/${key}`;
    }
    return `${process.env.R2_PUBLIC_URL}/${key}`;
}
