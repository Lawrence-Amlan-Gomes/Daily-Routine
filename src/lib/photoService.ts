import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export async function uploadToS3(userId: string, fileBuffer: Buffer) {
  try {
    const optimized = await sharp(fileBuffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `profiles/${userId}/${uuidv4()}.webp`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: optimized,
      ContentType: "image/webp",
      ACL: "public-read",
    }));

    return {
      url: `${process.env.S3_PUBLIC_URL}/${key}`,
      key,
    };
  } catch (error) {
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function deleteFromS3(key: string) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    }));
  } catch (error) {
    throw new Error(`Delete failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
