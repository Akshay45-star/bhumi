import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

// Supports both Neon Object Storage (AWS_* vars) and legacy Cloudflare R2 (R2_* vars).
// Neon Object Storage is S3-compatible and preferred when AWS_ENDPOINT_URL_S3 is set.
function makeS3Client(): S3Client {
  if (process.env.AWS_ENDPOINT_URL_S3) {
    // Neon Object Storage
    return new S3Client({
      region:      process.env.AWS_REGION ?? "us-east-2",
      endpoint:    process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  // Legacy Cloudflare R2
  return new S3Client({
    region:   "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

const s3 = makeS3Client();

// Bucket: Neon uses branch-scoped bucket name via AWS_ENDPOINT_URL_S3; R2 uses R2_BUCKET_NAME.
const BUCKET = process.env.R2_BUCKET_NAME ?? "assets";

// Generate a presigned upload URL — mobile app uploads directly to storage
export async function getUploadPresignedUrl(userId: string, type: "checkin" | "message"): Promise<{
  uploadUrl: string;
  key:       string;
}> {
  const key = `${type}s/${userId}/${uuidv4()}.mp4`;
  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: "video/mp4",
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { uploadUrl, key };
}

// Upload a raw buffer directly from server (used for server-side uploads)
export async function uploadBuffer(
  key:         string,
  buffer:      Buffer,
  contentType: string
): Promise<void> {
  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
  }));
}

// Generate a signed playback URL (valid for 7 days)
export async function getPlaybackUrl(key: string, expiresInSeconds = 604800): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

// Alias used by other routes (shorter expiry)
export async function getSignedPlayUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  return getPlaybackUrl(key, expiresInSeconds);
}

// Public URL (if bucket is public-readable)
export function getPublicUrl(key: string): string {
  if (process.env.AWS_ENDPOINT_URL_S3) {
    return `${process.env.AWS_ENDPOINT_URL_S3}/${BUCKET}/${key}`;
  }
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
