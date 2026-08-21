const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const env = require("../config/env");

let r2Client = null;

const hasR2Config = () =>
  !!(env.CLOUDFLARE_R2_ACCOUNT_ID && env.CLOUDFLARE_R2_ACCESS_KEY_ID && env.CLOUDFLARE_R2_SECRET_ACCESS_KEY);

if (hasR2Config()) {
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
  console.log("[R2] Cloudflare R2 client initialized");
}

/**
 * Upload a buffer to Cloudflare R2.
 * Returns the public URL of the uploaded file.
 */
const uploadToR2 = async (buffer, filename, contentType = "application/pdf", folder = "resumes") => {
  if (!r2Client) throw new Error("Cloudflare R2 is not configured");
  const key = `${folder}/${filename}`;
  const command = new PutObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await r2Client.send(command);
  const baseUrl = env.CLOUDFLARE_R2_PUBLIC_URL || `https://pub-${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.dev`;
  return `${baseUrl}/${key}`;
};

module.exports = { hasR2Config, uploadToR2 };
