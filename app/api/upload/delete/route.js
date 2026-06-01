import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/app/lib/r2";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { key: inputKey, fileUrl } = body;

    let key = inputKey;

    // If only the URL is provided, extract the key from it
    if (!key && fileUrl) {
      try {
        const url = new URL(fileUrl);
        // pathname is like "/notifications/12345_file.png". Substring(1) removes the leading slash
        key = decodeURIComponent(url.pathname.substring(1));
      } catch (err) {
        // Fallback simple parsing if URL parsing fails
        const markers = [".r2.dev/", "cloudflarestorage.com/"];
        for (const marker of markers) {
          if (fileUrl.includes(marker)) {
            key = fileUrl.split(marker)[1];
            break;
          }
        }
        if (!key) {
          key = fileUrl; // last resort fallback
        }
      }
    }

    if (!key) {
      return NextResponse.json(
        { error: "Key or File URL is required" },
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

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);

    return NextResponse.json({
      success: true,
      message: `File deleted successfully from R2`,
      key,
    });
  } catch (error) {
    console.error("Delete API Error:", error);
    return NextResponse.json(
      { error: "Failed to delete file from Cloudflare R2" },
      { status: 500 }
    );
  }
}
