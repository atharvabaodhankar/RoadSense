const Jimp = require("jimp");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function drawBoundingBoxes(imageBuffer, predictions) {
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempPath = path.join(tempDir, `temp_${Date.now()}.png`);

    // Convert to PNG first using sharp
    await sharp(imageBuffer).png().toFile(tempPath);

    // Load with Jimp
    const img = await Jimp.read(tempPath);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

    predictions.forEach(pred => {
      const { x, y, width, height, class: className, confidence } = pred;

      const boxX = Math.round(x - width / 2);
      const boxY = Math.round(y - height / 2);
      const boxWidth = Math.round(width);
      const boxHeight = Math.round(height);

      // Color based on defect type
      let color;
      const classLower = className.toLowerCase();
      if (classLower.includes("pothole")) {
        color = 0xFF0000FF; // Red
      } else if (classLower.includes("alligator")) {
        color = 0xFF8800FF; // Orange
      } else {
        color = 0xFFFF00FF; // Yellow
      }

      const thickness = 3;

      // Draw rectangle
      for (let i = 0; i < thickness; i++) {
        for (let px = boxX; px < boxX + boxWidth; px++) {
          if (px >= 0 && px < img.bitmap.width) {
            if (boxY + i >= 0 && boxY + i < img.bitmap.height) {
              img.setPixelColor(color, px, boxY + i);
            }
            if (boxY + boxHeight - i >= 0 && boxY + boxHeight - i < img.bitmap.height) {
              img.setPixelColor(color, px, boxY + boxHeight - i);
            }
          }
        }
        for (let py = boxY; py < boxY + boxHeight; py++) {
          if (py >= 0 && py < img.bitmap.height) {
            if (boxX + i >= 0 && boxX + i < img.bitmap.width) {
              img.setPixelColor(color, boxX + i, py);
            }
            if (boxX + boxWidth - i >= 0 && boxX + boxWidth - i < img.bitmap.width) {
              img.setPixelColor(color, boxX + boxWidth - i, py);
            }
          }
        }
      }

      // Add label
      const label = `${className} ${(confidence * 100).toFixed(1)}%`;
      const labelY = Math.max(0, boxY - 20);
      img.print(font, boxX + 5, labelY, label);
    });

    // Get buffer
    const annotatedBuffer = await img.getBufferAsync(Jimp.MIME_PNG);

    // Clean up temp file
    fs.unlinkSync(tempPath);

    return annotatedBuffer;
  } catch (error) {
    console.error("Annotation error:", error);
    throw new Error("Failed to annotate image");
  }
}

module.exports = { drawBoundingBoxes };
