const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

function getClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
}

async function uploadImage(imageBuffer, lead) {
  const bucket = process.env.R2_BUCKET_NAME || "quotes";
  const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

  if (!publicUrl) {
    throw new Error("R2_PUBLIC_URL is required to build the quote image URL.");
  }

  const id = uuidv4();
  const key = `quotes/${id}.png`;
  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: imageBuffer,
      ContentType: "image/png",
      Metadata: {
        contactid: String(lead.contactId || ""),
        borrower: `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
      }
    })
  );

  const imageUrl = `${publicUrl}/${key}`;

  return {
    imageUrl,
    quotePageUrl: imageUrl
  };
}

module.exports = {
  uploadImage
};
