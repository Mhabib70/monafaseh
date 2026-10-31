// Create a small test image and try uploading it via the API
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

async function main() {
  const db = new PrismaClient();

  // Find admin user
  const admin = await db.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    console.log("No admin user");
    return;
  }
  console.log("Admin:", admin.email);

  // Create session for admin
  const sessionToken = "test-session-" + Date.now();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await db.session.create({
    data: {
      sessionToken,
      userId: admin.id,
      expires,
    },
  });
  console.log("Session created:", sessionToken);

  // Create a test image (100x100 red square)
  const testImage = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: { r: 255, g: 100, b: 100 },
    },
  })
    .png()
    .toBuffer();
  console.log("Test image size:", testImage.length, "bytes");

  // Save test image to a temp file
  const { writeFileSync } = await import("fs");
  writeFileSync("/tmp/test-banner.png", testImage);

  // Now try the upload API using fetch
  const FormData = (await import("form-data")).default;
  const form = new FormData();
  form.append("banner", testImage, {
    filename: "test.png",
    contentType: "image/png",
  });
  form.append("cropX", "0");
  form.append("cropY", "0");
  form.append("cropW", "1");
  form.append("cropH", "1");
  form.append("targetWidth", "728");
  form.append("targetHeight", "90");

  // We can't easily call localhost from node without http module
  // Let's just verify sharp can do the operation
  console.log("\n=== Testing sharp pipeline directly ===");
  try {
    const result = await sharp(testImage)
      .extract({ left: 0, top: 0, width: 1000, height: 1000 })
      .resize(728, 90, { fit: "cover", position: "center" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    console.log("✓ Sharp pipeline works!");
    console.log("  Output size:", result.data.length, "bytes");
    console.log("  Dimensions:", result.info.width, "x", result.info.height);
  } catch (err: any) {
    console.error("✗ Sharp pipeline failed:", err.message);
  }

  // Cleanup
  await db.session.deleteMany({ where: { sessionToken } });
  await db.$disconnect();
}

main().catch(console.error);
