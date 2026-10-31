// Test sharp pipeline directly
import sharp from "sharp";
import { writeFileSync } from "fs";

async function main() {
  // Create a test image (1000x1000 red square)
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

  // Save test image
  writeFileSync("/tmp/test-banner.png", testImage);
  console.log("Saved to /tmp/test-banner.png");

  console.log("\n=== Testing sharp pipeline (crop + resize + webp) ===");
  try {
    const result = await sharp(testImage)
      .extract({ left: 0, top: 0, width: 1000, height: 1000 })
      .resize(728, 90, { fit: "cover", position: "center" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    console.log("✓ Sharp pipeline works!");
    console.log("  Output size:", result.data.length, "bytes");
    console.log("  Dimensions:", result.info.width, "x", result.info.height);

    // Save the output
    writeFileSync("/tmp/test-banner-output.webp", result.data);
    console.log("  Saved to /tmp/test-banner-output.webp");
  } catch (err: any) {
    console.error("✗ Sharp pipeline failed:", err.message);
  }
}

main().catch(console.error);
