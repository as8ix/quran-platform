import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client } from "@/app/lib/r2";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Filename and Content-Type are required" },
        { status: 400 }
      );
    }

    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { error: "R2 Bucket Name is not configured on the server" },
        { status: 500 }
      );
    }

    // Sanitize filename to avoid weird character issues in S3 key / URL
    const sanitizedFilename = filename
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_"); // remove duplicate underscores

    // Organize uploads inside a notifications folder with unique timestamp
    const key = `notifications/${Date.now()}_${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    // Generate secure upload URL valid for 15 minutes (900 seconds)
    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

    // Determine the public access URL of the file
    let publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";
    if (publicBaseUrl.endsWith("/")) {
      publicBaseUrl = publicBaseUrl.slice(0, -1);
    }

    const fileUrl = publicBaseUrl 
      ? `${publicBaseUrl}/${key}`
      : `https://${bucketName}.r2.cloudflarestorage.com/${key}`;

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
    });
  } catch (error) {
    console.error("Presign API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate pre-signed upload URL", details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
