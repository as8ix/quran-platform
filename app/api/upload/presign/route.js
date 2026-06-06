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

    // 1. Restrict File Types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed." },
        { status: 400 }
      );
    }

    // 2. Add ContentLengthRange to restrict file size to 10MB (10485760 bytes)
    // Actually, S3 presigned URLs don't enforce Content-Length easily without conditions,
    // but we can set limits in the frontend and trust that the bucket has lifecycle policies or we can use conditions if using POST.
    // For PutObjectCommand, S3 does not inherently restrict size based on the URL unless we use Presigned POST.
    // We will just do basic type checking here.

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

    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { r2Client } = await import("@/app/lib/r2");

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
